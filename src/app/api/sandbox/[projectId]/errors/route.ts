import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import { prisma } from "@/lib/db";

/**
 * POST /api/sandbox/[projectId]/errors
 * 
 * Report compilation or runtime errors from the preview sandbox.
 * This triggers the AI agent to automatically fix the errors.
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ projectId: string }> }
) {
    try {
        const session = await getSession();
        if (!session?.user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { projectId } = await params;
        const body = await request.json();
        const { errorType, errorMessage, errorStack, logs } = body;

        // Verify project ownership
        const project = await prisma.project.findFirst({
            where: {
                id: projectId,
                userId: session.user.id,
            },
            select: {
                id: true,
                name: true,
                codeFiles: true,
            },
        });

        if (!project) {
            return NextResponse.json(
                { error: "Project not found or access denied" },
                { status: 404 }
            );
        }

        console.log(`🚨 Error reported for project ${projectId}:`, {
            type: errorType,
            message: errorMessage,
        });

        // Format error message for the agent
        const errorContext = [
            `## Preview Error Detected`,
            ``,
            `**Error Type:** ${errorType}`,
            `**Error Message:**`,
            `\`\`\``,
            errorMessage,
            `\`\`\``,
        ];

        if (errorStack) {
            errorContext.push(``, `**Stack Trace:**`, `\`\`\``, errorStack, `\`\`\``);
        }

        if (logs) {
            errorContext.push(``, `**Recent Logs:**`, `\`\`\``, logs, `\`\`\``);
        }

        errorContext.push(
            ``,
            `Please analyze the error and fix the code. Use \`getLogs()\` to see more details if needed.`
        );

        const errorMessageText = errorContext.join('\n');

        // Create a user message to trigger the agent
        const chatMessage = await prisma.chatMessage.create({
            data: {
                projectId: projectId,
                role: "user",
                content: errorMessageText,
            },
        });

        console.log(`📨 Auto-created error report message ${chatMessage.id} for project ${projectId}`);

        // Note: The frontend should poll for new messages or use SSE to detect this new message
        // and automatically trigger the AI agent to respond

        return NextResponse.json({
            success: true,
            messageId: chatMessage.id,
            message: "Error reported - agent should be triggered to fix automatically",
            shouldTriggerAgent: true, // Signal to frontend to trigger agent
        });
    } catch (error) {
        console.error("❌ Failed to report error:", error);
        return NextResponse.json(
            {
                error: "Failed to report error",
                message: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}
