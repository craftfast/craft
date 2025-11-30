import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import { prisma } from "@/lib/db";
import { getUserOAuthToken } from "@/lib/github-app";

/**
 * GET /api/integrations/github/sync-status
 * Check sync status between local project and remote GitHub repository
 */
export async function GET(req: NextRequest) {
    try {
        const session = await getSession();

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const projectId = req.nextUrl.searchParams.get("projectId");

        if (!projectId) {
            return NextResponse.json(
                { error: "Project ID is required" },
                { status: 400 }
            );
        }

        // Get GitHub integration
        const integration = await prisma.gitHubIntegration.findUnique({
            where: { userId: session.user.id },
        });

        if (!integration || !integration.isActive) {
            return NextResponse.json({
                synced: false,
                status: "not_connected",
                message: "GitHub not connected",
            });
        }

        // Get project and verify access
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            select: { id: true, userId: true, name: true, updatedAt: true },
        });

        if (!project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        // Check access
        const hasAccess =
            project.userId === session.user.id ||
            (await prisma.projectCollaborator.findFirst({
                where: { projectId, userId: session.user.id },
            })) !== null;

        if (!hasAccess) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Get linked repository
        const repository = await prisma.gitHubRepository.findFirst({
            where: { projectId },
        });

        if (!repository) {
            return NextResponse.json({
                synced: false,
                status: "no_repo",
                message: "No GitHub repository linked to this project",
            });
        }

        // Get user OAuth token for accessing repos
        const accessToken = await getUserOAuthToken(integration);

        // Get latest commit from GitHub
        const commitResponse = await fetch(
            `https://api.github.com/repos/${repository.fullName}/commits/${repository.defaultBranch}`,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    Accept: "application/vnd.github.v3+json",
                },
            }
        );

        if (!commitResponse.ok) {
            if (commitResponse.status === 404) {
                return NextResponse.json({
                    synced: false,
                    status: "repo_not_found",
                    message: "Repository not found on GitHub. It may have been deleted.",
                    repository: {
                        name: repository.name,
                        fullName: repository.fullName,
                    },
                });
            }

            if (commitResponse.status === 401) {
                await prisma.gitHubIntegration.update({
                    where: { id: integration.id },
                    data: { isActive: false },
                });
                return NextResponse.json({
                    synced: false,
                    status: "token_expired",
                    message: "GitHub token expired. Please reconnect.",
                });
            }

            return NextResponse.json({
                synced: false,
                status: "fetch_error",
                message: "Failed to fetch repository info from GitHub",
            });
        }

        const commitData = await commitResponse.json();

        // Get last deployment/sync for this project
        const lastDeployment = await prisma.deployment.findFirst({
            where: {
                projectId,
                platform: "github",
                status: "ready",
            },
            orderBy: { completedAt: "desc" },
            select: {
                id: true,
                githubCommitSha: true,
                completedAt: true,
            },
        });

        const localCommit = lastDeployment?.githubCommitSha;
        const remoteCommit = commitData.sha;
        const isSynced = localCommit === remoteCommit;

        // Determine sync status
        let status: string;
        let message: string;

        if (!localCommit) {
            status = "never_pushed";
            message = "Project has never been pushed to this repository";
        } else if (isSynced) {
            status = "synced";
            message = "Project is up to date with GitHub";
        } else {
            status = "out_of_sync";
            message = "Local and remote versions differ";
        }

        return NextResponse.json({
            synced: isSynced,
            status,
            message,
            localCommit,
            remoteCommit,
            remoteCommitMessage: commitData.commit?.message,
            remoteCommitDate: commitData.commit?.committer?.date,
            remoteCommitAuthor: commitData.commit?.author?.name,
            lastSyncedAt: lastDeployment?.completedAt,
            projectUpdatedAt: project.updatedAt,
            repository: {
                id: repository.id,
                name: repository.name,
                fullName: repository.fullName,
                htmlUrl: repository.htmlUrl,
                defaultBranch: repository.defaultBranch,
                isPrivate: repository.isPrivate,
            },
        });
    } catch (error) {
        console.error("Sync status check error:", error);
        return NextResponse.json(
            { error: "Failed to check sync status" },
            { status: 500 }
        );
    }
}
