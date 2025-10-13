import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getTeamAIUsage } from "@/lib/ai-usage";

// GET /api/token-usage?teamId=xxx&period=current - Get token usage for team
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const teamId = req.nextUrl.searchParams.get("teamId");

        if (!teamId) {
            return NextResponse.json(
                { error: "Missing teamId parameter" },
                { status: 400 }
            );
        }

        // Verify user has access to this team
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: {
                teamMembers: {
                    where: { teamId },
                },
            },
        });

        if (!user || user.teamMembers.length === 0) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Get current billing period dates
        const now = new Date();
        const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

        // Get usage data
        const usage = await getTeamAIUsage(teamId, startDate, endDate);

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
