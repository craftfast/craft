/**
 * Infrastructure Usage Tracking
 * Tracks non-AI resource usage: sandbox, database, storage, deployments
 * All usage deducts exact provider costs from user balance (no markup)
 */

import { prisma } from "@/lib/db";
import { INFRASTRUCTURE_COSTS } from "@/lib/pricing-constants";
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
}): Promise<{ id: string; providerCostUsd: number; balanceAfter: number }> {
    // Calculate duration in minutes
    const durationMs = params.endTime.getTime() - params.startTime.getTime();
    const durationMin = Math.ceil(durationMs / (1000 * 60));

    // Calculate exact provider cost (no markup)
    const providerCostUsd = durationMin * INFRASTRUCTURE_COSTS.sandbox.perMinute;

    // Deduct from balance and create usage record in transaction
    const result = await prisma.$transaction(async (tx) => {
        // Create usage record
        const record = await tx.sandboxUsage.create({
            data: {
                userId: params.userId,
                projectId: params.projectId,
                sandboxId: params.sandboxId,
                startTime: params.startTime,
                endTime: params.endTime,
                durationMin,
                providerCostUsd,
                metadata: (params.metadata as Prisma.InputJsonValue) || Prisma.JsonNull,
            },
        });

        // Deduct from user balance
        const user = await tx.user.findUnique({
            where: { id: params.userId },
            select: { accountBalance: true },
        });

        if (!user) {
            throw new Error(`User ${params.userId} not found`);
        }

        const balanceBefore = Number(user.accountBalance || 0);
        const balanceAfter = balanceBefore - providerCostUsd;

        await tx.user.update({
            where: { id: params.userId },
            data: { accountBalance: balanceAfter },
        });

        // Create balance transaction record
        await tx.balanceTransaction.create({
            data: {
                userId: params.userId,
                type: "SANDBOX_USAGE",
                amount: -providerCostUsd,
                balanceBefore,
                balanceAfter,
                description: `Sandbox usage: ${durationMin} minutes`,
                metadata: {
                    usageId: record.id,
                    sandboxId: params.sandboxId,
                    projectId: params.projectId,
                    durationMin,
                },
            },
        });

        return {
            id: record.id,
            providerCostUsd,
            balanceAfter,
        };
    });

    return result;
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
            providerCostUsd: 0,
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
}): Promise<{ providerCostUsd: number; balanceAfter: number; durationMin: number }> {
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

    // Calculate exact provider cost (no markup)
    const providerCostUsd = durationMin * INFRASTRUCTURE_COSTS.sandbox.perMinute;

    // Update the record and deduct from balance in transaction
    const result = await prisma.$transaction(async (tx) => {
        // Update the usage record
        await tx.sandboxUsage.update({
            where: { id: params.sessionId },
            data: {
                endTime,
                durationMin,
                providerCostUsd,
            },
        });

        // Deduct from user balance
        const user = await tx.user.findUnique({
            where: { id: session.userId },
            select: { accountBalance: true },
        });

        if (!user) {
            throw new Error(`User ${session.userId} not found`);
        }

        const balanceBefore = Number(user.accountBalance || 0);
        const balanceAfter = balanceBefore - providerCostUsd;

        await tx.user.update({
            where: { id: session.userId },
            data: { accountBalance: balanceAfter },
        });

        // Create balance transaction record
        await tx.balanceTransaction.create({
            data: {
                userId: session.userId,
                type: "SANDBOX_USAGE",
                amount: -providerCostUsd,
                balanceBefore,
                balanceAfter,
                description: `Sandbox session ended: ${durationMin} minutes`,
                metadata: {
                    usageId: params.sessionId,
                    sandboxId: session.sandboxId,
                    projectId: session.projectId,
                    durationMin,
                },
            },
        });

        return {
            providerCostUsd,
            balanceAfter,
            durationMin,
        };
    });

    return result;
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
}): Promise<{ id: string; providerCostUsd: number; balanceAfter: number }> {
    // Calculate exact provider cost (no markup)
    let providerCostUsd = 0;

    if (params.storageType === "r2") {
        // R2 storage: charge per GB/month + operations
        providerCostUsd += params.sizeGB * INFRASTRUCTURE_COSTS.storage.perGBMonth;
        if (params.operations) {
            providerCostUsd += (params.operations / 1_000_000) * INFRASTRUCTURE_COSTS.storage.perMillionOps;
        }
    } else if (params.storageType === "database") {
        // Database storage
        providerCostUsd = params.sizeGB * INFRASTRUCTURE_COSTS.database.storagePerGBMonth;
    }

    providerCostUsd = Math.round(providerCostUsd * 100000) / 100000; // Round to 5 decimals

    // Deduct from balance and create usage record in transaction
    const result = await prisma.$transaction(async (tx) => {
        // Create usage record
        const record = await tx.storageUsage.create({
            data: {
                userId: params.userId,
                projectId: params.projectId || null,
                storageType: params.storageType,
                sizeGB: params.sizeGB,
                operations: params.operations || 0,
                providerCostUsd,
                billingPeriod: params.billingPeriod,
                metadata: (params.metadata as Prisma.InputJsonValue) || Prisma.JsonNull,
            },
        });

        // Deduct from user balance
        const user = await tx.user.findUnique({
            where: { id: params.userId },
            select: { accountBalance: true },
        });

        if (!user) {
            throw new Error(`User ${params.userId} not found`);
        }

        const balanceBefore = Number(user.accountBalance || 0);
        const balanceAfter = balanceBefore - providerCostUsd;

        await tx.user.update({
            where: { id: params.userId },
            data: { accountBalance: balanceAfter },
        });

        // Create balance transaction record
        await tx.balanceTransaction.create({
            data: {
                userId: params.userId,
                type: "STORAGE_USAGE",
                amount: -providerCostUsd,
                balanceBefore,
                balanceAfter,
                description: `Storage usage: ${params.storageType} ${params.sizeGB} GB`,
                metadata: {
                    usageId: record.id,
                    storageType: params.storageType,
                    sizeGB: params.sizeGB,
                    operations: params.operations || 0,
                    projectId: params.projectId || null,
                },
            },
        });

        return {
            id: record.id,
            providerCostUsd,
            balanceAfter,
        };
    });

    return result;
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
}): Promise<{ id: string; providerCostUsd: number; balanceAfter: number }> {
    // Fixed provider cost per deployment (no markup)
    const providerCostUsd = INFRASTRUCTURE_COSTS.deployment.perDeploy;

    // Deduct from balance and create usage record in transaction
    const result = await prisma.$transaction(async (tx) => {
        // Create usage record
        const record = await tx.deploymentUsage.create({
            data: {
                userId: params.userId,
                projectId: params.projectId,
                deploymentId: params.deploymentId || null,
                platform: params.platform || "vercel",
                providerCostUsd,
                buildDurationMin: params.buildDurationMin || 0,
                metadata: (params.metadata as Prisma.InputJsonValue) || Prisma.JsonNull,
            },
        });

        // Deduct from user balance
        const user = await tx.user.findUnique({
            where: { id: params.userId },
            select: { accountBalance: true },
        });

        if (!user) {
            throw new Error(`User ${params.userId} not found`);
        }

        const balanceBefore = Number(user.accountBalance || 0);
        const balanceAfter = balanceBefore - providerCostUsd;

        await tx.user.update({
            where: { id: params.userId },
            data: { accountBalance: balanceAfter },
        });

        // Create balance transaction record
        await tx.balanceTransaction.create({
            data: {
                userId: params.userId,
                type: "DEPLOYMENT",
                amount: -providerCostUsd,
                balanceBefore,
                balanceAfter,
                description: `Deployment: ${params.platform || "vercel"}`,
                metadata: {
                    usageId: record.id,
                    deploymentId: params.deploymentId || null,
                    projectId: params.projectId,
                    platform: params.platform || "vercel",
                    buildDurationMin: params.buildDurationMin || 0,
                },
            },
        });

        return {
            id: record.id,
            providerCostUsd,
            balanceAfter,
        };
    });

    return result;
}

