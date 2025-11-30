import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import { prisma } from "@/lib/db";
import {
    getVersionHistory,
    hasLinkedRepository,
} from "@/lib/services/git-versioning";

interface RouteContext {
    params: Promise<{ id: string }>;
}

/**
 * GET /api/projects/[id]/git-versions
 * 
 * Fetch Git commit history for a project (replaces ProjectVersion)
 * Query params:
 * - limit: number of commits to fetch (default: 30)
 * - page: pagination page (default: 1)
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

        const { id: projectId } = await context.params;
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get("limit") || "30");
        const page = parseInt(searchParams.get("page") || "1");

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

        // Check if project has linked repository
        const hasRepo = await hasLinkedRepository(projectId);
        if (!hasRepo) {
            return NextResponse.json({
                commits: [],
                totalCount: 0,
                hasLinkedRepository: false,
                message: "No GitHub repository linked. Create or link a repository to enable version history.",
            });
        }

        // Get commit history from GitHub
        const { commits, totalCount } = await getVersionHistory(
            session.user.id,
            projectId,
            { limit, page }
        );

        return NextResponse.json({
            commits,
            totalCount,
            hasLinkedRepository: true,
            page,
            limit,
            hasMore: page * limit < totalCount,
        });
    } catch (error) {
        console.error("Error fetching git versions:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to fetch versions" },
            { status: 500 }
        );
    }
}
