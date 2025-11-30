import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { deployToGitHub } from "@/lib/services/github-deploy";

export async function POST(request: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { projectId, repositoryName, description, isPrivate } = await request.json();

        if (!projectId) {
            return NextResponse.json(
                { error: "Project ID is required" },
                { status: 400 }
            );
        }

        // Get the project
        const project = await prisma.project.findUnique({
            where: { id: projectId, userId: session.user.id },
        });

        if (!project) {
            return NextResponse.json(
                { error: "Project not found" },
                { status: 404 }
            );
        }

        // Check if project already has a linked repo
        const existingRepo = await prisma.gitHubRepository.findFirst({
            where: { projectId },
        });

        if (existingRepo) {
            return NextResponse.json(
                { error: "Project already has a linked repository. Unlink it first." },
                { status: 400 }
            );
        }

        // Create new repository and push code
        const result = await deployToGitHub(session.user.id, project, {
            repositoryName: repositoryName || project.name.toLowerCase().replace(/\s+/g, "-"),
            repositoryDescription: description || `Created with Craft`,
            isPrivate: isPrivate ?? true,
        });

        return NextResponse.json({
            success: true,
            repository: result.repository,
            deployment: {
                id: result.deployment.id,
                status: result.deployment.status,
            },
            commitSha: result.commitSha,
        });
    } catch (error) {
        console.error("GitHub create repo error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to create repository" },
            { status: 500 }
        );
    }
}
