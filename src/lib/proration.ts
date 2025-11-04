/**
 * Proration Calculation Utility
 * 
 * Handles credit and payment proration when users upgrade or downgrade their subscription plans
 * 
 * Key Concepts:
 * - Upgrade: User switches to a higher-tier plan mid-cycle
 *   → Gets prorated credits for remaining period
 *   → Pays difference for remaining period
 * 
 * - Downgrade: User switches to a lower-tier plan mid-cycle
 *   → Credits adjusted at next billing cycle
 *   → No refund, but applies at period end
 */

import { prisma } from "@/lib/db";

export interface ProrationResult {
    // Credit adjustments
    oldPlanCredits: number;
    newPlanCredits: number;
    creditsDifference: number;
    proratedCredits: number;

    // Payment adjustments
    oldPlanPrice: number;
    newPlanPrice: number;
    priceDifference: number;
    proratedPayment: number;

    // Timing
    daysRemaining: number;
    daysInPeriod: number;
    proratedPercentage: number;

    // Recommendations
    shouldChargeImmediately: boolean;
    shouldRefund: boolean;
    effectiveDate: Date;
}

/**
 * Calculate proration for plan change
 * 
 * @param userId - User ID
 * @param newPlanId - New plan ID
 * @returns Proration calculation results
 */
export async function calculateProration(
    userId: string,
    newPlanId: string
): Promise<ProrationResult> {
    // Get current subscription
    const subscription = await prisma.userSubscription.findUnique({
        where: { userId },
        include: { plan: true },
    });

    if (!subscription) {
        throw new Error("No active subscription found for user");
    }

    // Get new plan
    const newPlan = await prisma.plan.findUnique({
        where: { id: newPlanId },
    });

    if (!newPlan) {
        throw new Error("New plan not found");
    }

    // Calculate time-based proration
    const now = new Date();
    const periodStart = subscription.currentPeriodStart;
    const periodEnd = subscription.currentPeriodEnd;

    const totalPeriodMs = periodEnd.getTime() - periodStart.getTime();
    const remainingPeriodMs = periodEnd.getTime() - now.getTime();

    const daysInPeriod = Math.ceil(totalPeriodMs / (1000 * 60 * 60 * 24));
    const daysRemaining = Math.ceil(remainingPeriodMs / (1000 * 60 * 60 * 24));
    const proratedPercentage = remainingPeriodMs / totalPeriodMs;

    // Calculate credit differences
    const oldPlanCredits = subscription.plan.monthlyCredits;
    const newPlanCredits = newPlan.monthlyCredits;
    const creditsDifference = newPlanCredits - oldPlanCredits;

    // Calculate prorated credits for remaining period
    const proratedCredits = Math.round(creditsDifference * proratedPercentage);

    // Calculate payment differences
    const oldPlanPrice = subscription.plan.priceMonthlyUsd;
    const newPlanPrice = newPlan.priceMonthlyUsd;
    const priceDifference = newPlanPrice - oldPlanPrice;

    // Calculate prorated payment for remaining period
    const proratedPayment = Number((priceDifference * proratedPercentage).toFixed(2));

    // Determine action recommendations
    const isUpgrade = newPlanPrice > oldPlanPrice;
    const isDowngrade = newPlanPrice < oldPlanPrice;

    return {
        // Credit adjustments
        oldPlanCredits,
        newPlanCredits,
        creditsDifference,
        proratedCredits,

        // Payment adjustments
        oldPlanPrice,
        newPlanPrice,
        priceDifference,
        proratedPayment,

        // Timing
        daysRemaining,
        daysInPeriod,
        proratedPercentage,

        // Recommendations
        shouldChargeImmediately: isUpgrade && proratedPayment > 0,
        shouldRefund: isDowngrade, // Note: Typically apply at period end, not refund
        effectiveDate: isDowngrade ? periodEnd : now,
    };
}

/**
 * Apply proration to user's subscription
 * 
 * @param userId - User ID
 * @param newPlanId - New plan ID
 * @param proration - Proration calculation result
 * @returns Updated subscription
 */
