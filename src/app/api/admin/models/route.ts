/**
 * Admin AI Models API
 *
 * API routes for viewing AI model configuration and usage stats
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { AVAILABLE_MODELS, getAvailableCodingModels } from "@/lib/models/config";

/**
 * GET /api/admin/models
 * Get all AI models with usage statistics
 */
export async function GET(request: NextRequest) {
    const adminCheck = await requireAdmin(request);
    if (adminCheck) return adminCheck;

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "30d"; // 1d, 7d, 30d, all

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

    // Get usage stats per model
    const usageStats = await prisma.aICreditUsage.groupBy({
        by: ["model"],
        where: startDate ? { createdAt: { gte: startDate } } : undefined,
        _sum: {
            inputTokens: true,
            outputTokens: true,
            totalTokens: true,
            providerCostUsd: true,
        },
        _count: true,
    });

    // Get user preferences for models
    const modelPreferences = await prisma.user.groupBy({
        by: ["preferredCodingModel"],
        where: {
            preferredCodingModel: { not: null },
            deletedAt: null,
        },
        _count: true,
    });

    // Build model stats
    const modelStats = Object.entries(AVAILABLE_MODELS).map(([id, config]) => {
        const usage = usageStats.find((u) => u.model === id) || {
            _count: 0,
            _sum: {
                inputTokens: 0,
                outputTokens: 0,
                totalTokens: 0,
                providerCostUsd: 0,
            },
        };

        const preference = modelPreferences.find(
            (p) => p.preferredCodingModel === id
        ) || { _count: 0 };

        return {
            ...config,
            id,
            stats: {
                totalCalls: usage._count,
                inputTokens: usage._sum.inputTokens || 0,
                outputTokens: usage._sum.outputTokens || 0,
                totalTokens: usage._sum.totalTokens || 0,
                totalCost: usage._sum.providerCostUsd || 0,
                usersPreferring: preference._count,
            },
        };
    });

    // Calculate totals
    const totals = {
        totalCalls: usageStats.reduce((sum, s) => sum + s._count, 0),
        totalInputTokens: usageStats.reduce(
            (sum, s) => sum + (s._sum.inputTokens || 0),
            0
        ),
        totalOutputTokens: usageStats.reduce(
            (sum, s) => sum + (s._sum.outputTokens || 0),
            0
        ),
        totalCost: usageStats.reduce(
            (sum, s) => sum + (s._sum.providerCostUsd || 0),
            0
        ),
    };

    return NextResponse.json({
        models: modelStats,
        totals,
        period,
    });
}
