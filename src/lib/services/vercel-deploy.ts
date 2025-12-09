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
        // Prepare project files from database
        const codeFiles = typeof project.codeFiles === 'object' && project.codeFiles !== null
            ? project.codeFiles as Record<string, string>
            : {};

        // Sanitize project name for Vercel (lowercase, alphanumeric and hyphens only)
        const vercelProjectName = (options.projectName || project.name)
            .toLowerCase()
            .replace(/[^a-z0-9-]/g, "-")
            .replace(/-+/g, "-")
            .replace(/^-|-$/g, "")
            .substring(0, 100);

        // Build team query param if we have a team ID
        const teamQuery = integration.vercelTeamId
            ? `?teamId=${integration.vercelTeamId}`
            : '';

        // Try to get or create Vercel project
        let vercelProjectId = options.vercelProjectId;

        if (!vercelProjectId) {
            // First, try to get existing project
            const getProjectResponse = await fetch(
                `https://api.vercel.com/v9/projects/${vercelProjectName}${teamQuery}`,
                {
                    headers: {
                        Authorization: `Bearer ${integration.accessToken}`,
                    },
                }
            );

            if (getProjectResponse.ok) {
                // Project exists, use it
                const existingProject = await getProjectResponse.json();
                vercelProjectId = existingProject.id;
                console.log(`Using existing Vercel project: ${vercelProjectName} (${vercelProjectId})`);
            } else if (getProjectResponse.status === 404) {
                // Project doesn't exist, create it
                console.log(`Creating new Vercel project: ${vercelProjectName}`);
                const createProjectResponse = await fetch(
                    `https://api.vercel.com/v9/projects${teamQuery}`,
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

                if (!createProjectResponse.ok) {
                    const error = await createProjectResponse.text();
                    throw new Error(`Failed to create Vercel project: ${error}`);
                }

                const projectData = await createProjectResponse.json();
                vercelProjectId = projectData.id;
                console.log(`Created Vercel project: ${vercelProjectName} (${vercelProjectId})`);
            } else {
                const error = await getProjectResponse.text();
                throw new Error(`Failed to check Vercel project: ${error}`);
            }
        }

        // Prepare files for Vercel deployment
        // Vercel expects files with 'file' (path) and 'data' (base64 encoded content)
        const deploymentFiles = Object.entries(codeFiles).map(([filePath, content]) => {
            // Remove leading slash if present
            const normalizedPath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
            // Base64 encode the content
            const encodedContent = Buffer.from(content || '').toString('base64');

            return {
                file: normalizedPath,
                data: encodedContent,
                encoding: 'base64',
            };
        });

        console.log(`Deploying ${deploymentFiles.length} files to Vercel...`);

        // Create deployment
        const deployResponse = await fetch(
            `https://api.vercel.com/v13/deployments${teamQuery}`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${integration.accessToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: vercelProjectName,
                    project: vercelProjectId,
                    files: deploymentFiles,
                    projectSettings: {
                        framework: "nextjs",
                        buildCommand: "next build",
                        outputDirectory: ".next",
                        installCommand: "npm install",
                    },
                    target: "production",
                }),
            }
        );

        if (!deployResponse.ok) {
            const error = await deployResponse.text();
            console.error("Vercel deployment error:", error);
            throw new Error(`Vercel deployment failed: ${error}`);
        }

        const deployData = await deployResponse.json();
        console.log(`Deployment started: ${deployData.id}, URL: ${deployData.url}`);

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
            deployment.id,
            integration.vercelTeamId
        );

        return finalDeployment;
    } catch (error) {
        console.error("Deployment error:", error);
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
    teamId?: string | null,
    maxAttempts = 60
): Promise<{ status: string; url?: string; vercelUrl?: string }> {
    const teamQuery = teamId ? `?teamId=${teamId}` : '';

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait 5 seconds

        const response = await fetch(
            `https://api.vercel.com/v13/deployments/${vercelDeploymentId}${teamQuery}`,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );

        if (!response.ok) {
            console.log(`Poll attempt ${attempt + 1}: API error, retrying...`);
            continue;
        }

        const data = await response.json();
        console.log(`Poll attempt ${attempt + 1}: State = ${data.readyState}`);

        if (data.readyState === "READY") {
            // Deployment successful
            const deploymentUrl = data.alias?.[0] || data.url;
            await prisma.deployment.update({
                where: { id: deploymentId },
                data: {
                    status: "ready",
                    vercelUrl: deploymentUrl,
                    vercelAliases: data.alias || [],
                    completedAt: new Date(),
                    duration: Math.floor((Date.now() - new Date(data.createdAt).getTime()) / 1000),
                },
            });

            console.log(`Deployment ready: https://${deploymentUrl}`);
            return { status: "ready", url: deploymentUrl, vercelUrl: deploymentUrl };
        } else if (data.readyState === "ERROR" || data.readyState === "CANCELED") {
            // Deployment failed
            const errorMessage = data.errorMessage || "Vercel deployment failed";
            await prisma.deployment.update({
                where: { id: deploymentId },
                data: {
                    status: "error",
                    errorMessage,
                    completedAt: new Date(),
                },
            });

            console.error(`Deployment failed: ${errorMessage}`);
            return { status: "error" };
        }
    }

    // Timeout
    console.error("Deployment timeout after 5 minutes");
    await prisma.deployment.update({
        where: { id: deploymentId },
        data: {
            status: "error",
            errorMessage: "Deployment timeout - build took too long",
            completedAt: new Date(),
        },
    });

    return { status: "error" };
}
