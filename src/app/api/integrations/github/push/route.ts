import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import { prisma } from "@/lib/db";
import { withCsrfProtection } from "@/lib/csrf";
import { pushToGitHub } from "@/lib/services/github-deploy";

/**
 * POST /api/integrations/github/push
 * Push project code to linked GitHub repository
 */
export async function POST(req: NextRequest) {
    try {
        // CSRF Protection
        const csrfCheck = await withCsrfProtection(req);
        if (csrfCheck) return csrfCheck;

        const session = await getSession();

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { projectId, commitMessage, branch } = body;

        if (!projectId) {
            return NextResponse.json(
                { error: "Project ID is required" },
                { status: 400 }
            );
        }

        // Get project with code files
        const project = await prisma.project.findUnique({
            where: { id: projectId, userId: session.user.id },
        });

        if (!project) {
            return NextResponse.json(
                { error: "Project not found or access denied" },
                { status: 404 }
            );
        }

        const result = await pushToGitHub(session.user.id, project, {
            commitMessage,
            branch,
        });

        return NextResponse.json({
            success: true,
            commitSha: result.commitSha,
            commitMessage: result.commitMessage,
            repository: result.repository,
        });
    } catch (error) {
        console.error("GitHub push error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Push failed" },
            { status: 500 }
        );
    }
}
