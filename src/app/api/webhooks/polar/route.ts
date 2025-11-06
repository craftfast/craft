/**
 * Polar Webhook Endpoint
 * 
 * Main webhook handler that receives and routes Polar webhook events.
 * Handles signature verification, event routing, and error handling.
 */

import { NextRequest, NextResponse } from "next/server";
import {
    verifyWebhookSignature,
    logWebhookEvent,
    updateWebhookEventStatus,
} from "@/lib/polar/webhooks";

// Import event handlers
import {
    handleSubscriptionCreated,
    handleSubscriptionActive,
    handleSubscriptionUpdated,
    handleSubscriptionCanceled,
    handleSubscriptionRevoked,
    handleSubscriptionRenewed,
} from "@/lib/polar/webhook-handlers/subscription-events";

import {
    handleCustomerCreated,
    handleCustomerUpdated,
    handleCustomerDeleted,
} from "@/lib/polar/webhook-handlers/customer-events";

import {
    handleCheckoutCreated,
    handleCheckoutUpdated,
} from "@/lib/polar/webhook-handlers/checkout-events";

import {
    handleOrderCreated,
    handleOrderPaid,
    handleOrderRefunded,
    handlePaymentFailed,
} from "@/lib/polar/webhook-handlers/order-events";

import {
    handleBenefitGrantCreated,
    handleBenefitGrantUpdated,
    handleBenefitGrantRevoked,
} from "@/lib/polar/webhook-handlers/benefit-events";

export async function POST(req: NextRequest) {
    try {
        // Get raw body and signature
        const body = await req.text();
        const signature = req.headers.get("polar-signature");

        if (!signature) {
            console.error("Missing polar-signature header");
            return NextResponse.json(
                { error: "Missing signature" },
                { status: 401 }
            );
        }

        // Verify webhook signature
        const webhookSecret = process.env.POLAR_WEBHOOK_SECRET;
        if (!webhookSecret) {
            console.error("POLAR_WEBHOOK_SECRET not configured");
            return NextResponse.json(
                { error: "Server configuration error" },
                { status: 500 }
            );
        }

        const isValid = verifyWebhookSignature(body, signature, webhookSecret);
        if (!isValid) {
            console.error("Invalid webhook signature");
            return NextResponse.json(
                { error: "Invalid signature" },
                { status: 401 }
            );
        }

        // Parse webhook event
        const event = JSON.parse(body);
        const eventType = event.type;
        const eventId = event.id || `${eventType}-${Date.now()}`;

        console.log(`Received Polar webhook: ${eventType} (${eventId})`);

        // Log webhook event to database
        await logWebhookEvent(eventType, eventId, event);

        // Update status to processing
        await updateWebhookEventStatus(eventId, "PROCESSING");

        // Route to appropriate handler
        let result: { success: boolean; error?: string } = { success: false };

        try {
            switch (eventType) {
                // Subscription events
                case "subscription.created":
                    result = await handleSubscriptionCreated(event.data);
                    break;
                case "subscription.active":
                    result = await handleSubscriptionActive(event.data);
                    break;
                case "subscription.updated":
                    result = await handleSubscriptionUpdated(event.data);
                    break;
                case "subscription.canceled":
                    result = await handleSubscriptionCanceled(event.data);
                    break;
                case "subscription.revoked":
                    result = await handleSubscriptionRevoked(event.data);
                    break;
                case "subscription.renewed":
                    result = await handleSubscriptionRenewed(event.data);
                    break;

                // Customer events
                case "customer.created":
                    result = await handleCustomerCreated(event.data);
                    break;
                case "customer.updated":
                    result = await handleCustomerUpdated(event.data);
                    break;
                case "customer.deleted":
                    result = await handleCustomerDeleted(event.data);
                    break;

                // Checkout events
                case "checkout.created":
                    result = await handleCheckoutCreated(event.data);
                    break;
                case "checkout.updated":
                    result = await handleCheckoutUpdated(event.data);
                    break;

                // Order/Payment events
                case "order.created":
                    result = await handleOrderCreated(event.data);
                    break;
                case "order.paid":
                    result = await handleOrderPaid(event.data);
                    break;
                case "order.refunded":
                    result = await handleOrderRefunded(event.data);
                    break;
                case "payment.failed":
                    result = await handlePaymentFailed(event.data);
                    break;

                // Benefit events
                case "benefit_grant.created":
                    result = await handleBenefitGrantCreated(event.data);
                    break;
                case "benefit_grant.updated":
                    result = await handleBenefitGrantUpdated(event.data);
                    break;
                case "benefit_grant.revoked":
                    result = await handleBenefitGrantRevoked(event.data);
                    break;

                default:
                    console.warn(`Unhandled webhook event type: ${eventType}`);
                    result = { success: true }; // Don't fail on unknown events
            }

            // Update webhook status based on result
            if (result.success) {
                await updateWebhookEventStatus(eventId, "COMPLETED");
                console.log(`Successfully processed webhook: ${eventType}`);
                return NextResponse.json({ received: true }, { status: 200 });
            } else {
                await updateWebhookEventStatus(
                    eventId,
                    "FAILED",
                    result.error
                );
                console.error(`Failed to process webhook: ${eventType}`, result.error);
                return NextResponse.json(
                    { error: result.error || "Processing failed" },
                    { status: 500 }
                );
            }
        } catch (handlerError) {
            const errorMessage =
                handlerError instanceof Error
                    ? handlerError.message
                    : "Unknown handler error";
            await updateWebhookEventStatus(eventId, "FAILED", errorMessage);
            throw handlerError;
        }
    } catch (error) {
        console.error("Webhook processing error:", error);
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : "Internal server error",
            },
            { status: 500 }
        );
    }
}

// Health check endpoint
export async function GET() {
    return NextResponse.json({
        status: "ok",
        message: "Polar webhook endpoint is active",
    });
}
