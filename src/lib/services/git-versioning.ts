/**
 * Git-Native Versioning Service
 * 
 * Replaces the custom ProjectVersion table with GitHub as the single source of truth.
 * Each AI edit becomes a Git commit, enabling:
 * - Real diffs between versions
 * - Branching and merging
 * - Industry-standard version control
 * - Seamless GitHub integration
 * 
 * Architecture:
 * 1. AI edits files → Auto-commit to GitHub
 * 2. Version history = Git log via GitHub API
 * 3. Restore version = Checkout commit
 * 4. Diff view = Git diff via GitHub API
 */

import { prisma } from "@/lib/db";
import type { Project, GitHubIntegration, GitHubRepository } from "@prisma/client";
import { refreshAccessToken } from "@/lib/github-app";

// ============================================================================
// TYPES
// ============================================================================

export interface GitCommit {
    sha: string;
    message: string;
    author: {
        name: string;
        email: string;
        date: string;
    };
    committer: {
        name: string;
        email: string;
        date: string;
    };
    url: string;
    filesChanged?: number;
    additions?: number;
    deletions?: number;
}

export interface GitDiff {
    filename: string;
    status: 'added' | 'modified' | 'removed' | 'renamed';
    additions: number;
    deletions: number;
    changes: number;
    patch?: string;
    previousFilename?: string;
}

export interface CommitOptions {
    message: string;
    files: Record<string, string | null>; // null = delete file
    branch?: string;
}

export interface VersionInfo {
    sha: string;
    shortSha: string;
    message: string;
    author: string;
    date: Date;
    isBookmarked?: boolean; // Can use GitHub tags for bookmarks
}

// ============================================================================
// TOKEN MANAGEMENT
// ============================================================================

/**
 * Get valid OAuth token for GitHub API calls
 */
async function getValidToken(integration: GitHubIntegration): Promise<string> {
    const now = new Date();
    const bufferTime = 5 * 60 * 1000; // 5 minutes

    if (
        integration.tokenExpiresAt &&
        integration.tokenExpiresAt.getTime() < now.getTime() + bufferTime
    ) {
        if (!integration.refreshToken) {
            throw new Error("GitHub token expired. Please reconnect GitHub.");
        }

        if (
            integration.refreshTokenExpiresAt &&
            integration.refreshTokenExpiresAt.getTime() < now.getTime()
        ) {
            throw new Error("GitHub refresh token expired. Please reconnect GitHub.");
        }

        const newTokens = await refreshAccessToken(integration.refreshToken);
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

        return newTokens.access_token;
    }

    return integration.accessToken;
}

// ============================================================================
// CORE GIT OPERATIONS
// ============================================================================

/**
 * Check if project has a linked GitHub repository
 */
export async function hasLinkedRepository(projectId: string): Promise<boolean> {
    const repository = await prisma.gitHubRepository.findFirst({
        where: { projectId },
    });
    return !!repository;
}

/**
 * Get linked repository for a project
 */
export async function getLinkedRepository(projectId: string): Promise<GitHubRepository | null> {
    return prisma.gitHubRepository.findFirst({
        where: { projectId },
    });
}

/**
 * Commit files to GitHub repository
 * This is the core function for Git-native versioning
 */