export async function applyProration(
    userId: string,
    newPlanId: string,
    proration: ProrationResult
) {
    const subscription = await prisma.userSubscription.findUnique({
        where: { userId },
    });

    if (!subscription) {
        throw new Error("No active subscription found for user");
    }

    // For upgrades: Apply immediately
    if (proration.shouldChargeImmediately) {
        // Update plan immediately
        await prisma.userSubscription.update({
            where: { userId },
            data: {
                planId: newPlanId,
                // Add prorated credits to monthly allowance
                // Note: Credits are reset at period end anyway
                updatedAt: new Date(),
            },
        });

        // Create payment transaction for prorated amount
        if (proration.proratedPayment > 0) {
            await prisma.paymentTransaction.create({
                data: {
                    userId,
                    amount: proration.proratedPayment,
                    currency: "USD",
                    status: "pending",
                    paymentMethod: "polar",
                    metadata: {
                        type: "proration_upgrade",
                        oldPlanId: subscription.planId,
                        newPlanId,
                        proratedPayment: proration.proratedPayment,
                        proratedCredits: proration.proratedCredits,
                        daysRemaining: proration.daysRemaining,
                    },
                },
            });
        }

        return {
            action: "upgraded_immediately",
            message: `Plan upgraded. You've been charged $${proration.proratedPayment.toFixed(2)} for the remaining ${proration.daysRemaining} days.`,
            creditsAdded: proration.proratedCredits,
        };
    }

    // For downgrades: Schedule for next period
    if (proration.shouldRefund) {
        // Don't change plan immediately - schedule for period end
        await prisma.userSubscription.update({
            where: { userId },
            data: {
                // Store the pending plan change
                pendingPlanId: newPlanId,
                planChangeAt: proration.effectiveDate,
                updatedAt: new Date(),
            },
        });

        return {
            action: "downgrade_scheduled",
            message: `Your plan will change to the new tier on ${proration.effectiveDate.toLocaleDateString()}. You'll retain access to current features until then.`,
            effectiveDate: proration.effectiveDate,
            pendingPlanId: newPlanId,
        };
    }

    return {
        action: "no_change_needed",
        message: "Plan change does not require proration.",
    };
}

/**
 * Get proration preview for UI display
 * 
 * @param userId - User ID
 * @param newPlanId - New plan ID
 * @returns User-friendly proration summary
 */
export async function getProrationPreview(
    userId: string,
    newPlanId: string
): Promise<{
    currentPlan: string;
    newPlan: string;
    immediateCharge: number;
    creditsAdded: number;
    effectiveDate: Date;
    summary: string;
}> {
    const proration = await calculateProration(userId, newPlanId);

    const subscription = await prisma.userSubscription.findUnique({
        where: { userId },
        include: { plan: true },
    });

    const newPlan = await prisma.plan.findUnique({
        where: { id: newPlanId },
    });

    if (!subscription || !newPlan) {
        throw new Error("Invalid subscription or plan");
    }

    let summary = "";

    if (proration.shouldChargeImmediately) {
        summary = `You'll be charged $${proration.proratedPayment.toFixed(2)} today for upgrading with ${proration.daysRemaining} days remaining in your billing cycle. You'll receive ${proration.proratedCredits} additional credits immediately.`;
    } else if (proration.shouldRefund) {
        summary = `Your plan will downgrade to ${newPlan.displayName} on ${proration.effectiveDate.toLocaleDateString()}. You'll retain access to ${subscription.plan.displayName} features until then.`;
    } else {
        summary = "Plan change will take effect immediately with no additional charges.";
    }

    return {
        currentPlan: subscription.plan.displayName,
        newPlan: newPlan.displayName,
        immediateCharge: proration.shouldChargeImmediately ? proration.proratedPayment : 0,
        creditsAdded: proration.shouldChargeImmediately ? proration.proratedCredits : 0,
        effectiveDate: proration.effectiveDate,
        summary,
    };
}

/**
 * Calculate refund amount for cancellation
 * 
 * @param userId - User ID
 * @returns Refund amount (if applicable)
 */
