import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { recordTokenPurchase } from "@/lib/ai-usage";

/**
 * Polar Webhook Handler
 * Handles subscription lifecycle events and token purchases from Polar.sh
 * 
 * Events handled:
 * - checkout.created: When a checkout is created
 * - subscription.created: When a new subscription is created
 * - subscription.updated: When a subscription is updated
 * - subscription.active: When a subscription becomes active
 * - subscription.canceled: When a subscription is cancelled (US spelling)
 * - subscription.uncanceled: When a subscription is uncanceled/reactivated
 * - subscription.revoked: When a subscription is revoked/expired
 * - order.created: When a token purchase order is created
 * - order.paid: When a token purchase is paid
 * - refund.created: When a refund is issued
 * 
 * Note: Polar uses US spelling "canceled" (one 'l')
 */

interface PolarWebhookEvent {
    type: string;
    data: {
        id: string;
        customer_email?: string;
        customer_id?: string;
        status?: string;
        metadata?: Record<string, string>;
        cancel_at_period_end?: boolean;
        billing_reason?: string;
        amount?: number;
        currency?: string;
        product_id?: string;
        product_price_id?: string;
    };
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const signature = request.headers.get("polar-signature");

        if (!signature) {
            console.error("Webhook missing signature");
            return NextResponse.json(
                { error: "Missing signature" },
                { status: 401 }
            );
        }

        // TODO: Implement webhook signature verification when available in SDK
        // For now, we'll process the event directly
        const event = body;

        console.log("Received Polar webhook event:", event.type);

        // Handle different event types
        switch (event.type) {
            case "checkout.created":
                await handleCheckoutCreated(event.data);
                break;

            case "subscription.created":
                await handleSubscriptionCreated(event.data);
                break;

            case "subscription.updated":
                await handleSubscriptionUpdated(event.data);
                break;

            case "subscription.active":
                await handleSubscriptionActive(event.data);
                break;

            case "subscription.canceled": // Note: US spelling (one 'l')
                await handleSubscriptionCanceled(event.data);
                break;

            case "subscription.uncanceled":
                await handleSubscriptionUncanceled(event.data);
                break;

            case "subscription.revoked":
                await handleSubscriptionRevoked(event.data);
                break;

            case "order.created":
                await handleOrderCreated(event.data);
                break;

            case "order.paid":
                await handleOrderPaid(event.data);
                break;

            case "refund.created":
                await handleRefundCreated(event.data);
                break;

            default:
                console.log("Unhandled webhook event type:", event.type);
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error("Webhook processing error:", error);
        return NextResponse.json(
            {
                error: "Webhook processing failed",
                message: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 400 }
        );
    }
}

/**
 * Handle checkout created event
 * This fires when a checkout is created (before payment)
 * Handles both subscriptions and one-time token purchases
 */
async function handleCheckoutCreated(data: PolarWebhookEvent["data"]) {
    try {
        console.log("Processing checkout completed:", data.id);

        const { id: checkoutId, customer_email, metadata } = data;

        if (!customer_email) {
            console.warn("No customer email in checkout data");
            return;
        }

        // Find user by email
        const user = await prisma.user.findUnique({
            where: { email: customer_email },
        });

        if (!user) {
            console.warn(`User not found for email: ${customer_email}`);
            return;
        }

        // Check purchase type to determine how to handle this checkout
        const purchaseType = metadata?.purchaseType;

        if (purchaseType === "token_topup") {
            // Token purchases are handled by order.paid event
            console.log("Token top-up checkout completed - will be processed by order.paid");
            return;
        }

        // Handle subscription checkout (default behavior)
        // Determine plan name from product/metadata
        const planName = metadata?.planName || "PRO";

        // Get the plan from database
        const plan = await prisma.plan.findUnique({
            where: { name: planName },
        });

        if (!plan) {
            console.error(`Plan not found: ${planName}`);
            return;
        }

        // Calculate period end (30 days or 365 days from now)
        const periodEnd = new Date();
        periodEnd.setDate(
            periodEnd.getDate() + (metadata?.billingPeriod === "YEARLY" ? 365 : 30)
        );

        // Update or create user subscription
        await prisma.userSubscription.upsert({
            where: { userId: user.id },
            update: {
                planId: plan.id,
                status: "active",
                polarCheckoutId: checkoutId,
                currentPeriodEnd: periodEnd,
                updatedAt: new Date(),
            },
            create: {
                userId: user.id,
                planId: plan.id,
                status: "active",
                polarCheckoutId: checkoutId,
                currentPeriodStart: new Date(),
                currentPeriodEnd: periodEnd,
            },
        });

        console.log(
            `Subscription activated for user ${user.id} - ${planName}`
        );
    } catch (error) {
        console.error("Error handling checkout created:", error);
        throw error;
    }
}

/**
 * Handle subscription created event
 */