export async function commitToGitHub(
    userId: string,
    projectId: string,
    options: CommitOptions
): Promise<{ sha: string; url: string }> {
    const { message, files, branch } = options;

    // Get GitHub integration
    const integration = await prisma.gitHubIntegration.findUnique({
        where: { userId },
    });

    if (!integration || !integration.isActive) {
        throw new Error("GitHub not connected. Please connect GitHub to enable versioning.");
    }

    // Get linked repository
    const repository = await prisma.gitHubRepository.findFirst({
        where: { projectId },
    });

    if (!repository) {
        throw new Error("No GitHub repository linked. Please create or link a repository first.");
    }

    const accessToken = await getValidToken(integration);
    const targetBranch = branch || repository.defaultBranch;
    const repoFullName = repository.fullName;

    // Get the latest commit SHA from the branch
    const refResponse = await fetch(
        `https://api.github.com/repos/${repoFullName}/git/refs/heads/${targetBranch}`,
        {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                Accept: "application/vnd.github.v3+json",
            },
        }
    );

    if (!refResponse.ok) {
        throw new Error(`Failed to get branch reference: ${refResponse.statusText}`);
    }

    const refData = await refResponse.json();
    const parentSha = refData.object.sha;

    // Get the current tree
    const commitResponse = await fetch(
        `https://api.github.com/repos/${repoFullName}/git/commits/${parentSha}`,
        {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                Accept: "application/vnd.github.v3+json",
            },
        }
    );

    if (!commitResponse.ok) {
        throw new Error("Failed to get current commit");
    }

    const commitData = await commitResponse.json();
    const baseTreeSha = commitData.tree.sha;

    // Create tree items for changed files
    const treeItems = Object.entries(files).map(([path, content]) => {
        if (content === null) {
            // Delete file - use special mode
            return {
                path,
                mode: "100644" as const,
                type: "blob" as const,
                sha: null, // null SHA deletes the file
            };
        }
        return {
            path,
            mode: "100644" as const,
            type: "blob" as const,
            content,
        };
    });

    // Create new tree
    const treeResponse = await fetch(
        `https://api.github.com/repos/${repoFullName}/git/trees`,
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

    // Create commit
    const newCommitResponse = await fetch(
        `https://api.github.com/repos/${repoFullName}/git/commits`,
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                Accept: "application/vnd.github.v3+json",
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                message,
                tree: treeData.sha,
                parents: [parentSha],
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
        `https://api.github.com/repos/${repoFullName}/git/refs/heads/${targetBranch}`,
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

    // Update repository last sync
    await prisma.gitHubRepository.update({
        where: { id: repository.id },
        data: {
            lastSyncedAt: new Date(),
            updatedAt: new Date(),
        },
    });

    // Update project's last code update timestamp
    await prisma.project.update({
        where: { id: projectId },
        data: {
            lastCodeUpdateAt: new Date(),
            updatedAt: new Date(),
        },
    });

    console.log(`✅ Committed to GitHub: ${newCommitData.sha.substring(0, 7)} - ${message}`);

    return {
        sha: newCommitData.sha,
        url: `https://github.com/${repoFullName}/commit/${newCommitData.sha}`,
    };
}

/**
 * Auto-commit after AI makes changes
 * Called after generateFiles tool execution
 */
export async function autoCommitAfterEdit(
    userId: string,
    projectId: string,
    changedFiles: Array<{ path: string; action: 'created' | 'updated' | 'deleted' }>,
    taskDescription?: string
): Promise<{ sha: string; url: string } | null> {
    // Check if project has linked repo
    const hasRepo = await hasLinkedRepository(projectId);
    if (!hasRepo) {
        console.log("⏭️ No linked repository, skipping auto-commit");
        return null;
    }

    // Get current files from project
    const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { codeFiles: true, name: true },
    });

    if (!project) {
        throw new Error("Project not found");
    }

    const codeFiles = (project.codeFiles as Record<string, string>) || {};

    // Build files map for commit
    const files: Record<string, string | null> = {};
    for (const change of changedFiles) {
        if (change.action === 'deleted') {
            files[change.path] = null;
        } else {
            files[change.path] = codeFiles[change.path] || "";
        }
    }

    // Generate commit message
    const filesSummary = changedFiles.map(f =>
        `${f.action === 'created' ? '+' : f.action === 'deleted' ? '-' : '~'} ${f.path}`
    ).join(', ');

    const message = taskDescription
        ? `${taskDescription}\n\nFiles: ${filesSummary}`
        : `Update ${changedFiles.length} file(s): ${filesSummary}`;

    try {
        return await commitToGitHub(userId, projectId, {
            message,
            files,
        });
    } catch (error) {
        console.error("Auto-commit failed:", error);
        // Don't throw - auto-commit failure shouldn't break the workflow
        return null;
    }
}

