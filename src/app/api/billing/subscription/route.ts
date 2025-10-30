/**
 * API Route: Get User Subscription
 * GET /api/billing/subscription
 * 
 * Returns the user's current subscription plan, status, and billing details
 */

import { NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import { prisma } from "@/lib/db";

export async function GET() {
    try {
        const session = await getSession();

        if (!session?.user?.email) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Get user with subscription and plan details
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

        // If no subscription exists, create a default HOBBY plan
        if (!user.subscription) {
            const hobbyPlan = await prisma.plan.findUnique({
                where: { name: "HOBBY" },
            });

            if (!hobbyPlan) {
                return NextResponse.json(
                    { error: "Default plan not found" },
                    { status: 500 }
                );
            }

            // Create subscription with HOBBY plan
            const subscription = await prisma.userSubscription.create({
                data: {
                    userId: user.id,
                    planId: hobbyPlan.id,
                    status: "active",
                    currentPeriodStart: new Date(),
                    currentPeriodEnd: new Date(
                        new Date().setMonth(new Date().getMonth() + 1)
                    ),
                },
                include: {
                    plan: true,
                },
            });

            // Calculate credit balance for new subscription
            const now = new Date();
            const resetTime = new Date(subscription.lastCreditReset);
            resetTime.setDate(resetTime.getDate() + 1);

            const hoursUntilReset = Math.max(
                0,
                Math.ceil((resetTime.getTime() - now.getTime()) / (1000 * 60 * 60))
            );

            const dailyCreditsUsed = Number(subscription.dailyCreditsUsed);
            const dailyCreditsLimit = subscription.plan.dailyCredits || 0;
            const dailyCreditsRemaining = Math.max(0, dailyCreditsLimit - dailyCreditsUsed);

            return NextResponse.json({
                plan: {
                    name: subscription.plan.name,
                    displayName: subscription.plan.displayName,
                    priceMonthlyUsd: subscription.plan.priceMonthlyUsd,
                    maxProjects: subscription.plan.maxProjects,
                    dailyCredits: subscription.plan.dailyCredits,
                    monthlyCredits: subscription.plan.monthlyCredits,
                    features: subscription.plan.features,
                },
                status: subscription.status,
                currentPeriodStart: subscription.currentPeriodStart,
                currentPeriodEnd: subscription.currentPeriodEnd,
                cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
                daily: {
                    limit: dailyCreditsLimit,
                    used: dailyCreditsUsed,
                    remaining: dailyCreditsRemaining,
                    resetTime: resetTime,
                    hoursUntilReset: hoursUntilReset,
                },
            });
        }

        // Calculate credit balance
        const now = new Date();
        const resetTime = new Date(user.subscription.lastCreditReset);
        resetTime.setDate(resetTime.getDate() + 1);

        const hoursUntilReset = Math.max(
            0,
            Math.ceil((resetTime.getTime() - now.getTime()) / (1000 * 60 * 60))
        );

        const dailyCreditsUsed = Number(user.subscription.dailyCreditsUsed);
        const dailyCreditsLimit = user.subscription.plan.dailyCredits || 0;
        const dailyCreditsRemaining = Math.max(0, dailyCreditsLimit - dailyCreditsUsed);

        return NextResponse.json({
            plan: {
                name: user.subscription.plan.name,
                displayName: user.subscription.plan.displayName,
                priceMonthlyUsd: user.subscription.plan.priceMonthlyUsd,
                maxProjects: user.subscription.plan.maxProjects,
                dailyCredits: user.subscription.plan.dailyCredits,
                monthlyCredits: user.subscription.plan.monthlyCredits,
                features: user.subscription.plan.features,
            },
            status: user.subscription.status,
            currentPeriodStart: user.subscription.currentPeriodStart,
            currentPeriodEnd: user.subscription.currentPeriodEnd,
            cancelAtPeriodEnd: user.subscription.cancelAtPeriodEnd,
            daily: {
                limit: dailyCreditsLimit,
                used: dailyCreditsUsed,
                remaining: dailyCreditsRemaining,
                resetTime: resetTime,
                hoursUntilReset: hoursUntilReset,
            },
        });
    } catch (error) {
        console.error("Error fetching subscription:", error);
        return NextResponse.json(
            { error: "Failed to fetch subscription details" },
            { status: 500 }
        );
    }
}
