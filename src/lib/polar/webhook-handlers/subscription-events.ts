/**
 * Polar Subscription Event Handlers
 * 
 * Handles subscription lifecycle events from Polar webhooks.
 */

import { prisma } from "@/lib/db";
import { SubscriptionStatus } from "@prisma/client";
import type { SubscriptionEvent } from "../webhook-types";

/**
 * Handle subscription.created event
 */
export async function handleSubscriptionCreated(data: SubscriptionEvent) {
    console.log("Processing subscription.created event:", data.id);

    try {
        const subscription = data;
        const customer = subscription.customer;

        if (!customer) {
            console.error("No customer data in subscription event");
            return { success: false, error: "No customer data" };
        }

        // Find user by Polar customer ID or external ID
        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { polarCustomerId: customer.id },
                    { polarCustomerExtId: customer.external_id },
                    { id: customer.external_id },
                ],
            },
        });

        if (!user) {
            console.error(`User not found for customer ${customer.id}`);
            return { success: false, error: "User not found" };
        }

        // Find the plan based on product ID
        const plan = await prisma.plan.findFirst({
            where: {
                polarProductId: subscription.product_id,
            },
        });

        if (!plan) {
            console.error(`Plan not found for product ${subscription.product_id}`);
            return { success: false, error: "Plan not found" };
        }

        // Create or update subscription
        await prisma.userSubscription.upsert({
            where: { userId: user.id },
            create: {
                userId: user.id,
                planId: plan.id,
                status: SubscriptionStatus.TRIALING,
                polarSubscriptionId: subscription.id,
                polarCustomerId: customer.id,
                currentPeriodStart: new Date(subscription.current_period_start),
                currentPeriodEnd: new Date(subscription.current_period_end),
                monthlyCreditsUsed: 0,
                periodCreditsReset: new Date(),
            },
            update: {
                planId: plan.id,
                polarSubscriptionId: subscription.id,
                polarCustomerId: customer.id,
                status: SubscriptionStatus.TRIALING,
                currentPeriodStart: new Date(subscription.current_period_start),
                currentPeriodEnd: new Date(subscription.current_period_end),
            },
        });

        console.log(`Subscription created for user ${user.id}`);
        return { success: true };
    } catch (error) {
        console.error("Error handling subscription.created:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}

/**
 * Handle subscription.active event
 */
export async function handleSubscriptionActive(data: SubscriptionEvent) {
    console.log("Processing subscription.active event:", data.id);

    try {
        const subscription = data;

        // Update subscription status to ACTIVE
        await prisma.userSubscription.updateMany({
            where: { polarSubscriptionId: subscription.id },
            data: {
                status: SubscriptionStatus.ACTIVE,
                currentPeriodStart: new Date(subscription.current_period_start),
                currentPeriodEnd: new Date(subscription.current_period_end),
                cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
                paymentFailedAt: null,
                gracePeriodEndsAt: null,
            },
        });

        console.log(`Subscription ${subscription.id} activated`);
        return { success: true };
    } catch (error) {
        console.error("Error handling subscription.active:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}

/**
 * Handle subscription.updated event
 */
export async function handleSubscriptionUpdated(data: SubscriptionEvent) {
    console.log("Processing subscription.updated event:", data.id);

    try {
        const subscription = data;

        // Map Polar status to our status
        let status: SubscriptionStatus = SubscriptionStatus.ACTIVE;
        if (subscription.status === "canceled") status = SubscriptionStatus.CANCELLED;
        else if (subscription.status === "past_due") status = SubscriptionStatus.PAST_DUE;
        else if (subscription.status === "unpaid") status = SubscriptionStatus.UNPAID;
        else if (subscription.status === "trialing") status = SubscriptionStatus.TRIALING;

        await prisma.userSubscription.updateMany({
            where: { polarSubscriptionId: subscription.id },
            data: {
                status,
                currentPeriodStart: new Date(subscription.current_period_start),
                currentPeriodEnd: new Date(subscription.current_period_end),
                cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
            },
        });

        console.log(`Subscription ${subscription.id} updated`);
        return { success: true };
    } catch (error) {
        console.error("Error handling subscription.updated:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}

/**
 * Handle subscription.canceled event
 */
export async function handleSubscriptionCanceled(data: SubscriptionEvent) {
    console.log("Processing subscription.canceled event:", data.id);

    try {
        const subscription = data;

        await prisma.userSubscription.updateMany({
            where: { polarSubscriptionId: subscription.id },
            data: {
                status: SubscriptionStatus.CANCELLED,
                cancelledAt: new Date(),
                cancelAtPeriodEnd: true,
            },
        });

        console.log(`Subscription ${subscription.id} canceled`);
        return { success: true };
    } catch (error) {
        console.error("Error handling subscription.canceled:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}

/**
 * Handle subscription.revoked event
 */
export async function handleSubscriptionRevoked(data: SubscriptionEvent) {
    console.log("Processing subscription.revoked event:", data.id);

    try {
        const subscription = data;

        await prisma.userSubscription.updateMany({
            where: { polarSubscriptionId: subscription.id },
            data: {
                status: SubscriptionStatus.CANCELLED,
                cancelledAt: new Date(),
                currentPeriodEnd: new Date(), // End immediately
            },
        });

        console.log(`Subscription ${subscription.id} revoked`);
        return { success: true };
    } catch (error) {
        console.error("Error handling subscription.revoked:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}

/**
 * Handle subscription renewal (period transition)
 */
/**
 * Handle subscription renewed
 */
export async function handleSubscriptionRenewed(data: SubscriptionEvent) {
    console.log("Processing subscription renewal:", data.id);

    try {
        const subscription = data;

        // Reset credits on renewal
        await prisma.userSubscription.updateMany({
            where: { polarSubscriptionId: subscription.id },
            data: {
                currentPeriodStart: new Date(subscription.current_period_start),
                currentPeriodEnd: new Date(subscription.current_period_end),
                monthlyCreditsUsed: 0,
                periodCreditsReset: new Date(),
                paymentFailedAt: null,
                gracePeriodEndsAt: null,
            },
        });

        console.log(`Subscription ${subscription.id} renewed, credits reset`);
        return { success: true };
    } catch (error) {
        console.error("Error handling subscription renewal:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}
