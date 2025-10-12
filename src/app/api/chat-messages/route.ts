import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// POST /api/chat-messages - Create a new chat message
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { chatSessionId, role, content } = await req.json();

        if (!chatSessionId || !role || !content) {
            return NextResponse.json(
                { error: "Missing required fields: chatSessionId, role, content" },
                { status: 400 }
            );
        }

        if (role !== "user" && role !== "assistant") {
            return NextResponse.json(
                { error: "Role must be 'user' or 'assistant'" },
                { status: 400 }
            );
        }

        // Verify chat session exists and user has access
        const chatSession = await prisma.chatSession.findUnique({
            where: { id: chatSessionId },
            include: {
                project: {
                    select: {
                        userId: true,
                    },
                },
            },
        });

        if (!chatSession) {
            return NextResponse.json(
                { error: "Chat session not found" },
                { status: 404 }
            );
        }

        // Verify project ownership
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        });

        if (!user || chatSession.project.userId !== user.id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Create the message
        const message = await prisma.chatMessage.create({
            data: {
                chatSessionId,
                role,
                content,
            },
        });

        // If this is the first user message in the session, auto-name the session
        if (role === "user") {
            const messageCount = await prisma.chatMessage.count({
                where: { chatSessionId },
            });

            // If this is the first message (count is 1 after creation) and session has default name
            if (messageCount === 1 && chatSession.name === "New Chat") {
                // Generate a name from the first 50 characters of the message
                const autoName = content.trim().slice(0, 50) + (content.length > 50 ? "..." : "");

                await prisma.chatSession.update({
                    where: { id: chatSessionId },
                    data: {
                        name: autoName,
                        updatedAt: new Date()
                    },
                });
            } else {
                // Just update the timestamp
                await prisma.chatSession.update({
                    where: { id: chatSessionId },
                    data: { updatedAt: new Date() },
                });
            }
        } else {
            // For assistant messages, just update the timestamp
            await prisma.chatSession.update({
                where: { id: chatSessionId },
                data: { updatedAt: new Date() },
            });
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

// GET /api/chat-messages?chatSessionId=xxx - Get all messages for a chat session
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const chatSessionId = req.nextUrl.searchParams.get("chatSessionId");
        if (!chatSessionId) {
            return NextResponse.json(
                { error: "Missing chatSessionId parameter" },
                { status: 400 }
            );
        }

        // Verify chat session exists and user has access
        const chatSession = await prisma.chatSession.findUnique({
            where: { id: chatSessionId },
            include: {
                project: {
                    select: {
                        userId: true,
                    },
                },
            },
        });

        if (!chatSession) {
            return NextResponse.json(
                { error: "Chat session not found" },
                { status: 404 }
            );
        }

        // Verify project ownership
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        });

        if (!user || chatSession.project.userId !== user.id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Get all messages
        const messages = await prisma.chatMessage.findMany({
            where: { chatSessionId },
            orderBy: { createdAt: "asc" },
        });

        return NextResponse.json({ messages });
    } catch (error) {
        console.error("Chat messages fetch error:", error);
        return NextResponse.json(
            {
                error: "Failed to fetch chat messages",
                details: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}
