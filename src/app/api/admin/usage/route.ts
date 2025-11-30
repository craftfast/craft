/**
 * Admin Usage API
 *
 * API routes for system usage statistics
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";

/**
 * GET /api/admin/usage
 * Get system usage statistics
 */
export async function GET(request: NextRequest) {
    const adminCheck = await requireAdmin(request);
    if (adminCheck) return adminCheck;

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "30d";

    // Calculate date range
    const now = new Date();
    let startDate: Date | undefined;

    switch (period) {
        case "1d":
            startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            break;
        case "7d":
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
        case "30d":
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
        case "all":
            startDate = undefined;
            break;
    }

    const where = startDate ? { createdAt: { gte: startDate } } : {};

    // Get AI usage stats
    const [aiUsage, aiUsageByModel, aiUsageByDay] = await Promise.all([
        prisma.aICreditUsage.aggregate({
            where,
            _sum: {
                inputTokens: true,
                outputTokens: true,
                totalTokens: true,
                providerCostUsd: true,
            },
            _count: true,
        }),
        prisma.aICreditUsage.groupBy({
            by: ["model"],
            where,
            _sum: {
                inputTokens: true,
                outputTokens: true,
                providerCostUsd: true,
            },
            _count: true,
            orderBy: { _count: { id: "desc" } },
        }),
        // Daily usage for charts
        prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('day', "createdAt") as date,
        COUNT(*) as calls,
        SUM("providerCostUsd") as cost,
        SUM("totalTokens") as tokens
      FROM "ai_credit_usage"
      ${startDate ? prisma.$queryRaw`WHERE "createdAt" >= ${startDate}` : prisma.$queryRaw``}
      GROUP BY DATE_TRUNC('day', "createdAt")
      ORDER BY date DESC
      LIMIT 30
    `,
    ]);

    // Get sandbox usage
    const sandboxUsage = await prisma.sandboxUsage.aggregate({
        where,
        _sum: {
            durationMin: true,
            providerCostUsd: true,
        },
        _count: true,
    });

    // Get storage usage
    const storageUsage = await prisma.storageUsage.aggregate({
        where: startDate ? { createdAt: { gte: startDate } } : {},
        _sum: {
            providerCostUsd: true,
        },
        _count: true,
    });

    // Get user activity
    const activeUsers = await prisma.user.count({
        where: {
            updatedAt: { gte: startDate || new Date(0) },
            deletedAt: null,
        },
    });

    const newUsers = await prisma.user.count({
        where: {
            createdAt: { gte: startDate || new Date(0) },
            deletedAt: null,
        },
    });

    // Get project activity
    const activeProjects = await prisma.project.count({
        where: {
            updatedAt: { gte: startDate || new Date(0) },
        },
    });

    const newProjects = await prisma.project.count({
        where: {
            createdAt: { gte: startDate || new Date(0) },
        },
    });

    // Get session stats
    const activeSessions = await prisma.session.count({
        where: {
            expiresAt: { gt: new Date() },
        },
    });

    return NextResponse.json({
        ai: {
            totalCalls: aiUsage._count,
            inputTokens: aiUsage._sum.inputTokens || 0,
            outputTokens: aiUsage._sum.outputTokens || 0,
            totalTokens: aiUsage._sum.totalTokens || 0,
            cost: aiUsage._sum.providerCostUsd || 0,
            byModel: aiUsageByModel,
            byDay: aiUsageByDay,
        },
        sandbox: {
            totalSessions: sandboxUsage._count,
            totalMinutes: sandboxUsage._sum.durationMin || 0,
            cost: sandboxUsage._sum.providerCostUsd || 0,
        },
        storage: {
            totalOperations: storageUsage._count,
            cost: storageUsage._sum.providerCostUsd || 0,
        },
        users: {
            active: activeUsers,
            new: newUsers,
        },
        projects: {
            active: activeProjects,
            new: newProjects,
        },
        sessions: {
            active: activeSessions,
        },
        period,
    });
}
