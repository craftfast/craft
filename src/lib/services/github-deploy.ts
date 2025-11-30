import { prisma } from "@/lib/db";
import type { Project, GitHubIntegration } from "@prisma/client";
import { refreshAccessToken, getInstallationToken } from "@/lib/github-app";

interface GitHubDeploymentOptions {
    repositoryName?: string;
    repositoryDescription?: string;
    isPrivate?: boolean;
    branch?: string;
}

interface GitHubPushOptions {
    commitMessage?: string;
    branch?: string;
}

interface GitHubLinkOptions {
    branch?: string;
}

/**
 * Get user's OAuth token (not installation token)
 * Required for user-specific operations like creating repos
 */
async function getUserOAuthToken(integration: GitHubIntegration): Promise<string> {
    const now = new Date();
    const bufferTime = 5 * 60 * 1000; // 5 minutes in milliseconds

    if (
        integration.tokenExpiresAt &&
        integration.tokenExpiresAt.getTime() < now.getTime() + bufferTime
    ) {
        // Token is expired or about to expire, try to refresh
        if (!integration.refreshToken) {
            throw new Error("GitHub token expired and no refresh token available. Please reconnect GitHub.");
        }

        // Check if refresh token is also expired
        if (
            integration.refreshTokenExpiresAt &&
            integration.refreshTokenExpiresAt.getTime() < now.getTime()
        ) {
            throw new Error("GitHub refresh token expired. Please reconnect GitHub.");
        }

        try {
            console.log("Refreshing GitHub access token...");
            const newTokens = await refreshAccessToken(integration.refreshToken);

            // Update tokens in database
            const tokenExpiresAt = new Date(now.getTime() + newTokens.expires_in * 1000);
            const refreshTokenExpiresAt = new Date(
                now.getTime() + newTokens.refresh_token_expires_in * 1000
            );

            await prisma.gitHubIntegration.update({
                where: { id: integration.id },
                data: {
                    accessToken: newTokens.access_token,
                    refreshToken: newTokens.refresh_token,
                    tokenExpiresAt,
                    refreshTokenExpiresAt,
                    updatedAt: new Date(),
                },
            });

            console.log("GitHub access token refreshed successfully");
            return newTokens.access_token;
        } catch (error) {
            console.error("Failed to refresh GitHub token:", error);
            throw new Error("Failed to refresh GitHub token. Please reconnect GitHub.");
        }
    }

    return integration.accessToken;
}

/**
 * Get installation token for repo operations
 * Installation tokens have the permissions defined in the GitHub App
 */
