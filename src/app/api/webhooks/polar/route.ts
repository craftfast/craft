import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * Polar Webhook Handler
 * Handles subscription lifecycle events from Polar.sh
 * 
 * Events handled:
 * - checkout.completed: When a checkout is successfully completed
 * - checkout.failed: When a checkout fails
 * - subscription.created: When a new subscription is created
 * - subscription.updated: When a subscription is updated
 * - subscription.cancelled: When a subscription is cancelled
 * - subscription.expired: When a subscription expires
 */

interface PolarWebhookEvent {
    type: string;
    data: {
        id: string;
        customer_email?: string;
        status?: string;
        metadata?: Record<string, string>;
        cancel_at_period_end?: boolean;
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
            case "checkout.completed":
                await handleCheckoutCompleted(event.data);
                break;

            case "checkout.failed":
                await handleCheckoutFailed(event.data);
                break;

            case "subscription.created":
                await handleSubscriptionCreated(event.data);
                break;

            case "subscription.updated":
                await handleSubscriptionUpdated(event.data);
                break;

            case "subscription.cancelled":
                await handleSubscriptionCancelled(event.data);
                break;

            case "subscription.expired":
                await handleSubscriptionExpired(event.data);
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
 * Handle checkout completed event
 * This fires when a user successfully completes payment
 */
async function handleCheckoutCompleted(data: PolarWebhookEvent["data"]) {
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

        // Get team (assuming user has a team)
        const team = await prisma.team.findFirst({
            where: {
                members: {
                    some: { userId: user.id },
                },
            },
        });

        if (!team) {
            console.warn(`No team found for user: ${user.id}`);
            return;
        }

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

        // Update or create subscription
        await prisma.teamSubscription.upsert({
            where: { teamId: team.id },
            update: {
                planId: plan.id,
                status: "active",
                polarCheckoutId: checkoutId,
                currentPeriodEnd: periodEnd,
                updatedAt: new Date(),
            },
            create: {
                teamId: team.id,
                planId: plan.id,
                status: "active",
                polarCheckoutId: checkoutId,
                currentPeriodStart: new Date(),
                currentPeriodEnd: periodEnd,
            },
        });

        console.log(
            `Subscription activated for team ${team.id} - ${planName}`
        );
    } catch (error) {
        console.error("Error handling checkout completed:", error);
        throw error;
    }
}

/**
 * Handle checkout failed event
 */
async function handleCheckoutFailed(data: PolarWebhookEvent["data"]) {
    try {
        console.log("Processing checkout failed:", data.id);

        // Create a payment transaction record marking the failure
        const { id: checkoutId, customer_email } = data;

        const user = await prisma.user.findUnique({
            where: { email: customer_email },
        });

        if (!user) return;

        const team = await prisma.team.findFirst({
            where: {
                members: {
                    some: { userId: user.id },
                },
            },
        });

        if (!team) return;

        // Log the failed payment
        await prisma.paymentTransaction.create({
            data: {
                teamId: team.id,
                amount: 0, // Amount not available in failed checkout
                currency: "USD",
                status: "failed",
                paymentMethod: "polar",
                polarCheckoutId: checkoutId,
            },
        });

        console.log(`Checkout failed recorded for team ${team.id}`);
    } catch (error) {
        console.error("Error handling checkout failed:", error);
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

        const team = await prisma.team.findFirst({
            where: {
                members: {
                    some: { userId: user.id },
                },
            },
        });

        if (!team) return;

        // Update subscription status
        await prisma.teamSubscription.update({
            where: { teamId: team.id },
            data: {
                status: status === "active" ? "active" : "past_due",
                updatedAt: new Date(),
            },
        });

        console.log(`Subscription updated for team ${team.id} - status: ${status}`);
    } catch (error) {
        console.error("Error handling subscription updated:", error);
        throw error;
    }
}

/**
 * Handle subscription cancelled event
 */
async function handleSubscriptionCancelled(data: PolarWebhookEvent["data"]) {
    try {
        console.log("Processing subscription cancelled:", data.id);

        const { customer_email, cancel_at_period_end } = data;

        const user = await prisma.user.findUnique({
            where: { email: customer_email },
        });

        if (!user) return;

        const team = await prisma.team.findFirst({
            where: {
                members: {
                    some: { userId: user.id },
                },
            },
        });

        if (!team) return;

        // Update subscription to cancelled
        await prisma.teamSubscription.update({
            where: { teamId: team.id },
            data: {
                status: cancel_at_period_end ? "active" : "cancelled",
                cancelAtPeriodEnd: cancel_at_period_end,
                updatedAt: new Date(),
            },
        });

        console.log(
            `Subscription cancelled for team ${team.id} - cancel at period end: ${cancel_at_period_end}`
        );
    } catch (error) {
        console.error("Error handling subscription cancelled:", error);
        throw error;
    }
}

/**
 * Handle subscription expired event
 */
async function handleSubscriptionExpired(data: PolarWebhookEvent["data"]) {
    try {
        console.log("Processing subscription expired:", data.id);

        const { customer_email } = data;

        const user = await prisma.user.findUnique({
            where: { email: customer_email },
        });

        if (!user) return;

        const team = await prisma.team.findFirst({
            where: {
                members: {
                    some: { userId: user.id },
                },
            },
        });

        if (!team) return;

        // Get the FREE plan
        const freePlan = await prisma.plan.findUnique({
            where: { name: "FREE" },
        });

        if (!freePlan) {
            console.error("FREE plan not found in database");
            return;
        }

        // Update subscription to expired and downgrade to free plan
        await prisma.teamSubscription.update({
            where: { teamId: team.id },
            data: {
                status: "expired",
                planId: freePlan.id,
                updatedAt: new Date(),
            },
        });

        console.log(`Subscription expired for team ${team.id} - downgraded to FREE`);
    } catch (error) {
        console.error("Error handling subscription expired:", error);
        throw error;
    }
}
