/**
 * Razorpay Webhook Endpoint
 * 
 * Implements Razorpay webhook handling with signature verification.
 * 
 * @see https://razorpay.com/docs/webhooks/validate-test/
 */

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { RAZORPAY_WEBHOOK_SECRET } from "@/lib/razorpay";
import {
    logWebhookEvent,
    updateWebhookEventStatus,
} from "@/lib/razorpay/webhooks";

// Import event handlers
import {
    handlePaymentCaptured,
    handlePaymentFailed,
    handleOrderPaid,
} from "@/lib/razorpay/webhook-handlers/payment-events";

import type { RazorpayWebhookEvent } from "@/lib/razorpay/webhook-types";

/**
 * Verify Razorpay webhook signature
 */
function verifyWebhookSignature(body: string, signature: string, secret: string): boolean {
    try {
        const expectedSignature = crypto
            .createHmac("sha256", secret)
            .update(body)
            .digest("hex");

        return crypto.timingSafeEqual(
            Buffer.from(signature),
            Buffer.from(expectedSignature)
        );
    } catch (error) {
        console.error("Error verifying webhook signature:", error);
        return false;
    }
}

export async function POST(req: NextRequest) {
    try {
        // Get raw body for signature verification
        const body = await req.text();

        // Verify webhook secret is configured
        if (!RAZORPAY_WEBHOOK_SECRET) {
            console.error("RAZORPAY_WEBHOOK_SECRET not configured");
            return NextResponse.json(
                { error: "Server configuration error" },
                { status: 500 }
            );
        }

        // Get signature from header
        const signature = req.headers.get("x-razorpay-signature");
        if (!signature) {
            console.error("Missing x-razorpay-signature header");
            return NextResponse.json(
                { error: "Missing signature" },
                { status: 403 }
            );
        }

        // Verify webhook signature
        const isValid = verifyWebhookSignature(body, signature, RAZORPAY_WEBHOOK_SECRET);
        if (!isValid) {
            console.error("❌ Invalid webhook signature");
            return NextResponse.json(
                { error: "Invalid signature" },
                { status: 403 }
            );
        }

        console.log("✅ Webhook signature verified successfully");

        // Parse webhook event
        const event: RazorpayWebhookEvent = JSON.parse(body);
        const eventType = event.event;
        const eventId = `${event.account_id}_${event.created_at}_${eventType}`;

        console.log(`Received Razorpay webhook: ${eventType} (${eventId})`);

        // Log webhook event to database
        await logWebhookEvent(eventType, eventId, event);

        // Update status to processing
        await updateWebhookEventStatus(eventId, "PROCESSING");

        // Route to appropriate handler
        let result: { success: boolean; error?: string } = { success: false };

        try {
            switch (eventType) {
                // Payment events
                case "payment.captured":
                    result = await handlePaymentCaptured(event as any);
                    break;

                case "payment.failed":
                    result = await handlePaymentFailed(event as any);
                    break;

                case "order.paid":
                    result = await handleOrderPaid(event as any);
                    break;

                // Add more event handlers as needed
                // case "subscription.charged":
                // case "subscription.cancelled":
                // case "subscription.completed":
                // case "refund.created":

                default:
                    console.log(`Unhandled webhook event type: ${eventType}`);
                    result = { success: true }; // Mark as success to acknowledge receipt
            }

            // Update event status based on result
            if (result.success) {
                await updateWebhookEventStatus(eventId, "COMPLETED");
                console.log(`✅ Successfully processed ${eventType}`);
            } else {
                await updateWebhookEventStatus(
                    eventId,
                    "FAILED",
                    result.error || "Handler returned failure"
                );
                console.error(`❌ Failed to process ${eventType}:`, result.error);
            }

            // Always return 200 to Razorpay to acknowledge receipt
            return NextResponse.json({ received: true });
        } catch (handlerError) {
            console.error(`Error in webhook handler for ${eventType}:`, handlerError);
            await updateWebhookEventStatus(
                eventId,
                "FAILED",
                handlerError instanceof Error ? handlerError.message : "Unknown handler error"
            );

            // Still return 200 to prevent retries for handler errors
            return NextResponse.json({ received: true, error: "Handler error" });
        }
    } catch (error) {
        console.error("Error processing webhook:", error);

        return NextResponse.json(
            {
                error: "Webhook processing failed",
                details: error instanceof Error ? error.message : "Unknown error"
            },
            { status: 500 }
        );
    }
}
