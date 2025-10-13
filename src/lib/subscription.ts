/**
 * Subscription Management Utility
 * Handles team subscriptions, plan assignments, and billing
 */

import { prisma } from "@/lib/db";

export interface SubscriptionDetails {
    id: string;
    teamId: string;
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
 * Get team's current subscription
 */
export async function getTeamSubscription(
    teamId: string
): Promise<SubscriptionDetails | null> {
    const subscription = await prisma.teamSubscription.findUnique({
        where: { teamId },
        include: {
            plan: true,
        },
    });

    if (!subscription) return null;

    return {
        id: subscription.id,
        teamId: subscription.teamId,
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
 * Create or assign a plan to a team
 * By default assigns HOBBY plan to new teams
 */
export async function assignPlanToTeam(
    teamId: string,
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
    const existing = await prisma.teamSubscription.findUnique({
        where: { teamId },
    });

    let subscription;

    if (existing) {
        // Update existing subscription
        subscription = await prisma.teamSubscription.update({
            where: { teamId },
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
        subscription = await prisma.teamSubscription.create({
            data: {
                teamId,
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
        teamId: subscription.teamId,
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
    teamId: string
): Promise<SubscriptionDetails> {
    const subscription = await prisma.teamSubscription.update({
        where: { teamId },
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
        teamId: subscription.teamId,
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
    teamId: string
): Promise<SubscriptionDetails> {
    const subscription = await prisma.teamSubscription.update({
        where: { teamId },
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
        teamId: subscription.teamId,
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

    const subscriptions = await prisma.teamSubscription.findMany({
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
        teamId: sub.teamId,
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
 * Check if team has an active subscription
 */
export async function hasActiveSubscription(teamId: string): Promise<boolean> {
    const subscription = await prisma.teamSubscription.findUnique({
        where: { teamId },
    });

    return subscription?.status === "active";
}

/**
 * Get team's plan name
 */
export async function getTeamPlan(
    teamId: string
): Promise<"HOBBY" | "PRO" | "ENTERPRISE"> {
    const subscription = await getTeamSubscription(teamId);
    return (subscription?.plan.name as "HOBBY" | "PRO" | "ENTERPRISE") || "HOBBY";
}
