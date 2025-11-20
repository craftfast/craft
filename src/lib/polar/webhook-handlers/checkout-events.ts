/**
 * Polar Checkout Event Handlers
 * 
 * Handles checkout session events from Polar webhooks.
 */

import { prisma } from "@/lib/db";
import type { CheckoutEvent } from "../webhook-types";

/**
 * Process balance top-up from a successful checkout
 */
async function processBalanceTopup(userId: string, checkout: CheckoutEvent) {
    console.log("Processing balance top-up for user:", userId, "checkout:", checkout.id);

    try {
        const metadata = checkout.metadata || {};
        const requestedBalance = parseFloat(metadata.requestedBalance || "0");
        const platformFee = parseFloat(metadata.platformFee || "0");
        const totalCharged = parseFloat(metadata.totalCharged || "0");

        if (requestedBalance <= 0) {
            console.error("Invalid balance top-up metadata:", metadata);
            return { success: false, error: "Invalid metadata" };
        }

        // Check if this checkout was already processed
        const existing = await prisma.balanceTransaction.findFirst({
            where: {
                metadata: {
                    path: ["checkoutId"],
                    equals: checkout.id,
                },
            },
        });

        if (existing) {
            console.log(`Balance top-up for checkout ${checkout.id} already processed`);
            return { success: true, message: "Already processed" };
        }

        // Credit user's balance
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
                        checkoutId: checkout.id,
                        platformFee,
                        totalCharged,
                        currency: checkout.currency,
                    },
                },
            });
        });

        console.log(`✅ Credited $${requestedBalance} to user ${userId} (checkout ${checkout.id})`);
        return { success: true };
    } catch (error) {
        console.error("Error processing balance top-up:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}

/**
 * Handle checkout.created event
 */
export async function handleCheckoutCreated(data: CheckoutEvent) {
    console.log("Processing checkout.created event:", data.id);

    try {
        const checkout = data;

        // Find user by customer ID or external ID
        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { polarCustomerId: checkout.customer_id },
                    { polarCustomerExtId: checkout.customer?.external_id },
                    ...(checkout.customer?.external_id
                        ? [{ id: checkout.customer.external_id }]
                        : []
                    ),
                ],
            },
        });

        if (!user) {
            // This is normal for new users who haven't signed up yet
            // The checkout is being created before they complete signup
            console.log(`Checkout ${checkout.id} created (user will be linked on signup)`);
            return { success: true };
        }

        console.log(`Checkout ${checkout.id} created for user ${user.id}`);

        // Checkout creation is tracked, but we mainly care about completion
        // The actual subscription/order will be created on successful checkout

        return { success: true };
    } catch (error) {
        console.error("Error handling checkout.created:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}

/**
 * Handle checkout.updated event (success/failure)
 */
export async function handleCheckoutUpdated(data: CheckoutEvent) {
    console.log("Processing checkout.updated event:", data.id);

    try {
        const checkout = data;
        const metadata = checkout.metadata || {};

        // Try to find user by userId from metadata first (for balance top-ups)
        let user = null;
        if (metadata.userId) {
            user = await prisma.user.findUnique({
                where: { id: metadata.userId as string },
            });
            console.log(`Found user by metadata userId: ${user?.id}`);
        }

        // Fallback: Find user by customer ID or external ID
        if (!user) {
            user = await prisma.user.findFirst({
                where: {
                    OR: [
                        { polarCustomerId: checkout.customer_id },
                        { polarCustomerExtId: checkout.customer?.external_id },
                        ...(checkout.customer?.external_id
                            ? [{ id: checkout.customer.external_id }]
                            : []
                        ),
                    ],
                },
            });
        }

        if (!user) {
            // This is normal during checkout flow before user signup is complete
            console.log(`Checkout ${checkout.id} updated (user will be linked on signup)`);
            return { success: true };
        }

        console.log(`Checkout ${checkout.id} status: ${checkout.status} for user ${user.id}`);
        console.log("Checkout metadata:", JSON.stringify(metadata, null, 2));

        if (checkout.status === "succeeded" || checkout.status === "confirmed") {
            console.log(`✅ Checkout ${checkout.id} ${checkout.status}`);

            // Handle balance top-up
            if (metadata.purchaseType === "balance_topup") {
                console.log("✅ Balance top-up detected in checkout, processing...");
                await processBalanceTopup(user.id, checkout);
            }

        } else if (checkout.status === "failed") {
            console.log(`Checkout ${checkout.id} failed for user ${user.id}`);

            // TODO: Send email notification about failed checkout
            // Could also track failed checkout attempts for analytics
        }

        return { success: true };
    } catch (error) {
        console.error("Error handling checkout.updated:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}
