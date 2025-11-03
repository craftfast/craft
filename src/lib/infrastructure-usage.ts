/**
 * Infrastructure Usage Tracking
 * Tracks non-AI resource usage: sandbox, database, storage, deployments
 * All usage consumes credits from monthly allocation
 */

import { prisma } from "@/lib/db";
import { CREDIT_RATES } from "@/lib/pricing-constants";
import { Prisma } from "@prisma/client";

// ============================================================================
// SANDBOX USAGE TRACKING (E2B)
// ============================================================================

/**
 * Track sandbox usage for a session
 */
export async function trackSandboxUsage(params: {
    userId: string;
    projectId: string;
    sandboxId: string;
    startTime: Date;
    endTime: Date;
    metadata?: Record<string, unknown>;
}): Promise<{ id: string; creditsUsed: number; costUsd: number }> {
    // Calculate duration in minutes
    const durationMs = params.endTime.getTime() - params.startTime.getTime();
    const durationMin = Math.ceil(durationMs / (1000 * 60));

    // Calculate credits used
    const creditsUsed = Number((durationMin * CREDIT_RATES.sandbox.perMinute).toFixed(4));

    // Rough cost estimation (sandbox cost ~$0.001/min)
    const costUsd = durationMin * 0.001;

    // Create usage record
    const record = await prisma.sandboxUsage.create({
        data: {
            userId: params.userId,
            projectId: params.projectId,
            sandboxId: params.sandboxId,
            startTime: params.startTime,
            endTime: params.endTime,
            durationMin,
            creditsUsed,
            costUsd,
            metadata: (params.metadata as Prisma.InputJsonValue) || Prisma.JsonNull,
        },
    });

    // Update subscription credits
    await deductCreditsFromSubscription(params.userId, creditsUsed, "sandbox", costUsd);

    return {
        id: record.id,
        creditsUsed,
        costUsd,
    };
}

/**
 * Start tracking a sandbox session
 */
export async function startSandboxSession(params: {
    userId: string;
    projectId: string;
    sandboxId: string;
}): Promise<{ sessionId: string; startTime: Date }> {
    const startTime = new Date();

    // Create a placeholder record (will be updated when session ends)
    const record = await prisma.sandboxUsage.create({
        data: {
            userId: params.userId,
            projectId: params.projectId,
            sandboxId: params.sandboxId,
            startTime,
            endTime: null, // Will be set when session ends
            durationMin: 0,
            creditsUsed: 0,
            costUsd: 0,
        },
    });

    return {
        sessionId: record.id,
        startTime,
    };
}

/**
 * End a sandbox session and calculate final usage
 */
export async function endSandboxSession(params: {
    sessionId: string;
    endTime?: Date;
}): Promise<{ creditsUsed: number; costUsd: number; durationMin: number }> {
    const endTime = params.endTime || new Date();

    // Get the session record
    const session = await prisma.sandboxUsage.findUnique({
        where: { id: params.sessionId },
    });

    if (!session) {
        throw new Error("Sandbox session not found");
    }

    // Calculate duration
    const durationMs = endTime.getTime() - session.startTime.getTime();
    const durationMin = Math.ceil(durationMs / (1000 * 60));

    // Calculate credits used
    const creditsUsed = Number((durationMin * CREDIT_RATES.sandbox.perMinute).toFixed(4));
    const costUsd = durationMin * 0.001;

    // Update the record
    await prisma.sandboxUsage.update({
        where: { id: params.sessionId },
        data: {
            endTime,
            durationMin,
            creditsUsed,
            costUsd,
        },
    });

    // Deduct credits from subscription
    await deductCreditsFromSubscription(session.userId, creditsUsed, "sandbox", costUsd);

    return {
        creditsUsed,
        costUsd,
        durationMin,
    };
}

// ============================================================================
// STORAGE USAGE TRACKING (R2 + Database)
// ============================================================================

/**
 * Track storage usage for a billing period
 */
