import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import { prisma } from "@/lib/db";
import { getCommitDiff } from "@/lib/services/git-versioning";

interface RouteContext {
    params: Promise<{ id: string; sha: string }>;
}

/**
 * GET /api/projects/[id]/git-versions/[sha]/diff
 * 
 * Get diff between a commit and its parent (or another commit)
 * Query params:
 * - base: base commit SHA (optional, defaults to parent)
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

        const { id: projectId, sha: headSha } = await context.params;
        const { searchParams } = new URL(request.url);
        const baseSha = searchParams.get("base") || `${headSha}^`; // Default to parent commit

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

        // Get diff
        const diff = await getCommitDiff(session.user.id, projectId, baseSha, headSha);

        // Calculate summary
        const summary = {
            filesChanged: diff.length,
            additions: diff.reduce((sum, f) => sum + f.additions, 0),
            deletions: diff.reduce((sum, f) => sum + f.deletions, 0),
        };

        return NextResponse.json({
            baseSha,
            headSha,
            diff,
            summary,
        });
    } catch (error) {
        console.error("Error fetching diff:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to fetch diff" },
            { status: 500 }
        );
    }
}
