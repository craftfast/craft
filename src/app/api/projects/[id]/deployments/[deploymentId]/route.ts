import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { withCsrfProtection } from "@/lib/csrf";

// GET /api/projects/[id]/deployments/[deploymentId] - Get deployment details
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string; deploymentId: string }> }
) {
    try {
        const session = await auth.api.getSession({
            headers: req.headers,
        });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id: projectId, deploymentId } = await params;

        // Verify access
        const deployment = await prisma.projectDeployment.findUnique({
            where: { id: deploymentId },
            include: { project: true },
        });

        if (!deployment) {
            return NextResponse.json(
                { error: "Deployment not found" },
                { status: 404 }
            );
        }

        if (deployment.projectId !== projectId) {
            return NextResponse.json(
                { error: "Deployment does not belong to this project" },
                { status: 400 }
            );
        }

        const hasAccess =
            deployment.project.userId === session.user.id ||
            (await prisma.projectCollaborator.findFirst({
                where: { projectId, userId: session.user.id },
            })) !== null;

        if (!hasAccess) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Fetch latest deployment status from provider
        const status = await fetchDeploymentStatus(deployment);

        // Update status if changed
        if (status.status !== deployment.status) {
            await prisma.projectDeployment.update({
                where: { id: deploymentId },
                data: {
                    status: status.status,
                    metadata: status.metadata as any,
                },
            });
        }

        return NextResponse.json({
            deployment: {
                ...deployment,
                status: status.status,
                metadata: status.metadata,
            },
        });
    } catch (error) {
        console.error("Error fetching deployment:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// DELETE /api/projects/[id]/deployments/[deploymentId] - Delete/cancel deployment
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string; deploymentId: string }> }
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

        const { id: projectId, deploymentId } = await params;

        // Verify ownership
        const deployment = await prisma.projectDeployment.findUnique({
            where: { id: deploymentId },
            include: { project: true },
        });

        if (!deployment) {
            return NextResponse.json(
                { error: "Deployment not found" },
                { status: 404 }
            );
        }

        if (deployment.project.userId !== session.user.id) {
            return NextResponse.json(
                { error: "Only project owner can delete deployments" },
                { status: 403 }
            );
        }

        // Cancel deployment on provider if active
        if (deployment.status === "active") {
            await cancelDeployment(deployment);
        }

        // Delete deployment record
        await prisma.projectDeployment.delete({
            where: { id: deploymentId },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting deployment:", error);
        return NextResponse.json(
            { error: "Failed to delete deployment" },
            { status: 500 }
        );
    }
}

/**
 * Fetch deployment status from provider
 */
async function fetchDeploymentStatus(deployment: any): Promise<{
    status: string;
    metadata?: any;
}> {
    // If no deployment ID, return current status
    if (!deployment.deploymentId) {
        return { status: deployment.status, metadata: deployment.metadata };
    }

    try {
        switch (deployment.provider) {
            case "vercel":
                return await getVercelDeploymentStatus(deployment.deploymentId);
            case "netlify":
                return await getNetlifyDeploymentStatus(deployment.deploymentId);
            case "railway":
                return await getRailwayDeploymentStatus(deployment.deploymentId);
            default:
                return { status: deployment.status, metadata: deployment.metadata };
        }
    } catch (error) {
        console.error("Error fetching deployment status:", error);
        return { status: deployment.status, metadata: deployment.metadata };
    }
}

/**
 * Get Vercel deployment status
 */
async function getVercelDeploymentStatus(deploymentId: string): Promise<any> {
    const VERCEL_TOKEN = process.env.VERCEL_TOKEN;

    if (!VERCEL_TOKEN) {
        return { status: "unknown" };
    }

    // Placeholder - integrate with Vercel API
    return {
        status: "active",
        metadata: {
            message: "Vercel status check placeholder",
        },
    };
}

/**
 * Get Netlify deployment status
 */
async function getNetlifyDeploymentStatus(deploymentId: string): Promise<any> {
    const NETLIFY_TOKEN = process.env.NETLIFY_AUTH_TOKEN;

    if (!NETLIFY_TOKEN) {
        return { status: "unknown" };
    }

    // Placeholder - integrate with Netlify API
    return {
        status: "active",
        metadata: {
            message: "Netlify status check placeholder",
        },
    };
}

/**
 * Get Railway deployment status
 */
async function getRailwayDeploymentStatus(deploymentId: string): Promise<any> {
    const RAILWAY_TOKEN = process.env.RAILWAY_TOKEN;

    if (!RAILWAY_TOKEN) {
        return { status: "unknown" };
    }

    // Placeholder - integrate with Railway API
    return {
        status: "active",
        metadata: {
            message: "Railway status check placeholder",
        },
    };
}

/**
 * Cancel deployment on provider
 */
async function cancelDeployment(deployment: any): Promise<void> {
    if (!deployment.deploymentId) return;

    switch (deployment.provider) {
        case "vercel":
            await cancelVercelDeployment(deployment.deploymentId);
            break;
        case "netlify":
            await cancelNetlifyDeployment(deployment.deploymentId);
            break;
        case "railway":
            await cancelRailwayDeployment(deployment.deploymentId);
            break;
    }
}

async function cancelVercelDeployment(deploymentId: string): Promise<void> {
    // Placeholder
    console.log("Canceling Vercel deployment:", deploymentId);
}

async function cancelNetlifyDeployment(deploymentId: string): Promise<void> {
    // Placeholder
    console.log("Canceling Netlify deployment:", deploymentId);
}

async function cancelRailwayDeployment(deploymentId: string): Promise<void> {
    // Placeholder
    console.log("Canceling Railway deployment:", deploymentId);
}
