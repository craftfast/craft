import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import { withCsrfProtection } from "@/lib/csrf";
import { linkGitHubRepository, unlinkGitHubRepository } from "@/lib/services/github-deploy";

/**
 * POST /api/integrations/github/link
 * Link an existing GitHub repository to a project
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
        const { projectId, repoFullName, branch } = body;

        if (!projectId || !repoFullName) {
            return NextResponse.json(
                { error: "Project ID and repository name are required" },
                { status: 400 }
            );
        }

        const result = await linkGitHubRepository(
            session.user.id,
            projectId,
            repoFullName,
            { branch }
        );

        return NextResponse.json({
            success: true,
            repository: result.repository,
        });
    } catch (error) {
        console.error("GitHub link error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to link repository" },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/integrations/github/link
 * Unlink a GitHub repository from a project
 */
export async function DELETE(req: NextRequest) {
    try {
        // CSRF Protection
        const csrfCheck = await withCsrfProtection(req);
        if (csrfCheck) return csrfCheck;

        const session = await getSession();

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const projectId = searchParams.get("projectId");

        if (!projectId) {
            return NextResponse.json(
                { error: "Project ID is required" },
                { status: 400 }
            );
        }

        await unlinkGitHubRepository(session.user.id, projectId);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("GitHub unlink error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to unlink repository" },
            { status: 500 }
        );
    }
}
