/**
 * Admin Billing API
 *
 * API routes for billing and payment management
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";

/**
 * GET /api/admin/billing
 * Get billing overview and recent transactions
 */
export async function GET(request: NextRequest) {
    const adminCheck = await requireAdmin(request);
    if (adminCheck) return adminCheck;

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "30d";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

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

    // Get transactions
    const where = startDate ? { createdAt: { gte: startDate } } : {};

    const [transactions, total, stats] = await Promise.all([
        prisma.paymentTransaction.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip: (page - 1) * limit,
            take: limit,
            include: {
                user: {
                    select: { id: true, name: true, email: true },
                },
            },
        }),
        prisma.paymentTransaction.count({ where }),
        prisma.paymentTransaction.aggregate({
            where: { ...where, status: "completed" },
            _sum: { amount: true, taxAmount: true },
            _count: true,
        }),
    ]);

    // Get balance top-ups
    const balanceTopups = await prisma.balanceTransaction.aggregate({
        where: {
            type: "TOPUP",
            ...(startDate ? { createdAt: { gte: startDate } } : {}),
        },
        _sum: { amount: true },
        _count: true,
    });

    // Get AI usage costs
    const aiUsageCosts = await prisma.aICreditUsage.aggregate({
        where: startDate ? { createdAt: { gte: startDate } } : {},
        _sum: { providerCostUsd: true },
        _count: true,
    });

    return NextResponse.json({
        transactions,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
        stats: {
            totalRevenue: stats._sum.amount || 0,
            totalTax: stats._sum.taxAmount || 0,
            completedTransactions: stats._count,
            totalTopups: balanceTopups._count,
            topupAmount: Number(balanceTopups._sum.amount) || 0,
            aiUsageCalls: aiUsageCosts._count,
            aiUsageCost: aiUsageCosts._sum.providerCostUsd || 0,
        },
    });
}