async function handleSubscriptionCreated(data: PolarWebhookEvent["data"]) {
    try {
        console.log("Processing subscription created:", data.id);

        // Most of the work is done in checkout.completed
        // This can be used for additional tracking if needed
    } catch (error) {
        console.error("Error handling subscription created:", error);
        throw error;
    }
}

/**
 * Handle subscription updated event
 */
async function handleSubscriptionUpdated(data: PolarWebhookEvent["data"]) {
    try {
        console.log("Processing subscription updated:", data.id);

        const { status, customer_email } = data;

        const user = await prisma.user.findUnique({
            where: { email: customer_email },
        });

        if (!user) return;

        // Update user subscription status
        await prisma.userSubscription.update({
            where: { userId: user.id },
            data: {
                status: status === "active" ? "active" : "past_due",
                updatedAt: new Date(),
            },
        });

        console.log(`Subscription updated for user ${user.id} - status: ${status}`);
    } catch (error) {
        console.error("Error handling subscription updated:", error);
        throw error;
    }
}

/**
 * Handle subscription active event
 * Fired when a subscription becomes active (after payment)
 */
async function handleSubscriptionActive(data: PolarWebhookEvent["data"]) {
    try {
        console.log("Processing subscription active:", data.id);

        const { customer_email } = data;

        const user = await prisma.user.findUnique({
            where: { email: customer_email },
        });

        if (!user) return;

        // Ensure subscription status is active
        await prisma.userSubscription.update({
            where: { userId: user.id },
            data: {
                status: "active",
                cancelAtPeriodEnd: false,
                updatedAt: new Date(),
            },
        });

        console.log(`Subscription confirmed active for user ${user.id}`);
    } catch (error) {
        console.error("Error handling subscription active:", error);
        throw error;
    }
}

/**
 * Handle subscription canceled event (US spelling)
 */
async function handleSubscriptionCanceled(data: PolarWebhookEvent["data"]) {
    try {
        console.log("Processing subscription cancelled:", data.id);

        const { customer_email, cancel_at_period_end } = data;

        const user = await prisma.user.findUnique({
            where: { email: customer_email },
        });

        if (!user) return;

        // Update user subscription to cancelled
        await prisma.userSubscription.update({
            where: { userId: user.id },
            data: {
                status: cancel_at_period_end ? "active" : "cancelled",
                cancelAtPeriodEnd: cancel_at_period_end,
                updatedAt: new Date(),
            },
        });

        console.log(
            `Subscription canceled for user ${user.id} - cancel at period end: ${cancel_at_period_end}`
        );
    } catch (error) {
        console.error("Error handling subscription canceled:", error);
        throw error;
    }
}

/**
 * Handle subscription uncanceled event
 * Fired when a previously canceled subscription is reactivated
 */
async function handleSubscriptionUncanceled(data: PolarWebhookEvent["data"]) {
    try {
        console.log("Processing subscription uncanceled:", data.id);

        const { customer_email } = data;

        const user = await prisma.user.findUnique({
            where: { email: customer_email },
        });

        if (!user) return;

        // Reactivate the subscription
        await prisma.userSubscription.update({
            where: { userId: user.id },
            data: {
                status: "active",
                cancelAtPeriodEnd: false,
                updatedAt: new Date(),
            },
        });

        console.log(`Subscription uncanceled/reactivated for user ${user.id}`);
    } catch (error) {
        console.error("Error handling subscription uncanceled:", error);
        throw error;
    }
}

/**
 * Handle subscription revoked event
 * Fired when a subscription is revoked or expires
 */
async function handleSubscriptionRevoked(data: PolarWebhookEvent["data"]) {
    try {
        console.log("Processing subscription expired:", data.id);

        const { customer_email } = data;

        const user = await prisma.user.findUnique({
            where: { email: customer_email },
        });

        if (!user) return;

        // Get the HOBBY plan (free plan)
        const hobbyPlan = await prisma.plan.findUnique({
            where: { name: "HOBBY" },
        });

        if (!hobbyPlan) {
            console.error("HOBBY plan not found in database");
            return;
        }

        // Update user subscription to expired and downgrade to hobby plan
        await prisma.userSubscription.update({
            where: { userId: user.id },
            data: {
                status: "expired",
                planId: hobbyPlan.id,
                updatedAt: new Date(),
            },
        });

        console.log(`Subscription revoked for user ${user.id} - downgraded to HOBBY`);
    } catch (error) {
        console.error("Error handling subscription revoked:", error);
        throw error;
    }
}

/**
 * Handle order created event
 * This fires when a token purchase order is created
 */