// ============================================================================
// VERSION HISTORY (Git Log)
// ============================================================================

/**
 * Get commit history for a project (replaces ProjectVersion.findMany)
 */
export async function getVersionHistory(
    userId: string,
    projectId: string,
    options: { limit?: number; page?: number } = {}
): Promise<{ commits: VersionInfo[]; totalCount: number }> {
    const { limit = 30, page = 1 } = options;

    const integration = await prisma.gitHubIntegration.findUnique({
        where: { userId },
    });

    if (!integration || !integration.isActive) {
        return { commits: [], totalCount: 0 };
    }

    const repository = await prisma.gitHubRepository.findFirst({
        where: { projectId },
    });

    if (!repository) {
        return { commits: [], totalCount: 0 };
    }

    const accessToken = await getValidToken(integration);

    // Get commits from GitHub API
    const response = await fetch(
        `https://api.github.com/repos/${repository.fullName}/commits?per_page=${limit}&page=${page}`,
        {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                Accept: "application/vnd.github.v3+json",
            },
        }
    );

    if (!response.ok) {
        console.error("Failed to fetch commits:", response.statusText);
        return { commits: [], totalCount: 0 };
    }

    const commits = await response.json();

    // Get total count from headers (Link header pagination)
    const linkHeader = response.headers.get("Link");
    let totalCount = commits.length;
    if (linkHeader?.includes('rel="last"')) {
        const lastMatch = linkHeader.match(/page=(\d+)>; rel="last"/);
        if (lastMatch) {
            totalCount = parseInt(lastMatch[1]) * limit;
        }
    }

    const versionHistory: VersionInfo[] = commits.map((commit: any) => ({
        sha: commit.sha,
        shortSha: commit.sha.substring(0, 7),
        message: commit.commit.message.split('\n')[0], // First line only
        author: commit.commit.author.name,
        date: new Date(commit.commit.author.date),
        isBookmarked: false, // TODO: Use GitHub tags for bookmarks
    }));

    return { commits: versionHistory, totalCount };
}

/**
 * Get a specific commit's details
 */
export async function getCommitDetails(
    userId: string,
    projectId: string,
    commitSha: string
): Promise<GitCommit | null> {
    const integration = await prisma.gitHubIntegration.findUnique({
        where: { userId },
    });

    if (!integration || !integration.isActive) {
        return null;
    }

    const repository = await prisma.gitHubRepository.findFirst({
        where: { projectId },
    });

    if (!repository) {
        return null;
    }

    const accessToken = await getValidToken(integration);

    const response = await fetch(
        `https://api.github.com/repos/${repository.fullName}/commits/${commitSha}`,
        {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                Accept: "application/vnd.github.v3+json",
            },
        }
    );

    if (!response.ok) {
        return null;
    }

    const data = await response.json();

    return {
        sha: data.sha,
        message: data.commit.message,
        author: data.commit.author,
        committer: data.commit.committer,
        url: data.html_url,
        filesChanged: data.files?.length || 0,
        additions: data.stats?.additions || 0,
        deletions: data.stats?.deletions || 0,
    };
}

// ============================================================================
// DIFF OPERATIONS
// ============================================================================

/**
 * Get diff between two commits
 */
export async function getCommitDiff(
    userId: string,
    projectId: string,
    baseSha: string,
    headSha: string
): Promise<GitDiff[]> {
    const integration = await prisma.gitHubIntegration.findUnique({
        where: { userId },
    });

    if (!integration || !integration.isActive) {
        return [];
    }

    const repository = await prisma.gitHubRepository.findFirst({
        where: { projectId },
    });

    if (!repository) {
        return [];
    }

    const accessToken = await getValidToken(integration);

    const response = await fetch(
        `https://api.github.com/repos/${repository.fullName}/compare/${baseSha}...${headSha}`,
        {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                Accept: "application/vnd.github.v3+json",
            },
        }
    );

    if (!response.ok) {
        console.error("Failed to get diff:", response.statusText);
        return [];
    }

    const data = await response.json();

    return (data.files || []).map((file: any) => ({
        filename: file.filename,
        status: file.status,
        additions: file.additions,
        deletions: file.deletions,
        changes: file.changes,
        patch: file.patch,
        previousFilename: file.previous_filename,
    }));
}

