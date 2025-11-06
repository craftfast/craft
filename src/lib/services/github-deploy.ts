import { prisma } from "@/lib/db";
import type { Project } from "@prisma/client";

interface GitHubDeploymentOptions {
    repositoryName?: string;
    repositoryDescription?: string;
    isPrivate?: boolean;
    branch?: string;
}

/**
 * Deploy a project to GitHub (create repo and push code)
 */
export async function deployToGitHub(
    userId: string,
    project: Project,
    options: GitHubDeploymentOptions = {}
) {
    // Get GitHub integration
    const integration = await prisma.gitHubIntegration.findUnique({
        where: { userId },
    });

    if (!integration || !integration.isActive) {
        throw new Error("GitHub account not connected");
    }

    // Create deployment record
    const deployment = await prisma.deployment.create({
        data: {
            projectId: project.id,
            userId,
            platform: "github",
            status: "pending",
            startedAt: new Date(),
        },
    });

    try {
        const repoName =
            options.repositoryName || project.name.toLowerCase().replace(/\s+/g, "-");
        const branch = options.branch || "main";

        // Create GitHub repository
        const repoResponse = await fetch("https://api.github.com/user/repos", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${integration.accessToken}`,
                Accept: "application/vnd.github.v3+json",
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                name: repoName,
                description: options.repositoryDescription || project.description,
                private: options.isPrivate !== false, // Default to private
                auto_init: false, // Don't auto-initialize
            }),
        });

        if (!repoResponse.ok) {
            const error = await repoResponse.json();
            throw new Error(`Failed to create GitHub repository: ${error.message}`);
        }

        const repoData = await repoResponse.json();

        // Store repository in database
        const repository = await prisma.gitHubRepository.create({
            data: {
                githubIntegrationId: integration.id,
                projectId: project.id,
                githubRepoId: repoData.id,
                name: repoData.name,
                fullName: repoData.full_name,
                owner: repoData.owner.login,
                isPrivate: repoData.private,
                defaultBranch: repoData.default_branch || branch,
                htmlUrl: repoData.html_url,
                cloneUrl: repoData.clone_url,
                sshUrl: repoData.ssh_url,
                description: repoData.description,
            },
        });

        // Update deployment with GitHub repo info
        await prisma.deployment.update({
            where: { id: deployment.id },
            data: {
                githubRepositoryId: repository.id,
                githubBranch: branch,
                status: "building",
            },
        });

        // Prepare project files
        const files = typeof project.codeFiles === 'object' && project.codeFiles !== null
            ? project.codeFiles
            : {};

        // Create initial commit with all files
        const tree = await createGitTree(
            integration.accessToken,
            repoData.full_name,
            files as Record<string, string | unknown>
        );

        const commit = await createGitCommit(
            integration.accessToken,
            repoData.full_name,
            tree.sha,
            "Initial commit from Craft"
        );

        // Update branch reference
        await updateBranchRef(
            integration.accessToken,
            repoData.full_name,
            branch,
            commit.sha
        );

        // Deployment successful
        const finalDeployment = await prisma.deployment.update({
            where: { id: deployment.id },
            data: {
                status: "ready",
                githubCommitSha: commit.sha,
                completedAt: new Date(),
            },
        });

        return finalDeployment;
    } catch (error) {
        // Update deployment record with error
        await prisma.deployment.update({
            where: { id: deployment.id },
            data: {
                status: "error",
                errorMessage: error instanceof Error ? error.message : "Unknown error",
                completedAt: new Date(),
            },
        });

        throw error;
    }
}

/**
 * Create a Git tree with all project files
 */
async function createGitTree(
    accessToken: string,
    repo: string,
    files: Record<string, string | unknown>
) {
    const tree = Object.entries(files).map(([path, content]) => ({
        path,
        mode: "100644", // Regular file
        type: "blob",
        content: typeof content === 'string' ? content : '',
    }));

    const response = await fetch(
        `https://api.github.com/repos/${repo}/git/trees`,
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                Accept: "application/vnd.github.v3+json",
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ tree }),
        }
    );

    if (!response.ok) {
        const error = await response.json();
        throw new Error(`Failed to create Git tree: ${error.message}`);
    }

    return await response.json();
}

/**
 * Create a Git commit
 */
async function createGitCommit(
    accessToken: string,
    repo: string,
    treeSha: string,
    message: string,
    parentSha?: string
) {
    const body: { message: string; tree: string; parents?: string[] } = {
        message,
        tree: treeSha,
    };

    if (parentSha) {
        body.parents = [parentSha];
    }

    const response = await fetch(
        `https://api.github.com/repos/${repo}/git/commits`,
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                Accept: "application/vnd.github.v3+json",
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        }
    );

    if (!response.ok) {
        const error = await response.json();
        throw new Error(`Failed to create Git commit: ${error.message}`);
    }

    return await response.json();
}

/**
 * Update branch reference to point to a commit
 */
async function updateBranchRef(
    accessToken: string,
    repo: string,
    branch: string,
    commitSha: string
) {
    const response = await fetch(
        `https://api.github.com/repos/${repo}/git/refs/heads/${branch}`,
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                Accept: "application/vnd.github.v3+json",
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                ref: `refs/heads/${branch}`,
                sha: commitSha,
            }),
        }
    );

    if (!response.ok) {
        // If branch doesn't exist, create it
        const createResponse = await fetch(
            `https://api.github.com/repos/${repo}/git/refs`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    Accept: "application/vnd.github.v3+json",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    ref: `refs/heads/${branch}`,
                    sha: commitSha,
                }),
            }
        );

        if (!createResponse.ok) {
            const error = await createResponse.json();
            throw new Error(`Failed to update branch ref: ${error.message}`);
        }

        return await createResponse.json();
    }

    return await response.json();
}
