/**
 * Admin Project Detail API
 *
 * Get detailed project information
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";

/**
 * GET /api/admin/projects/[projectId]
 * Get detailed project info
 */
export async function GET(
    request: NextRequest,
    context: { params: Promise<{ projectId: string }> }
) {
    const adminCheck = await requireAdmin(request);
    if (adminCheck) return adminCheck;

    const { projectId } = await context.params;

    const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    image: true,
                },
            },
            chatMessages: {
                orderBy: { createdAt: "desc" },
                take: 50,
                select: {
                    id: true,
                    role: true,
                    content: true,
                    createdAt: true,
                },
            },
            versions: {
                orderBy: { version: "desc" },
                take: 10,
                select: {
                    id: true,
                    version: true,
                    name: true,
                    isBookmarked: true,
                    createdAt: true,
                },
            },
            agentSessions: {
                orderBy: { createdAt: "desc" },
                take: 5,
                select: {
                    id: true,
                    status: true,
                    messageCount: true,
                    createdAt: true,
                    lastActive: true,
                },
            },
            _count: {
                select: {
                    chatMessages: true,
                    versions: true,
                    fileRecords: true,
                },
            },
        },
    });

    if (!project) {
        return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Get AI usage for this project
    const aiUsage = await prisma.aICreditUsage.aggregate({
        where: { projectId },
        _sum: {
            inputTokens: true,
            outputTokens: true,
            providerCostUsd: true,
        },
        _count: true,
    });

    return NextResponse.json({
        project,
        stats: {
            totalAiCalls: aiUsage._count,
            totalInputTokens: aiUsage._sum.inputTokens || 0,
            totalOutputTokens: aiUsage._sum.outputTokens || 0,
            totalAiCost: aiUsage._sum.providerCostUsd || 0,
        },
    });
}