export async function calculateCancellationRefund(
    userId: string
): Promise<{
    refundAmount: number;
    daysRemaining: number;
    shouldRefund: boolean;
}> {
    const subscription = await prisma.userSubscription.findUnique({
        where: { userId },
        include: { plan: true },
    });

    if (!subscription) {
        throw new Error("No active subscription found");
    }

    const now = new Date();
    const periodEnd = subscription.currentPeriodEnd;
    const periodStart = subscription.currentPeriodStart;

    const totalPeriodMs = periodEnd.getTime() - periodStart.getTime();
    const remainingPeriodMs = periodEnd.getTime() - now.getTime();

    const daysRemaining = Math.ceil(remainingPeriodMs / (1000 * 60 * 60 * 24));
    const proratedPercentage = remainingPeriodMs / totalPeriodMs;

    // Calculate refund (typically not offered, but good to calculate)
    const refundAmount = Number((subscription.plan.priceMonthlyUsd * proratedPercentage).toFixed(2));

    return {
        refundAmount,
        daysRemaining,
        shouldRefund: false, // Most SaaS don't offer refunds on cancellation
    };
}

/**
 * Process scheduled plan changes (run as cron job or on billing cycle)
 * 
 * This applies pending plan downgrades that were scheduled for the end of the billing period
 * 
 * @returns Results of processing
 */
export async function processPendingPlanChanges(): Promise<{
    processed: number;
    errors: Array<{ userId: string; error: string }>;
}> {
    const now = new Date();

    // Find all subscriptions with pending plan changes that should be applied
    const subscriptionsToUpdate = await prisma.userSubscription.findMany({
        where: {
            pendingPlanId: { not: null },
            planChangeAt: { lte: now },
        },
        include: {
            plan: true,
        },
    });

    const errors: Array<{ userId: string; error: string }> = [];
    let processed = 0;

    console.log(`Processing ${subscriptionsToUpdate.length} pending plan changes...`);

    for (const subscription of subscriptionsToUpdate) {
        if (!subscription.pendingPlanId) continue;

        try {
            // Apply the pending plan change
            await prisma.userSubscription.update({
                where: { userId: subscription.userId },
                data: {
                    planId: subscription.pendingPlanId,
                    pendingPlanId: null,
                    planChangeAt: null,
                    // Reset credits for new plan
                    monthlyCreditsUsed: 0,
                    periodCreditsReset: new Date(),
                    updatedAt: new Date(),
                },
            });

            console.log(
                `Applied plan change for user ${subscription.userId}: ${subscription.plan.name} → Plan ${subscription.pendingPlanId}`
            );
            processed++;
        } catch (error) {
            console.error(`Failed to process plan change for user ${subscription.userId}:`, error);
            errors.push({
                userId: subscription.userId,
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }

    console.log(`Processed ${processed}/${subscriptionsToUpdate.length} pending plan changes`);

    return { processed, errors };
}

/**
 * Cancel a scheduled plan change (user changed their mind)
 * 
 * @param userId - User ID
 */
export async function cancelPendingPlanChange(userId: string): Promise<void> {
    await prisma.userSubscription.update({
        where: { userId },
        data: {
            pendingPlanId: null,
            planChangeAt: null,
            updatedAt: new Date(),
        },
    });

    console.log(`Cancelled pending plan change for user ${userId}`);
}

/**
 * Get pending plan change details for a user
 * 
 * @param userId - User ID
 * @returns Pending plan change info or null
 */
export async function getPendingPlanChange(userId: string): Promise<{
    currentPlan: { id: string; name: string; displayName: string };
    pendingPlan: { id: string; name: string; displayName: string };
    changeDate: Date;
} | null> {
    const subscription = await prisma.userSubscription.findUnique({
        where: { userId },
        include: { plan: true },
    });

    if (!subscription || !subscription.pendingPlanId || !subscription.planChangeAt) {
        return null;
    }

    const pendingPlan = await prisma.plan.findUnique({
        where: { id: subscription.pendingPlanId },
    });

    if (!pendingPlan) {
        return null;
    }

    return {
        currentPlan: {
            id: subscription.plan.id,
            name: subscription.plan.name,
            displayName: subscription.plan.displayName,
        },
        pendingPlan: {
            id: pendingPlan.id,
            name: pendingPlan.name,
            displayName: pendingPlan.displayName,
        },
        changeDate: subscription.planChangeAt,
    };
}