async function getInstallationAccessToken(integration: GitHubIntegration): Promise<string> {
    if (!integration.installationId) {
        throw new Error("GitHub App not installed. Please install the app first.");
    }

    try {
        console.log(`Getting installation token for installation ${integration.installationId}...`);
        const installationToken = await getInstallationToken(integration.installationId);
        console.log("Got installation token, expires at:", installationToken.expiresAt);
        return installationToken.token;
    } catch (error) {
        console.error("Failed to get installation token:", error);
        throw new Error("Failed to get GitHub installation token. Please reinstall the app.");
    }
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

    // Get user OAuth token for creating repo (installation tokens can't create repos)
    const userToken = await getUserOAuthToken(integration);

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

        // Create GitHub repository using user token
        console.log("Creating repository with user OAuth token...");
        const repoResponse = await fetch("https://api.github.com/user/repos", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${userToken}`,
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
        console.log("Repository created:", repoData.full_name);

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

        // For empty repos, we need to use the Contents API to create the first commit
        // The Git Data API doesn't work on completely empty repos
        const commitSha = await initializeEmptyRepoWithFiles(
            userToken,
            repoData.full_name,
            files as Record<string, string>,
            branch,
            "Initial commit from Craft"
        );

        // Deployment successful
        const finalDeployment = await prisma.deployment.update({
            where: { id: deployment.id },
            data: {
                status: "ready",
                githubCommitSha: commitSha,
                completedAt: new Date(),
            },
        });

        return {
            deployment: finalDeployment,
            repository: {
                id: repository.id,
                name: repository.name,
                fullName: repository.fullName,
                htmlUrl: repository.htmlUrl,
                isPrivate: repository.isPrivate,
                defaultBranch: repository.defaultBranch,
            },
            commitSha: commitSha,
        };
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
 * Initialize an empty GitHub repository with files using the Contents API
 * The Git Data API doesn't work on completely empty repos, so we need to:
 * 1. Create the first file using Contents API (this creates the first commit)
 * 2. Get the commit SHA and tree SHA
 * 3. Use Git Data API to add remaining files in one commit
 */
async function initializeEmptyRepoWithFiles(
    accessToken: string,
    repo: string,
    files: Record<string, string>,
    branch: string,
    commitMessage: string
): Promise<string> {
    const fileEntries = Object.entries(files);

    if (fileEntries.length === 0) {
        throw new Error("No files to commit");
    }

    // Sort files so README.md or package.json comes first (more meaningful first file)
    fileEntries.sort(([pathA], [pathB]) => {
        if (pathA === "README.md") return -1;
        if (pathB === "README.md") return 1;
        if (pathA === "package.json") return -1;
        if (pathB === "package.json") return 1;
        return pathA.localeCompare(pathB);
    });

    // Create the first file using Contents API - this initializes the repo
    const [firstPath, firstContent] = fileEntries[0];
    console.log(`Creating initial file: ${firstPath}`);

    const firstFileResponse = await fetch(
        `https://api.github.com/repos/${repo}/contents/${firstPath}`,
        {
            method: "PUT",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                Accept: "application/vnd.github.v3+json",
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                message: commitMessage,
                content: Buffer.from(firstContent || "").toString("base64"),
                branch,
            }),
        }
    );

    if (!firstFileResponse.ok) {
        const error = await firstFileResponse.json();
        throw new Error(`Failed to create initial file: ${error.message}`);
    }

    const firstFileData = await firstFileResponse.json();
    let lastCommitSha = firstFileData.commit.sha;
    console.log(`Initial file created, commit: ${lastCommitSha}`);

    // If only one file, we're done
    if (fileEntries.length === 1) {
        return lastCommitSha;
    }

    // For remaining files, we can now use the Git Data API since repo is initialized
    // Add remaining files one commit at a time using Contents API (simpler and reliable)
    const remainingFiles = fileEntries.slice(1);

    // Batch remaining files into one commit using Git Data API
    // First, get the current tree
    const refResponse = await fetch(
        `https://api.github.com/repos/${repo}/git/refs/heads/${branch}`,
        {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                Accept: "application/vnd.github.v3+json",
            },
        }
    );

    if (!refResponse.ok) {
        throw new Error("Failed to get branch reference");
    }

    const refData = await refResponse.json();
    const currentCommitSha = refData.object.sha;

    // Get the current commit to find its tree
    const commitResponse = await fetch(
        `https://api.github.com/repos/${repo}/git/commits/${currentCommitSha}`,
        {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                Accept: "application/vnd.github.v3+json",
            },
        }
    );

    if (!commitResponse.ok) {
        throw new Error("Failed to get commit details");
    }

    const commitData = await commitResponse.json();
    const baseTreeSha = commitData.tree.sha;

    // Create tree with all remaining files
    const treeItems = remainingFiles.map(([path, content]) => ({
        path,
        mode: "100644" as const,
        type: "blob" as const,
        content: content || "",
    }));

    const treeResponse = await fetch(
        `https://api.github.com/repos/${repo}/git/trees`,
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                Accept: "application/vnd.github.v3+json",
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                base_tree: baseTreeSha,
                tree: treeItems,
            }),
        }
    );

    if (!treeResponse.ok) {
        const error = await treeResponse.json();
        throw new Error(`Failed to create tree: ${error.message}`);
    }

    const treeData = await treeResponse.json();

    // Create commit with remaining files
    const newCommitResponse = await fetch(
        `https://api.github.com/repos/${repo}/git/commits`,
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                Accept: "application/vnd.github.v3+json",
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                message: "Add project files from Craft",
                tree: treeData.sha,
                parents: [currentCommitSha],
            }),
        }
    );

    if (!newCommitResponse.ok) {
        const error = await newCommitResponse.json();
        throw new Error(`Failed to create commit: ${error.message}`);
    }

    const newCommitData = await newCommitResponse.json();

    // Update branch reference
    const updateRefResponse = await fetch(
        `https://api.github.com/repos/${repo}/git/refs/heads/${branch}`,
        {
            method: "PATCH",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                Accept: "application/vnd.github.v3+json",
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                sha: newCommitData.sha,
            }),
        }
    );

    if (!updateRefResponse.ok) {
        const error = await updateRefResponse.json();
        throw new Error(`Failed to update branch: ${error.message}`);
    }

    console.log(`All ${fileEntries.length} files committed, final SHA: ${newCommitData.sha}`);
    return newCommitData.sha;
}

