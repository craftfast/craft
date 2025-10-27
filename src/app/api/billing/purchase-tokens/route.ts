/**
 * API Route: Purchase Tokens
 * POST /api/billing/purchase-tokens
 * 
 * Allows Pro and Agent users to purchase additional tokens
 * Redirects to Polar checkout for payment
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { CREDIT_TIERS } from "@/lib/pricing-constants";

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { tierIndex } = body; // Index of the credit tier to purchase

        if (typeof tierIndex !== "number" || tierIndex < 0 || tierIndex >= CREDIT_TIERS.length) {
            return NextResponse.json(
                { error: "Invalid tier selection" },
                { status: 400 }
            );
        }

        // Get user and subscription
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

        // Check if user can purchase tokens (Pro or Agent plans only)
        const currentPlan = user.subscription?.plan;
        if (!currentPlan?.canPurchaseTokens) {
            return NextResponse.json(
                { error: "Your current plan does not allow purchasing additional tokens. Please upgrade to Pro or Agent." },
                { status: 403 }
            );
        }

        // Get the selected tier
        const selectedTier = CREDIT_TIERS[tierIndex];

        // Get Polar product ID from environment variable
        const polarProductId = process.env[selectedTier.polarEnvKey];

        if (!polarProductId) {
            console.error(`Missing Polar product ID: ${selectedTier.polarEnvKey}`);
            return NextResponse.json(
                { error: "Payment configuration error. Please contact support." },
                { status: 500 }
            );
        }

        // Build checkout URL
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const checkoutUrl = new URL("/api/checkout", baseUrl);

        checkoutUrl.searchParams.set("products", polarProductId);
        checkoutUrl.searchParams.set("customerEmail", user.email || '');
        checkoutUrl.searchParams.set("metadata[userId]", user.id);
        checkoutUrl.searchParams.set("metadata[purchaseType]", "tokens");
        checkoutUrl.searchParams.set("metadata[tokenAmount]", selectedTier.tokens.toString());
        checkoutUrl.searchParams.set("metadata[tierIndex]", tierIndex.toString());

        return NextResponse.json({
            success: true,
            checkoutUrl: checkoutUrl.toString(),
            tokens: selectedTier.tokens,
            price: selectedTier.price,
            display: selectedTier.display,
        });
    } catch (error) {
        console.error("Error creating token purchase checkout:", error);
        return NextResponse.json(
            { error: "Failed to process token purchase" },
            { status: 500 }
        );
    }
}
