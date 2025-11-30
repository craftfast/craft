import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import { prisma } from "@/lib/db";
import { withCsrfProtection } from "@/lib/csrf";
import { getUserOAuthToken } from "@/lib/github-app";

/**
 * POST /api/integrations/github/pull
 * Pull/import code from a GitHub repository to a project
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
        const { repoFullName, branch, projectId } = body;

        if (!repoFullName) {
            return NextResponse.json(
                { error: "Repository name is required" },
                { status: 400 }
            );
        }

        const integration = await prisma.gitHubIntegration.findUnique({
            where: { userId: session.user.id },
        });

        if (!integration || !integration.isActive) {
            return NextResponse.json(
                { error: "GitHub not connected" },
                { status: 400 }
            );
        }

        // Get user OAuth token for accessing repos
        const accessToken = await getUserOAuthToken(integration);

        // Verify project ownership if projectId provided
        if (projectId) {
            const project = await prisma.project.findUnique({
                where: { id: projectId, userId: session.user.id },
            });

            if (!project) {
                return NextResponse.json(
                    { error: "Project not found or access denied" },
                    { status: 404 }
                );
            }
        }

        // Get repository info to determine default branch
        const repoResponse = await fetch(
            `https://api.github.com/repos/${repoFullName}`,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    Accept: "application/vnd.github.v3+json",
                },
            }
        );

        if (!repoResponse.ok) {
            const error = await repoResponse.json().catch(() => ({}));
            console.error("GitHub repo fetch error:", error);
            return NextResponse.json(
                { error: "Failed to fetch repository info" },
                { status: 500 }
            );
        }

        const repoData = await repoResponse.json();
        const targetBranch = branch || repoData.default_branch;

        // Get the file tree for the branch
        const treeResponse = await fetch(
            `https://api.github.com/repos/${repoFullName}/git/trees/${targetBranch}?recursive=1`,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    Accept: "application/vnd.github.v3+json",
                },
            }
        );

        if (!treeResponse.ok) {
            const error = await treeResponse.json().catch(() => ({}));
            console.error("GitHub tree fetch error:", error);
            return NextResponse.json(
                { error: "Failed to fetch file tree. Branch may not exist." },
                { status: 500 }
            );
        }

        const treeData = await treeResponse.json();

        // Filter files (exclude common non-essential directories)
        const excludePatterns = [
            "node_modules/",
            ".git/",
            ".next/",
            "dist/",
            "build/",
            ".cache/",
            "coverage/",
            ".turbo/",
            ".vercel/",
        ];

        const fileItems = treeData.tree.filter(
            (item: { type: string; path: string; size?: number }) =>
                item.type === "blob" &&
                !excludePatterns.some((pattern) => item.path.includes(pattern)) &&
                (item.size === undefined || item.size < 1024 * 100) // Skip files > 100KB
        );

        if (fileItems.length === 0) {
            return NextResponse.json(
                { error: "No files found in repository" },
                { status: 400 }
            );
        }

        // Limit total files to prevent overwhelming
        const maxFiles = 200;
        const filesToFetch = fileItems.slice(0, maxFiles);

        // Fetch file contents in batches
        const files: Record<string, string> = {};
        const batchSize = 10;

        for (let i = 0; i < filesToFetch.length; i += batchSize) {
            const batch = filesToFetch.slice(i, i + batchSize);

            const batchResults = await Promise.allSettled(
                batch.map(async (item: { path: string; sha: string }) => {
                    try {
                        const contentResponse = await fetch(
                            `https://api.github.com/repos/${repoFullName}/contents/${encodeURIComponent(item.path)}?ref=${targetBranch}`,
                            {
                                headers: {
                                    Authorization: `Bearer ${accessToken}`,
                                    Accept: "application/vnd.github.v3+json",
                                },
                            }
                        );

                        if (contentResponse.ok) {
                            const contentData = await contentResponse.json();
                            if (contentData.content && contentData.encoding === "base64") {
                                const content = Buffer.from(
                                    contentData.content,
                                    "base64"
                                ).toString("utf-8");
                                return { path: item.path, content };
                            }
                        }
                        return null;
                    } catch {
                        return null;
                    }
                })
            );

            batchResults.forEach((result) => {
                if (result.status === "fulfilled" && result.value) {
                    files[result.value.path] = result.value.content;
                }
            });

            // Small delay between batches to avoid rate limiting
            if (i + batchSize < filesToFetch.length) {
                await new Promise((resolve) => setTimeout(resolve, 100));
            }
        }

        const filesCount = Object.keys(files).length;

        if (filesCount === 0) {
            return NextResponse.json(
                { error: "Failed to fetch any file contents" },
                { status: 500 }
            );
        }

        // Update project with pulled files if projectId provided
        if (projectId) {
            await prisma.project.update({
                where: { id: projectId },
                data: {
                    codeFiles: files,
                    updatedAt: new Date(),
                },
            });

            // Link repository to project if not already linked
            const existingLink = await prisma.gitHubRepository.findFirst({
                where: { projectId },
            });

            if (!existingLink) {
                await prisma.gitHubRepository.upsert({
                    where: { githubRepoId: repoData.id },
                    update: {
                        projectId,
                        updatedAt: new Date(),
                    },
                    create: {
                        githubIntegrationId: integration.id,
                        projectId,
                        githubRepoId: repoData.id,
                        name: repoData.name,
                        fullName: repoData.full_name,
                        owner: repoData.owner.login,
                        isPrivate: repoData.private,
                        defaultBranch: repoData.default_branch,
                        htmlUrl: repoData.html_url,
                        cloneUrl: repoData.clone_url,
                        sshUrl: repoData.ssh_url,
                        description: repoData.description,
                    },
                });
            }
        }

        return NextResponse.json({
            success: true,
            filesCount,
            files: Object.keys(files),
            repository: {
                name: repoData.name,
                fullName: repoData.full_name,
                branch: targetBranch,
                htmlUrl: repoData.html_url,
            },
            ...(fileItems.length > maxFiles && {
                warning: `Only first ${maxFiles} files were imported. Total files: ${fileItems.length}`,
            }),
        });
    } catch (error) {
        console.error("GitHub pull error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Pull failed" },
            { status: 500 }
        );
    }
}