// ============================================================================
// SUPABASE USAGE TRACKING
// ============================================================================

/**
 * Track Supabase compute usage (hourly billing)
 * Called periodically by cron job to bill for active Supabase instances
 */
export async function trackSupabaseComputeUsage(params: {
    userId: string;
    projectId: string;
    supabaseProjectRef: string;
    hoursActive: number;
    instanceSize?: "pico" | "micro" | "small" | "medium" | "large";
    metadata?: Record<string, unknown>;
}): Promise<{ id: string; providerCostUsd: number; balanceAfter: number }> {
    // Calculate cost based on instance size
    // Default to micro if not specified
    const hourlyRate = INFRASTRUCTURE_COSTS.supabase.computePerHour;
    const providerCostUsd = params.hoursActive * hourlyRate;

    if (providerCostUsd <= 0) {
        return { id: "", providerCostUsd: 0, balanceAfter: 0 };
    }

    const result = await prisma.$transaction(async (tx) => {
        // Deduct from user balance
        const user = await tx.user.findUnique({
            where: { id: params.userId },
            select: { accountBalance: true },
        });

        if (!user) {
            throw new Error(`User ${params.userId} not found`);
        }

        const balanceBefore = Number(user.accountBalance || 0);
        const balanceAfter = balanceBefore - providerCostUsd;

        await tx.user.update({
            where: { id: params.userId },
            data: { accountBalance: balanceAfter },
        });

        // Create balance transaction record
        await tx.balanceTransaction.create({
            data: {
                userId: params.userId,
                type: "DATABASE_USAGE",
                amount: -providerCostUsd,
                balanceBefore,
                balanceAfter,
                description: `Supabase compute: ${params.hoursActive} hours`,
                metadata: {
                    projectId: params.projectId,
                    supabaseProjectRef: params.supabaseProjectRef,
                    hoursActive: params.hoursActive,
                    instanceSize: params.instanceSize || "micro",
                    ...params.metadata,
                },
            },
        });

        return {
            id: `supabase-compute-${Date.now()}`,
            providerCostUsd,
            balanceAfter,
        };
    });

    return result;
}

