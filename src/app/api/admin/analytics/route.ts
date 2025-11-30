/**
 * Admin Analytics API
 *
 * GET /api/admin/analytics - Get detailed analytics data with trends
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/get-session";
import { isAdmin } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const hasAdminRole = await isAdmin(session.user.id);
        if (!hasAdminRole) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const period = searchParams.get("period") || "30d";

        // Calculate date ranges
        const now = new Date();
        let daysBack = 30;
        switch (period) {
            case "7d":
                daysBack = 7;
                break;
            case "30d":
                daysBack = 30;
                break;
            case "90d":
                daysBack = 90;
                break;
            case "365d":
                daysBack = 365;
                break;
        }

        const startDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);
        const previousStartDate = new Date(startDate.getTime() - daysBack * 24 * 60 * 60 * 1000);

        // Get user growth data
        const users = await prisma.user.findMany({
            where: {
                createdAt: { gte: startDate },
                deletedAt: null,
            },
            select: { createdAt: true },
            orderBy: { createdAt: "asc" },
        });

        // Group users by date
        const userGrowthMap = new Map<string, number>();
        users.forEach((user) => {
            const date = user.createdAt.toISOString().split("T")[0];
            userGrowthMap.set(date, (userGrowthMap.get(date) || 0) + 1);
        });

        // Generate all dates in range
        const userGrowth: { date: string; count: number; cumulative: number }[] = [];
        let cumulative = 0;
        for (let d = new Date(startDate); d <= now; d.setDate(d.getDate() + 1)) {
            const date = d.toISOString().split("T")[0];
            const count = userGrowthMap.get(date) || 0;
            cumulative += count;
            userGrowth.push({ date, count, cumulative });
        }

        // Get project growth data
        const projects = await prisma.project.findMany({
            where: { createdAt: { gte: startDate } },
            select: { createdAt: true },
            orderBy: { createdAt: "asc" },
        });

        const projectGrowthMap = new Map<string, number>();
        projects.forEach((project) => {
            const date = project.createdAt.toISOString().split("T")[0];
            projectGrowthMap.set(date, (projectGrowthMap.get(date) || 0) + 1);
        });

        const projectGrowth: { date: string; count: number; cumulative: number }[] = [];
        cumulative = 0;
        for (let d = new Date(startDate); d <= now; d.setDate(d.getDate() + 1)) {
            const date = d.toISOString().split("T")[0];
            const count = projectGrowthMap.get(date) || 0;
            cumulative += count;
            projectGrowth.push({ date, count, cumulative });
        }

        // Get revenue data
        const transactions = await prisma.paymentTransaction.findMany({
            where: {
                createdAt: { gte: startDate },
                status: "completed",
            },
            select: { amount: true, createdAt: true },
            orderBy: { createdAt: "asc" },
        });

        const revenueMap = new Map<string, { amount: number; transactions: number }>();
        transactions.forEach((tx) => {
            const date = tx.createdAt.toISOString().split("T")[0];
            const existing = revenueMap.get(date) || { amount: 0, transactions: 0 };
            revenueMap.set(date, {
                amount: existing.amount + tx.amount,
                transactions: existing.transactions + 1,
            });
        });

        const revenue: { date: string; amount: number; transactions: number }[] = [];
        for (let d = new Date(startDate); d <= now; d.setDate(d.getDate() + 1)) {
            const date = d.toISOString().split("T")[0];
            const data = revenueMap.get(date) || { amount: 0, transactions: 0 };
            revenue.push({ date, ...data });
        }

        // Get AI usage data
        const aiUsage = await prisma.aICreditUsage.findMany({
            where: { createdAt: { gte: startDate } },
            select: {
                createdAt: true,
                providerCostUsd: true,
                totalTokens: true,
            },
            orderBy: { createdAt: "asc" },
        });

        const aiUsageMap = new Map<string, { calls: number; cost: number; tokens: number }>();
        aiUsage.forEach((usage) => {
            const date = usage.createdAt.toISOString().split("T")[0];
            const existing = aiUsageMap.get(date) || { calls: 0, cost: 0, tokens: 0 };
            aiUsageMap.set(date, {
                calls: existing.calls + 1,
                cost: existing.cost + usage.providerCostUsd,
                tokens: existing.tokens + usage.totalTokens,
            });
        });

        const aiUsageData: { date: string; calls: number; cost: number; tokens: number }[] = [];
        for (let d = new Date(startDate); d <= now; d.setDate(d.getDate() + 1)) {
            const date = d.toISOString().split("T")[0];
            const data = aiUsageMap.get(date) || { calls: 0, cost: 0, tokens: 0 };
            aiUsageData.push({ date, ...data });
        }

        // Get top models
        const modelUsage = await prisma.aICreditUsage.groupBy({
            by: ["model"],
            where: { createdAt: { gte: startDate } },
            _count: { id: true },
            _sum: { providerCostUsd: true },
            orderBy: { _count: { id: "desc" } },
            take: 10,
        });

        const topModels = modelUsage.map((m) => ({
            model: m.model,
            calls: m._count.id,
            cost: m._sum.providerCostUsd || 0,
        }));

        // Calculate summary with comparison
        const [
            totalUsers,
            previousUsers,
            totalProjects,
            previousProjects,
            currentRevenue,
            previousRevenue,
            currentAiCalls,
            previousAiCalls,
        ] = await Promise.all([
            prisma.user.count({ where: { deletedAt: null } }),
            prisma.user.count({
                where: {
                    createdAt: { gte: previousStartDate, lt: startDate },
                    deletedAt: null,
                },
            }),
            prisma.project.count(),
            prisma.project.count({
                where: { createdAt: { gte: previousStartDate, lt: startDate } },
            }),
            prisma.paymentTransaction.aggregate({
                where: { createdAt: { gte: startDate }, status: "completed" },
                _sum: { amount: true },
            }),
            prisma.paymentTransaction.aggregate({
                where: {
                    createdAt: { gte: previousStartDate, lt: startDate },
                    status: "completed",
                },
                _sum: { amount: true },
            }),
            prisma.aICreditUsage.count({
                where: { createdAt: { gte: startDate } },
            }),
            prisma.aICreditUsage.count({
                where: { createdAt: { gte: previousStartDate, lt: startDate } },
            }),
        ]);

        const newUsersThisPeriod = users.length;
        const newUsersChange = previousUsers > 0
            ? ((newUsersThisPeriod - previousUsers) / previousUsers) * 100
            : newUsersThisPeriod > 0 ? 100 : 0;

        const newProjectsThisPeriod = projects.length;
        const newProjectsChange = previousProjects > 0
            ? ((newProjectsThisPeriod - previousProjects) / previousProjects) * 100
            : newProjectsThisPeriod > 0 ? 100 : 0;

        const currentRevenueTotal = currentRevenue._sum.amount || 0;
        const previousRevenueTotal = previousRevenue._sum.amount || 0;
        const revenueChange = previousRevenueTotal > 0
            ? ((currentRevenueTotal - previousRevenueTotal) / previousRevenueTotal) * 100
            : currentRevenueTotal > 0 ? 100 : 0;

        const aiCallsChange = previousAiCalls > 0
            ? ((currentAiCalls - previousAiCalls) / previousAiCalls) * 100
            : currentAiCalls > 0 ? 100 : 0;

        return NextResponse.json({
            userGrowth,
            projectGrowth,
            revenue,
            aiUsage: aiUsageData,
            topModels,
            summary: {
                totalUsers,
                newUsersChange,
                totalProjects,
                newProjectsChange,
                totalRevenue: currentRevenueTotal,
                revenueChange,
                totalAiCalls: currentAiCalls,
                aiCallsChange,
            },
        });
    } catch (error) {
        console.error("Error fetching analytics:", error);
        return NextResponse.json(
            { error: "Failed to fetch analytics" },
            { status: 500 }
        );
    }
}
