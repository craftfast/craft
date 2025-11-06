/**
 * API Route: Create Checkout Session
 * POST /api/billing/create-checkout-session
 * 
 * Creates a Polar checkout session and returns the URL for embedded checkout.
 * This keeps users in the app flow instead of redirecting to external pages.
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

        const body = await request.json();
        const { monthlyCredits = 500 } = body;

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

        // Check if user is already on Pro plan with the same tier
        const currentPlan = user.subscription?.plan;
        if (currentPlan?.name === "PRO" && currentPlan?.monthlyCredits === monthlyCredits) {
            return NextResponse.json(
                { error: `You are already on the Pro ${monthlyCredits} credits/month plan` },
                { status: 400 }
            );
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
        const priceId = product.prices[0].id;

        // Create checkout session using Polar SDK
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

        // Create checkout session with correct parameter names (camelCase)
        const checkout = await polar.checkouts.create({
            productPriceId: priceId,
            customerEmail: user.email || undefined,
            embedOrigin: baseUrl,
            successUrl: `${baseUrl}/dashboard?payment=success`,
            metadata: {
                userId: user.id,
                purchaseType: "subscription",
                planName: "PRO",
                monthlyCredits: monthlyCredits.toString(),
                billingPeriod: "MONTHLY",
            },
        } as any); // Using 'as any' temporarily due to SDK type issues        // Return the Polar-hosted checkout URL for embedding
        return NextResponse.json({
            success: true,
            checkoutUrl: checkout.url,
            planName: "PRO",
            monthlyCredits: selectedTier.monthlyCredits,
            price: selectedTier.priceMonthly,
            displayPrice: selectedTier.displayPrice,
        });
    } catch (error) {
        console.error("Error creating checkout session:", error);
        return NextResponse.json(
            { error: "Failed to create checkout session" },
            { status: 500 }
        );
    }
}
