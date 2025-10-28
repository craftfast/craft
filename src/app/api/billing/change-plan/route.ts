/**
 * API Route: Change Plan
 * POST /api/billing/change-plan
 * 
 * Handles plan upgrades and downgrades (HOBBY <-> PRO <-> ENTERPRISE)
 * For upgrades to paid plans, redirects to Polar checkout
 * For downgrades, schedules change at end of current billing period
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

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
        const { targetPlan } = body; // "HOBBY" | "PRO" | "ENTERPRISE"

        if (!["HOBBY", "PRO", "ENTERPRISE"].includes(targetPlan)) {
            return NextResponse.json(
                { error: "Invalid plan" },
                { status: 400 }
            );
        }

        // Get user and current subscription
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

        const currentPlan = user.subscription?.plan?.name || "HOBBY";

        // Check if user is already on the target plan
        if (currentPlan === targetPlan) {
            return NextResponse.json(
                { error: `You are already on the ${targetPlan} plan` },
                { status: 400 }
            );
        }

        // Get target plan details
        const targetPlanDetails = await prisma.plan.findUnique({
            where: { name: targetPlan },
        });

        if (!targetPlanDetails) {
            return NextResponse.json(
                { error: "Target plan not found" },
                { status: 404 }
            );
        }

        // UPGRADE FLOW: User wants a paid plan (PRO or ENTERPRISE)
        if (targetPlan === "PRO" || targetPlan === "ENTERPRISE") {
            // Enterprise plans require contacting sales
            if (targetPlan === "ENTERPRISE") {
                return NextResponse.json(
                    { error: "Enterprise plans require contacting sales. Please email sales@craft.fast" },
                    { status: 400 }
                );
            }

            // Get Polar price ID from environment for Pro plan
            const polarPriceId = process.env.POLAR_PRO_PRICE_ID;

            if (!polarPriceId) {
                console.error(`Missing Polar price ID for ${targetPlan}`);
                return NextResponse.json(
                    { error: "Payment configuration error. Please contact support." },
                    { status: 500 }
                );
            }

            // Build checkout URL
            const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
            const checkoutUrl = new URL("/api/checkout", baseUrl);

            checkoutUrl.searchParams.set("products", polarPriceId);
            checkoutUrl.searchParams.set("customerEmail", user.email || '');
            checkoutUrl.searchParams.set("metadata[userId]", user.id);
            checkoutUrl.searchParams.set("metadata[purchaseType]", "subscription");
            checkoutUrl.searchParams.set("metadata[planName]", targetPlan);
            checkoutUrl.searchParams.set("metadata[billingPeriod]", "MONTHLY");

            return NextResponse.json({
                action: "redirect",
                checkoutUrl: checkoutUrl.toString(),
                targetPlan,
                price: targetPlanDetails.priceMonthlyUsd,
            });
        }

        // DOWNGRADE FLOW: User wants to downgrade to HOBBY (free)
        if (targetPlan === "HOBBY") {
            // Schedule downgrade at end of current billing period
            if (!user.subscription) {
                return NextResponse.json(
                    { error: "No active subscription found" },
                    { status: 400 }
                );
            }

            await prisma.userSubscription.update({
                where: { id: user.subscription.id },
                data: {
                    cancelAtPeriodEnd: true,
                    cancelledAt: new Date(),
                },
            });

            return NextResponse.json({
                action: "scheduled_downgrade",
                message: `Your plan will change to ${targetPlanDetails.displayName} at the end of your current billing period`,
                effectiveDate: user.subscription.currentPeriodEnd,
                targetPlan,
            });
        }

        return NextResponse.json(
            { error: "Invalid plan change request" },
            { status: 400 }
        );
    } catch (error) {
        console.error("Error changing plan:", error);
        return NextResponse.json(
            { error: "Failed to process plan change" },
            { status: 500 }
        );
    }
}
