/**
 * API Route: Purchase Additional AI Tokens
 * POST /api/tokens/purchase
 * 
 * Allows users to purchase additional AI tokens beyond their plan limit
 * Pricing: $5 per 1M tokens (both input and output included)
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { TOKEN_PRICING } from "@/lib/pricing-constants";

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
        const { tokenAmount } = body; // Amount of tokens to purchase in millions (e.g., 1 = 1M tokens)

        if (!tokenAmount || tokenAmount <= 0) {
            return NextResponse.json(
                { error: "Invalid token amount. Must be greater than 0." },
                { status: 400 }
            );
        }

        // Get user and their team
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: {
                teamMembers: {
                    include: {
                        team: {
                            include: {
                                subscription: {
                                    include: {
                                        plan: true,
                                    },
                                },
                            },
                        },
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

        // Get user's personal team
        const personalTeam = user.teamMembers.find((tm) => tm.team.isPersonal);
        const team = personalTeam?.team || user.teamMembers[0]?.team;

        if (!team) {
            return NextResponse.json(
                { error: "Team not found" },
                { status: 404 }
            );
        }

        // Check if user's plan allows purchasing tokens
        const plan = team.subscription?.plan;
        if (!plan?.canPurchaseTokens) {
            return NextResponse.json(
                { error: "Your plan does not allow purchasing additional tokens" },
                { status: 403 }
            );
        }

        // Calculate price in USD
        const pricePerMillion = TOKEN_PRICING.PAY_AS_YOU_GO;
        const totalPriceUsd = tokenAmount * pricePerMillion;

        // Convert to cents for payment processing
        const totalPriceCents = Math.round(totalPriceUsd * 100);

        // Return checkout information
        // The actual payment will be processed by Polar via client-side redirect
        return NextResponse.json({
            success: true,
            tokenAmount: tokenAmount * 1000000, // Convert millions to actual token count
            pricePerMillion: pricePerMillion,
            totalPriceUsd: totalPriceUsd,
            totalPriceCents: totalPriceCents,
            teamId: team.id,
            productName: `${tokenAmount}M AI Tokens`,
            productDescription: `Additional ${tokenAmount} million AI tokens for your Craft projects`,
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
