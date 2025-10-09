import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET /api/chat-sessions?projectId=xxx - Get all chat sessions for a project
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const projectId = req.nextUrl.searchParams.get("projectId");
        if (!projectId) {
            return NextResponse.json(
                { error: "Missing projectId parameter" },
                { status: 400 }
            );
        }

        // Verify project ownership
        const project = await prisma.project.findFirst({
            where: {
                id: projectId,
                user: { email: session.user.email },
            },
        });

        if (!project) {
            return NextResponse.json(
                { error: "Project not found or access denied" },
                { status: 404 }
            );
        }

        // Get all chat sessions for the project
        const chatSessions = await prisma.chatSession.findMany({
            where: { projectId },
            orderBy: { updatedAt: "desc" },
            include: {
                messages: {
                    orderBy: { createdAt: "asc" },
                },
            },
        });

        return NextResponse.json({ chatSessions });
    } catch (error) {
        console.error("Chat sessions fetch error:", error);
        return NextResponse.json(
            {
                error: "Failed to fetch chat sessions",
                details: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}

// POST /api/chat-sessions - Create a new chat session
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { projectId, name } = await req.json();

        if (!projectId) {
            return NextResponse.json(
                { error: "Missing projectId" },
                { status: 400 }
            );
        }

        // Verify project ownership
        const project = await prisma.project.findFirst({
            where: {
                id: projectId,
                user: { email: session.user.email },
            },
        });

        if (!project) {
            return NextResponse.json(
                { error: "Project not found or access denied" },
                { status: 404 }
            );
        }

        // Create new chat session
        const chatSession = await prisma.chatSession.create({
            data: {
                projectId,
                name: name || "New Chat",
            },
            include: {
                messages: true,
            },
        });

        return NextResponse.json({ chatSession }, { status: 201 });
    } catch (error) {
        console.error("Chat session creation error:", error);
        return NextResponse.json(
            {
                error: "Failed to create chat session",
                details: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}
