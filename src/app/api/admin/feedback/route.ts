/**
 * Admin Feedback API
 *
 * GET /api/admin/feedback - List feedback with filtering
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
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "20");
        const sentiment = searchParams.get("sentiment");

        const where: Record<string, unknown> = {};
        if (sentiment && sentiment !== "all") {
            where.sentiment = sentiment;
        }

        const [feedback, total, stats] = await Promise.all([
            prisma.feedback.findMany({
                where,
                orderBy: { createdAt: "desc" },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.feedback.count({ where }),
            prisma.feedback.groupBy({
                by: ["sentiment"],
                _count: { id: true },
            }),
        ]);

        const statsSummary = {
            total,
            positive: stats.find((s) => s.sentiment === "positive")?._count.id || 0,
            negative: stats.find((s) => s.sentiment === "negative")?._count.id || 0,
            neutral: stats.find((s) => s.sentiment === "neutral" || s.sentiment === null)?._count.id || 0,
        };

        return NextResponse.json({
            feedback,
            stats: statsSummary,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("Error fetching feedback:", error);
        return NextResponse.json(
            { error: "Failed to fetch feedback" },
            { status: 500 }
        );
    }
}
