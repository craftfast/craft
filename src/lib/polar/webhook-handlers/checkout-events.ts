/**
 * Polar Checkout Event Handlers
 * 
 * Handles checkout session events from Polar webhooks.
 */

import { prisma } from "@/lib/db";
import type { CheckoutEvent } from "../webhook-types";

/**
 * Handle checkout.created event
 */
export async function handleCheckoutCreated(data: CheckoutEvent) {
    console.log("Processing checkout.created event:", data.id);

    try {
        const checkout = data;

        // Find user by customer ID
        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { polarCustomerId: checkout.customer_id },
                    { polarCustomerExtId: checkout.customer?.external_id },
                ],
            },
        });

        if (!user) {
            console.log(`User not found for checkout ${checkout.id}`);
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

        // Find user by customer ID
        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { polarCustomerId: checkout.customer_id },
                    { polarCustomerExtId: checkout.customer?.external_id },
                ],
            },
        });

        if (!user) {
            console.log(`User not found for checkout ${checkout.id}`);
            return { success: true };
        }

        if (checkout.status === "succeeded") {
            console.log(`Checkout ${checkout.id} succeeded for user ${user.id}`);

            // Success is handled by subscription.created and order.created events
            // We just log it here for tracking

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
