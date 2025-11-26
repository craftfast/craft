/**
 * API Route: Expire Tokens
 * POST /api/cron/expire-tokens
 * 
 * This endpoint should be called by a cron job to expire purchased balance
 * that has passed its expiration date (1 year after purchase).
 * 
 * Security: CRON_SECRET is REQUIRED in production.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

const IS_PRODUCTION = process.env.NODE_ENV === "production";

export async function POST(request: NextRequest) {
    try {
        // Verify cron secret - REQUIRED in production
        const authHeader = request.headers.get("authorization");
        const cronSecret = process.env.CRON_SECRET;

        if (IS_PRODUCTION && !cronSecret) {
            console.error("❌ CRON_SECRET not configured in production");
            return NextResponse.json(
                { error: "Server configuration error" },
                { status: 500 }
            );
        }

        if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const now = new Date();

        // Find expired balance transactions (top-ups older than 1 year)
        const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

        // Find TOPUP transactions that are older than 1 year
        // and haven't been marked as expired yet
        const expiredTopups = await prisma.balanceTransaction.findMany({
            where: {
                type: "TOPUP",
                createdAt: {
                    lte: oneYearAgo,
                },
                // Only find topups that haven't been expired yet (check metadata)
                NOT: {
                    metadata: {
                        path: ["expired"],
                        equals: true,
                    },
                },
            },
            select: {
                id: true,
                userId: true,
                amount: true,
                createdAt: true,
            },
        });

        console.log(`🕐 Found ${expiredTopups.length} expired balance top-ups to process`);

        let expiredCount = 0;
        let totalExpiredAmount = new Prisma.Decimal(0);
        const errors: { transactionId: string; error: string }[] = [];

        for (const topup of expiredTopups) {
            try {
                await prisma.$transaction(async (tx) => {
                    // Get user's current balance
                    const user = await tx.user.findUnique({
                        where: { id: topup.userId },
                        select: {
                            id: true,
                            accountBalance: true,
                        },
                    });

                    if (!user) {
                        console.warn(`⚠️ User ${topup.userId} not found, skipping`);
                        return;
                    }

                    const topupAmount = new Prisma.Decimal(topup.amount.toString());

                    // Calculate how much to expire (don't go negative)
                    const amountToExpire = Prisma.Decimal.min(
                        topupAmount,
                        user.accountBalance
                    );

                    if (amountToExpire.greaterThan(0)) {
                        const newBalance = user.accountBalance.minus(amountToExpire);

                        // Deduct expired amount from balance
                        await tx.user.update({
                            where: { id: user.id },
                            data: {
                                accountBalance: newBalance,
                            },
                        });

                        // Create a balance transaction record for the expiration
                        await tx.balanceTransaction.create({
                            data: {
                                userId: user.id,
                                type: "AI_USAGE", // Using AI_USAGE as closest type for debit
                                amount: amountToExpire.negated(),
                                balanceBefore: user.accountBalance,
                                balanceAfter: newBalance,
                                description: `Balance expired (credited ${topup.createdAt.toISOString().split('T')[0]})`,
                                metadata: {
                                    reason: "expiration",
                                    originalTopupId: topup.id,
                                    expiredAt: now.toISOString(),
                                },
                            },
                        });

                        totalExpiredAmount = totalExpiredAmount.plus(amountToExpire);
                    }

                    // Mark original transaction as expired
                    await tx.balanceTransaction.update({
                        where: { id: topup.id },
                        data: {
                            metadata: {
                                ...((topup as { metadata?: Record<string, unknown> }).metadata || {}),
                                expired: true,
                                expiredAt: now.toISOString(),
                                expiredAmount: amountToExpire.toString(),
                            },
                        },
                    });
                });

                expiredCount++;
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : "Unknown error";
                console.error(`❌ Failed to expire balance for transaction ${topup.id}:`, error);
                errors.push({
                    transactionId: topup.id,
                    error: errorMessage,
                });
            }
        }

        console.log(`✅ Expired $${totalExpiredAmount.toString()} from ${expiredCount} top-ups`);

        return NextResponse.json({
            success: true,
            message: `Expired $${totalExpiredAmount.toString()} from ${expiredCount} top-ups`,
            processed: expiredCount,
            totalExpiredAmount: totalExpiredAmount.toString(),
            errors: errors.length > 0 ? errors : undefined,
        });
    } catch (error) {
        console.error("❌ Expire tokens cron failed:", error);
        return NextResponse.json(
            {
                error: "Failed to expire tokens",
                details: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}

// Also support GET for manual testing (with auth)
export async function GET(request: NextRequest) {
    return POST(request);
}