/**
 * Get files at a specific commit (for restore/preview)
 */
export async function getFilesAtCommit(
    userId: string,
    projectId: string,
    commitSha: string
): Promise<Record<string, string>> {
    const integration = await prisma.gitHubIntegration.findUnique({
        where: { userId },
    });

    if (!integration || !integration.isActive) {
        throw new Error("GitHub not connected");
    }

    const repository = await prisma.gitHubRepository.findFirst({
        where: { projectId },
    });

    if (!repository) {
        throw new Error("No repository linked");
    }

    const accessToken = await getValidToken(integration);

    // Get tree at commit
    const treeResponse = await fetch(
        `https://api.github.com/repos/${repository.fullName}/git/trees/${commitSha}?recursive=1`,
        {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                Accept: "application/vnd.github.v3+json",
            },
        }
    );

    if (!treeResponse.ok) {
        throw new Error("Failed to get tree");
    }

    const treeData = await treeResponse.json();
    const files: Record<string, string> = {};

    // Filter for blobs (files) only
    const blobs = treeData.tree.filter((item: any) => item.type === "blob");

    // Fetch file contents in parallel (batch of 10)
    const binaryExtensions = ['.ico', '.png', '.jpg', '.jpeg', '.gif', '.webp', '.woff', '.woff2'];

    for (let i = 0; i < blobs.length; i += 10) {
        const batch = blobs.slice(i, i + 10);
        const results = await Promise.allSettled(
            batch.map(async (blob: any) => {
                // Skip binary files
                if (binaryExtensions.some(ext => blob.path.toLowerCase().endsWith(ext))) {
                    return { path: blob.path, content: null };
                }

                const contentResponse = await fetch(
                    `https://api.github.com/repos/${repository.fullName}/contents/${encodeURIComponent(blob.path)}?ref=${commitSha}`,
                    {
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                            Accept: "application/vnd.github.v3+json",
                        },
                    }
                );

                if (!contentResponse.ok) {
                    return { path: blob.path, content: null };
                }

                const contentData = await contentResponse.json();
                if (contentData.content && contentData.encoding === "base64") {
                    const content = Buffer.from(contentData.content, "base64").toString("utf-8");
                    return { path: blob.path, content };
                }
                return { path: blob.path, content: null };
            })
        );

        results.forEach((result) => {
            if (result.status === "fulfilled" && result.value.content !== null) {
                files[result.value.path] = result.value.content;
            }
        });
    }

    return files;
}

// ============================================================================
// RESTORE OPERATIONS
// ============================================================================

/**
 * Restore project to a specific commit
 * Creates a new commit that reverts to the old state (Git best practice)
 */
export async function restoreToCommit(
    userId: string,
    projectId: string,
    commitSha: string
): Promise<{ newSha: string; message: string }> {
    // Get files at the target commit
    const files = await getFilesAtCommit(userId, projectId, commitSha);

    if (Object.keys(files).length === 0) {
        throw new Error("No files found at this commit");
    }

    // Update project's codeFiles
    await prisma.project.update({
        where: { id: projectId },
        data: {
            codeFiles: files,
            updatedAt: new Date(),
            lastCodeUpdateAt: new Date(),
        },
    });

    // Commit the restore as a new commit (Git best practice - don't rewrite history)
    const shortSha = commitSha.substring(0, 7);
    const result = await commitToGitHub(userId, projectId, {
        message: `Restore to commit ${shortSha}\n\nReverted project state to commit ${commitSha}`,
        files,
    });

    return {
        newSha: result.sha,
        message: `Successfully restored to commit ${shortSha}`,
    };
}