async function handleOrderCreated(data: PolarWebhookEvent["data"]) {
    try {
        console.log("Processing order created:", data.id);

        const { id: orderId, customer_email, metadata, billing_reason } = data;

        // Only process token purchase orders (not subscription renewals)
        if (billing_reason !== "purchase") {
            console.log("Skipping order.created - not a token purchase:", billing_reason);
            return;
        }

        if (!customer_email) {
            console.warn("No customer email in order data");
            return;
        }

        // Find user by email
        const user = await prisma.user.findUnique({
            where: { email: customer_email },
        });

        if (!user) {
            console.warn(`User not found for email: ${customer_email}`);
            return;
        }

        // Extract token amount and price from metadata
        const tokenAmount = parseInt(metadata?.tokenAmount || "0");
        const priceUsd = parseFloat(metadata?.priceUsd || "0");

        if (!tokenAmount || !priceUsd) {
            console.error("Missing token amount or price in metadata");
            return;
        }

        // Create pending token purchase record
        await prisma.tokenPurchase.create({
            data: {
                userId: user.id,
                tokenAmount: tokenAmount,
                priceUsd: priceUsd,
                tokensRemaining: tokenAmount,
                status: "pending",
                polarCheckoutId: orderId,
                expiresAt: null,
            },
        });

        console.log(`Token purchase order created for user ${user.id} - ${tokenAmount} tokens`);
    } catch (error) {
        console.error("Error handling order created:", error);
        throw error;
    }
}

/**
 * Handle order paid event
 * This fires when a token purchase order is successfully paid
 * This is where we actually add tokens to the user's account
 */
async function handleOrderPaid(data: PolarWebhookEvent["data"]) {
    try {
        console.log("Processing order paid:", data.id);

        const { id: orderId, customer_email, metadata, billing_reason } = data;

        // Only process token purchase orders (not subscription renewals)
        if (billing_reason !== "purchase") {
            console.log("Skipping order.paid - not a token purchase:", billing_reason);
            return;
        }

        if (!customer_email) {
            console.warn("No customer email in order data");
            return;
        }

        // Find user by email
        const user = await prisma.user.findUnique({
            where: { email: customer_email },
        });

        if (!user) {
            console.warn(`User not found for email: ${customer_email}`);
            return;
        }

        // Extract token amount and price from metadata
        const tokenAmount = parseInt(metadata?.tokenAmount || "0");
        const priceUsd = parseFloat(metadata?.priceUsd || "0");

        if (!tokenAmount || !priceUsd) {
            console.error("Missing token amount or price in metadata");
            return;
        }

        // Record the completed token purchase (this adds tokens to user balance)
        const result = await recordTokenPurchase({
            userId: user.id,
            tokenAmount: tokenAmount,
            priceUsd: priceUsd,
            polarCheckoutId: orderId,
            polarPaymentId: data.id,
        });

        if (result.success) {
            console.log(`✅ Token purchase completed for user ${user.id} - ${tokenAmount} tokens added`);
        } else {
            console.error(`❌ Failed to record token purchase for user ${user.id}`);
        }

        // Create payment transaction record
        await prisma.paymentTransaction.create({
            data: {
                userId: user.id,
                amount: priceUsd,
                currency: data.currency || "USD",
                status: "completed",
                paymentMethod: "polar",
                polarCheckoutId: orderId,
                metadata: {
                    tokenAmount,
                    purchaseType: "token_topup",
                },
            },
        });

        console.log(`Payment transaction recorded for user ${user.id}`);
    } catch (error) {
        console.error("Error handling order paid:", error);
        throw error;
    }
}

/**
 * Handle refund created event
 * This fires when a refund is issued (for token purchases or subscriptions)
 */
async function handleRefundCreated(data: PolarWebhookEvent["data"]) {
    try {
        console.log("Processing order refunded:", data.id);

        const { id: orderId, customer_email } = data;

        if (!customer_email) {
            console.warn("No customer email in order data");
            return;
        }

        // Find user by email
        const user = await prisma.user.findUnique({
            where: { email: customer_email },
        });

        if (!user) {
            console.warn(`User not found for email: ${customer_email}`);
            return;
        }

        // Find the token purchase record
        const purchase = await prisma.tokenPurchase.findFirst({
            where: {
                userId: user.id,
                polarCheckoutId: orderId,
            },
        });

        if (!purchase) {
            console.warn(`Token purchase not found for order: ${orderId}`);
            return;
        }

        // Update token purchase status to refunded
        await prisma.tokenPurchase.update({
            where: { id: purchase.id },
            data: {
                status: "refunded",
                updatedAt: new Date(),
            },
        });

        // Deduct any remaining tokens from user balance
        // (In a more sophisticated system, you might want to track which tokens were used)
        if (purchase.tokensRemaining > 0) {
            console.log(`Deducting ${purchase.tokensRemaining} unused tokens from user ${user.id}`);
            // Note: You may want to add logic to actually deduct from user's token balance
            // This depends on how you're tracking the token balance in your system
        }

        console.log(`Token purchase refunded for user ${user.id} - order ${orderId}`);
    } catch (error) {
        console.error("Error handling order refunded:", error);
        throw error;
    }
}

