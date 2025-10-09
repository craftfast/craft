import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// POST /api/files - Create or update a file for a project
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { projectId, filePath, content } = await req.json();

        if (!projectId || !filePath || content === undefined) {
            return NextResponse.json(
                { error: "Missing required fields: projectId, filePath, content" },
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

        // Store file in database (JSON structure mapping file paths to content)
        const files = (project.files as Record<string, string>) || {};
        files[filePath] = content;

        await prisma.project.update({
            where: { id: projectId },
            data: { files },
        });

        return NextResponse.json({
            success: true,
            filePath,
            message: "File saved successfully",
        });
    } catch (error) {
        console.error("File save error:", error);
        return NextResponse.json(
            {
                error: "Failed to save file",
                details: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}

// GET /api/files?projectId=xxx - Get all files for a project
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

        const files = (project.files as Record<string, string>) || {};

        return NextResponse.json({ files });
    } catch (error) {
        console.error("Files fetch error:", error);
        return NextResponse.json(
            {
                error: "Failed to fetch files",
                details: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}
