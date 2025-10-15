import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET /api/chat-messages - Get all messages for a project
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const projectId = searchParams.get("projectId");

        if (!projectId) {
            return NextResponse.json(
                { error: "Missing required field: projectId" },
                { status: 400 }
            );
        }

        // Verify project exists and user has access
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const project = await prisma.project.findUnique({
            where: { id: projectId },
        });

        if (!project) {
            return NextResponse.json(
                { error: "Project not found" },
                { status: 404 }
            );
        }

        if (project.userId !== user.id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Get all messages for the project
        const messages = await prisma.chatMessage.findMany({
            where: { projectId },
            orderBy: { createdAt: "asc" },
            include: {
                files: true, // Include associated files
            },
        });

        return NextResponse.json({ messages }, { status: 200 });
    } catch (error) {
        console.error("Error fetching chat messages:", error);
        return NextResponse.json(
            { error: "Failed to fetch chat messages" },
            { status: 500 }
        );
    }
}

// POST /api/chat-messages - Create a new chat message
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { projectId, role, content, fileIds, fileChanges } = await req.json();

        if (!projectId || !role || !content) {
            return NextResponse.json(
                { error: "Missing required fields: projectId, role, content" },
                { status: 400 }
            );
        }

        if (role !== "user" && role !== "assistant") {
            return NextResponse.json(
                { error: "Role must be 'user' or 'assistant'" },
                { status: 400 }
            );
        }

        // Verify project exists and user has access
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const project = await prisma.project.findUnique({
            where: { id: projectId },
        });

        if (!project) {
            return NextResponse.json(
                { error: "Project not found" },
                { status: 404 }
            );
        }

        if (project.userId !== user.id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Create the message
        const message = await prisma.chatMessage.create({
            data: {
                projectId,
                role,
                content,
                fileChanges: fileChanges || undefined,
            },
        });

        // Link files to the message if fileIds provided
        if (fileIds && Array.isArray(fileIds) && fileIds.length > 0) {
            await prisma.file.updateMany({
                where: {
                    id: { in: fileIds },
                    userId: user.id, // Ensure user owns the files
                },
                data: {
                    chatMessageId: message.id,
                },
            });

            console.log(`✅ Linked ${fileIds.length} files to message ${message.id}`);
        }

        return NextResponse.json({ message }, { status: 201 });
    } catch (error) {
        console.error("Chat message creation error:", error);
        return NextResponse.json(
            {
                error: "Failed to create chat message",
                details: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}
