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
            // This is normal during checkout flow before user signup is complete
            console.log(`Checkout ${checkout.id} updated (user will be linked on signup)`);
            return { success: true };
        }

        if (checkout.status === "succeeded") {
            console.log(`Checkout ${checkout.id} succeeded for user ${user.id}`);

            // Success is handled by order.created event for balance top-ups
            // The checkout embed will automatically close on the frontend when it receives
            // the success webhook event from Polar

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
