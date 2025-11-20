/**
 * Polar Order Event Handlers
 * 
 * Handles order-related events from Polar webhooks.
 */

import { prisma } from "@/lib/db";
import type { OrderEvent } from "../webhook-types";

/**
 * Handle order.created event
 */
export async function handleOrderCreated(data: OrderEvent) {
    console.log("Processing order.created event:", data.id);

    try {
        const order = data;
        let metadata = order.metadata || {};

        console.log("Order metadata:", JSON.stringify(metadata, null, 2));
        console.log("Order checkout_id:", order.checkout_id);

        // If order has no metadata but has a checkout_id, fetch the checkout to get metadata
        if (Object.keys(metadata).length === 0 && order.checkout_id) {
            console.log("⚠️ Order has empty metadata, fetching checkout:", order.checkout_id);

            try {
                const { polarClient } = await import("@/lib/polar");
                const checkout = await polarClient.checkouts.get({ id: order.checkout_id });

                if (checkout.metadata) {
                    console.log("✅ Found checkout metadata:", JSON.stringify(checkout.metadata, null, 2));
                    metadata = checkout.metadata as Record<string, unknown>;
                } else {
                    console.log("⚠️ Checkout also has no metadata");
                }
            } catch (checkoutError) {
                console.error("Error fetching checkout:", checkoutError);
                // Continue with empty metadata
            }
        }

        // Check if this is a balance top-up
        if (metadata.purchaseType === "balance_topup") {
            console.log("✅ Balance top-up detected, processing...");
            // Pass the metadata we found
            return await handleBalanceTopup({ ...order, metadata });
        }

        console.log("⚠️ Not a balance top-up, purchaseType:", metadata.purchaseType);

        // Legacy subscription order handling
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

        // Legacy subscription orders - balance top-ups are handled separately
        console.log(`Legacy order ${order.id} for user ${user.id} - skipping (balance system active)`);
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
 * Handle balance top-up order
 */
async function handleBalanceTopup(order: OrderEvent) {
    console.log("Processing balance top-up order:", order.id);

    try {
        const metadata = order.metadata || {};
        const userId = metadata.userId;
        const requestedBalance = parseFloat(metadata.requestedBalance || "0");
        const platformFee = parseFloat(metadata.platformFee || "0");
        const totalCharged = parseFloat(metadata.totalCharged || "0");

        if (!userId || requestedBalance <= 0) {
            console.error("Invalid balance top-up order metadata:", metadata);
            return { success: false, error: "Invalid order metadata" };
        }

        // Credit user's balance (NOT the total charged amount)
        await prisma.$transaction(async (tx) => {
            const user = await tx.user.findUnique({
                where: { id: userId },
                select: { accountBalance: true },
            });

            if (!user) {
                throw new Error(`User ${userId} not found`);
            }

            const balanceBefore = Number(user.accountBalance || 0);
            const balanceAfter = balanceBefore + requestedBalance;

            // Update user balance
            await tx.user.update({
                where: { id: userId },
                data: { accountBalance: balanceAfter },
            });

            // Create transaction record
            await tx.balanceTransaction.create({
                data: {
                    userId,
                    type: "TOPUP",
                    amount: requestedBalance,
                    balanceBefore,
                    balanceAfter,
                    description: `Balance top-up: Added $${requestedBalance.toFixed(2)} (paid $${totalCharged.toFixed(2)} including $${platformFee.toFixed(2)} platform fee)`,
                    metadata: {
                        orderId: order.id,
                        checkoutId: order.checkout_id,
                        platformFee,
                        totalCharged,
                        currency: order.currency,
                    },
                },
            });
        });

        console.log(`Credited $${requestedBalance} to user ${userId} (order ${order.id})`);
        return { success: true };
    } catch (error) {
        console.error("Error handling balance top-up:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}

/**
 * Handle order.paid event
 */
export async function handleOrderPaid(data: OrderEvent) {
    console.log("Processing order.paid event:", data.id);

    try {
        const order = data;

        // Balance top-ups are handled in handleBalanceTopup via order.created
        // Legacy subscription payments are no longer used
        console.log(`Order ${order.id} marked as paid - balance system active`);
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
export async function handleOrderRefunded(data: OrderEvent) {
    console.log("Processing order.refunded event:", data.id);

    try {
        const order = data;

        // TODO: Handle balance top-up refunds if needed
        console.log(`Order ${order.id} refunded - balance system active`);
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
export async function handlePaymentFailed(data: OrderEvent) {
    console.log("Processing payment failure:", data.id);

    try {
        // Balance-based system - payment failures don't affect account access
        // Users simply cannot make new purchases until payment method is fixed
        console.log(`Payment failed for order ${data.id} - no action needed in balance system`);

        // TODO: Send email notification to user about failed payment

        return { success: true };
    } catch (error) {
        console.error("Error handling payment failure:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}
