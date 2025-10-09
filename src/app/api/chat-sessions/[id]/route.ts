import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET /api/chat-sessions/[id] - Get a single chat session with messages
export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const chatSession = await prisma.chatSession.findUnique({
            where: { id: params.id },
            include: {
                messages: {
                    orderBy: { createdAt: "asc" },
                },
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

        return NextResponse.json({ chatSession });
    } catch (error) {
        console.error("Chat session fetch error:", error);
        return NextResponse.json(
            {
                error: "Failed to fetch chat session",
                details: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}

// PATCH /api/chat-sessions/[id] - Update chat session (e.g., rename)
export async function PATCH(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { name } = await req.json();

        const chatSession = await prisma.chatSession.findUnique({
            where: { id: params.id },
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

        // Update chat session
        const updatedSession = await prisma.chatSession.update({
            where: { id: params.id },
            data: { name },
            include: {
                messages: {
                    orderBy: { createdAt: "asc" },
                },
            },
        });

        return NextResponse.json({ chatSession: updatedSession });
    } catch (error) {
        console.error("Chat session update error:", error);
        return NextResponse.json(
            {
                error: "Failed to update chat session",
                details: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}

// DELETE /api/chat-sessions/[id] - Delete a chat session
export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const chatSession = await prisma.chatSession.findUnique({
            where: { id: params.id },
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

        // Delete chat session (messages will be cascade deleted)
        await prisma.chatSession.delete({
            where: { id: params.id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Chat session deletion error:", error);
        return NextResponse.json(
            {
                error: "Failed to delete chat session",
                details: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}
