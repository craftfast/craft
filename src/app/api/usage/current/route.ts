import { NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import { prisma } from "@/lib/db";
import { getUserAIUsageInRange } from "@/lib/ai-usage";

export async function GET() {
    try {
        const session = await getSession();

        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get user from database
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: {
                id: true,
                accountBalance: true,
            },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Get AI usage for current month
        const now = new Date();
        const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        const aiUsage = await getUserAIUsageInRange(user.id, startDate, endDate);

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

            // Balance (pay-as-you-go system)
            balance: {
                current: Number(user.accountBalance),
                formatted: `$${Number(user.accountBalance).toFixed(2)}`,
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
