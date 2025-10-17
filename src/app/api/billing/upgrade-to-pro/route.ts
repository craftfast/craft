/**
 * API Route: Upgrade to Pro Plan
 * POST /api/billing/upgrade-to-pro
 * 
 * Creates a Polar checkout session for upgrading to Pro plan
 * Currently supports monthly billing only
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PRICING } from "@/lib/pricing-constants";

export async function POST() {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Currently only monthly billing is supported
        // Future: Add yearly billing when separate price ID is configured in Polar
        const billingPeriod = "MONTHLY";

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

        // Check if user is already on Pro plan
        const currentPlan = user.subscription?.plan;
        if (currentPlan?.name === "PRO") {
            return NextResponse.json(
                { error: "You are already on the Pro plan" },
                { status: 400 }
            );
        }

        // Get the Polar price ID from environment
        // Note: Currently only monthly billing is supported
        // To add yearly billing: Create a separate product in Polar and add POLAR_PRO_YEARLY_PRICE_ID to .env
        const polarPriceId = process.env.POLAR_PRO_PRICE_ID;

        if (!polarPriceId) {
            console.error(`Missing POLAR_PRO_PRICE_ID`);
            return NextResponse.json(
                { error: "Payment configuration error. Please contact support." },
                { status: 500 }
            );
        }

        // Monthly pricing
        const price = PRICING.PRO.priceMonthly;

        // Create checkout URL with metadata
        const checkoutUrl = `https://sandbox.polar.sh/checkout/${polarPriceId}?customer_email=${encodeURIComponent(user.email || '')}&metadata[userId]=${user.id}&metadata[purchaseType]=subscription&metadata[planName]=PRO&metadata[billingPeriod]=${billingPeriod}`;

        return NextResponse.json({
            success: true,
            checkoutUrl,
            planName: "PRO",
            billingPeriod,
            price,
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
