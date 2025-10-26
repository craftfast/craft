import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { deployToVercel } from "@/lib/services/vercel-deploy";
import { deployToGitHub } from "@/lib/services/github-deploy";

/**
 * POST /api/integrations/deploy
 * Deploys a project to Vercel or GitHub
 */
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { projectId, platform, options } = body;

        if (!projectId || !platform) {
            return NextResponse.json(
                { error: "Missing projectId or platform" },
                { status: 400 }
            );
        }

        // Get project
        const project = await prisma.project.findUnique({
            where: { id: projectId, userId: session.user.id },
        });

        if (!project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        let deployment;

        if (platform === "vercel") {
            // Deploy to Vercel
            deployment = await deployToVercel(session.user.id, project, options);
        } else if (platform === "github") {
            // Push to GitHub
            deployment = await deployToGitHub(session.user.id, project, options);
        } else {
            return NextResponse.json(
                { error: "Unsupported platform" },
                { status: 400 }
            );
        }

        return NextResponse.json(deployment);
    } catch (error) {
        console.error("Deployment error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Deployment failed" },
            { status: 500 }
        );
    }
}

/**
 * GET /api/integrations/deploy?projectId=xxx
 * Gets deployment history for a project
 */
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const searchParams = request.nextUrl.searchParams;
        const projectId = searchParams.get("projectId");

        if (!projectId) {
            return NextResponse.json(
                { error: "Missing projectId" },
                { status: 400 }
            );
        }

        // Get deployments
        const deployments = await prisma.deployment.findMany({
            where: {
                projectId,
                userId: session.user.id,
            },
            orderBy: {
                createdAt: "desc",
            },
            take: 20,
        });

        return NextResponse.json(deployments);
    } catch (error) {
        console.error("Deployment history error:", error);
        return NextResponse.json(
            { error: "Failed to fetch deployments" },
            { status: 500 }
        );
    }
}
