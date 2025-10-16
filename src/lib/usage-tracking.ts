/**
 * Infrastructure Usage Tracking & Billing
 * Tracks database, storage, bandwidth, auth, and edge function usage
 */

import { prisma } from "@/lib/db";

// Pricing per unit (in USD)
const INFRASTRUCTURE_PRICING = {
    // Database storage (per GB/month beyond free tier)
    database: 0.25,

    // File storage (per GB/month beyond free tier)
    storage: 0.04,

    // Bandwidth (per GB beyond free tier)
    bandwidth: 0.12,

    // Auth - Monthly Active Users (per user beyond free tier)
    auth: 0.008,

    // Edge function invocations (per million invocations)
    edgeFunctions: 0.5,
} as const;

// Free tier limits by plan
const FREE_TIERS = {
    HOBBY: {
        databaseGb: 0.5,
        storageGb: 1,
        bandwidthGb: 100,
        authMau: 1000,
        edgeFunctionInvocations: 100000, // 100k
    },
    PRO: {
        databaseGb: 5,
        storageGb: 10,
        bandwidthGb: 500,
        authMau: 10000,
        edgeFunctionInvocations: 1000000, // 1M
    },
    ENTERPRISE: {
        databaseGb: 999999, // Virtually unlimited
        storageGb: 999999,
        bandwidthGb: 999999,
        authMau: 999999,
        edgeFunctionInvocations: 999999999,
    },
} as const;

/**
 * Calculate infrastructure costs based on usage
 */
export function calculateInfrastructureCosts(
    planName: "HOBBY" | "PRO" | "ENTERPRISE",
    usage: {
        databaseSizeGb: number;
        storageSizeGb: number;
        bandwidthGb: number;
        authMau: number;
        edgeFunctionInvocations: number;
    }
): {
    databaseCost: number;
    storageCost: number;
    bandwidthCost: number;
    authCost: number;
    edgeFunctionCost: number;
    totalCost: number;
} {
    const freeTier = FREE_TIERS[planName];

    // Calculate overage for each resource
    const databaseOverage = Math.max(0, usage.databaseSizeGb - freeTier.databaseGb);
    const storageOverage = Math.max(0, usage.storageSizeGb - freeTier.storageGb);
    const bandwidthOverage = Math.max(0, usage.bandwidthGb - freeTier.bandwidthGb);
    const authOverage = Math.max(0, usage.authMau - freeTier.authMau);
    const edgeFunctionOverage = Math.max(
        0,
        usage.edgeFunctionInvocations - freeTier.edgeFunctionInvocations
    );

    // Calculate costs
    const databaseCost = databaseOverage * INFRASTRUCTURE_PRICING.database;
    const storageCost = storageOverage * INFRASTRUCTURE_PRICING.storage;
    const bandwidthCost = bandwidthOverage * INFRASTRUCTURE_PRICING.bandwidth;
    const authCost = authOverage * INFRASTRUCTURE_PRICING.auth;
    const edgeFunctionCost =
        (edgeFunctionOverage / 1000000) * INFRASTRUCTURE_PRICING.edgeFunctions;

    const totalCost =
        databaseCost + storageCost + bandwidthCost + authCost + edgeFunctionCost;

    return {
        databaseCost,
        storageCost,
        bandwidthCost,
        authCost,
        edgeFunctionCost,
        totalCost,
    };
}

/**
 * Create or update usage record for current billing period
 */
