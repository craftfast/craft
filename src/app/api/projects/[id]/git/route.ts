import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { withCsrfProtection } from "@/lib/csrf";
import { encryptValue, decryptValue } from "@/lib/crypto";

// GET /api/projects/[id]/git - Get Git connection
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth.api.getSession({
            headers: req.headers,
        });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id: projectId } = await params;

        // Verify project access
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: {
                gitConnections: true,
            },
        });

        if (!project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        const hasAccess =
            project.userId === session.user.id ||
            (await prisma.projectCollaborator.findFirst({
                where: { projectId, userId: session.user.id },
            })) !== null;

        if (!hasAccess) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const gitConnection = project.gitConnections[0];
        if (!gitConnection) {
            return NextResponse.json({ connection: null });
        }

        // Return connection without sensitive data
        return NextResponse.json({
            connection: {
                id: gitConnection.id,
                provider: gitConnection.provider,
                repository: gitConnection.repository,
                branch: gitConnection.branch,
                username: gitConnection.username,
                repoUrl: gitConnection.repoUrl,
                connectedAt: gitConnection.connectedAt,
                lastSyncAt: gitConnection.lastSyncAt,
            },
        });
    } catch (error) {
        console.error("Error fetching Git connection:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// POST /api/projects/[id]/git - Connect Git provider
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
        const { provider, repository, branch, accessToken, refreshToken, username, repoUrl } =
            body;

        if (!provider || !repository || !accessToken) {
            return NextResponse.json(
                { error: "Provider, repository, and access token are required" },
                { status: 400 }
            );
        }

        // Verify project ownership
        const project = await prisma.project.findUnique({
            where: { id: projectId, userId: session.user.id },
        });

        if (!project) {
            return NextResponse.json(
                { error: "Project not found or access denied" },
                { status: 404 }
            );
        }

        // Encrypt tokens
        const encryptedAccessToken = encryptValue(accessToken);
        const encryptedRefreshToken = refreshToken
            ? encryptValue(refreshToken)
            : null;

        // Check if connection exists
        const existing = await prisma.projectGitConnection.findUnique({
            where: { projectId },
        });

        let connection;
        if (existing) {
            // Update existing connection
            connection = await prisma.projectGitConnection.update({
                where: { projectId },
                data: {
                    provider,
                    repository,
                    branch: branch || "main",
                    accessToken: encryptedAccessToken,
                    refreshToken: encryptedRefreshToken,
                    username,
                    repoUrl,
                    lastSyncAt: new Date(),
                },
            });
        } else {
            // Create new connection
            connection = await prisma.projectGitConnection.create({
                data: {
                    projectId,
                    provider,
                    repository,
                    branch: branch || "main",
                    accessToken: encryptedAccessToken,
                    refreshToken: encryptedRefreshToken,
                    username,
                    repoUrl,
                },
            });
        }

        return NextResponse.json({
            connection: {
                id: connection.id,
                provider: connection.provider,
                repository: connection.repository,
                branch: connection.branch,
                username: connection.username,
                repoUrl: connection.repoUrl,
                connectedAt: connection.connectedAt,
            },
        });
    } catch (error) {
        console.error("Error connecting Git provider:", error);
        return NextResponse.json(
            { error: "Failed to connect Git provider" },
            { status: 500 }
        );
    }
}

// DELETE /api/projects/[id]/git - Disconnect Git provider
export async function DELETE(
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

        // Verify project ownership
        const project = await prisma.project.findUnique({
            where: { id: projectId, userId: session.user.id },
        });

        if (!project) {
            return NextResponse.json(
                { error: "Project not found or access denied" },
                { status: 404 }
            );
        }

        // Delete connection
        await prisma.projectGitConnection.deleteMany({
            where: { projectId },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error disconnecting Git provider:", error);
        return NextResponse.json(
            { error: "Failed to disconnect Git provider" },
            { status: 500 }
        );
    }
}
