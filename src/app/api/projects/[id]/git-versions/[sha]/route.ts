import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import { prisma } from "@/lib/db";
import {
    getCommitDetails,
    restoreToCommit,
    bookmarkCommit,
    getFilesAtCommit,
} from "@/lib/services/git-versioning";

interface RouteContext {
    params: Promise<{ id: string; sha: string }>;
}

/**
 * GET /api/projects/[id]/git-versions/[sha]
 * 
 * Get details of a specific commit
 */
export async function GET(
    request: NextRequest,
    context: RouteContext
) {
    try {
        const session = await getSession();

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id: projectId, sha: commitSha } = await context.params;

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

        // Get commit details
        const commit = await getCommitDetails(session.user.id, projectId, commitSha);

        if (!commit) {
            return NextResponse.json(
                { error: "Commit not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({ commit });
    } catch (error) {
        console.error("Error fetching commit:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to fetch commit" },
            { status: 500 }
        );
    }
}