/**
 * Track Supabase database storage usage (monthly billing)
 */
export async function trackSupabaseDatabaseStorage(params: {
    userId: string;
    projectId: string;
    supabaseProjectRef: string;
    storageGB: number;
    metadata?: Record<string, unknown>;
}): Promise<{ id: string; providerCostUsd: number; balanceAfter: number }> {
    const providerCostUsd = params.storageGB * INFRASTRUCTURE_COSTS.supabase.databaseStoragePerGBMonth;

    if (providerCostUsd <= 0) {
        return { id: "", providerCostUsd: 0, balanceAfter: 0 };
    }

    const result = await prisma.$transaction(async (tx) => {
        const user = await tx.user.findUnique({
            where: { id: params.userId },
            select: { accountBalance: true },
        });

        if (!user) {
            throw new Error(`User ${params.userId} not found`);
        }

        const balanceBefore = Number(user.accountBalance || 0);
        const balanceAfter = balanceBefore - providerCostUsd;

        await tx.user.update({
            where: { id: params.userId },
            data: { accountBalance: balanceAfter },
        });

        await tx.balanceTransaction.create({
            data: {
                userId: params.userId,
                type: "DATABASE_USAGE",
                amount: -providerCostUsd,
                balanceBefore,
                balanceAfter,
                description: `Supabase DB storage: ${params.storageGB} GB`,
                metadata: {
                    projectId: params.projectId,
                    supabaseProjectRef: params.supabaseProjectRef,
                    storageGB: params.storageGB,
                    ...params.metadata,
                },
            },
        });

        return {
            id: `supabase-db-storage-${Date.now()}`,
            providerCostUsd,
            balanceAfter,
        };
    });

    return result;
}

/**
 * Track Supabase file storage usage (monthly billing)
 */
export async function trackSupabaseFileStorage(params: {
    userId: string;
    projectId: string;
    supabaseProjectRef: string;
    storageGB: number;
    metadata?: Record<string, unknown>;
}): Promise<{ id: string; providerCostUsd: number; balanceAfter: number }> {
    const providerCostUsd = params.storageGB * INFRASTRUCTURE_COSTS.supabase.fileStoragePerGBMonth;

    if (providerCostUsd <= 0) {
        return { id: "", providerCostUsd: 0, balanceAfter: 0 };
    }

    const result = await prisma.$transaction(async (tx) => {
        const user = await tx.user.findUnique({
            where: { id: params.userId },
            select: { accountBalance: true },
        });

        if (!user) {
            throw new Error(`User ${params.userId} not found`);
        }

        const balanceBefore = Number(user.accountBalance || 0);
        const balanceAfter = balanceBefore - providerCostUsd;

        await tx.user.update({
            where: { id: params.userId },
            data: { accountBalance: balanceAfter },
        });

        await tx.balanceTransaction.create({
            data: {
                userId: params.userId,
                type: "STORAGE_USAGE",
                amount: -providerCostUsd,
                balanceBefore,
                balanceAfter,
                description: `Supabase file storage: ${params.storageGB} GB`,
                metadata: {
                    projectId: params.projectId,
                    supabaseProjectRef: params.supabaseProjectRef,
                    storageGB: params.storageGB,
                    ...params.metadata,
                },
            },
        });

        return {
            id: `supabase-file-storage-${Date.now()}`,
            providerCostUsd,
            balanceAfter,
        };
    });

    return result;
}

