/**
 * AI Token Usage Tracking & Billing
 * Tracks AI token usage for billing
 */

import { prisma } from "@/lib/db";

/**
 * Create or update usage record for current billing period
 */
export async function updateUsageRecord(
    userId: string,
    usage: {
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

    // Find existing usage record for current period
    const existingRecord = await prisma.usageRecord.findUnique({
        where: {
            subscriptionId_billingPeriodStart: {
                subscriptionId: subscription.id,
                billingPeriodStart: subscription.currentPeriodStart,
            },
        },
    });

    const totalCostUsd = usage.aiCostUsd || 0;

    if (existingRecord) {
        // Update existing record
        await prisma.usageRecord.update({
            where: { id: existingRecord.id },
            data: {
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
