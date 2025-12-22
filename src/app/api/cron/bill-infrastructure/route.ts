/**
 * Cron Job: Bill Infrastructure Usage
 * 
 * Runs hourly to:
 * 1. Bill E2B sandbox usage for active projects (hourly)
 * 2. Bill Supabase compute usage for active projects (hourly)
 * 3. Bill Vercel runtime usage for deployed projects (daily)
 * 4. Check for low balance users and pause their services
 * 5. Track storage usage (daily at midnight)
 * 6. Send low balance warning emails (once per day per user)
 * 
 * Schedule: Every hour (0 * * * *)
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
    trackSupabaseComputeUsage,
    trackSupabaseDatabaseStorage,
    trackSupabaseFileStorage,
    trackVercelRuntimeUsage,
    trackSandboxUsage,
} from "@/lib/infrastructure-usage";
import {
    pauseProject as pauseSupabaseProject,
} from "@/lib/services/supabase-platforms";
import {
    MINIMUM_BALANCE_THRESHOLD,
    LOW_BALANCE_WARNING_THRESHOLD,
    INFRASTRUCTURE_COSTS,
} from "@/lib/pricing-constants";
import {
    sendLowBalanceWarningEmail,
    sendServicePausedEmail,
} from "@/lib/email";

// Verify cron secret to prevent unauthorized access
function verifyCronSecret(req: NextRequest): boolean {
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
        console.warn("⚠️ CRON_SECRET not configured");
        return false;
    }

    return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(req: NextRequest) {
    // Verify this is a legitimate cron request
    if (!verifyCronSecret(req)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("🕐 Starting infrastructure billing cron...");

    const results = {
        billedSandboxes: 0,
        billedProjects: 0,
        billedVercelProjects: 0,
        pausedProjects: 0,
        lowBalanceWarnings: 0,
        errors: [] as string[],
    };

    try {
        // ==============================================================
        // STEP 1: Bill E2B Sandbox Usage (Hourly)
        // ==============================================================
        console.log("🏖️ Billing E2B sandbox usage...");
        await billSandboxUsage(results);
        // ==============================================================
        // STEP 2: Bill Supabase Compute Usage (Hourly)
        // ==============================================================
        // Get all projects with active Supabase instances
        const activeProjects = await prisma.project.findMany({
            where: {
                supabaseProjectRef: { not: null },
                supabaseStatus: "active",
            },
            select: {
                id: true,
                name: true,
                userId: true,
                supabaseProjectRef: true,
                supabaseProvisionedAt: true,
                user: {
                    select: {
                        id: true,
                        email: true,
                        accountBalance: true,
                    },
                },
            },
        });

        console.log(`📊 Found ${activeProjects.length} active Supabase projects`);

        for (const project of activeProjects) {
            try {
                const userBalance = Number(project.user.accountBalance || 0);

                // Check if user has sufficient balance
                if (userBalance < MINIMUM_BALANCE_THRESHOLD) {
                    // Pause Supabase to stop charges
                    console.log(`⏸️ Pausing Supabase for project ${project.id} - Low balance: $${userBalance.toFixed(2)}`);

                    try {
                        await pauseSupabaseProject(project.supabaseProjectRef!);
                        await prisma.project.update({
                            where: { id: project.id },
                            data: {
                                supabaseStatus: "paused_low_balance",
                            },
                        });
                        results.pausedProjects++;

                        // Send service paused notification email
                        try {
                            await sendServicePausedEmail({
                                email: project.user.email!,
                                name: null, // Could fetch user name if needed
                                balance: userBalance,
                                serviceName: "Database",
                                projectName: project.name,
                            });
                            console.log(`📧 Sent paused notification to ${project.user.email}`);
                        } catch (emailError) {
                            console.error(`Failed to send paused email:`, emailError);
                        }
                    } catch (pauseError) {
                        console.error(`Failed to pause Supabase for ${project.id}:`, pauseError);
                        results.errors.push(`Failed to pause ${project.id}: ${pauseError}`);
                    }
                    continue;
                }

                // Warn if balance is low but still above threshold (send only once when it drops)
                if (userBalance < LOW_BALANCE_WARNING_THRESHOLD) {
                    results.lowBalanceWarnings++;

                    // Check if we've already sent a warning for this low balance period
                    // We use a simple check: if user has lowBalanceWarnedAt set and balance hasn't gone back up
                    const user = await prisma.user.findUnique({
                        where: { id: project.userId },
                        select: { lowBalanceWarnedAt: true },
                    });

                    // Only send if we haven't warned them yet for this low balance period
                    if (!user?.lowBalanceWarnedAt) {
                        try {
                            await sendLowBalanceWarningEmail({
                                email: project.user.email!,
                                name: null,
                                balance: userBalance,
                            });
                            // Mark that we've warned this user
                            await prisma.user.update({
                                where: { id: project.userId },
                                data: { lowBalanceWarnedAt: new Date() },
                            });
                            console.log(`📧 Sent low balance warning to ${project.user.email}`);
                        } catch (emailError) {
                            console.error(`Failed to send warning email:`, emailError);
                        }
                    }
                }

                // Bill for compute usage (1 hour since this runs hourly)
                const computeResult = await trackSupabaseComputeUsage({
                    userId: project.userId,
                    projectId: project.id,
                    supabaseProjectRef: project.supabaseProjectRef!,
                    hoursActive: 1,
                    instanceSize: "micro",
                });

                if (computeResult.providerCostUsd > 0) {
                    console.log(`💰 Billed $${computeResult.providerCostUsd.toFixed(4)} for ${project.name}`);
                    results.billedProjects++;

                    // Check if billing caused balance to go below threshold
                    if (computeResult.balanceAfter < MINIMUM_BALANCE_THRESHOLD) {
                        console.log(`⏸️ Post-billing pause for ${project.id} - Balance: $${computeResult.balanceAfter.toFixed(2)}`);
                        try {
                            await pauseSupabaseProject(project.supabaseProjectRef!);
                            await prisma.project.update({
                                where: { id: project.id },
                                data: {
                                    supabaseStatus: "paused_low_balance",
                                },
                            });
                            results.pausedProjects++;
                        } catch (pauseError) {
                            console.error(`Failed to pause after billing:`, pauseError);
                        }
                    }
                }
            } catch (projectError) {
                console.error(`Error processing project ${project.id}:`, projectError);
                results.errors.push(`Project ${project.id}: ${projectError}`);
            }
        }

        // Daily storage billing (run at midnight UTC)
        const currentHour = new Date().getUTCHours();
        if (currentHour === 0) {
            console.log("🗄️ Running daily storage billing...");
            await billStorageUsage(results);

            console.log("🚀 Running daily Vercel runtime billing...");
            await billVercelRuntimeUsage(results);
        }

        console.log("✅ Infrastructure billing cron completed:", results);

        return NextResponse.json({
            success: true,
            ...results,
        });
    } catch (error) {
        console.error("❌ Infrastructure billing cron failed:", error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
                ...results,
            },
            { status: 500 }
        );
    }
}

/**
 * Bill for E2B sandbox usage (called hourly)
 * Tracks sandboxes that were active in the last hour
 * E2B charges $0.10/hour for 2 vCPU sandbox
 */
