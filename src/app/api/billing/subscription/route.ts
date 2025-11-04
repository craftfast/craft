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
                    status: "ACTIVE",
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
            const periodEnd = new Date(subscription.currentPeriodEnd);
            const daysUntilReset = Math.max(
                0,
                Math.ceil((periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
            );

            const monthlyCreditsUsed = subscription.monthlyCreditsUsed.toNumber(); // Use Decimal.toNumber()
            const monthlyCreditsLimit = subscription.plan.monthlyCredits || 0;
            const monthlyCreditsRemaining = Math.max(0, monthlyCreditsLimit - monthlyCreditsUsed);

            return NextResponse.json({
                plan: {
                    name: subscription.plan.name,
                    displayName: subscription.plan.displayName,
                    priceMonthlyUsd: subscription.plan.priceMonthlyUsd,
                    maxProjects: subscription.plan.maxProjects,
                    monthlyCredits: subscription.plan.monthlyCredits,
                    features: subscription.plan.features,
                },
                status: subscription.status,
                currentPeriodStart: subscription.currentPeriodStart,
                currentPeriodEnd: subscription.currentPeriodEnd,
                cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
                monthly: {
                    limit: monthlyCreditsLimit,
                    used: monthlyCreditsUsed,
                    remaining: monthlyCreditsRemaining,
                    periodEnd: periodEnd,
                    daysUntilReset: daysUntilReset,
                },
            });
        }

        // Calculate credit balance
        const now = new Date();
        const periodEnd = new Date(user.subscription.currentPeriodEnd);
        const daysUntilReset = Math.max(
            0,
            Math.ceil((periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        );

        const monthlyCreditsUsed = user.subscription.monthlyCreditsUsed.toNumber(); // Use Decimal.toNumber()
        const monthlyCreditsLimit = user.subscription.plan.monthlyCredits || 0;
        const monthlyCreditsRemaining = Math.max(0, monthlyCreditsLimit - monthlyCreditsUsed);

        return NextResponse.json({
            plan: {
                name: user.subscription.plan.name,
                displayName: user.subscription.plan.displayName,
                priceMonthlyUsd: user.subscription.plan.priceMonthlyUsd,
                maxProjects: user.subscription.plan.maxProjects,
                monthlyCredits: user.subscription.plan.monthlyCredits,
                features: user.subscription.plan.features,
            },
            status: user.subscription.status,
            currentPeriodStart: user.subscription.currentPeriodStart,
            currentPeriodEnd: user.subscription.currentPeriodEnd,
            cancelAtPeriodEnd: user.subscription.cancelAtPeriodEnd,
            monthly: {
                limit: monthlyCreditsLimit,
                used: monthlyCreditsUsed,
                remaining: monthlyCreditsRemaining,
                periodEnd: periodEnd,
                daysUntilReset: daysUntilReset,
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
