/**
 * API Route: Get Token Purchase History
 * GET /api/billing/token-purchase-history
 * 
 * Returns all token purchase records for the user
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

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        });

        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        // Get all token purchases
        const tokenPurchases = await prisma.tokenPurchase.findMany({
            where: { userId: user.id },
            orderBy: { purchasedAt: 'desc' },
        });

        return NextResponse.json({
            purchases: tokenPurchases.map(purchase => ({
                id: purchase.id,
                tokenAmount: purchase.tokenAmount,
                priceUsd: purchase.priceUsd,
                currency: purchase.currency,
                status: purchase.status,
                polarCheckoutId: purchase.polarCheckoutId,
                polarPaymentId: purchase.polarPaymentId,
                purchasedAt: purchase.purchasedAt,
                expiresAt: purchase.expiresAt,
                tokensRemaining: purchase.tokensRemaining,
                createdAt: purchase.createdAt,
            })),
            summary: {
                totalPurchased: tokenPurchases.reduce((sum, p) => sum + p.tokenAmount, 0),
                totalSpent: tokenPurchases.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.priceUsd, 0),
                tokensRemaining: tokenPurchases.reduce((sum, p) => sum + p.tokensRemaining, 0),
                activePurchases: tokenPurchases.filter(p => p.status === 'completed' && p.tokensRemaining > 0).length,
            }
        });
    } catch (error) {
        console.error("Error fetching token purchase history:", error);
        return NextResponse.json(
            { error: "Failed to fetch token purchase history" },
            { status: 500 }
        );
    }
}
