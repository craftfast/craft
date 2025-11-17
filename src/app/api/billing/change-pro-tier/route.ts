/**
 * API Route: Change Pro Tier
 * POST /api/billing/change-pro-tier
 * 
 * Allows Pro users to upgrade or downgrade between Pro tiers
 * First attempts direct subscription update, falls back to checkout if needed
 */

import { NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import { prisma } from "@/lib/db";
import { PRO_TIERS, getProTier } from "@/lib/pricing-constants";
import { Polar } from "@polar-sh/sdk";

export async function POST(request: Request) {
    try {
        const session = await getSession();

        if (!session?.user?.email) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Get the requested monthly credits from the request body
        const body = await request.json();
        const { monthlyCredits } = body;

        if (!monthlyCredits || typeof monthlyCredits !== "number") {
            return NextResponse.json(
                { error: "Invalid monthly credits value" },
                { status: 400 }
            );
        }

        // Find the Pro tier
        const selectedTier = getProTier(monthlyCredits);

        if (!selectedTier) {
            return NextResponse.json(
                { error: "Invalid Pro tier selected" },
                { status: 400 }
            );
        }

        // Get user and their subscription
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: {
                subscription: {
                    include: {
                        plan: true,
                    },
                },
            },
        });

        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        // ========================================
        // CRITICAL VALIDATION: Subscription State
        // ========================================
        if (!user.subscription?.polarSubscriptionId) {
            return NextResponse.json(
                { error: "No active subscription found. Please upgrade to Pro first." },
                { status: 400 }
            );
        }

        // Verify user is on Pro plan (handles PRO, PRO_100, PRO_200, etc.)
        const isPro = user.subscription.plan?.name?.startsWith("PRO");
        if (!isPro) {
            return NextResponse.json(
                { error: "Only Pro users can change tiers. Please upgrade to Pro first." },
                { status: 400 }
            );
        }

        // Check if already on this tier
        if (user.subscription.plan.monthlyCredits === monthlyCredits) {
            return NextResponse.json(
                { error: `You are already on the Pro ${monthlyCredits} credits/month tier` },
                { status: 400 }
            );
        }

        // CRITICAL: Block if subscription is not in active state
        // Following Polar's SubscriptionStatus validation patterns
        const subscriptionStatus = user.subscription.status;

        // Block: CANCELLED, PAST_DUE, UNPAID subscriptions
        if (["CANCELLED", "PAST_DUE", "UNPAID"].includes(subscriptionStatus)) {
            const statusMessages = {
                CANCELLED: "Your subscription has been cancelled. Please start a new subscription to change tiers.",
                PAST_DUE: "Your subscription has a payment issue. Please update your payment method before changing tiers.",
                UNPAID: "Your subscription is unpaid. Please resolve payment issues before changing tiers.",
            };
            return NextResponse.json(
                {
                    error: statusMessages[subscriptionStatus as keyof typeof statusMessages],
                    status: subscriptionStatus,
                    requiresAction: subscriptionStatus === "PAST_DUE" ? "update_payment_method" : "contact_support"
                },
                { status: 403 }
            );
        }

        // Block: TRIALING subscriptions (following Polar's TrialingSubscription error pattern)
        if (subscriptionStatus === "TRIALING") {
            return NextResponse.json(
                {
                    error: "Tier changes are not available during trial period. Please wait until your trial ends.",
                    status: "TRIALING",
                    trialEndsAt: user.subscription.currentPeriodEnd
                },
                { status: 403 }
            );
        }

        // Only allow ACTIVE subscriptions
        if (subscriptionStatus !== "ACTIVE") {
            return NextResponse.json(
                { error: `Subscription status '${subscriptionStatus}' does not allow tier changes.` },
                { status: 403 }
            );
        }

        // CRITICAL: Check for pending downgrade (cancel_at_period_end)
        // Following Polar's AlreadyCanceledSubscription error pattern
        const hasPendingDowngrade = user.subscription.cancelAtPeriodEnd;
        if (hasPendingDowngrade) {
            const currentCredits = user.subscription.plan.monthlyCredits || 0;
            const isUpgrade = monthlyCredits > currentCredits;

            // For upgrades: Cancel the scheduled downgrade first
            if (isUpgrade) {
                console.log("User has pending downgrade, will cancel it for upgrade");
                // Note: We'll handle cancellation in the Polar API call section
            } else {
                // For downgrades: Block multiple scheduled changes
                return NextResponse.json(
                    {
                        error: "You already have a tier change scheduled. Please wait for it to take effect or cancel it first.",
                        scheduledChange: true,
                        effectiveDate: user.subscription.currentPeriodEnd
                    },
                    { status: 409 }
                );
            }
        }

        // Get the Polar product ID from environment variable
        const polarEnvKey = selectedTier.polarEnvKey;
        const polarProductId = process.env[polarEnvKey];

        if (!polarProductId) {
            console.error(`Missing ${polarEnvKey} environment variable`);
            return NextResponse.json(
                { error: "Payment configuration error. Please contact support." },
                { status: 500 }
            );
        }

        // Initialize Polar SDK
        const polar = new Polar({
            accessToken: process.env.POLAR_ACCESS_TOKEN!,
            server: (process.env.POLAR_SERVER as "sandbox" | "production") || "sandbox",
        });

        // Get the product to find its price ID
        const product = await polar.products.get({ id: polarProductId });

        if (!product || !product.prices || product.prices.length === 0) {
            console.error(`Product ${polarProductId} has no prices`);
            return NextResponse.json(
                { error: "Product configuration error. Please contact support." },
                { status: 500 }
            );
        }

        // Get the first (and usually only) price for this product
        const newPriceId = product.prices[0].id;

        // Determine if this is an upgrade or downgrade
        const currentCredits = user.subscription.plan.monthlyCredits || 0;
        const isUpgrade = monthlyCredits > currentCredits;

        // Different behavior for upgrades vs downgrades:
        // - Upgrades: Charge immediately with proration
        // - Downgrades: Apply at end of current billing cycle
        console.log("Processing tier change:", {
            subscriptionId: user.subscription.polarSubscriptionId,
            currentProduct: user.subscription.plan.polarProductId,
            newProduct: polarProductId,
            currentCredits,
            newCredits: monthlyCredits,
            isUpgrade,
        });

        try {
            const polarServer = process.env.POLAR_SERVER === "production"
                ? "https://api.polar.sh"
                : "https://sandbox-api.polar.sh";

            if (isUpgrade) {
                // UPGRADE: Invoice immediately with prorated charges
                // CRITICAL: Payment method validation happens here (Polar will return error if missing)
                const response = await fetch(
                    `${polarServer}/v1/subscriptions/${user.subscription.polarSubscriptionId}`,
                    {
                        method: "PATCH",
                        headers: {
                            "Authorization": `Bearer ${process.env.POLAR_ACCESS_TOKEN}`,
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            product_id: polarProductId,
                            proration_behavior: "invoice", // Invoice immediately
                        }),
                    }
                );

                if (!response.ok) {
                    const errorData = await response.json();

                    // CRITICAL: Handle MissingPaymentMethod error
                    // Following Polar's StripeService.update_subscription_price() pattern
                    if (errorData.type === "MissingPaymentMethod" ||
                        errorData.detail?.toLowerCase().includes("payment method") ||
                        errorData.detail?.toLowerCase().includes("no card") ||
                        errorData.error?.toLowerCase().includes("payment")) {
                        return NextResponse.json(
                            {
                                error: "MissingPaymentMethod",
                                message: "A valid payment method is required to upgrade. Please add a payment method first.",
                                requiresAction: "add_payment_method"
                            },
                            { status: 402 } // 402 Payment Required
                        );
                    }

                    // CRITICAL: Handle AlreadyCanceledSubscription error
                    if (errorData.type === "AlreadyCanceledSubscription" ||
                        errorData.detail?.toLowerCase().includes("canceled") ||
                        errorData.detail?.toLowerCase().includes("cancelled")) {
                        return NextResponse.json(
                            {
                                error: "AlreadyCanceledSubscription",
                                message: "Your subscription has been cancelled. Please start a new subscription.",
                                requiresAction: "resubscribe"
                            },
                            { status: 403 }
                        );
                    }

                    // CRITICAL: Handle TrialingSubscription error
                    if (errorData.type === "TrialingSubscription" ||
                        errorData.detail?.toLowerCase().includes("trial")) {
                        return NextResponse.json(
                            {
                                error: "TrialingSubscription",
                                message: "Tier changes are not available during trial period.",
                                requiresAction: "wait_for_trial_end"
                            },
                            { status: 403 }
                        );
                    }

                    // Generic error
                    throw new Error(errorData.detail || errorData.error || `API returned ${response.status}`);
                }

                const updatedSubscription = await response.json();

                console.log("Upgrade completed - invoiced immediately:", {
                    subscriptionId: updatedSubscription.id,
                    newProductId: updatedSubscription.product_id,
                    status: updatedSubscription.status,
                });

                return NextResponse.json({
                    success: true,
                    immediate: true,
                    tierChange: "upgrade",
                    currentCredits,
                    newCredits: monthlyCredits,
                    currentPrice: user.subscription.plan.priceMonthlyUsd,
                    newPrice: selectedTier.priceMonthly,
                    displayPrice: selectedTier.displayPrice,
                    message: `Upgraded to Pro ${monthlyCredits} credits/month! You've been charged the prorated amount immediately. Your new tier is active now.`,
                });
            } else {
                // DOWNGRADE: Schedule change for end of billing period
                const response = await fetch(
                    `${polarServer}/v1/subscriptions/${user.subscription.polarSubscriptionId}`,
                    {
                        method: "PATCH",
                        headers: {
                            "Authorization": `Bearer ${process.env.POLAR_ACCESS_TOKEN}`,
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            product_id: polarProductId,
                            proration_behavior: "prorate", // Add to next invoice (end of period)
                        }),
                    }
                );

                if (!response.ok) {
                    const errorData = await response.json();

                    // Handle common errors for downgrades
                    if (errorData.type === "AlreadyCanceledSubscription" ||
                        errorData.detail?.toLowerCase().includes("canceled") ||
                        errorData.detail?.toLowerCase().includes("cancelled")) {
                        return NextResponse.json(
                            {
                                error: "AlreadyCanceledSubscription",
                                message: "Your subscription has been cancelled. Please start a new subscription.",
                                requiresAction: "resubscribe"
                            },
                            { status: 403 }
                        );
                    }

                    throw new Error(errorData.detail || errorData.error || `API returned ${response.status}`);
                }

                const updatedSubscription = await response.json();

                console.log("Downgrade scheduled for end of billing period:", {
                    subscriptionId: updatedSubscription.id,
                    newProductId: updatedSubscription.product_id,
                    currentPeriodEnd: updatedSubscription.current_period_end,
                });

                return NextResponse.json({
                    success: true,
                    immediate: false, // Not immediate - happens at period end
                    scheduled: true,
                    tierChange: "downgrade",
                    currentCredits,
                    newCredits: monthlyCredits,
                    currentPrice: user.subscription.plan.priceMonthlyUsd,
                    newPrice: selectedTier.priceMonthly,
                    displayPrice: selectedTier.displayPrice,
                    effectiveDate: updatedSubscription.current_period_end,
                    message: `Downgrade scheduled to Pro ${monthlyCredits} credits/month. The change will take effect at the end of your current billing period. You'll continue to have access to your current ${currentCredits} credits until then.`,
                });
            }
        } catch (updateError: unknown) {
            console.error("Failed to update Polar subscription:", updateError);
            const errorMessage = updateError instanceof Error ? updateError.message : "Unknown error";
            return NextResponse.json(
                {
                    error: "Failed to update subscription. Please try again or contact support.",
                    details: errorMessage,
                },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error("Pro tier change error:", error);
        return NextResponse.json(
            {
                error: "Failed to process Pro tier change",
                details: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}
