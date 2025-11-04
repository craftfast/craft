/**
 * Automated Credit Reset Cron Job
 * Runs daily to reset monthly credits for subscriptions past their billing period
 * 
 * Vercel Cron: Runs at midnight UTC daily
 * Manual test: GET /api/cron/reset-credits?secret=YOUR_CRON_SECRET
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
    try {
        // Verify cron secret to prevent unauthorized access
        const authHeader = request.headers.get("authorization");
        const cronSecret = process.env.CRON_SECRET;

        // Allow requests from Vercel Cron or with valid secret
        const isVercelCron = authHeader === `Bearer ${cronSecret}`;
        const urlSecret = request.nextUrl.searchParams.get("secret");
        const hasValidSecret = cronSecret && urlSecret === cronSecret;

        if (!isVercelCron && !hasValidSecret) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const now = new Date();
        console.log(`🔄 Starting credit reset job at ${now.toISOString()}`);

        // Find all subscriptions past their period end
        const expiredSubscriptions = await prisma.userSubscription.findMany({
            where: {
                currentPeriodEnd: {
                    lte: now,
                },
                status: "ACTIVE", // Only reset for active subscriptions
            },
            include: {
                plan: true,
                user: true,
            },
        });

        console.log(`📊 Found ${expiredSubscriptions.length} subscriptions needing reset`);

        let successCount = 0;
        let errorCount = 0;
        const errors: Array<{ userId: string; error: string }> = [];

        for (const subscription of expiredSubscriptions) {
            try {
                // Calculate new period dates
                const newPeriodStart = subscription.currentPeriodEnd;
                const newPeriodEnd = new Date(newPeriodStart);
                newPeriodEnd.setDate(newPeriodEnd.getDate() + 30);

                // Reset credits and update period
                await prisma.userSubscription.update({
                    where: { id: subscription.id },
                    data: {
                        monthlyCreditsUsed: 0,
                        periodCreditsReset: now,
                        currentPeriodStart: newPeriodStart,
                        currentPeriodEnd: newPeriodEnd,
                    },
                });

                console.log(
                    `✅ Reset credits for user ${subscription.user.email} (${subscription.plan.name})`
                );
                successCount++;
            } catch (error) {
                console.error(
                    `❌ Failed to reset credits for user ${subscription.userId}:`,
                    error
                );
                errors.push({
                    userId: subscription.userId,
                    error: error instanceof Error ? error.message : "Unknown error",
                });
                errorCount++;
            }
        }

        // Log summary
        console.log(`✅ Credit reset complete: ${successCount} success, ${errorCount} errors`);

        return NextResponse.json({
            success: true,
            timestamp: now.toISOString(),
            stats: {
                totalFound: expiredSubscriptions.length,
                successCount,
                errorCount,
            },
            errors: errors.length > 0 ? errors : undefined,
        });
    } catch (error) {
        console.error("❌ Credit reset job failed:", error);
        return NextResponse.json(
            {
                success: false,
                error: "Credit reset failed",
                details: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}
