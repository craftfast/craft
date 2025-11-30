import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import { prisma } from "@/lib/db";
import { bookmarkCommit } from "@/lib/services/git-versioning";

interface RouteContext {
    params: Promise<{ id: string; sha: string }>;
}

/**
 * POST /api/projects/[id]/git-versions/[sha]/bookmark
 * 
 * Bookmark a commit by creating a Git tag
 * Body: { name: string }
 */
export async function POST(
    request: NextRequest,
    context: RouteContext
) {
    try {
        const session = await getSession();

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id: projectId, sha: commitSha } = await context.params;
        const body = await request.json();
        const { name } = body;

        if (!name || typeof name !== "string") {
            return NextResponse.json(
                { error: "Bookmark name is required" },
                { status: 400 }
            );
        }

        // Verify project ownership
        const project = await prisma.project.findFirst({
            where: {
                id: projectId,
                userId: session.user.id,
            },
        });

        if (!project) {
            return NextResponse.json(
                { error: "Project not found" },
                { status: 404 }
            );
        }

        // Create bookmark (Git tag)
        const result = await bookmarkCommit(session.user.id, projectId, commitSha, name);

        return NextResponse.json({
            success: true,
            tagName: result.tagName,
            sha: commitSha,
            message: `Bookmarked commit ${commitSha.substring(0, 7)} as "${name}"`,
        });
    } catch (error) {
        console.error("Error bookmarking commit:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to bookmark commit" },
            { status: 500 }
        );
    }
}
