import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import { prisma } from "@/lib/db";
import { restoreToCommit, getFilesAtCommit } from "@/lib/services/git-versioning";
import { writeFileToSandbox, getOrCreateProjectSandbox } from "@/lib/e2b/sandbox-manager";

interface RouteContext {
    params: Promise<{ id: string; sha: string }>;
}

/**
 * POST /api/projects/[id]/git-versions/[sha]/restore
 * 
 * Restore project to a specific Git commit
 * This:
 * 1. Fetches files at the target commit
 * 2. Updates the database codeFiles
 * 3. Syncs to E2B sandbox
 * 4. Creates a new commit (Git best practice: don't rewrite history)
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

        console.log(`🔄 Restoring project ${projectId} to commit ${commitSha.substring(0, 7)}...`);

        // Get files at the target commit
        const files = await getFilesAtCommit(session.user.id, projectId, commitSha);

        if (Object.keys(files).length === 0) {
            return NextResponse.json(
                { error: "No files found at this commit" },
                { status: 400 }
            );
        }

        // Update database with restored files
        await prisma.project.update({
            where: { id: projectId },
            data: {
                codeFiles: files,
                updatedAt: new Date(),
                lastCodeUpdateAt: new Date(),
                version: { increment: 1 },
            },
        });

        // Sync to E2B sandbox if active
        if (project.sandboxId) {
            console.log(`📦 Syncing restored files to sandbox...`);
            try {
                const sandbox = await getOrCreateProjectSandbox(projectId);

                // Write all files to sandbox
                for (const [path, content] of Object.entries(files)) {
                    await writeFileToSandbox(sandbox.sandboxId, path, content);
                }

                console.log(`✅ Restored ${Object.keys(files).length} files to sandbox`);
            } catch (sandboxError) {
                console.warn("⚠️ Could not sync to sandbox:", sandboxError);
                // Don't fail restore if sandbox sync fails
            }
        }

        // Create a new commit documenting the restore (Git best practice)
        const result = await restoreToCommit(session.user.id, projectId, commitSha);

        return NextResponse.json({
            success: true,
            filesRestored: Object.keys(files).length,
            restoredFromSha: commitSha,
            newCommit: {
                sha: result.newSha,
                shortSha: result.newSha.substring(0, 7),
            },
            message: result.message,
        });
    } catch (error) {
        console.error("Error restoring commit:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to restore commit" },
            { status: 500 }
        );
    }
}
