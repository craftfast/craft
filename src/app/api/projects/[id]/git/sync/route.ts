import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { withCsrfProtection } from "@/lib/csrf";
import { decryptValue } from "@/lib/crypto";

// POST /api/projects/[id]/git/sync - Sync project with Git repository
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // CSRF Protection
        const csrfCheck = await withCsrfProtection(req);
        if (csrfCheck) return csrfCheck;

        const session = await auth.api.getSession({
            headers: req.headers,
        });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id: projectId } = await params;
        const body = await req.json();
        const { direction = "push", message = "Update from Craft" } = body;

        // Verify project ownership
        const project = await prisma.project.findUnique({
            where: { id: projectId, userId: session.user.id },
            include: {
                gitConnections: true,
            },
        });

        if (!project) {
            return NextResponse.json(
                { error: "Project not found or access denied" },
                { status: 404 }
            );
        }

        const gitConnection = project.gitConnections[0];
        if (!gitConnection) {
            return NextResponse.json(
                { error: "No Git connection found" },
                { status: 400 }
            );
        }

        // Decrypt access token
        const accessToken = decryptValue(gitConnection.accessToken);

        // Get code files
        const codeFiles = project.codeFiles as Record<string, any>;

        if (direction === "push") {
            // Push to Git repository
            await pushToGitHub(
                gitConnection.provider,
                gitConnection.repository,
                gitConnection.branch,
                accessToken,
                codeFiles,
                message
            );

            // Update last sync time
            await prisma.projectGitConnection.update({
                where: { id: gitConnection.id },
                data: { lastSyncAt: new Date() },
            });

            return NextResponse.json({
                success: true,
                message: "Successfully pushed to repository",
            });
        } else if (direction === "pull") {
            // Pull from Git repository
            const pulledFiles = await pullFromGitHub(
                gitConnection.provider,
                gitConnection.repository,
                gitConnection.branch,
                accessToken
            );

            // Update project code files
            await prisma.project.update({
                where: { id: projectId },
                data: {
                    codeFiles: pulledFiles as any,
                    version: { increment: 1 },
                    lastCodeUpdateAt: new Date(),
                },
            });

            // Update last sync time
            await prisma.projectGitConnection.update({
                where: { id: gitConnection.id },
                data: { lastSyncAt: new Date() },
            });

            return NextResponse.json({
                success: true,
                message: "Successfully pulled from repository",
                filesUpdated: Object.keys(pulledFiles).length,
            });
        }

        return NextResponse.json({ error: "Invalid direction" }, { status: 400 });
    } catch (error) {
        console.error("Error syncing with Git:", error);
        return NextResponse.json(
            { error: "Failed to sync with Git repository" },
            { status: 500 }
        );
    }
}

/**
 * Push files to GitHub repository
 */
async function pushToGitHub(
    provider: string,
    repository: string,
    branch: string,
    accessToken: string,
    files: Record<string, any>,
    message: string
) {
    if (provider !== "github") {
        throw new Error("Only GitHub is currently supported");
    }

    // GitHub API: Get latest commit SHA
    const repoUrl = `https://api.github.com/repos/${repository}`;
    const branchUrl = `${repoUrl}/git/refs/heads/${branch}`;

    const branchRes = await fetch(branchUrl, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: "application/vnd.github.v3+json",
        },
    });

    if (!branchRes.ok) {
        throw new Error("Failed to get branch information");
    }

    const branchData = await branchRes.json();
    const latestCommitSha = branchData.object.sha;

    // Get the tree of the latest commit
    const commitRes = await fetch(
        `${repoUrl}/git/commits/${latestCommitSha}`,
        {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                Accept: "application/vnd.github.v3+json",
            },
        }
    );

    const commitData = await commitRes.json();
    const baseTreeSha = commitData.tree.sha;

    // Create blobs for each file
    const tree = [];
    for (const [path, content] of Object.entries(files)) {
        const fileContent = typeof content === "string" ? content : content.content || "";

        const blobRes = await fetch(`${repoUrl}/git/blobs`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                Accept: "application/vnd.github.v3+json",
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                content: fileContent,
                encoding: "utf-8",
            }),
        });

        const blobData = await blobRes.json();

        tree.push({
            path,
            mode: "100644",
            type: "blob",
            sha: blobData.sha,
        });
    }

    // Create new tree
    const treeRes = await fetch(`${repoUrl}/git/trees`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: "application/vnd.github.v3+json",
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            base_tree: baseTreeSha,
            tree,
        }),
    });

    const treeData = await treeRes.json();

    // Create new commit
    const newCommitRes = await fetch(`${repoUrl}/git/commits`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: "application/vnd.github.v3+json",
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            message,
            tree: treeData.sha,
            parents: [latestCommitSha],
        }),
    });

    const newCommitData = await newCommitRes.json();

    // Update branch reference
    await fetch(branchUrl, {
        method: "PATCH",
        headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: "application/vnd.github.v3+json",
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            sha: newCommitData.sha,
        }),
    });
}

/**
 * Pull files from GitHub repository
 */
async function pullFromGitHub(
    provider: string,
    repository: string,
    branch: string,
    accessToken: string
): Promise<Record<string, string>> {
    if (provider !== "github") {
        throw new Error("Only GitHub is currently supported");
    }

    const repoUrl = `https://api.github.com/repos/${repository}`;

    // Get repository tree
    const treeRes = await fetch(
        `${repoUrl}/git/trees/${branch}?recursive=1`,
        {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                Accept: "application/vnd.github.v3+json",
            },
        }
    );

    if (!treeRes.ok) {
        throw new Error("Failed to get repository tree");
    }

    const treeData = await treeRes.json();
    const files: Record<string, string> = {};

    // Fetch content for each file
    for (const item of treeData.tree) {
        if (item.type === "blob") {
            const contentRes = await fetch(
                `${repoUrl}/contents/${item.path}?ref=${branch}`,
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        Accept: "application/vnd.github.v3+json",
                    },
                }
            );

            if (contentRes.ok) {
                const contentData = await contentRes.json();
                const content = Buffer.from(contentData.content, "base64").toString(
                    "utf-8"
                );
                files[item.path] = content;
            }
        }
    }

    return files;
}
