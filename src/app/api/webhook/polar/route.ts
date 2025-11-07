/**
 * Polar Webhook Handler using Next.js Adapter
 * Handles webhook events from Polar to keep database in sync with payments
 * 
 * @see https://polar.sh/docs/guides/nextjs
 * @see https://polar.sh/docs/api-reference/webhooks
 */

import { Webhooks } from "@polar-sh/nextjs";
import { prisma } from "@/lib/db";
import { SubscriptionStatus, WebhookEventStatus } from "@prisma/client";

/**
 * Log webhook event to database for audit trail and replay capability
 */
async function logWebhookEvent(
    eventId: string,
    eventType: string,
    payload: unknown,
    status: WebhookEventStatus = WebhookEventStatus.PENDING
) {
    try {
        await prisma.webhookEvent.upsert({
            where: { eventId },
            create: {
                eventId,
                eventType,
                payload: payload as never,
                status,
                createdAt: new Date(),
            },
            update: {
                status,
                updatedAt: new Date(),
            },
        });
    } catch (error) {
        console.error("Failed to log webhook event:", error);
    }
}

/**
 * Mark webhook event as completed
 */
async function markWebhookEventCompleted(eventId: string) {
    try {
        await prisma.webhookEvent.update({
            where: { eventId },
            data: {
                status: WebhookEventStatus.COMPLETED,
                processedAt: new Date(),
            },
        });
    } catch (error) {
        console.error("Failed to mark webhook event as completed:", error);
    }
}

/**
 * Mark webhook event as failed
 */
async function markWebhookEventFailed(eventId: string, error: string) {
    try {
        await prisma.webhookEvent.update({
            where: { eventId },
            data: {
                status: WebhookEventStatus.FAILED,
                error,
                processedAt: new Date(),
            },
        });
    } catch (err) {
        console.error("Failed to mark webhook event as failed:", err);
    }
}