async function billSandboxUsage(results: { billedSandboxes: number; errors: string[] }): Promise<void> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    // Get all projects with active sandboxes (accessed in the last hour)
    // Sandboxes auto-pause after 10 min, but we bill for any activity in the hour
    const activeProjects = await prisma.project.findMany({
        where: {
            sandboxId: { not: null },
            // Project was accessed/updated in last hour (indicates sandbox activity)
            OR: [
                { updatedAt: { gte: oneHourAgo } },
                { sandboxPausedAt: null }, // Running sandboxes
            ],
        },
        select: {
            id: true,
            name: true,
            userId: true,
            sandboxId: true,
            sandboxPausedAt: true,
            updatedAt: true,
            user: {
                select: {
                    id: true,
                    email: true,
                    accountBalance: true,
                },
            },
        },
    });

    console.log(`📊 Found ${activeProjects.length} projects with sandbox activity`);

    for (const project of activeProjects) {
        try {
            const userBalance = Number(project.user.accountBalance || 0);

            // Check if user has sufficient balance
            if (userBalance < MINIMUM_BALANCE_THRESHOLD) {
                console.log(`⚠️ Low balance for sandbox ${project.sandboxId} - skipping billing (balance: $${userBalance.toFixed(2)})`);
                // Sandbox will auto-pause, but we don't actively kill it
                // User can't resume without adding credits (see sandbox endpoint balance check)
                continue;
            }

            // Calculate usage time
            // If sandbox is running (not paused), bill for the full hour
            // If paused, bill for partial hour based on when it was paused
            let minutesActive = 60; // Full hour by default

            if (project.sandboxPausedAt) {
                // Sandbox was paused - calculate partial usage
                const pausedAt = project.sandboxPausedAt.getTime();
                const hourStart = oneHourAgo.getTime();
                const hourEnd = Date.now();

                if (pausedAt < hourStart) {
                    // Paused before this billing hour - no charge
                    continue;
                }

                // Calculate minutes active in this hour
                minutesActive = Math.ceil((pausedAt - hourStart) / (1000 * 60));
                minutesActive = Math.min(minutesActive, 60); // Cap at 60 minutes
            }

            // Bill for sandbox usage
            const endTime = project.sandboxPausedAt || new Date();
            const startTime = new Date(endTime.getTime() - minutesActive * 60 * 1000);

            const sandboxResult = await trackSandboxUsage({
                userId: project.userId,
                projectId: project.id,
                sandboxId: project.sandboxId!,
                startTime,
                endTime,
                metadata: {
                    billingType: "hourly_cron",
                    projectName: project.name,
                    minutesBilled: minutesActive,
                },
            });

            if (sandboxResult.providerCostUsd > 0) {
                console.log(`💰 Billed E2B sandbox $${sandboxResult.providerCostUsd.toFixed(4)} for ${project.name} (${minutesActive} min)`);
                results.billedSandboxes++;
            }
        } catch (sandboxError) {
            console.error(`Sandbox billing error for ${project.id}:`, sandboxError);
            results.errors.push(`Sandbox ${project.id}: ${sandboxError}`);
        }
    }
}

