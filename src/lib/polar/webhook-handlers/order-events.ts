/**
 * Polar Order Event Handlers
 * 
 * Handles order and payment events from Polar webhooks.
 */

import { prisma } from "@/lib/db";

/**
 * Handle order.created event
 */
export async function handleOrderCreated(data: any) {
    console.log("Processing order.created event:", data.id);

    try {
        const order = data;

        // Find user by customer ID
        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { polarCustomerId: order.customer_id },
                    { polarCustomerExtId: order.customer?.external_id },
                ],
            },
            include: {
                subscription: true,
            },
        });

        if (!user) {
            console.error(`User not found for order ${order.id}`);
            return { success: false, error: "User not found" };
        }

        if (!user.subscription) {
            console.error(`Subscription not found for user ${user.id}`);
            return { success: false, error: "Subscription not found" };
        }

        // Create invoice record
        await prisma.invoice.create({
            data: {
                userId: user.id,
                subscriptionId: user.subscription.id,
                invoiceNumber: order.id,
                status: "pending",
                billingPeriodStart: new Date(order.created_at),
                billingPeriodEnd: new Date(order.created_at),
                totalUsd: order.amount / 100, // Convert cents to dollars
                currency: order.currency || "USD",
                dueDate: new Date(order.created_at),
                polarCheckoutId: order.checkout_id,
                polarPaymentId: order.id,
            },
        });

        console.log(`Order ${order.id} created for user ${user.id}`);
        return { success: true };
    } catch (error) {
        console.error("Error handling order.created:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}

/**
 * Handle order.paid event
 */
export async function handleOrderPaid(data: any) {
    console.log("Processing order.paid event:", data.id);

    try {
        const order = data;

        // Update invoice to paid
        await prisma.invoice.updateMany({
            where: {
                invoiceNumber: order.id,
            },
            data: {
                status: "paid",
                paidAt: new Date(),
            },
        });

        // Clear any payment failure flags
        if (order.subscription_id) {
            await prisma.userSubscription.updateMany({
                where: { polarSubscriptionId: order.subscription_id },
                data: {
                    paymentFailedAt: null,
                    gracePeriodEndsAt: null,
                },
            });
        }

        console.log(`Order ${order.id} marked as paid`);
        return { success: true };
    } catch (error) {
        console.error("Error handling order.paid:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}

/**
 * Handle order.refunded event
 */
export async function handleOrderRefunded(data: any) {
    console.log("Processing order.refunded event:", data.id);

    try {
        const order = data;

        // Update invoice to refunded
        await prisma.invoice.updateMany({
            where: {
                invoiceNumber: order.id,
            },
            data: {
                status: "refunded",
            },
        });

        console.log(`Order ${order.id} refunded`);
        return { success: true };
    } catch (error) {
        console.error("Error handling order.refunded:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}

/**
 * Handle payment failure
 */
export async function handlePaymentFailed(data: any) {
    console.log("Processing payment failure for subscription:", data.subscription_id);

    try {
        const subscription = data;

        // Set grace period (7 days)
        const gracePeriodEnd = new Date();
        gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 7);

        await prisma.userSubscription.updateMany({
            where: { polarSubscriptionId: subscription.id },
            data: {
                paymentFailedAt: new Date(),
                gracePeriodEndsAt: gracePeriodEnd,
            },
        });

        console.log(`Payment failed for subscription ${subscription.id}, grace period set`);

        // TODO: Send email notification to user

        return { success: true };
    } catch (error) {
        console.error("Error handling payment failure:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}
