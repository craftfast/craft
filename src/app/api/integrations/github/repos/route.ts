import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import { prisma } from "@/lib/db";
import { getUserOAuthToken } from "@/lib/github-app";

/**
 * GET /api/integrations/github/repos
 * Lists user's GitHub repositories
 */
export async function GET(req: NextRequest) {
    try {
        const session = await getSession();

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

        // Get user OAuth token for listing repos
        const accessToken = await getUserOAuthToken(integration);

        // Get query parameters
        const searchParams = req.nextUrl.searchParams;
        const sort = searchParams.get("sort") || "updated";
        const perPage = Math.min(parseInt(searchParams.get("per_page") || "50"), 100);
        const page = parseInt(searchParams.get("page") || "1");
        const type = searchParams.get("type") || "all"; // all, owner, public, private, member

        // Fetch user's repos from GitHub API
        const response = await fetch(
            `https://api.github.com/user/repos?sort=${sort}&per_page=${perPage}&page=${page}&type=${type}`,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    Accept: "application/vnd.github.v3+json",
                },
            }
        );

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            console.error("GitHub API error:", error);

            if (response.status === 401) {
                await prisma.gitHubIntegration.update({
                    where: { id: integration.id },
                    data: { isActive: false },
                });
                return NextResponse.json(
                    { error: "GitHub token expired. Please reconnect." },
                    { status: 401 }
                );
            }

            return NextResponse.json(
                { error: "Failed to fetch repositories" },
                { status: 500 }
            );
        }

        const repos = await response.json();

        // Get linked repos from database to show which are already connected
        const linkedRepos = await prisma.gitHubRepository.findMany({
            where: {
                githubIntegrationId: integration.id,
            },
            select: {
                githubRepoId: true,
                projectId: true,
            },
        });

        const linkedRepoMap = new Map(
            linkedRepos.map((r) => [r.githubRepoId, r.projectId])
        );

        return NextResponse.json({
            repos: repos.map((repo: {
                id: number;
                name: string;
                full_name: string;
                private: boolean;
                default_branch: string;
                html_url: string;
                clone_url: string;
                ssh_url: string;
                description: string | null;
                updated_at: string;
                pushed_at: string;
                language: string | null;
                stargazers_count: number;
                forks_count: number;
                owner: { login: string; avatar_url: string };
            }) => ({
                id: repo.id,
                name: repo.name,
                fullName: repo.full_name,
                private: repo.private,
                defaultBranch: repo.default_branch,
                htmlUrl: repo.html_url,
                cloneUrl: repo.clone_url,
                sshUrl: repo.ssh_url,
                description: repo.description,
                updatedAt: repo.updated_at,
                pushedAt: repo.pushed_at,
                language: repo.language,
                stars: repo.stargazers_count,
                forks: repo.forks_count,
                owner: {
                    login: repo.owner.login,
                    avatarUrl: repo.owner.avatar_url,
                },
                linkedProjectId: linkedRepoMap.get(repo.id) || null,
            })),
            pagination: {
                page,
                perPage,
                hasMore: repos.length === perPage,
            },
        });
    } catch (error) {
        console.error("Error fetching GitHub repos:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