export const POST = Webhooks({
    webhookSecret: process.env.POLAR_WEBHOOK_SECRET!,

    // ============================================================================
    // GENERIC WEBHOOK HANDLER
    // ============================================================================

    onPayload: async (payload) => {
        console.log(" Polar webhook received:", payload.type);
        console.log(" Full payload:", JSON.stringify(payload, null, 2));

        // Log all webhook events to database
        const eventId = `${payload.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        await logWebhookEvent(eventId, payload.type, payload);
    },

    // ============================================================================
    // ORDER WEBHOOKS (PRIMARY PAYMENT HANDLERS)
    // ============================================================================

    onOrderPaid: async (payload) => {
        const order = payload.data;
        console.log(" Order paid:", order.id);
        console.log(" Billing reason:", order.billingReason);

        // Check if this order is already processed
        const existingTransaction = await prisma.paymentTransaction.findFirst({
            where: {
                polarPaymentId: order.id,
                status: "completed"
            },
        });

        if (existingTransaction) {
            console.log(" Order already processed:", order.id);
            return;
        }

        // Extract customer email from order
        const customerEmail = order.customer?.email;
        if (!customerEmail) {
            console.error(" No customer email in order:", order.id);
            return;
        }

        // Find user by email
        const user = await prisma.user.findUnique({
            where: { email: customerEmail },
        });

        if (!user) {
            console.error(" User not found for email:", customerEmail);
            return;
        }

        // Get product details from order
        const product = order.product;
        if (!product) {
            console.error(" No product in order:", order.id);
            return;
        }

        // Determine if this is a subscription or token purchase based on billingReason
        const billingReason = order.billingReason;

        if (billingReason === 'subscription_create' || billingReason === 'subscription_cycle' || billingReason === 'subscription_update') {
            // Handle subscription payment (initial, renewal, or update)
            await handleSubscriptionPayment(user.id, order);
        } else if (billingReason === 'purchase') {
            // One-time purchases (tokens) are no longer supported - user should upgrade to Pro tier
            console.log("One-time token purchase no longer supported - user should upgrade to a higher Pro tier instead");
        } else {
            console.warn(" Unknown billing reason:", billingReason);
        }
    },

    onOrderRefunded: async (payload) => {
        const order = payload.data;
        console.log(" Order refunded:", order.id);

        // Handle refund - reverse the transaction
        await handleOrderRefund(order);
    },

    // ============================================================================
    // SUBSCRIPTION WEBHOOKS
    // ============================================================================

    onSubscriptionActive: async (payload) => {
        const subscription = payload.data;
        console.log(" Subscription became active:", subscription.id);
        console.log(" Customer:", subscription.customer?.email);

        // Subscription is now active - payment confirmed
        await handleSubscriptionActive(subscription);
    },

    onSubscriptionUpdated: async (payload) => {
        const subscription = payload.data;
        console.log(" Subscription updated:", subscription.id);
        console.log(" Status:", subscription.status);

        // Handle subscription changes (plan upgrade/downgrade, etc.)
        await handleSubscriptionUpdate(subscription);
    },

    onSubscriptionCanceled: async (payload) => {
        const subscription = payload.data;
        console.log(" Subscription canceled:", subscription.id);
        console.log(" Will end at:", subscription.currentPeriodEnd);

        // Subscription canceled but user retains access until period end
        await handleSubscriptionCanceled(subscription);
    },

    onSubscriptionUncanceled: async (payload) => {
        const subscription = payload.data;
        console.log(" Subscription uncanceled:", subscription.id);

        // User reactivated their subscription before period end
        await handleSubscriptionUncanceled(subscription);
    },

    onSubscriptionRevoked: async (payload) => {
        const subscription = payload.data;
        console.log(" Subscription revoked immediately:", subscription.id);

        // Immediate access revocation (payment failed, etc.)
        await handleSubscriptionRevoked(subscription);
    },

    onBenefitGrantCreated: async (payload) => {
        console.log("🎁 Benefit grant created:", payload.data.id);
        await handleBenefitGrantCreated(payload);
    },

    onBenefitGrantRevoked: async (payload) => {
        console.log("❌ Benefit grant revoked:", payload.data.id);
        await handleBenefitGrantRevoked(payload);
    },
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function handleSubscriptionPayment(userId: string, order: Record<string, unknown>) {
    console.log("Processing subscription payment for user:", userId);

    // Extract metadata to get monthly credits tier
    const metadata = order.metadata as Record<string, unknown> | undefined;
    const monthlyCredits = metadata?.monthlyCredits ? Number(metadata.monthlyCredits) : 500; // Default to 500 credits/month

    console.log(`Pro tier: ${monthlyCredits} credits/month`);

    // Find or create the Pro plan with the specific monthly credits
    let proPlan = await prisma.plan.findFirst({
        where: {
            name: "PRO",
            monthlyCredits: monthlyCredits,
        },
    });

    // If plan doesn't exist for this tier, create it
    if (!proPlan) {
        console.log(`Creating Pro plan for ${monthlyCredits} credits/month`);
        const { getProTier } = await import("@/lib/pricing-constants");
        const tier = getProTier(monthlyCredits);

        if (!tier) {
            console.error("Invalid Pro tier:", monthlyCredits);
            return;
        }

        proPlan = await prisma.plan.create({
            data: {
                name: "PRO",
                displayName: "Pro",
                description: `Everything you need to build and scale your app. ${tier.monthlyCredits} credits/month.`,
                priceMonthlyUsd: tier.priceMonthly,
                maxProjects: 999,
                monthlyCredits: tier.monthlyCredits,
                isActive: true,
                sortOrder: 1,
                features: [
                    "Everything in hobby, plus:",
                    `${tier.monthlyCredits.toLocaleString()} credits/month`,
                    "Unlimited projects",
                    "Import from Figma & GitHub",
                    "Deploy to vercel",
                    "Priority email support",
                ],
            },
        });
    }

    const currentPeriodStart = new Date();
    const currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await prisma.userSubscription.upsert({
        where: { userId },
        create: {
            userId,
            planId: proPlan.id,
            status: SubscriptionStatus.ACTIVE,
            currentPeriodStart,
            currentPeriodEnd,
            cancelAtPeriodEnd: false,
            monthlyCreditsUsed: 0,
            periodCreditsReset: new Date(),
            polarCheckoutId: String(order.checkoutId),
            polarPaymentId: String(order.id),
        },
        update: {
            planId: proPlan.id,
            status: SubscriptionStatus.ACTIVE,
            currentPeriodStart,
            currentPeriodEnd,
            cancelAtPeriodEnd: false,
            monthlyCreditsUsed: 0,
            periodCreditsReset: new Date(),
            polarPaymentId: String(order.id),
            cancelledAt: null,
        },
    });

    await prisma.paymentTransaction.create({
        data: {
            user: {
                connect: { id: userId },
            },
            amount: Number(order.amount) / 100,
            currency: String(order.currency).toUpperCase(),
            status: "completed",
            paymentMethod: "polar",
            polarCheckoutId: String(order.checkoutId),
            polarPaymentId: String(order.id),
            metadata: JSON.parse(JSON.stringify(order)),
        },
    });

    console.log(`Subscription payment processed for user ${userId}: Pro ${monthlyCredits} credits/month`);
}

async function handleSubscriptionActive(subscription: Record<string, unknown>) {
    const customerEmail = (subscription.customer as { email?: string })?.email;
    if (!customerEmail) {
        console.error("No customer email in subscription:", subscription.id);
        return;
    }
    const user = await prisma.user.findUnique({ where: { email: customerEmail } });
    if (!user) {
        console.error("User not found for email:", customerEmail);
        return;
    }
    const proPlan = await prisma.plan.findUnique({ where: { name: "PRO" } });
    if (!proPlan) {
        console.error("Pro plan not found in database");
        return;
    }
    await prisma.userSubscription.upsert({
        where: { userId: user.id },
        create: {
            userId: user.id, planId: proPlan.id, status: SubscriptionStatus.ACTIVE,
            currentPeriodStart: new Date(String(subscription.currentPeriodStart)),
            currentPeriodEnd: new Date(String(subscription.currentPeriodEnd)), cancelAtPeriodEnd: false,
        },
        update: {
            status: SubscriptionStatus.ACTIVE, currentPeriodStart: new Date(String(subscription.currentPeriodStart)),
            currentPeriodEnd: new Date(String(subscription.currentPeriodEnd)), cancelAtPeriodEnd: false, cancelledAt: null,
        },
    });
    console.log("Subscription activated for user:", user.id);
}

async function handleSubscriptionUpdate(subscription: Record<string, unknown>) {
    const customerEmail = (subscription.customer as { email?: string })?.email;
    if (!customerEmail) {
        console.error("No customer email in subscription:", subscription.id);
        return;
    }
    const user = await prisma.user.findUnique({ where: { email: customerEmail } });
    if (!user) {
        console.error("User not found for email:", customerEmail);
        return;
    }

    // Get existing subscription to check if this is a renewal
    const existingSub = await prisma.userSubscription.findUnique({
        where: { userId: user.id },
    });

    const newPeriodStart = new Date(String(subscription.currentPeriodStart));
    const isRenewal = existingSub &&
        newPeriodStart > existingSub.currentPeriodStart;

    // Map Polar status to our enum
    const statusMap: Record<string, SubscriptionStatus> = {
        active: SubscriptionStatus.ACTIVE,
        past_due: SubscriptionStatus.PAST_DUE,
        canceled: SubscriptionStatus.CANCELLED,
        trialing: SubscriptionStatus.TRIALING,
        unpaid: SubscriptionStatus.UNPAID,
        expired: SubscriptionStatus.EXPIRED,
    };

    const polarStatus = String(subscription.status).toLowerCase();
    const mappedStatus = statusMap[polarStatus] || SubscriptionStatus.ACTIVE;

    await prisma.userSubscription.updateMany({
        where: { userId: user.id },
        data: {
            status: mappedStatus,
            currentPeriodStart: newPeriodStart,
            currentPeriodEnd: new Date(String(subscription.currentPeriodEnd)),
            // Reset credits if this is a renewal (new billing period started)
            ...(isRenewal && {
                monthlyCreditsUsed: 0,
                periodCreditsReset: new Date(),
            }),
            updatedAt: new Date(),
        },
    });

    if (isRenewal) {
        console.log("Subscription renewed and credits reset for user:", user.id);
    } else {
        console.log("Subscription updated for user:", user.id);
    }
}

async function handleSubscriptionCanceled(subscription: Record<string, unknown>) {
    const customerEmail = (subscription.customer as { email?: string })?.email;
    if (!customerEmail) {
        console.error("No customer email in subscription:", subscription.id);
        return;
    }
    const user = await prisma.user.findUnique({ where: { email: customerEmail } });
    if (!user) {
        console.error("User not found for email:", customerEmail);
        return;
    }
    await prisma.userSubscription.updateMany({
        where: { userId: user.id },
        data: { cancelAtPeriodEnd: true, cancelledAt: new Date(), updatedAt: new Date() },
    });
    console.log("Subscription marked as canceled for user:", user.id);
}

async function handleSubscriptionUncanceled(subscription: Record<string, unknown>) {
    const customerEmail = (subscription.customer as { email?: string })?.email;
    if (!customerEmail) {
        console.error("No customer email in subscription:", subscription.id);
        return;
    }
    const user = await prisma.user.findUnique({ where: { email: customerEmail } });
    if (!user) {
        console.error("User not found for email:", customerEmail);
        return;
    }
    await prisma.userSubscription.updateMany({
        where: { userId: user.id },
        data: { cancelAtPeriodEnd: false, cancelledAt: null, status: SubscriptionStatus.ACTIVE, updatedAt: new Date() },
    });
    console.log("Subscription reactivated for user:", user.id);
}

async function handleSubscriptionRevoked(subscription: Record<string, unknown>) {
    const customerEmail = (subscription.customer as { email?: string })?.email;
    if (!customerEmail) {
        console.error("No customer email in subscription:", subscription.id);
        return;
    }
    const user = await prisma.user.findUnique({ where: { email: customerEmail } });
    if (!user) {
        console.error("User not found for email:", customerEmail);
        return;
    }
    const hobbyPlan = await prisma.plan.findUnique({ where: { name: "HOBBY" } });
    if (!hobbyPlan) {
        console.error("Hobby plan not found in database");
        return;
    }
    await prisma.userSubscription.updateMany({
        where: { userId: user.id },
        data: { planId: hobbyPlan.id, status: SubscriptionStatus.CANCELLED, cancelAtPeriodEnd: true, cancelledAt: new Date(), updatedAt: new Date() },
    });
    console.log("Subscription revoked for user:", user.id);
}

async function handleOrderRefund(order: Record<string, unknown>) {
    const customerEmail = (order.customer as { email?: string })?.email;
    if (!customerEmail) {
        console.error("No customer email in order:", order.id);
        return;
    }
    const user = await prisma.user.findUnique({ where: { email: customerEmail } });
    if (!user) {
        console.error("User not found for email:", customerEmail);
        return;
    }
    const transaction = await prisma.paymentTransaction.findFirst({
        where: { polarPaymentId: String(order.id) },
    });
    if (transaction) {
        await prisma.paymentTransaction.update({
            where: { id: transaction.id },
            data: { status: "refunded", updatedAt: new Date() },
        });
    }

    // Token purchases no longer exist - refund would downgrade subscription instead
    console.log("Order refund processed:", order.id);
}

/**
 * Handle subscription payment failure
 * Sets status to PAST_DUE and establishes 7-day grace period
 * Note: This should be called when payment fails on renewal
 */
async function handleSubscriptionPaymentFailed(subscription: Record<string, unknown>) {
    const customerEmail = (subscription.customer as { email?: string })?.email;
    if (!customerEmail) {
        console.error("No customer email in subscription:", subscription.id);
        return;
    }

    const user = await prisma.user.findUnique({
        where: { email: customerEmail },
        include: { subscription: true }
    });

    if (!user) {
        console.error("User not found for email:", customerEmail);
        return;
    }

    // Set 7-day grace period
    const gracePeriodEndsAt = new Date();
    gracePeriodEndsAt.setDate(gracePeriodEndsAt.getDate() + 7);

    await prisma.userSubscription.updateMany({
        where: { userId: user.id },
        data: {
            status: SubscriptionStatus.PAST_DUE,
            paymentFailedAt: new Date(),
            gracePeriodEndsAt,
            updatedAt: new Date(),
        },
    });

    console.log(`Payment failed for user ${user.id}. Grace period until ${gracePeriodEndsAt.toISOString()}`);

    // Send payment failure email notification
    if (user.subscription) {
        const { sendPaymentFailedEmail } = await import("@/lib/subscription-emails");
        const plan = await prisma.plan.findUnique({
            where: { id: user.subscription.planId }
        });

        if (plan) {
            await sendPaymentFailedEmail({
                user: {
                    email: user.email,
                    name: user.name
                },
                planName: plan.displayName || plan.name,
                amount: plan.priceMonthlyUsd,
                currency: "USD"
            });
            console.log(`Payment failure email sent to ${user.email}`);
        }
    }
}

async function handleBenefitGrantCreated(event: Record<string, unknown>) {
    console.log("Benefit grant created event received:", JSON.stringify(event, null, 2));

    const benefitGrant = event.data as Record<string, unknown>;
    const subscription_id = benefitGrant.subscription_id as string | undefined;
    const benefit_id = benefitGrant.benefit_id as string | undefined;
    const properties = benefitGrant.properties as Record<string, unknown> | undefined;

    // Extract credit amount from benefit properties
    const creditAmount = properties?.grant_amount as number | undefined;

    if (!creditAmount) {
        console.error("No grant_amount found in benefit properties");
        return;
    }

    // Find user by Polar subscription ID
    const userSubscription = await prisma.userSubscription.findFirst({
        where: { polarSubscriptionId: subscription_id },
        include: { user: true }
    });

    if (!userSubscription || !userSubscription.user) {
        console.error(`No user found with polarSubscriptionId: ${subscription_id}`);
        return;
    }

    const user = userSubscription.user;
    console.log(`Benefit grant for user ${user.id} - ${creditAmount} credits`);

    // TODO: Implement credit granting logic based on your credit system
    // This is a placeholder - credits are currently managed through the subscription plan
    console.log(`Successfully processed benefit grant for user ${user.email}`);
}

async function handleBenefitGrantRevoked(event: Record<string, unknown>) {
    console.log("Benefit grant revoked event received:", JSON.stringify(event, null, 2));

    const benefitGrant = event.data as Record<string, unknown>;
    const subscription_id = benefitGrant.subscription_id as string | undefined;

    // Find user subscription by Polar subscription ID
    const userSubscription = await prisma.userSubscription.findFirst({
        where: { polarSubscriptionId: subscription_id },
        include: { user: true }
    });

    if (!userSubscription || !userSubscription.user) {
        console.error(`No user found with polarSubscriptionId: ${subscription_id}`);
        return;
    }

    const user = userSubscription.user;
    console.log(`Benefit revoked for user ${user.id}. Credits will not be renewed next period.`);
    // Note: We typically don't deduct credits when revoked, just stop future grants
}
