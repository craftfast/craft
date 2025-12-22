/**
 * API: Resume Paused Supabase Database
 * 
 * POST /api/projects/[id]/supabase/resume
 * 
 * Called when a user adds credits and wants to re-enable their paused database.
 * Requirements:
 * - User must have balance >= MINIMUM_BALANCE_THRESHOLD ($0.50)
 * - Project must be in "paused_low_balance" status
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { withCsrfProtection } from "@/lib/csrf";
import { checkUserBalance } from "@/lib/ai-usage";
import {
    MINIMUM_BALANCE_THRESHOLD,
    INFRASTRUCTURE_COSTS,
} from "@/lib/pricing-constants";
import {
    resumeProject as resumeSupabaseProject,
    waitForProjectHealth,
    isSupabaseConfigured,
} from "@/lib/services/supabase-platforms";

/**
 * POST /api/projects/[id]/supabase/resume
 * Resume a paused Supabase project after user adds credits
 */
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // CSRF Protection
        const csrfCheck = await withCsrfProtection(req);
        if (csrfCheck) return csrfCheck;

        const session = await auth.api.getSession({
            headers: req.headers,
        });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id: projectId } = await params;

        // Check if Supabase for Platforms is configured
        if (!isSupabaseConfigured()) {
            return NextResponse.json(
                { error: "Supabase for Platforms is not configured" },
                { status: 503 }
            );
        }

        // Verify project ownership
        const project = await prisma.project.findUnique({
            where: { id: projectId, userId: session.user.id },
            select: {
                id: true,
                name: true,
                supabaseProjectRef: true,
                supabaseStatus: true,
            },
        });

        if (!project) {
            return NextResponse.json(
                { error: "Project not found" },
                { status: 404 }
            );
        }

        // Check if project has Supabase
        if (!project.supabaseProjectRef) {
            return NextResponse.json(
                { error: "Database is not provisioned for this project" },
                { status: 400 }
            );
        }

        // Check if project is paused due to low balance
        if (project.supabaseStatus !== "paused_low_balance" && project.supabaseStatus !== "paused") {
            return NextResponse.json(
                {
                    error: `Database is not paused. Current status: ${project.supabaseStatus}`,
                    status: project.supabaseStatus,
                },
                { status: 400 }
            );
        }

        // Check user balance - require at least enough for 1 hour of compute + threshold
        const estimatedCost = INFRASTRUCTURE_COSTS.supabase.computePerHour + MINIMUM_BALANCE_THRESHOLD;
        const balanceCheck = await checkUserBalance(session.user.id, estimatedCost);

        if (!balanceCheck.allowed) {
            return NextResponse.json(
                {
                    error: "Insufficient balance to resume database",
                    balance: balanceCheck.balance,
                    required: estimatedCost,
                    message: `You need at least $${estimatedCost.toFixed(2)} to resume. Current balance: $${balanceCheck.balance.toFixed(2)}`,
                },
                { status: 402 }
            );
        }

        // Resume the Supabase project
        console.log(`▶️ Resuming Supabase for project ${projectId}...`);

        try {
            await resumeSupabaseProject(project.supabaseProjectRef);

            // Wait for project to be healthy (up to 2 minutes)
            const isHealthy = await waitForProjectHealth(project.supabaseProjectRef, 120000, 5000);

            if (!isHealthy) {
                // Update status to indicate it's coming up
                await prisma.project.update({
                    where: { id: projectId },
                    data: { supabaseStatus: "resuming" },
                });

                return NextResponse.json({
                    success: true,
                    status: "resuming",
                    message: "Database is resuming. It may take a minute to be fully available.",
                });
            }

            // Update status to active
            await prisma.project.update({
                where: { id: projectId },
                data: { supabaseStatus: "active" },
            });

            console.log(`✅ Supabase resumed for project ${projectId}`);

            return NextResponse.json({
                success: true,
                status: "active",
                message: "Database resumed successfully!",
                balance: balanceCheck.balance,
            });
        } catch (resumeError) {
            console.error("Failed to resume Supabase:", resumeError);

            return NextResponse.json(
                {
                    error: "Failed to resume database. Please try again or contact support.",
                    details: resumeError instanceof Error ? resumeError.message : "Unknown error",
                },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error("Failed to resume Supabase:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to resume database" },
            { status: 500 }
        );
    }
}