/**
 * Create a blob for a file
 */
async function createBlob(
    accessToken: string,
    repo: string,
    content: string
): Promise<string> {
    const response = await fetch(
        `https://api.github.com/repos/${repo}/git/blobs`,
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                Accept: "application/vnd.github.v3+json",
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                content,
                encoding: "utf-8",
            }),
        }
    );

    if (!response.ok) {
        const error = await response.json();
        throw new Error(`Failed to create blob: ${error.message}`);
    }

    const data = await response.json();
    return data.sha;
}

/**
 * Create a Git tree with all project files
 * For empty repos, we need to create blobs first
 */
async function createGitTree(
    accessToken: string,
    repo: string,
    files: Record<string, string | unknown>,
    isEmptyRepo: boolean = false
) {
    let tree: Array<{
        path: string;
        mode: string;
        type: string;
        sha?: string;
        content?: string;
    }>;

    if (isEmptyRepo) {
        // For empty repos, create blobs first then reference them by SHA
        tree = await Promise.all(
            Object.entries(files).map(async ([path, content]) => {
                const contentStr = typeof content === 'string' ? content : '';
                const sha = await createBlob(accessToken, repo, contentStr);
                return {
                    path,
                    mode: "100644",
                    type: "blob",
                    sha,
                };
            })
        );
    } else {
        // For repos with commits, we can include content directly
        tree = Object.entries(files).map(([path, content]) => ({
            path,
            mode: "100644",
            type: "blob",
            content: typeof content === 'string' ? content : '',
        }));
    }

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
 * Update or create branch reference to point to a commit
 */
async function updateBranchRef(
    accessToken: string,
    repo: string,
    branch: string,
    commitSha: string
) {
    // First, try to create the ref (works for new/empty repos)
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

    if (createResponse.ok) {
        return await createResponse.json();
    }

    // If ref already exists (422 error), update it with PATCH
    if (createResponse.status === 422) {
        const updateResponse = await fetch(
            `https://api.github.com/repos/${repo}/git/refs/heads/${branch}`,
            {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    Accept: "application/vnd.github.v3+json",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    sha: commitSha,
                    force: false,
                }),
            }
        );

        if (!updateResponse.ok) {
            const error = await updateResponse.json();
            throw new Error(`Failed to update branch ref: ${error.message}`);
        }

        return await updateResponse.json();
    }

    const error = await createResponse.json();
    throw new Error(`Failed to create branch ref: ${error.message}`);
}

/**
 * Push updates to an existing linked GitHub repository
 */
export async function pushToGitHub(
    userId: string,
    project: Project,
    options: GitHubPushOptions = {}
) {
    // Get GitHub integration
    const integration = await prisma.gitHubIntegration.findUnique({
        where: { userId },
    });

    if (!integration || !integration.isActive) {
        throw new Error("GitHub account not connected");
    }

    // Use user OAuth token for pushing (has repo access)
    const accessToken = await getUserOAuthToken(integration);

    // Find linked repository for this project
    const repository = await prisma.gitHubRepository.findFirst({
        where: { projectId: project.id },
    });

    if (!repository) {
        throw new Error("No GitHub repository linked to this project. Please create or link a repository first.");
    }

    const branch = options.branch || repository.defaultBranch;
    const commitMessage = options.commitMessage || `Update from Craft - ${new Date().toISOString()}`;

    // Create deployment record
    const deployment = await prisma.deployment.create({
        data: {
            projectId: project.id,
            userId,
            platform: "github",
            status: "pending",
            githubRepositoryId: repository.id,
            githubBranch: branch,
            startedAt: new Date(),
        },
    });

    try {
        // Get the latest commit SHA from the branch
        const refResponse = await fetch(
            `https://api.github.com/repos/${repository.fullName}/git/refs/heads/${branch}`,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    Accept: "application/vnd.github.v3+json",
                },
            }
        );

        let parentSha: string | undefined;

        if (refResponse.ok) {
            const refData = await refResponse.json();
            parentSha = refData.object.sha;
        }

        // Update deployment status
        await prisma.deployment.update({
            where: { id: deployment.id },
            data: { status: "building" },
        });

        // Prepare project files
        const files = typeof project.codeFiles === 'object' && project.codeFiles !== null
            ? project.codeFiles
            : {};

        if (Object.keys(files).length === 0) {
            throw new Error("No files to push");
        }

        // Create tree with updated files
        const tree = await createGitTree(
            accessToken,
            repository.fullName,
            files as Record<string, string | unknown>
        );

        // Create commit with parent (if exists)
        const commit = await createGitCommit(
            accessToken,
            repository.fullName,
            tree.sha,
            commitMessage,
            parentSha
        );

        // Update branch reference
        if (parentSha) {
            // Branch exists, update it
            const updateResponse = await fetch(
                `https://api.github.com/repos/${repository.fullName}/git/refs/heads/${branch}`,
                {
                    method: "PATCH",
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        Accept: "application/vnd.github.v3+json",
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        sha: commit.sha,
                        force: false,
                    }),
                }
            );

            if (!updateResponse.ok) {
                const error = await updateResponse.json();
                throw new Error(`Failed to update branch: ${error.message}`);
            }
        } else {
            // Branch doesn't exist, create it
            await updateBranchRef(
                accessToken,
                repository.fullName,
                branch,
                commit.sha
            );
        }

        // Update repository last sync
        await prisma.gitHubRepository.update({
            where: { id: repository.id },
            data: { updatedAt: new Date() },
        });

        // Deployment successful
        const finalDeployment = await prisma.deployment.update({
            where: { id: deployment.id },
            data: {
                status: "ready",
                githubCommitSha: commit.sha,
                completedAt: new Date(),
            },
        });

        return {
            deployment: finalDeployment,
            commitSha: commit.sha,
            commitMessage,
            repository: {
                name: repository.name,
                fullName: repository.fullName,
                htmlUrl: repository.htmlUrl,
                branch,
            },
        };
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
 * Link an existing GitHub repository to a project
 */
