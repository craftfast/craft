/**
 * API Route: Upgrade to Pro Plan
 * POST /api/billing/upgrade-to-pro
 * 
 * Creates a Polar checkout session for upgrading to Pro plan with specific tier
 * Supports different Pro tiers based on daily credit allocation
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PRO_TIERS, getProTier } from "@/lib/pricing-constants";

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Get the requested daily credits from the request body
        const body = await request.json();
        const { dailyCredits = 10 } = body; // Default to 10 credits/day ($25/mo)

        // Find the Pro tier
        const selectedTier = getProTier(dailyCredits);

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
        if (currentPlan?.name === "PRO" && currentPlan?.dailyCredits === dailyCredits) {
            return NextResponse.json(
                { error: `You are already on the Pro ${dailyCredits} credits/day plan` },
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

        // Build checkout URL using the Polar Next.js adapter route
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const checkoutUrl = new URL("/api/checkout", baseUrl);

        // Add required parameters for Polar checkout
        checkoutUrl.searchParams.set("products", polarProductId);
        checkoutUrl.searchParams.set("customerEmail", user.email || '');

        // Add metadata as query parameters (Polar SDK will handle these)
        checkoutUrl.searchParams.set("metadata[userId]", user.id);
        checkoutUrl.searchParams.set("metadata[purchaseType]", "subscription");
        checkoutUrl.searchParams.set("metadata[planName]", "PRO");
        checkoutUrl.searchParams.set("metadata[dailyCredits]", dailyCredits.toString());
        checkoutUrl.searchParams.set("metadata[billingPeriod]", "MONTHLY");

        return NextResponse.json({
            success: true,
            checkoutUrl: checkoutUrl.toString(),
            planName: "PRO",
            dailyCredits: selectedTier.dailyCredits,
            monthlyCredits: selectedTier.monthlyCredits,
            price: selectedTier.priceMonthly,
            displayPrice: selectedTier.displayPrice,
        });
    } catch (error) {
        console.error("Pro upgrade error:", error);
        return NextResponse.json(
            {
                error: "Failed to process Pro upgrade request",
                details: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}