export async function trackStorageUsage(params: {
    userId: string;
    projectId?: string;
    storageType: "r2" | "database";
    sizeGB: number;
    operations?: number;
    billingPeriod: Date;
    metadata?: Record<string, unknown>;
}): Promise<{ id: string; creditsUsed: number; costUsd: number }> {
    let creditsUsed = 0;
    let costUsd = 0;

    if (params.storageType === "r2") {
        // R2 storage: charge per GB/month + operations
        creditsUsed += params.sizeGB * CREDIT_RATES.storage.perGBMonth;
        if (params.operations) {
            creditsUsed += (params.operations / 1000) * CREDIT_RATES.storage.perThousandOps;
        }
        costUsd = params.sizeGB * 0.015; // ~$0.015 per GB/month
    } else if (params.storageType === "database") {
        // Database storage
        creditsUsed = params.sizeGB * CREDIT_RATES.database.storagePerGBMonth;
        costUsd = params.sizeGB * 0.02; // ~$0.02 per GB/month
    }

    creditsUsed = Number(creditsUsed.toFixed(4));

    // Create usage record
    const record = await prisma.storageUsage.create({
        data: {
            userId: params.userId,
            projectId: params.projectId || null,
            storageType: params.storageType,
            sizeGB: params.sizeGB,
            operations: params.operations || 0,
            creditsUsed,
            costUsd,
            billingPeriod: params.billingPeriod,
            metadata: (params.metadata as Prisma.InputJsonValue) || Prisma.JsonNull,
        },
    });

    // Deduct credits from subscription
    await deductCreditsFromSubscription(
        params.userId,
        creditsUsed,
        params.storageType === "r2" ? "storage" : "database",
        costUsd
    );

    return {
        id: record.id,
        creditsUsed,
        costUsd,
    };
}

// ============================================================================
// DEPLOYMENT USAGE TRACKING
// ============================================================================

/**
 * Track deployment usage
 */
export async function trackDeploymentUsage(params: {
    userId: string;
    projectId: string;
    deploymentId?: string;
    platform?: string;
    buildDurationMin?: number;
    metadata?: Record<string, unknown>;
}): Promise<{ id: string; creditsUsed: number; costUsd: number }> {
    // Fixed credit cost per deployment
    const creditsUsed = CREDIT_RATES.deployment.perDeploy;
    const costUsd = 0.01; // ~$0.01 per deployment

    // Create usage record
    const record = await prisma.deploymentUsage.create({
        data: {
            userId: params.userId,
            projectId: params.projectId,
            deploymentId: params.deploymentId || null,
            platform: params.platform || "vercel",
            creditsUsed,
            costUsd,
            buildDurationMin: params.buildDurationMin || 0,
            metadata: (params.metadata as Prisma.InputJsonValue) || Prisma.JsonNull,
        },
    });

    // Deduct credits from subscription
    await deductCreditsFromSubscription(params.userId, creditsUsed, "deployment", costUsd);

    return {
        id: record.id,
        creditsUsed,
        costUsd,
    };
}

// ============================================================================
// CREDIT DEDUCTION HELPER
// ============================================================================

/**
 * Deduct credits from user's monthly allocation and update usage records
 */
