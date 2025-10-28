/**
 * Subscription Management Utility
 * Handles user subscriptions, plan assignments, and billing
 */

import { prisma } from "@/lib/db";

export interface SubscriptionDetails {
    id: string;
    userId: string;
    plan: {
        name: string;
        displayName: string;
        priceMonthlyUsd: number;
    };
    status: string;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    cancelAtPeriodEnd: boolean;
}

/**
 * Get user's current subscription
 */
export async function getUserSubscription(
    userId: string
): Promise<SubscriptionDetails | null> {
    const subscription = await prisma.userSubscription.findUnique({
        where: { userId },
        include: {
            plan: true,
        },
    });

    if (!subscription) return null;

    return {
        id: subscription.id,
        userId: subscription.userId,
        plan: {
            name: subscription.plan.name,
            displayName: subscription.plan.displayName,
            priceMonthlyUsd: subscription.plan.priceMonthlyUsd,
        },
        status: subscription.status,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
    };
}

/**
 * Create or assign a plan to a user
 * By default assigns HOBBY plan to new users
 */
export async function assignPlanToUser(
    userId: string,
    planName: "HOBBY" | "PRO" | "ENTERPRISE" = "HOBBY"
): Promise<SubscriptionDetails> {
    // Get the plan
    const plan = await prisma.plan.findUnique({
        where: { name: planName },
    });

    if (!plan) {
        throw new Error(`Plan ${planName} not found`);
    }

    // Calculate period end (30 days for monthly billing)
    const periodStart = new Date();
    const periodEnd = new Date();
    periodEnd.setDate(periodEnd.getDate() + 30);

    // Check if subscription already exists
    const existing = await prisma.userSubscription.findUnique({
        where: { userId },
    });

    let subscription;

    if (existing) {
        // Update existing subscription
        subscription = await prisma.userSubscription.update({
            where: { userId },
            data: {
                planId: plan.id,
                currentPeriodStart: periodStart,
                currentPeriodEnd: periodEnd,
                status: "active",
            },
            include: {
                plan: true,
            },
        });
    } else {
        // Create new subscription
        subscription = await prisma.userSubscription.create({
            data: {
                userId,
                planId: plan.id,
                currentPeriodStart: periodStart,
                currentPeriodEnd: periodEnd,
                status: "active",
            },
            include: {
                plan: true,
            },
        });
    }

    return {
        id: subscription.id,
        userId: subscription.userId,
        plan: {
            name: subscription.plan.name,
            displayName: subscription.plan.displayName,
            priceMonthlyUsd: subscription.plan.priceMonthlyUsd,
        },
        status: subscription.status,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
    };
}

/**
 * Cancel subscription at end of period
 */
export async function cancelSubscription(
    userId: string
): Promise<SubscriptionDetails> {
    const subscription = await prisma.userSubscription.update({
        where: { userId },
        data: {
            cancelAtPeriodEnd: true,
            cancelledAt: new Date(),
        },
        include: {
            plan: true,
        },
    });

    return {
        id: subscription.id,
        userId: subscription.userId,
        plan: {
            name: subscription.plan.name,
            displayName: subscription.plan.displayName,
            priceMonthlyUsd: subscription.plan.priceMonthlyUsd,
        },
        status: subscription.status,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
    };
}

/**
 * Reactivate a cancelled subscription
 */
export async function reactivateSubscription(
    userId: string
): Promise<SubscriptionDetails> {
    const subscription = await prisma.userSubscription.update({
        where: { userId },
        data: {
            cancelAtPeriodEnd: false,
            cancelledAt: null,
            status: "active",
        },
        include: {
            plan: true,
        },
    });

    return {
        id: subscription.id,
        userId: subscription.userId,
        plan: {
            name: subscription.plan.name,
            displayName: subscription.plan.displayName,
            priceMonthlyUsd: subscription.plan.priceMonthlyUsd,
        },
        status: subscription.status,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
    };
}

/**
 * Get all subscriptions expiring soon (within 7 days)
 */
export async function getExpiringSoonSubscriptions(): Promise<
    SubscriptionDetails[]
> {
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const subscriptions = await prisma.userSubscription.findMany({
        where: {
            currentPeriodEnd: {
                lte: sevenDaysFromNow,
            },
            status: "active",
        },
        include: {
            plan: true,
        },
    });

    return subscriptions.map((sub) => ({
        id: sub.id,
        userId: sub.userId,
        plan: {
            name: sub.plan.name,
            displayName: sub.plan.displayName,
            priceMonthlyUsd: sub.plan.priceMonthlyUsd,
        },
        status: sub.status,
        currentPeriodStart: sub.currentPeriodStart,
        currentPeriodEnd: sub.currentPeriodEnd,
        cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
    }));
}

/**
 * Check if user has an active subscription
 */
export async function hasActiveSubscription(userId: string): Promise<boolean> {
    const subscription = await prisma.userSubscription.findUnique({
        where: { userId },
    });

    return subscription?.status === "active";
}

/**
 * Get user's plan name (shorthand)
 */
export async function getUserPlan(
    userId: string
): Promise<"HOBBY" | "PRO" | "ENTERPRISE"> {
    const subscription = await getUserSubscription(userId);
    return (subscription?.plan.name as "HOBBY" | "PRO" | "ENTERPRISE") || "HOBBY";
}