/**
 * Bill for storage usage (called once daily at midnight)
 */
async function billStorageUsage(results: { errors: string[] }): Promise<void> {
    // Get all active Supabase projects
    const projects = await prisma.project.findMany({
        where: {
            supabaseProjectRef: { not: null },
            supabaseStatus: { in: ["active"] },
        },
        select: {
            id: true,
            userId: true,
            supabaseProjectRef: true,
        },
    });

    for (const project of projects) {
        try {
            // Note: In production, you'd query Supabase API for actual storage usage
            // For now, we estimate based on project activity
            // Daily cost = monthly rate / 30

            // Database storage (assume 0.5 GB average)
            const dbStorageGB = 0.5;
            const dailyDbCost = (dbStorageGB * INFRASTRUCTURE_COSTS.supabase.databaseStoragePerGBMonth) / 30;

            if (dailyDbCost > 0.001) {
                await trackSupabaseDatabaseStorage({
                    userId: project.userId,
                    projectId: project.id,
                    supabaseProjectRef: project.supabaseProjectRef!,
                    storageGB: dbStorageGB / 30, // Daily portion
                });
            }

            // File storage (assume 0.1 GB average)
            const fileStorageGB = 0.1;
            const dailyFileCost = (fileStorageGB * INFRASTRUCTURE_COSTS.supabase.fileStoragePerGBMonth) / 30;

            if (dailyFileCost > 0.001) {
                await trackSupabaseFileStorage({
                    userId: project.userId,
                    projectId: project.id,
                    supabaseProjectRef: project.supabaseProjectRef!,
                    storageGB: fileStorageGB / 30, // Daily portion
                });
            }
        } catch (storageError) {
            console.error(`Storage billing error for ${project.id}:`, storageError);
            results.errors.push(`Storage ${project.id}: ${storageError}`);
        }
    }
}

/**
 * Bill for Vercel runtime usage (called once daily at midnight)
 * Tracks CPU hours, memory GB-hours, and invocations for deployed projects
 */
async function billVercelRuntimeUsage(results: { billedVercelProjects: number; errors: string[] }): Promise<void> {
    // Get all projects with active Vercel deployments
    const projects = await prisma.project.findMany({
        where: {
            vercelProjectId: { not: null },
            vercelUrl: { not: null },
        },
        select: {
            id: true,
            name: true,
            userId: true,
            vercelProjectId: true,
            vercelProjectName: true,
            vercelUrl: true,
        },
    });

    console.log(`📊 Found ${projects.length} projects with Vercel deployments`);

    for (const project of projects) {
        try {
            // Note: In production, you'd query Vercel API for actual usage metrics
            // Vercel API: GET /v1/projects/{projectId}/stats
            // For now, estimate based on typical small app usage

            // Estimate daily usage for a small Next.js app:
            // - CPU: ~0.01 hours/day (36 seconds of active compute)
            // - Memory: ~0.5 GB-hours/day
            // - Invocations: ~100/day for a small app

            const estimatedCpuHours = 0.01;
            const estimatedMemoryGBHours = 0.5;
            const estimatedInvocations = 100;

            const runtimeResult = await trackVercelRuntimeUsage({
                userId: project.userId,
                projectId: project.id,
                vercelProjectId: project.vercelProjectId!,
                cpuHours: estimatedCpuHours,
                memoryGBHours: estimatedMemoryGBHours,
                invocations: estimatedInvocations,
                metadata: {
                    vercelProjectName: project.vercelProjectName,
                    vercelUrl: project.vercelUrl,
                    billingType: "estimated",
                },
            });

            if (runtimeResult.providerCostUsd > 0) {
                console.log(`💰 Billed Vercel runtime $${runtimeResult.providerCostUsd.toFixed(4)} for ${project.name}`);
                results.billedVercelProjects++;
            }
        } catch (vercelError) {
            console.error(`Vercel billing error for ${project.id}:`, vercelError);
            results.errors.push(`Vercel ${project.id}: ${vercelError}`);
        }
    }
}