// ============================================================================
// BOOKMARKS (GitHub Tags/Releases)
// ============================================================================

/**
 * Bookmark a commit by creating a lightweight tag
 */
export async function bookmarkCommit(
    userId: string,
    projectId: string,
    commitSha: string,
    name: string
): Promise<{ tagName: string }> {
    const integration = await prisma.gitHubIntegration.findUnique({
        where: { userId },
    });

    if (!integration || !integration.isActive) {
        throw new Error("GitHub not connected");
    }

    const repository = await prisma.gitHubRepository.findFirst({
        where: { projectId },
    });

    if (!repository) {
        throw new Error("No repository linked");
    }

    const accessToken = await getValidToken(integration);

    // Create tag name (sanitized)
    const tagName = `bookmark/${name.toLowerCase().replace(/[^a-z0-9-]/g, '-')}`;

    const response = await fetch(
        `https://api.github.com/repos/${repository.fullName}/git/refs`,
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                Accept: "application/vnd.github.v3+json",
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                ref: `refs/tags/${tagName}`,
                sha: commitSha,
            }),
        }
    );

    if (!response.ok) {
        const error = await response.json();
        throw new Error(`Failed to create bookmark: ${error.message}`);
    }

    console.log(`✅ Bookmarked commit ${commitSha.substring(0, 7)} as ${tagName}`);

    return { tagName };
}

/**
 * Get all bookmarked commits for a project
 */
export async function getBookmarkedCommits(
    userId: string,
    projectId: string
): Promise<Array<{ name: string; sha: string; date: Date }>> {
    const integration = await prisma.gitHubIntegration.findUnique({
        where: { userId },
    });

    if (!integration || !integration.isActive) {
        return [];
    }

    const repository = await prisma.gitHubRepository.findFirst({
        where: { projectId },
    });

    if (!repository) {
        return [];
    }

    const accessToken = await getValidToken(integration);

    const response = await fetch(
        `https://api.github.com/repos/${repository.fullName}/git/refs/tags`,
        {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                Accept: "application/vnd.github.v3+json",
            },
        }
    );

    if (!response.ok) {
        return [];
    }

    const tags = await response.json();

    // Filter for bookmark tags only
    const bookmarks = tags
        .filter((tag: any) => tag.ref.startsWith("refs/tags/bookmark/"))
        .map((tag: any) => ({
            name: tag.ref.replace("refs/tags/bookmark/", ""),
            sha: tag.object.sha,
            date: new Date(), // Would need additional API call for date
        }));

    return bookmarks;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if a project needs initial push to GitHub
 */
export async function needsInitialPush(projectId: string): Promise<boolean> {
    const repository = await prisma.gitHubRepository.findFirst({
        where: { projectId },
        select: { lastSyncedAt: true },
    });

    return repository !== null && repository.lastSyncedAt === null;
}

/**
 * Get sync status between local and remote
 */
export async function getSyncStatus(
    userId: string,
    projectId: string
): Promise<{
    synced: boolean;
    localChanges: number;
    behindBy: number;
}> {
    // This is a simplified version - full implementation would compare trees
    const repository = await prisma.gitHubRepository.findFirst({
        where: { projectId },
    });

    if (!repository) {
        return { synced: false, localChanges: 0, behindBy: 0 };
    }

    const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { updatedAt: true, lastCodeUpdateAt: true },
    });

    if (!project) {
        return { synced: false, localChanges: 0, behindBy: 0 };
    }

    // Simple heuristic: if project updated after last sync, there are local changes
    const hasLocalChanges = project.lastCodeUpdateAt && repository.lastSyncedAt
        ? project.lastCodeUpdateAt > repository.lastSyncedAt
        : false;

    return {
        synced: !hasLocalChanges,
        localChanges: hasLocalChanges ? 1 : 0, // Would need proper tracking for accurate count
        behindBy: 0, // Would need to fetch and compare with remote
    };
}
