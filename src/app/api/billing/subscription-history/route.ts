/**
 * API Route: Get User Subscription History
 * GET /api/billing/subscription-history
 * 
 * Returns all subscription records for the user
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

        // Get current subscription with plan details
        const currentSubscription = await prisma.userSubscription.findUnique({
            where: { userId: user.id },
            include: {
                plan: true,
            },
        });

        // Get all usage records (historical billing periods)
        const usageRecords = await prisma.usageRecord.findMany({
            where: { userId: user.id },
            orderBy: { billingPeriodStart: 'desc' },
            take: 12, // Last 12 billing periods
        });

        // Get all invoices
        const invoices = await prisma.invoice.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' },
            take: 12,
        });

        return NextResponse.json({
            currentSubscription: currentSubscription ? {
                id: currentSubscription.id,
                planName: currentSubscription.plan.name,
                planDisplayName: currentSubscription.plan.displayName,
                status: currentSubscription.status,
                currentPeriodStart: currentSubscription.currentPeriodStart,
                currentPeriodEnd: currentSubscription.currentPeriodEnd,
                cancelAtPeriodEnd: currentSubscription.cancelAtPeriodEnd,
                cancelledAt: currentSubscription.cancelledAt,
                createdAt: currentSubscription.createdAt,
                priceMonthlyUsd: currentSubscription.plan.priceMonthlyUsd,
            } : null,
            usageRecords: usageRecords.map(record => ({
                id: record.id,
                billingPeriodStart: record.billingPeriodStart,
                billingPeriodEnd: record.billingPeriodEnd,
                aiCostUsd: record.aiCostUsd,
                totalCostUsd: record.totalCostUsd,
                createdAt: record.createdAt,
            })),
            invoices: invoices.map(invoice => ({
                id: invoice.id,
                invoiceNumber: invoice.invoiceNumber,
                status: invoice.status,
                billingPeriodStart: invoice.billingPeriodStart,
                billingPeriodEnd: invoice.billingPeriodEnd,
                subscriptionFeeUsd: invoice.subscriptionFeeUsd,
                aiUsageCostUsd: invoice.aiUsageCostUsd,
                totalUsd: invoice.totalUsd,
                paidAt: invoice.paidAt,
                createdAt: invoice.createdAt,
            })),
        });
    } catch (error) {
        console.error("Error fetching subscription history:", error);
        return NextResponse.json(
            { error: "Failed to fetch subscription history" },
            { status: 500 }
        );
    }
}
