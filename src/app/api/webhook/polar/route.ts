/**
 * Polar Webhook Handler using Next.js Adapter
 * Handles webhook events from Polar to keep database in sync with payments
 * 
 * @see https://polar.sh/docs/guides/nextjs
 * @see https://polar.sh/docs/api-reference/webhooks
 */

import { Webhooks } from "@polar-sh/nextjs";
import { prisma } from "@/lib/db";
import { getTokenAmountFromProductId } from "@/lib/polar-config";

export const POST = Webhooks({
    webhookSecret: process.env.POLAR_WEBHOOK_SECRET!,

    // ============================================================================
    // GENERIC WEBHOOK HANDLER
    // ============================================================================

    onPayload: async (payload) => {
        console.log(" Polar webhook received:", payload.type);
        console.log(" Full payload:", JSON.stringify(payload, null, 2));
    },

    // ============================================================================
    // ORDER WEBHOOKS (PRIMARY PAYMENT HANDLERS)
    // ============================================================================

    onOrderPaid: async (payload) => {
        const order = payload.data;
        console.log(" Order paid:", order.id);
        console.log(" Billing reason:", order.billingReason);
        console.log(" Order details:", JSON.stringify(order, null, 2));

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
            // Handle one-time token purchase
            await handleTokenPurchasePayment(user.id, order);
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
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function handleSubscriptionPayment(userId: string, order: Record<string, unknown>) {
    console.log("Processing subscription payment for user:", userId);
    const proPlan = await prisma.plan.findUnique({ where: { name: "PRO" } });
    if (!proPlan) {
        console.error("Pro plan not found in database");
        return;
    }
    const currentPeriodStart = new Date();
    const currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await prisma.userSubscription.upsert({
        where: { userId },
        create: {
            userId, planId: proPlan.id, status: "active",
            currentPeriodStart, currentPeriodEnd, cancelAtPeriodEnd: false,
            polarCheckoutId: String(order.checkoutId), polarPaymentId: String(order.id),
        },
        update: {
            planId: proPlan.id, status: "active", currentPeriodStart, currentPeriodEnd,
            cancelAtPeriodEnd: false, polarPaymentId: String(order.id), cancelledAt: null,
        },
    });
    await prisma.paymentTransaction.create({
        data: {
            userId, amount: Number(order.amount) / 100, currency: String(order.currency).toUpperCase(),
            status: "completed", paymentMethod: "polar", polarCheckoutId: String(order.checkoutId),
            polarPaymentId: String(order.id), metadata: JSON.parse(JSON.stringify(order)),
        },
    });
    console.log("Subscription payment processed for user:", userId);
}

async function handleTokenPurchasePayment(userId: string, order: Record<string, unknown>) {
    console.log("Processing token purchase payment for user:", userId);

    // Use product ID instead of price ID (more stable, handles multiple prices per product)
    const productId = order.productId as string | undefined;

    if (!productId) {
        console.error("No product ID in order:", order.id);
        console.error("Order keys:", Object.keys(order));
        return;
    }

    console.log("Product ID found:", productId);

    const tokenAmount = getTokenAmountFromProductId(productId);
    if (!tokenAmount) {
        console.error("Unknown product ID:", productId);
        console.error("This product ID is not mapped in POLAR_CONFIG.tokenPurchases");
        console.error("Please add POLAR_TOKEN_*_PRODUCT_ID environment variable for product:", productId);
        return;
    }

    console.log("Token amount for purchase:", tokenAmount);
    const existingPurchase = await prisma.tokenPurchase.findFirst({
        where: {
            polarCheckoutId: String(order.checkoutId),
            status: "completed"
        },
    });

    if (existingPurchase) {
        console.log("Token purchase already recorded:", order.checkoutId);
        return;
    }

    // Calculate price in USD from totalAmount (in cents)
    const priceUsd = Number(order.totalAmount) / 100;
    console.log(`💰 Creating token purchase: ${tokenAmount} tokens for $${priceUsd}`);

    // Create token purchase record
    await prisma.tokenPurchase.create({
        data: {
            userId: userId,
            tokenAmount: tokenAmount,
            priceUsd: priceUsd,
            currency: String(order.currency).toUpperCase(),
            status: "completed",
            polarCheckoutId: String(order.checkoutId),
            polarPaymentId: String(order.id),
            tokensRemaining: tokenAmount,
            purchasedAt: new Date(),
            metadata: JSON.parse(JSON.stringify(order)),
        },
    });

    // Create payment transaction record
    await prisma.paymentTransaction.create({
        data: {
            userId,
            amount: Number(order.totalAmount) / 100,
            currency: String(order.currency).toUpperCase(),
            status: "completed",
            paymentMethod: "polar",
            polarCheckoutId: String(order.checkoutId),
            polarPaymentId: String(order.id),
            metadata: JSON.parse(JSON.stringify(order)),
        },
    });

    console.log(`✅ Token purchase completed: ${tokenAmount} tokens for $${Number(order.totalAmount) / 100} - User: ${userId}`);
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
            userId: user.id, planId: proPlan.id, status: "active",
            currentPeriodStart: new Date(String(subscription.currentPeriodStart)),
            currentPeriodEnd: new Date(String(subscription.currentPeriodEnd)), cancelAtPeriodEnd: false,
        },
        update: {
            status: "active", currentPeriodStart: new Date(String(subscription.currentPeriodStart)),
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
    await prisma.userSubscription.updateMany({
        where: { userId: user.id },
        data: {
            status: String(subscription.status),
            currentPeriodStart: new Date(String(subscription.currentPeriodStart)),
            currentPeriodEnd: new Date(String(subscription.currentPeriodEnd)),
            updatedAt: new Date(),
        },
    });
    console.log("Subscription updated for user:", user.id);
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
        data: { cancelAtPeriodEnd: false, cancelledAt: null, status: "active", updatedAt: new Date() },
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
        data: { planId: hobbyPlan.id, status: "cancelled", cancelAtPeriodEnd: true, cancelledAt: new Date(), updatedAt: new Date() },
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
    const tokenPurchase = await prisma.tokenPurchase.findFirst({
        where: { polarPaymentId: String(order.id) },
    });
    if (tokenPurchase) {
        await prisma.tokenPurchase.update({
            where: { id: tokenPurchase.id },
            data: { status: "refunded", tokensRemaining: 0, updatedAt: new Date() },
        });
        console.log("Token purchase refunded:", tokenPurchase.id);
    }
    console.log("Order refund processed:", order.id);
}
