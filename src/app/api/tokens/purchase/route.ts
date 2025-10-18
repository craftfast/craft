/**
 * API Route: Purchase Additional AI Tokens
 * POST /api/tokens/purchase
 * 
 * Creates a Polar checkout session for purchasing additional AI tokens
 * Pricing: $5 per 1M tokens (both input and output included)
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getCreditTiers } from "@/lib/pricing-constants";

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Get request body
        const body = await request.json();
        const { tokens } = body; // Exact token amount (e.g., 1000000 for 1M)

        if (!tokens || tokens <= 0) {
            return NextResponse.json(
                { error: "Invalid token amount. Must be greater than 0." },
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

        // Check if user's plan allows purchasing tokens
        const plan = user.subscription?.plan;
        if (!plan?.canPurchaseTokens) {
            return NextResponse.json(
                { error: "Your plan does not allow purchasing additional tokens. Please upgrade to Pro." },
                { status: 403 }
            );
        }

        // Find the matching credit tier
        const creditTiers = getCreditTiers();
        const tier = creditTiers.find(t => t.tokens === tokens);

        if (!tier) {
            return NextResponse.json(
                { error: "Invalid token amount. Please select a valid token package." },
                { status: 400 }
            );
        }

        // Get the Polar price ID from environment
        const polarPriceId = process.env[tier.polarEnvKey];

        if (!polarPriceId) {
            console.error(`Missing Polar price ID for ${tier.display}`);
            return NextResponse.json(
                { error: "Payment configuration error. Please contact support." },
                { status: 500 }
            );
        }

        // Build checkout URL using the Polar Next.js adapter route
        // This will create a proper Polar checkout session
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const checkoutUrl = new URL("/api/checkout", baseUrl);

        // Add required parameters for Polar checkout
        checkoutUrl.searchParams.set("products", polarPriceId);
        checkoutUrl.searchParams.set("customerEmail", user.email || '');

        // Add metadata as query parameters
        checkoutUrl.searchParams.set("metadata[userId]", user.id);
        checkoutUrl.searchParams.set("metadata[purchaseType]", "token_topup");
        checkoutUrl.searchParams.set("metadata[tokenAmount]", tokens.toString());
        checkoutUrl.searchParams.set("metadata[priceUsd]", tier.price.toString());

        return NextResponse.json({
            success: true,
            checkoutUrl: checkoutUrl.toString(),
            tokens: tier.tokens,
            price: tier.price,
            display: tier.display,
        });
    } catch (error) {
        console.error("Token purchase error:", error);
        return NextResponse.json(
            {
                error: "Failed to process token purchase request",
                details: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}
