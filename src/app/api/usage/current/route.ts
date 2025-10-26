import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getCurrentPeriodAIUsage } from "@/lib/ai-usage";
import { getCurrentUsageRecord } from "@/lib/usage-tracking";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get user from database
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
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Get AI usage for current period
        const aiUsage = await getCurrentPeriodAIUsage(user.id);

        // Get usage record for current period
        const usageRecord = await getCurrentUsageRecord(user.id);

        // Get subscription details
        const subscription = user.subscription;
        const plan = subscription?.plan;

        // Get project count
        const projectCount = await prisma.project.count({
            where: { userId: user.id },
        });

        return NextResponse.json({
            // AI Usage
            aiUsage: {
                totalTokens: aiUsage.totalTokens,
                totalCostUsd: aiUsage.totalCostUsd,
                byModel: aiUsage.byModel,
            },

            // Subscription & Limits
            subscription: {
                planName: plan?.name || "HOBBY",
                status: subscription?.status || "active",
                currentPeriodStart: subscription?.currentPeriodStart,
                currentPeriodEnd: subscription?.currentPeriodEnd,
            },

            // Project Count
            projectCount,
        });
    } catch (error) {
        console.error("Error fetching usage:", error);
        return NextResponse.json(
            { error: "Failed to fetch usage data" },
            { status: 500 }
        );
    }
}