/**
 * Track Supabase egress (data transfer)
 */
export async function trackSupabaseEgress(params: {
    userId: string;
    projectId: string;
    supabaseProjectRef: string;
    egressGB: number;
    metadata?: Record<string, unknown>;
}): Promise<{ id: string; providerCostUsd: number; balanceAfter: number }> {
    const providerCostUsd = params.egressGB * INFRASTRUCTURE_COSTS.supabase.egressPerGB;

    if (providerCostUsd <= 0) {
        return { id: "", providerCostUsd: 0, balanceAfter: 0 };
    }

    const result = await prisma.$transaction(async (tx) => {
        const user = await tx.user.findUnique({
            where: { id: params.userId },
            select: { accountBalance: true },
        });

        if (!user) {
            throw new Error(`User ${params.userId} not found`);
        }

        const balanceBefore = Number(user.accountBalance || 0);
        const balanceAfter = balanceBefore - providerCostUsd;

        await tx.user.update({
            where: { id: params.userId },
            data: { accountBalance: balanceAfter },
        });

        await tx.balanceTransaction.create({
            data: {
                userId: params.userId,
                type: "DATABASE_USAGE",
                amount: -providerCostUsd,
                balanceBefore,
                balanceAfter,
                description: `Supabase egress: ${params.egressGB} GB`,
                metadata: {
                    projectId: params.projectId,
                    supabaseProjectRef: params.supabaseProjectRef,
                    egressGB: params.egressGB,
                    ...params.metadata,
                },
            },
        });

        return {
            id: `supabase-egress-${Date.now()}`,
            providerCostUsd,
            balanceAfter,
        };
    });

    return result;
}

// ============================================================================
// USAGE ANALYTICS
// ============================================================================

/**
 * Get usage breakdown for a time period
 * @deprecated Subscription-based analytics will be replaced with balance-based analytics
 */
export async function getCurrentPeriodUsageBreakdown(userId: string): Promise<{
    balance: number;
    usage: {
        ai: { cost: number; count: number };
        sandbox: { cost: number; count: number };
        storage: { cost: number; count: number };
        deployment: { cost: number; count: number };
    };
}> {
    // Get current balance
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { accountBalance: true },
    });

    const balance = Number(user?.accountBalance || 0);

    // Get current month's usage
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get AI usage
    const aiUsage = await prisma.aICreditUsage.aggregate({
        where: {
            userId,
            createdAt: { gte: monthStart },
        },
        _sum: { providerCostUsd: true },
        _count: true,
    });

    // Get sandbox usage
    const sandboxUsage = await prisma.sandboxUsage.aggregate({
        where: {
            userId,
            createdAt: { gte: monthStart },
        },
        _sum: { providerCostUsd: true },
        _count: true,
    });

    // Get storage usage
    const storageUsage = await prisma.storageUsage.aggregate({
        where: {
            userId,
            createdAt: { gte: monthStart },
        },
        _sum: { providerCostUsd: true },
        _count: true,
    });

    // Get deployment usage
    const deploymentUsage = await prisma.deploymentUsage.aggregate({
        where: {
            userId,
            createdAt: { gte: monthStart },
        },
        _sum: { providerCostUsd: true },
        _count: true,
    });

    return {
        balance,
        usage: {
            ai: {
                cost: Number(aiUsage._sum.providerCostUsd || 0),
                count: aiUsage._count,
            },
            sandbox: {
                cost: Number(sandboxUsage._sum.providerCostUsd || 0),
                count: sandboxUsage._count,
            },
            storage: {
                cost: Number(storageUsage._sum.providerCostUsd || 0),
                count: storageUsage._count,
            },
            deployment: {
                cost: Number(deploymentUsage._sum.providerCostUsd || 0),
                count: deploymentUsage._count,
            },
        },
    };
}