async function deductCreditsFromSubscription(
    userId: string,
    creditsUsed: number,
    usageType: "sandbox" | "database" | "storage" | "deployment",
    costUsd: number
): Promise<void> {
    // Get user's subscription
    const subscription = await prisma.userSubscription.findUnique({
        where: { userId },
    });

    if (!subscription) {
        throw new Error("No subscription found for user");
    }

    // Update monthly credits used
    await prisma.userSubscription.update({
        where: { userId },
        data: {
            monthlyCreditsUsed: {
                increment: creditsUsed,
            },
        },
    });

    // Update or create usage record for current billing period
    const existingUsageRecord = await prisma.usageRecord.findUnique({
        where: {
            subscriptionId_billingPeriodStart: {
                subscriptionId: subscription.id,
                billingPeriodStart: subscription.currentPeriodStart,
            },
        },
    });

    // Prepare the update data based on usage type
    const updateData: Record<string, unknown> = {
        totalCreditsUsed: { increment: creditsUsed },
        totalCostUsd: { increment: costUsd },
    };

    if (usageType === "sandbox") {
        updateData.sandboxCreditsUsed = { increment: creditsUsed };
        updateData.sandboxCostUsd = { increment: costUsd };
    } else if (usageType === "database") {
        updateData.databaseCreditsUsed = { increment: creditsUsed };
        updateData.databaseCostUsd = { increment: costUsd };
    } else if (usageType === "storage") {
        updateData.storageCreditsUsed = { increment: creditsUsed };
        updateData.storageCostUsd = { increment: costUsd };
    } else if (usageType === "deployment") {
        updateData.deployCreditsUsed = { increment: creditsUsed };
        updateData.deployCostUsd = { increment: costUsd };
    }

    if (existingUsageRecord) {
        // Update existing record
        await prisma.usageRecord.update({
            where: { id: existingUsageRecord.id },
            data: updateData,
        });
    } else {
        // Create new record for this billing period
        const baseData = {
            userId,
            subscriptionId: subscription.id,
            billingPeriodStart: subscription.currentPeriodStart,
            billingPeriodEnd: subscription.currentPeriodEnd,
            totalCreditsUsed: creditsUsed,
            totalCostUsd: costUsd,
        };

        let createData;
        if (usageType === "sandbox") {
            createData = { ...baseData, sandboxCreditsUsed: creditsUsed, sandboxCostUsd: costUsd };
        } else if (usageType === "database") {
            createData = { ...baseData, databaseCreditsUsed: creditsUsed, databaseCostUsd: costUsd };
        } else if (usageType === "storage") {
            createData = { ...baseData, storageCreditsUsed: creditsUsed, storageCostUsd: costUsd };
        } else if (usageType === "deployment") {
            createData = { ...baseData, deployCreditsUsed: creditsUsed, deployCostUsd: costUsd };
        } else {
            createData = baseData;
        }

        await prisma.usageRecord.create({
            data: createData,
        });
    }
}

// ============================================================================
// USAGE ANALYTICS
// ============================================================================

/**
 * Get comprehensive usage breakdown for current billing period
 */
export async function getCurrentPeriodUsageBreakdown(userId: string): Promise<{
    period: {
        start: Date;
        end: Date;
        daysRemaining: number;
    };
    credits: {
        limit: number;
        used: number;
        remaining: number;
        percentUsed: number;
    };
    breakdown: {
        ai: { used: number; cost: number };
        sandbox: { used: number; cost: number };
        database: { used: number; cost: number };
        storage: { used: number; cost: number };
        deployment: { used: number; cost: number };
    };
}> {
    const subscription = await prisma.userSubscription.findUnique({
        where: { userId },
        include: { plan: true },
    });

    if (!subscription) {
        throw new Error("No subscription found");
    }

    const usageRecord = await prisma.usageRecord.findUnique({
        where: {
            subscriptionId_billingPeriodStart: {
                subscriptionId: subscription.id,
                billingPeriodStart: subscription.currentPeriodStart,
            },
        },
    });

    const now = new Date();
    const daysRemaining = Math.ceil(
        (subscription.currentPeriodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    const monthlyCreditsLimit = subscription.plan.monthlyCredits || 100;
    const monthlyCreditsUsed = Number(subscription.monthlyCreditsUsed || 0);
    const creditsRemaining = Math.max(0, monthlyCreditsLimit - monthlyCreditsUsed);
    const percentUsed = (monthlyCreditsUsed / monthlyCreditsLimit) * 100;

    return {
        period: {
            start: subscription.currentPeriodStart,
            end: subscription.currentPeriodEnd,
            daysRemaining,
        },
        credits: {
            limit: monthlyCreditsLimit,
            used: monthlyCreditsUsed,
            remaining: creditsRemaining,
            percentUsed: Math.round(percentUsed * 100) / 100,
        },
        breakdown: {
            ai: {
                used: Number(usageRecord?.aiCreditsUsed || 0),
                cost: usageRecord?.aiCostUsd || 0,
            },
            sandbox: {
                used: Number(usageRecord?.sandboxCreditsUsed || 0),
                cost: usageRecord?.sandboxCostUsd || 0,
            },
            database: {
                used: Number(usageRecord?.databaseCreditsUsed || 0),
                cost: usageRecord?.databaseCostUsd || 0,
            },
            storage: {
                used: Number(usageRecord?.storageCreditsUsed || 0),
                cost: usageRecord?.storageCostUsd || 0,
            },
            deployment: {
                used: Number(usageRecord?.deployCreditsUsed || 0),
                cost: usageRecord?.deployCostUsd || 0,
            },
        },
    };
}