export async function updateUsageRecord(
    userId: string,
    usage: {
        databaseSizeGb?: number;
        storageSizeGb?: number;
        bandwidthGb?: number;
        authMau?: number;
        edgeFunctionInvocations?: number;
        aiTokensUsed?: number;
        aiCostUsd?: number;
    }
): Promise<void> {
    // Get subscription
    const subscription = await prisma.userSubscription.findUnique({
        where: { userId },
        include: { plan: true },
    });

    if (!subscription) {
        throw new Error("No subscription found for user");
    }

    const planName = subscription.plan.name as "HOBBY" | "PRO" | "ENTERPRISE";

    // Calculate infrastructure costs
    const infraCosts = calculateInfrastructureCosts(planName, {
        databaseSizeGb: usage.databaseSizeGb || 0,
        storageSizeGb: usage.storageSizeGb || 0,
        bandwidthGb: usage.bandwidthGb || 0,
        authMau: usage.authMau || 0,
        edgeFunctionInvocations: usage.edgeFunctionInvocations || 0,
    });

    // Find existing usage record for current period
    const existingRecord = await prisma.usageRecord.findUnique({
        where: {
            subscriptionId_billingPeriodStart: {
                subscriptionId: subscription.id,
                billingPeriodStart: subscription.currentPeriodStart,
            },
        },
    });

    const totalCostUsd = (usage.aiCostUsd || 0) + infraCosts.totalCost;

    if (existingRecord) {
        // Update existing record
        await prisma.usageRecord.update({
            where: { id: existingRecord.id },
            data: {
                ...(usage.databaseSizeGb !== undefined && {
                    databaseSizeGb: usage.databaseSizeGb,
                    databaseCostUsd: infraCosts.databaseCost,
                }),
                ...(usage.storageSizeGb !== undefined && {
                    storageSizeGb: usage.storageSizeGb,
                    storageCostUsd: infraCosts.storageCost,
                }),
                ...(usage.bandwidthGb !== undefined && {
                    bandwidthGb: usage.bandwidthGb,
                    bandwidthCostUsd: infraCosts.bandwidthCost,
                }),
                ...(usage.authMau !== undefined && {
                    authMau: usage.authMau,
                    authCostUsd: infraCosts.authCost,
                }),
                ...(usage.edgeFunctionInvocations !== undefined && {
                    edgeFunctionInvocations: usage.edgeFunctionInvocations,
                    edgeFunctionCostUsd: infraCosts.edgeFunctionCost,
                }),
                ...(usage.aiTokensUsed !== undefined && {
                    aiTokensUsed: usage.aiTokensUsed,
                }),
                ...(usage.aiCostUsd !== undefined && {
                    aiCostUsd: usage.aiCostUsd,
                }),
                totalCostUsd,
            },
        });
    } else {
        // Create new record
        await prisma.usageRecord.create({
            data: {
                userId,
                subscriptionId: subscription.id,
                billingPeriodStart: subscription.currentPeriodStart,
                billingPeriodEnd: subscription.currentPeriodEnd,
                databaseSizeGb: usage.databaseSizeGb || 0,
                databaseCostUsd: infraCosts.databaseCost,
                storageSizeGb: usage.storageSizeGb || 0,
                storageCostUsd: infraCosts.storageCost,
                bandwidthGb: usage.bandwidthGb || 0,
                bandwidthCostUsd: infraCosts.bandwidthCost,
                authMau: usage.authMau || 0,
                authCostUsd: infraCosts.authCost,
                edgeFunctionInvocations: usage.edgeFunctionInvocations || 0,
                edgeFunctionCostUsd: infraCosts.edgeFunctionCost,
                aiTokensUsed: usage.aiTokensUsed || 0,
                aiCostUsd: usage.aiCostUsd || 0,
                totalCostUsd,
            },
        });
    }
}

/**
 * Get usage record for current billing period
 */
export async function getCurrentUsageRecord(userId: string) {
    const subscription = await prisma.userSubscription.findUnique({
        where: { userId },
    });

    if (!subscription) {
        return null;
    }

    return prisma.usageRecord.findUnique({
        where: {
            subscriptionId_billingPeriodStart: {
                subscriptionId: subscription.id,
                billingPeriodStart: subscription.currentPeriodStart,
            },
        },
    });
}

/**
 * Get all usage records for a user
 */
export async function getUserUsageHistory(userId: string) {
    const subscription = await prisma.userSubscription.findUnique({
        where: { userId },
    });

    if (!subscription) {
        return [];
    }

    return prisma.usageRecord.findMany({
        where: { subscriptionId: subscription.id },
        orderBy: { billingPeriodStart: "desc" },
    });
}

/**
 * Check if user has exceeded usage limits (for Hobby plan)
 */
export async function checkUsageLimits(
    userId: string,
    resource: "database" | "storage" | "bandwidth" | "auth" | "edgeFunctions"
): Promise<{ exceeded: boolean; current: number; limit: number }> {
    const subscription = await prisma.userSubscription.findUnique({
        where: { userId },
        include: { plan: true },
    });

    if (!subscription) {
        throw new Error("No subscription found");
    }

    const planName = subscription.plan.name as "HOBBY" | "PRO" | "ENTERPRISE";
    const freeTier = FREE_TIERS[planName];

    const usageRecord = await getCurrentUsageRecord(userId);

    if (!usageRecord) {
        return { exceeded: false, current: 0, limit: freeTier.databaseGb };
    }

    let current = 0;
    let limit = 0;

    switch (resource) {
        case "database":
            current = usageRecord.databaseSizeGb;
            limit = freeTier.databaseGb;
            break;
        case "storage":
            current = usageRecord.storageSizeGb;
            limit = freeTier.storageGb;
            break;
        case "bandwidth":
            current = usageRecord.bandwidthGb;
            limit = freeTier.bandwidthGb;
            break;
        case "auth":
            current = usageRecord.authMau;
            limit = freeTier.authMau;
            break;
        case "edgeFunctions":
            current = usageRecord.edgeFunctionInvocations;
            limit = freeTier.edgeFunctionInvocations;
            break;
    }

    // For Hobby plan, hard limits apply
    const exceeded = planName === "HOBBY" && current >= limit;

    return { exceeded, current, limit };
}
