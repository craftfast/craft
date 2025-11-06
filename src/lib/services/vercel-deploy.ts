import { prisma } from "@/lib/db";
import type { Project } from "@prisma/client";

interface DeploymentOptions {
    projectName?: string;
    vercelProjectId?: string;
    environmentVariables?: Record<string, string>;
}

/**
 * Deploy a project to Vercel
 */
export async function deployToVercel(
    userId: string,
    project: Project,
    options: DeploymentOptions = {}
) {
    // Get Vercel integration
    const integration = await prisma.vercelIntegration.findUnique({
        where: { userId },
    });

    if (!integration || !integration.isActive) {
        throw new Error("Vercel account not connected");
    }

    // Create deployment record
    const deployment = await prisma.deployment.create({
        data: {
            projectId: project.id,
            userId,
            vercelIntegrationId: integration.id,
            platform: "vercel",
            status: "pending",
            startedAt: new Date(),
        },
    });

    try {
        // Prepare project files
        const files = typeof project.codeFiles === 'object' && project.codeFiles !== null
            ? project.codeFiles
            : {};

        // Create or get Vercel project
        const vercelProjectName =
            options.projectName || project.name.toLowerCase().replace(/\s+/g, "-");
        let vercelProjectId = options.vercelProjectId;

        if (!vercelProjectId) {
            // Create new Vercel project
            const projectResponse = await fetch(
                `https://api.vercel.com/v9/projects`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${integration.accessToken}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        name: vercelProjectName,
                        framework: "nextjs",
                    }),
                }
            );

            if (!projectResponse.ok) {
                const error = await projectResponse.text();
                throw new Error(`Failed to create Vercel project: ${error}`);
            }

            const projectData = await projectResponse.json();
            vercelProjectId = projectData.id;
        }

        // Deploy to Vercel
        const deployResponse = await fetch(
            `https://api.vercel.com/v13/deployments`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${integration.accessToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: vercelProjectName,
                    files: Object.entries(files).map(([file, data]) => ({
                        file,
                        data: typeof data === 'string' ? data : '',
                    })),
                    projectSettings: {
                        framework: "nextjs",
                    },
                    target: "production",
                    gitSource: null, // Direct deployment without Git
                }),
            }
        );

        if (!deployResponse.ok) {
            const error = await deployResponse.text();
            throw new Error(`Vercel deployment failed: ${error}`);
        }

        const deployData = await deployResponse.json();

        // Update deployment record
        await prisma.deployment.update({
            where: { id: deployment.id },
            data: {
                status: "building",
                vercelDeploymentId: deployData.id,
                vercelProjectId: vercelProjectId,
                vercelUrl: deployData.url,
            },
        });

        // Poll deployment status
        const finalDeployment = await pollVercelDeployment(
            integration.accessToken,
            deployData.id,
            deployment.id
        );

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
 * Poll Vercel deployment status until complete
 */
async function pollVercelDeployment(
    accessToken: string,
    vercelDeploymentId: string,
    deploymentId: string,
    maxAttempts = 60
): Promise<{ status: string; url?: string }> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait 5 seconds

        const response = await fetch(
            `https://api.vercel.com/v13/deployments/${vercelDeploymentId}`,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );

        if (!response.ok) {
            continue;
        }

        const data = await response.json();

        if (data.readyState === "READY") {
            // Deployment successful
            const deployment = await prisma.deployment.update({
                where: { id: deploymentId },
                data: {
                    status: "ready",
                    vercelUrl: data.url,
                    vercelAliases: data.alias || [],
                    completedAt: new Date(),
                    duration: Math.floor((Date.now() - new Date(data.createdAt).getTime()) / 1000),
                },
            });

            return deployment;
        } else if (data.readyState === "ERROR") {
            // Deployment failed
            const deployment = await prisma.deployment.update({
                where: { id: deploymentId },
                data: {
                    status: "error",
                    errorMessage: "Vercel deployment failed",
                    completedAt: new Date(),
                },
            });

            return deployment;
        }
    }

    // Timeout
    const deployment = await prisma.deployment.update({
        where: { id: deploymentId },
        data: {
            status: "error",
            errorMessage: "Deployment timeout",
            completedAt: new Date(),
        },
    });

    return deployment;
}
