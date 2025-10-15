import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

interface RouteContext {
    params: Promise<{ id: string }>;
}

// GET /api/projects/[id]/versions - Fetch all versions for a project
export async function GET(
    request: NextRequest,
    context: RouteContext
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id: projectId } = await context.params;

        // Verify project ownership
        const project = await prisma.project.findFirst({
            where: {
                id: projectId,
                user: {
                    email: session.user.email,
                },
            },
        });

        if (!project) {
            return NextResponse.json(
                { error: "Project not found" },
                { status: 404 }
            );
        }

        // Fetch all versions, sorted by version number (newest first)
        const versions = await prisma.projectVersion.findMany({
            where: {
                projectId,
            },
            orderBy: [
                { isBookmarked: "desc" }, // Bookmarked versions first
                { version: "desc" }, // Then by version number
            ],
            select: {
                id: true,
                version: true,
                name: true,
                codeFiles: true,
                chatMessageId: true,
                isBookmarked: true,
                isPublished: true,
                createdAt: true,
            },
        });

        return NextResponse.json({
            versions,
            currentVersion: project.version,
        });
    } catch (error) {
        console.error("Error fetching versions:", error);
        return NextResponse.json(
            { error: "Failed to fetch versions" },
            { status: 500 }
        );
    }
}

// POST /api/projects/[id]/versions - Create a new version snapshot
export async function POST(
    request: NextRequest,
    context: RouteContext
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id: projectId } = await context.params;
        const body = await request.json();
        const { name, chatMessageId } = body;

        // Verify project ownership
        const project = await prisma.project.findFirst({
            where: {
                id: projectId,
                user: {
                    email: session.user.email,
                },
            },
        });

        if (!project) {
            return NextResponse.json(
                { error: "Project not found" },
                { status: 404 }
            );
        }

        // Create new version snapshot
        const version = await prisma.projectVersion.create({
            data: {
                projectId,
                version: project.version,
                name: name || `Version ${project.version}`,
                codeFiles: project.codeFiles as object,
                chatMessageId,
                isBookmarked: false,
            },
        });

        return NextResponse.json({ version });
    } catch (error) {
        console.error("Error creating version:", error);
        return NextResponse.json(
            { error: "Failed to create version" },
            { status: 500 }
        );
    }
}
