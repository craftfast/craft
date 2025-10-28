/**
 * API Route: Get Daily Credit Balance
 * GET /api/billing/token-balance
 * 
 * Returns user's current daily credit balance and usage statistics
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

        // Check if credits need to be reset (new day)
        const now = new Date();
        const lastReset = new Date(subscription.lastCreditReset);

        const isNewDay =
            now.getUTCFullYear() !== lastReset.getUTCFullYear() ||
            now.getUTCMonth() !== lastReset.getUTCMonth() ||
            now.getUTCDate() !== lastReset.getUTCDate();

        let dailyCreditsUsed = subscription.dailyCreditsUsed;
        let lastCreditReset = subscription.lastCreditReset;

        if (isNewDay) {
            // Reset daily credits
            await prisma.userSubscription.update({
                where: { userId: user.id },
                data: {
                    dailyCreditsUsed: 0,
                    lastCreditReset: now,
                },
            });
            dailyCreditsUsed = 0;
            lastCreditReset = now;
        }

        // Get daily credit limit from plan
        const dailyCreditsLimit = plan.dailyCredits || 1; // Default to 1 for Hobby
        const creditsRemaining = Math.max(0, dailyCreditsLimit - dailyCreditsUsed);

        // Calculate hours until next reset (midnight UTC)
        const tomorrow = new Date(now);
        tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
        tomorrow.setUTCHours(0, 0, 0, 0);
        const hoursUntilReset = Math.ceil(
            (tomorrow.getTime() - now.getTime()) / (1000 * 60 * 60)
        );

        return NextResponse.json({
            daily: {
                limit: dailyCreditsLimit,
                used: dailyCreditsUsed,
                remaining: creditsRemaining,
                resetTime: tomorrow,
                hoursUntilReset,
            },
            plan: {
                name: plan.name,
                displayName: plan.displayName,
                dailyCredits: plan.dailyCredits,
                monthlyCredits: plan.monthlyCredits,
            },
        });
    } catch (error) {
        console.error("Error fetching credit balance:", error);
        return NextResponse.json(
            { error: "Failed to fetch credit balance" },
            { status: 500 }
        );
    }
}
