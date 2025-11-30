/**
 * Admin User Detail API
 *
 * Get detailed user information including sessions
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";

/**
 * GET /api/admin/users/[userId]
 * Get detailed user info
 */
export async function GET(
    request: NextRequest,
    context: { params: Promise<{ userId: string }> }
) {
    const adminCheck = await requireAdmin(request);
    if (adminCheck) return adminCheck;

    const { userId } = await context.params;

    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            sessions: {
                orderBy: { createdAt: "desc" },
                take: 10,
            },
            projects: {
                orderBy: { updatedAt: "desc" },
                take: 10,
                select: {
                    id: true,
                    name: true,
                    status: true,
                    createdAt: true,
                    updatedAt: true,
                },
            },
            subscription: {
                include: {
                    plan: true,
                },
            },
            balanceTransactions: {
                orderBy: { createdAt: "desc" },
                take: 20,
            },
            _count: {
                select: {
                    projects: true,
                    sessions: true,
                    paymentTransactions: true,
                },
            },
        },
    });

    if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get AI usage stats
    const aiUsageStats = await prisma.aICreditUsage.aggregate({
        where: { userId },
        _sum: {
            inputTokens: true,
            outputTokens: true,
            providerCostUsd: true,
        },
        _count: true,
    });

    return NextResponse.json({
        user,
        stats: {
            totalAiCalls: aiUsageStats._count,
            totalInputTokens: aiUsageStats._sum.inputTokens || 0,
            totalOutputTokens: aiUsageStats._sum.outputTokens || 0,
            totalAiCost: aiUsageStats._sum.providerCostUsd || 0,
        },
    });
}

/**
 * DELETE /api/admin/users/[userId]
 * Soft delete a user
 */
export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ userId: string }> }
) {
    const adminCheck = await requireAdmin(request);
    if (adminCheck) return adminCheck;

    const { userId } = await context.params;

    // Soft delete the user
    await prisma.user.update({
        where: { id: userId },
        data: {
            deletedAt: new Date(),
            deletionScheduledAt: new Date(),
        },
    });

    return NextResponse.json({ success: true });
}