export async function linkGitHubRepository(
    userId: string,
    projectId: string,
    repoFullName: string,
    options: GitHubLinkOptions = {}
) {
    // Get GitHub integration
    const integration = await prisma.gitHubIntegration.findUnique({
        where: { userId },
    });

    if (!integration || !integration.isActive) {
        throw new Error("GitHub account not connected");
    }

    // Use user OAuth token for accessing repos
    const accessToken = await getUserOAuthToken(integration);

    // Verify project ownership
    const project = await prisma.project.findUnique({
        where: { id: projectId, userId },
    });

    if (!project) {
        throw new Error("Project not found or access denied");
    }

    // Check if project already has a linked repo
    const existingLink = await prisma.gitHubRepository.findFirst({
        where: { projectId },
    });

    if (existingLink) {
        throw new Error("Project already has a linked repository. Unlink it first.");
    }

    // Fetch repository info from GitHub
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
        throw new Error(`Repository not found: ${error.message || repoFullName}`);
    }

    const repoData = await repoResponse.json();

    // Check if this repo is already linked to another project
    const existingRepoLink = await prisma.gitHubRepository.findUnique({
        where: { githubRepoId: repoData.id },
    });

    if (existingRepoLink && existingRepoLink.projectId) {
        throw new Error("This repository is already linked to another project");
    }

    // Create or update repository link
    const repository = await prisma.gitHubRepository.upsert({
        where: { githubRepoId: repoData.id },
        update: {
            projectId,
            defaultBranch: options.branch || repoData.default_branch,
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
            defaultBranch: options.branch || repoData.default_branch,
            htmlUrl: repoData.html_url,
            cloneUrl: repoData.clone_url,
            sshUrl: repoData.ssh_url,
            description: repoData.description,
        },
    });

    return {
        repository: {
            id: repository.id,
            name: repository.name,
            fullName: repository.fullName,
            htmlUrl: repository.htmlUrl,
            defaultBranch: repository.defaultBranch,
            isPrivate: repository.isPrivate,
        },
    };
}

/**
 * Unlink a GitHub repository from a project
 */
export async function unlinkGitHubRepository(
    userId: string,
    projectId: string
) {
    // Verify project ownership
    const project = await prisma.project.findUnique({
        where: { id: projectId, userId },
    });

    if (!project) {
        throw new Error("Project not found or access denied");
    }

    // Find linked repository
    const repository = await prisma.gitHubRepository.findFirst({
        where: { projectId },
    });

    if (!repository) {
        throw new Error("No repository linked to this project");
    }

    // Remove the project link (keep the repository record for history)
    await prisma.gitHubRepository.update({
        where: { id: repository.id },
        data: { projectId: null },
    });

    return { success: true };
}
