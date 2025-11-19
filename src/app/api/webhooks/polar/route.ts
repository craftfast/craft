/**
 * Polar Webhook Endpoint
 * 
 * Implements Polar webhook handling following the official Standard Webhooks specification.
 * Uses the standardwebhooks library for signature verification as recommended by Polar.
 * 
 * @see https://polar.sh/docs/integrate/webhooks/delivery
 */

import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "standardwebhooks";
import {
    logWebhookEvent,
    updateWebhookEventStatus,
} from "@/lib/polar/webhooks";

// Import event handlers
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
        // Get raw body for signature verification
        const body = await req.text();

        // Verify webhook secret is configured
        const webhookSecret = process.env.POLAR_WEBHOOK_SECRET;
        if (!webhookSecret) {
            console.error("POLAR_WEBHOOK_SECRET not configured");
            return NextResponse.json(
                { error: "Server configuration error" },
                { status: 500 }
            );
        }

        // Validate webhook signature using Standard Webhooks library
        // As per Polar docs: https://polar.sh/docs/integrate/webhooks/delivery
        // 
        // Important: The Standard Webhooks spec requires the secret to be base64 encoded.
        // Polar webhook secrets need to be base64 encoded before passing to the Webhook class.
        try {
            // Base64 encode the secret as required by Standard Webhooks specification
            const base64Secret = Buffer.from(webhookSecret, 'utf-8').toString('base64');

            const wh = new Webhook(base64Secret);
            const headers = {
                "webhook-id": req.headers.get("webhook-id") || "",
                "webhook-signature": req.headers.get("webhook-signature") || "",
                "webhook-timestamp": req.headers.get("webhook-timestamp") || "",
            };

            wh.verify(body, headers);
            console.log("✅ Webhook signature verified successfully");
        } catch (error) {
            console.error("❌ Invalid webhook signature:", error);
            return NextResponse.json(
                { error: "Invalid signature" },
                { status: 403 }
            );
        }

        // Parse webhook event
        const event = JSON.parse(body);
        const eventType = event.type;
        const eventId = event.id || `${eventType}-${Date.now()}`;

        console.log(`Received Polar webhook: ${eventType} (${eventId})`);        // Log webhook event to database
        await logWebhookEvent(eventType, eventId, event);

        // Update status to processing
        await updateWebhookEventStatus(eventId, "PROCESSING");

        // Route to appropriate handler
        let result: { success: boolean; error?: string } = { success: false };

        try {
            switch (eventType) {
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
