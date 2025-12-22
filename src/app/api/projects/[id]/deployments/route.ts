import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { withCsrfProtection } from "@/lib/csrf";
import {
    createVercelProject,
    getVercelProject,
    createDeployment,
    prepareFilesForDeployment,
    waitForDeployment,
} from "@/lib/services/vercel-platforms";
import { trackDeploymentUsage } from "@/lib/infrastructure-usage";
import { checkUserBalance } from "@/lib/ai-usage";
import { MINIMUM_BALANCE_THRESHOLD } from "@/lib/pricing-constants";

// GET /api/projects/[id]/deployments - Get all deployments
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

        // Get deployments
        const deployments = await prisma.projectDeployment.findMany({
            where: { projectId },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json({ deployments });
    } catch (error) {
        console.error("Error fetching deployments:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// POST /api/projects/[id]/deployments - Create new deployment
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
        const { provider, environment = "production" } = body;

        if (!provider) {
            return NextResponse.json(
                { error: "Provider is required" },
                { status: 400 }
            );
        }

        // Check balance before deployment
        const { balance, allowed } = await checkUserBalance(session.user.id, MINIMUM_BALANCE_THRESHOLD);
        if (!allowed) {
            return NextResponse.json(
                {
                    error: `Insufficient balance. Minimum $${MINIMUM_BALANCE_THRESHOLD.toFixed(2)} required.`,
                    balance,
                    required: MINIMUM_BALANCE_THRESHOLD,
                },
                { status: 402 }
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

        // Create deployment
        const deployment = await prisma.projectDeployment.create({
            data: {
                projectId,
                provider,
                environment,
                status: "pending",
            },
        });

        // Trigger deployment based on provider
        try {
            const result = await triggerDeployment(
                provider,
                project,
                deployment.id,
                environment
            );

            // Update deployment with result
            await prisma.projectDeployment.update({
                where: { id: deployment.id },
                data: {
                    status: result.success ? "active" : "failed",
                    deploymentId: result.deploymentId,
                    url: result.url,
                    metadata: result.metadata as object,
                },
            });

            return NextResponse.json({
                deployment: {
                    ...deployment,
                    status: result.success ? "active" : "failed",
                    deploymentId: result.deploymentId,
                    url: result.url,
                },
            });
        } catch (error) {
            // Mark deployment as failed
            await prisma.projectDeployment.update({
                where: { id: deployment.id },
                data: { status: "failed" },
            });

            throw error;
        }
    } catch (error) {
        console.error("Error creating deployment:", error);
        return NextResponse.json(
            { error: "Failed to create deployment" },
            { status: 500 }
        );
    }
}

/**
 * Trigger deployment on various providers
 */
interface ProjectData {
    id: string;
    userId: string;
    name: string;
    codeFiles: unknown;
}

async function triggerDeployment(
    provider: string,
    project: ProjectData,
    _deploymentId: string,
    environment: string
): Promise<{
    success: boolean;
    deploymentId?: string;
    url?: string;
    metadata?: Record<string, unknown>;
}> {
    const projectName = project.name.toLowerCase().replace(/[^a-z0-9]/g, "-");

    switch (provider) {
        case "vercel":
            return await deployToVercel(project, projectName, environment);
        case "netlify":
            return await deployToNetlify(project, projectName, environment);
        case "railway":
            return await deployToRailway(project, projectName, environment);
        default:
            // For other providers, mark as pending (manual setup required)
            return {
                success: true,
                metadata: {
                    message: "Manual deployment setup required",
                    setupInstructions: `Please configure ${provider} manually`,
                },
            };
    }
}

/**
 * Deploy to Vercel using Platforms service (Craft-managed account)
 */
async function deployToVercel(
    project: ProjectData & { id: string; userId: string },
    projectName: string,
    _environment: string
): Promise<{
    success: boolean;
    deploymentId?: string;
    url?: string;
    metadata?: Record<string, unknown>;
}> {
    const VERCEL_PLATFORM_TOKEN = process.env.VERCEL_PLATFORM_TOKEN;

    if (!VERCEL_PLATFORM_TOKEN) {
        return {
            success: false,
            metadata: { error: "Vercel Platform not configured. Please contact support." },
        };
    }

    try {
        // Check user balance
        const user = await prisma.user.findUnique({
            where: { id: project.userId },
            select: { accountBalance: true },
        });

        const balance = Number(user?.accountBalance || 0);
        const minimumBalance = 0.50; // Minimum $0.50 required for deployment

        if (balance < minimumBalance) {
            return {
                success: false,
                metadata: {
                    error: `Insufficient balance. You need at least $${minimumBalance.toFixed(2)} to deploy. Current balance: $${balance.toFixed(2)}`,
                },
            };
        }

        // Get or create Vercel project
        let vercelProject = await getVercelProject(projectName);

        if (!vercelProject) {
            vercelProject = await createVercelProject({
                name: projectName,
                framework: "nextjs",
                buildCommand: "next build",
                outputDirectory: ".next",
                installCommand: "npm install",
            });

            // Save Vercel project ID to our project
            await prisma.project.update({
                where: { id: project.id },
                data: {
                    vercelProjectId: vercelProject.id,
                    vercelProjectName: vercelProject.name,
                },
            });
        }

        // Prepare files for deployment
        const codeFiles = typeof project.codeFiles === "object" && project.codeFiles !== null
            ? (project.codeFiles as Record<string, string>)
            : {};

        const files = prepareFilesForDeployment(codeFiles);

        if (files.length === 0) {
            return {
                success: false,
                metadata: { error: "No files to deploy" },
            };
        }

        // Create deployment
        const deployment = await createDeployment({
            projectId: vercelProject.id,
            files,
            target: "production",
            framework: "nextjs",
        });

        // Wait for deployment to complete (up to 5 minutes)
        const finalDeployment = await waitForDeployment(deployment.id, 300000);

        const deploymentUrl = finalDeployment.alias?.[0] || finalDeployment.url;

        // Update project with deployment URL
        await prisma.project.update({
            where: { id: project.id },
            data: {
                vercelUrl: deploymentUrl ? `https://${deploymentUrl}` : null,
            },
        });

        // Track deployment usage (charges for build time)
        try {
            await trackDeploymentUsage({
                userId: project.userId,
                projectId: project.id,
                deploymentId: deployment.id,
                platform: "vercel",
                buildDurationMin: Math.ceil((Date.now() - deployment.createdAt) / (1000 * 60)),
                metadata: {
                    vercelProjectId: vercelProject.id,
                    vercelProjectName: vercelProject.name,
                    url: deploymentUrl,
                },
            });
        } catch (trackError) {
            console.error("Failed to track deployment usage:", trackError);
            // Don't fail the deployment for tracking errors
        }

        return {
            success: true,
            deploymentId: deployment.id,
            url: deploymentUrl ? `https://${deploymentUrl}` : undefined,
            metadata: {
                provider: "vercel-platforms",
                vercelProjectId: vercelProject.id,
                vercelProjectName: vercelProject.name,
            },
        };
    } catch (error) {
        console.error("Vercel deployment error:", error);
        return {
            success: false,
            metadata: {
                error: error instanceof Error ? error.message : "Deployment failed",
            },
        };
    }
}

/**
 * Deploy to Netlify
 */
async function deployToNetlify(
    _project: ProjectData,
    projectName: string,
    environment: string
): Promise<{
    success: boolean;
    deploymentId?: string;
    url?: string;
    metadata?: Record<string, unknown>;
}> {
    const NETLIFY_TOKEN = process.env.NETLIFY_AUTH_TOKEN;

    if (!NETLIFY_TOKEN) {
        return {
            success: false,
            metadata: { error: "Netlify token not configured" },
        };
    }

    // Placeholder for Netlify deployment
    return {
        success: true,
        deploymentId: `netlify_${Date.now()}`,
        url: `https://${projectName}.netlify.app`,
        metadata: {
            provider: "netlify",
            environment,
            message: "Netlify integration placeholder - configure Netlify CLI or API",
        },
    };
}

/**
 * Deploy to Railway
 */
async function deployToRailway(
    _project: ProjectData,
    projectName: string,
    environment: string
): Promise<{
    success: boolean;
    deploymentId?: string;
    url?: string;
    metadata?: Record<string, unknown>;
}> {
    const RAILWAY_TOKEN = process.env.RAILWAY_TOKEN;

    if (!RAILWAY_TOKEN) {
        return {
            success: false,
            metadata: { error: "Railway token not configured" },
        };
    }

    // Placeholder for Railway deployment
    return {
        success: true,
        deploymentId: `railway_${Date.now()}`,
        url: `https://${projectName}.up.railway.app`,
        metadata: {
            provider: "railway",
            environment,
            message: "Railway integration placeholder - configure Railway CLI or API",
        },
    };
}
