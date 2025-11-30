/**
 * Admin Project Debug API
 *
 * GET /api/admin/projects/[projectId]/debug
 * 
 * Full project debugging info including:
 * - Complete chat history
 * - All AI usage records
 * - Agent sessions with details
 * - Task execution history
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ projectId: string }> }
) {
    const adminCheck = await requireAdmin(request);
    if (adminCheck) return adminCheck;

    const { projectId } = await context.params;

    try {
        // Get project with user info
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            select: {
                id: true,
                name: true,
                description: true,
                status: true,
                version: true,
                sandboxId: true,
                createdAt: true,
                updatedAt: true,
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        image: true,
                    },
                },
            },
        });

        if (!project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        // Get ALL chat messages (not limited)
        const chatMessages = await prisma.chatMessage.findMany({
            where: { projectId },
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                role: true,
                content: true,
                createdAt: true,
                toolCalls: true,
                fileChanges: true,
            },
        });

        // Get agent sessions
        const agentSessions = await prisma.agentSession.findMany({
            where: { projectId },
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                status: true,
                messageCount: true,
                createdAt: true,
                lastActive: true,
            },
        });

        // Get AI usage records
        const aiUsage = await prisma.aICreditUsage.findMany({
            where: { projectId },
            orderBy: { createdAt: "desc" },
            take: 500, // Last 500 API calls
            select: {
                id: true,
                model: true,
                inputTokens: true,
                outputTokens: true,
                totalTokens: true,
                providerCostUsd: true,
                callType: true,
                createdAt: true,
            },
        });

        // Get tasks
        const tasks = await prisma.task.findMany({
            where: { projectId },
            orderBy: { createdAt: "desc" },
            take: 100,
            select: {
                id: true,
                phase: true,
                description: true,
                status: true,
                result: true,
                errorMessage: true,
                createdAt: true,
                completedAt: true,
            },
        });

        // Calculate stats
        const userMessages = chatMessages.filter(m => m.role === "user").length;
        const assistantMessages = chatMessages.filter(m => m.role === "assistant").length;
        const totalAiCalls = aiUsage.length;
        const totalInputTokens = aiUsage.reduce((sum, u) => sum + u.inputTokens, 0);
        const totalOutputTokens = aiUsage.reduce((sum, u) => sum + u.outputTokens, 0);
        const totalCost = aiUsage.reduce((sum, u) => sum + u.providerCostUsd, 0);

        const stats = {
            totalMessages: chatMessages.length,
            userMessages,
            assistantMessages,
            totalAiCalls,
            totalInputTokens,
            totalOutputTokens,
            totalCost,
            avgTokensPerMessage: assistantMessages > 0
                ? Math.round((totalInputTokens + totalOutputTokens) / assistantMessages)
                : 0,
            avgCostPerMessage: assistantMessages > 0
                ? totalCost / assistantMessages
                : 0,
        };

        return NextResponse.json({
            project,
            chatMessages,
            agentSessions,
            aiUsage,
            tasks,
            stats,
        });
    } catch (error) {
        console.error("Error fetching project debug data:", error);
        return NextResponse.json(
            { error: "Failed to fetch project data" },
            { status: 500 }
        );
    }
}
