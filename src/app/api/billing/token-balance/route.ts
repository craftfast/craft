/**
 * API Route: Get Token Balance
 * GET /api/billing/token-balance
 * 
 * Returns user's current token balance and usage statistics
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Get user with subscription
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

        if (!user || !user.subscription) {
            return NextResponse.json(
                { error: "User or subscription not found" },
                { status: 404 }
            );
        }

        const subscription = user.subscription;
        const plan = subscription.plan;

        // Calculate current billing period dates
        const periodStart = subscription.currentPeriodStart;
        const periodEnd = subscription.currentPeriodEnd;

        // Get token usage for current billing period
        const tokenUsage = await prisma.aITokenUsage.aggregate({
            where: {
                userId: user.id,
                createdAt: {
                    gte: periodStart,
                    lte: periodEnd,
                },
            },
            _sum: {
                totalTokens: true,
            },
        });

        const usedTokens = tokenUsage._sum.totalTokens || 0;

        // Get purchased tokens from TokenPurchase model
        const tokenPurchases = await prisma.tokenPurchase.aggregate({
            where: {
                userId: user.id,
                status: "completed",
                OR: [
                    { expiresAt: null }, // Never expires
                    { expiresAt: { gte: new Date() } }, // Not yet expired
                ],
            },
            _sum: {
                tokenAmount: true,
                tokensRemaining: true,
            },
        });

        const totalPurchasedTokens = tokenPurchases._sum.tokenAmount || 0;
        const remainingPurchasedTokens = tokenPurchases._sum.tokensRemaining || 0;

        // Calculate remaining monthly tokens
        const monthlyTokenLimit = plan.monthlyTokenLimit || 0;
        const remainingMonthlyTokens = Math.max(0, monthlyTokenLimit - usedTokens);

        // Calculate days until reset
        const now = new Date();
        const daysUntilReset = Math.ceil(
            (periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        // Total available tokens = purchased tokens + remaining monthly tokens
        const totalAvailableTokens = remainingPurchasedTokens + remainingMonthlyTokens;

        return NextResponse.json({
            totalAvailable: totalAvailableTokens,
            monthly: {
                limit: monthlyTokenLimit,
                used: usedTokens,
                remaining: remainingMonthlyTokens,
                resetDate: periodEnd,
                daysUntilReset,
            },
            purchased: {
                total: totalPurchasedTokens,
                remaining: remainingPurchasedTokens,
            },
            gifted: {
                remaining: 0, // Future feature
            },
            plan: {
                name: plan.name,
                displayName: plan.displayName,
                canPurchaseTokens: plan.canPurchaseTokens,
            },
        });
    } catch (error) {
        console.error("Error fetching token balance:", error);
        return NextResponse.json(
            { error: "Failed to fetch token balance" },
            { status: 500 }
        );
    }
}
