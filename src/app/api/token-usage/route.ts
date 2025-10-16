import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getUserAIUsageInRange } from "@/lib/ai-usage";

// GET /api/token-usage?period=current - Get token usage for authenticated user
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get the authenticated user
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Get current billing period dates
        const now = new Date();
        const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

        // Get usage data for this user
        const usage = await getUserAIUsageInRange(user.id, startDate, endDate);

        return NextResponse.json({
            period: {
                start: startDate.toISOString(),
                end: endDate.toISOString(),
            },
            usage: {
                totalTokens: usage.totalTokens,
                totalCostUsd: usage.totalCostUsd,
                byModel: usage.byModel,
            },
        });
    } catch (error) {
        console.error("Token usage fetch error:", error);
        return NextResponse.json(
            {
                error: "Failed to fetch token usage",
                details: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}
