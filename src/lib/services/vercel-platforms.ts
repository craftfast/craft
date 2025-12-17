/**
 * Vercel for Platforms Service
 *
 * This service manages Vercel deployments using Craft's own Vercel account
 * (Platform model) rather than user OAuth tokens.
 *
 * Key features:
 * - All deployments are managed under Craft's Vercel team
 * - Usage is tracked and billed to user's balance at exact provider costs
 * - No OAuth flow required from users
 *
 * API Docs: https://vercel.com/docs/rest-api
 */

const VERCEL_API_URL = "https://api.vercel.com";

// Get platform configuration from environment
function getConfig() {
    const token = process.env.VERCEL_PLATFORM_TOKEN;
    const teamId = process.env.VERCEL_TEAM_ID;

    if (!token) {
        throw new Error("VERCEL_PLATFORM_TOKEN environment variable is not set");
    }

    return { token, teamId };
}

// Build query params with team ID
function buildTeamQuery(teamId?: string): string {
    return teamId ? `?teamId=${teamId}` : "";
}

// Types for Vercel API responses
export interface VercelProject {
    id: string;
    name: string;
    accountId: string;
    framework?: string;
    createdAt: number;
    updatedAt: number;
    latestDeployments?: VercelDeployment[];
}

export interface VercelDeployment {
    id: string;
    name: string;
    url: string;
    readyState: "READY" | "BUILDING" | "ERROR" | "CANCELED" | "QUEUED" | "INITIALIZING";
    createdAt: number;
    buildingAt?: number;
    readyAt?: number;
    alias?: string[];
    target?: string;
    creator?: {
        uid: string;
        email: string;
        username: string;
    };
}

export interface DeploymentFile {
    file: string;
    data: string;
    encoding?: "base64" | "utf-8";
}

export interface CreateProjectOptions {
    name: string;
    framework?: "nextjs" | "react" | "vue" | "svelte" | "nuxtjs" | "gatsby" | null;
    buildCommand?: string;
    outputDirectory?: string;
    installCommand?: string;
    environmentVariables?: Record<string, { value: string; target: ("production" | "preview" | "development")[] }>;
}

export interface CreateDeploymentOptions {
    projectId: string;
    files: DeploymentFile[];
    target?: "production" | "preview";
    environmentVariables?: Record<string, string>;
    framework?: string;
    buildCommand?: string;
    outputDirectory?: string;
    installCommand?: string;
}

/**
 * Create a Vercel project
 */
export async function createVercelProject(
    options: CreateProjectOptions
): Promise<VercelProject> {
    const { token, teamId } = getConfig();
    const query = buildTeamQuery(teamId);

    // Sanitize project name
    const sanitizedName = options.name
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")
        .substring(0, 100);

    const response = await fetch(`${VERCEL_API_URL}/v9/projects${query}`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            name: sanitizedName,
            framework: options.framework || "nextjs",
            buildCommand: options.buildCommand,
            outputDirectory: options.outputDirectory,
            installCommand: options.installCommand,
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        console.error("Failed to create Vercel project:", error);
        throw new Error(`Failed to create Vercel project: ${error}`);
    }

    const project: VercelProject = await response.json();

    // Add environment variables if provided
    if (options.environmentVariables) {
        await setEnvironmentVariables(project.id, options.environmentVariables);
    }

    return project;
}

/**
 * Get a Vercel project by ID or name
 */
export async function getVercelProject(projectIdOrName: string): Promise<VercelProject | null> {
    const { token, teamId } = getConfig();
    const query = buildTeamQuery(teamId);

    const response = await fetch(
        `${VERCEL_API_URL}/v9/projects/${projectIdOrName}${query}`,
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

    if (response.status === 404) {
        return null;
    }

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to get Vercel project: ${error}`);
    }

    return response.json();
}

/**
 * Delete a Vercel project
 */
export async function deleteVercelProject(projectIdOrName: string): Promise<void> {
    const { token, teamId } = getConfig();
    const query = buildTeamQuery(teamId);

    const response = await fetch(
        `${VERCEL_API_URL}/v9/projects/${projectIdOrName}${query}`,
        {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

    if (!response.ok && response.status !== 404) {
        const error = await response.text();
        throw new Error(`Failed to delete Vercel project: ${error}`);
    }
}

/**
 * Set environment variables for a project
 */
export async function setEnvironmentVariables(
    projectId: string,
    variables: Record<string, { value: string; target: ("production" | "preview" | "development")[] }>
): Promise<void> {
    const { token, teamId } = getConfig();
    const query = buildTeamQuery(teamId);

    const envVars = Object.entries(variables).map(([key, config]) => ({
        key,
        value: config.value,
        target: config.target,
        type: "encrypted",
    }));

    const response = await fetch(
        `${VERCEL_API_URL}/v10/projects/${projectId}/env${query}`,
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(envVars),
        }
    );

    if (!response.ok) {
        const error = await response.text();
        console.error("Failed to set environment variables:", error);
        // Don't throw, env vars are non-critical
    }
}

/**
 * Create a deployment for a project
 */
export async function createDeployment(
    options: CreateDeploymentOptions
): Promise<VercelDeployment> {
    const { token, teamId } = getConfig();
    const query = buildTeamQuery(teamId);

    // Get project to get the name
    const project = await getVercelProject(options.projectId);
    if (!project) {
        throw new Error(`Vercel project ${options.projectId} not found`);
    }

    const response = await fetch(`${VERCEL_API_URL}/v13/deployments${query}`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            name: project.name,
            project: options.projectId,
            files: options.files,
            projectSettings: {
                framework: options.framework || "nextjs",
                buildCommand: options.buildCommand || "next build",
                outputDirectory: options.outputDirectory || ".next",
                installCommand: options.installCommand || "npm install",
            },
            target: options.target || "production",
            env: options.environmentVariables,
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        console.error("Failed to create deployment:", error);
        throw new Error(`Failed to create Vercel deployment: ${error}`);
    }

    return response.json();
}

/**
 * Get deployment status
 */
export async function getDeployment(deploymentId: string): Promise<VercelDeployment | null> {
    const { token, teamId } = getConfig();
    const query = buildTeamQuery(teamId);

    const response = await fetch(
        `${VERCEL_API_URL}/v13/deployments/${deploymentId}${query}`,
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

    if (response.status === 404) {
        return null;
    }

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to get deployment: ${error}`);
    }

    return response.json();
}

/**
 * List deployments for a project
 */
export async function listDeployments(
    projectId: string,
    limit: number = 10
): Promise<VercelDeployment[]> {
    const { token, teamId } = getConfig();
    const teamQuery = teamId ? `&teamId=${teamId}` : "";

    const response = await fetch(
        `${VERCEL_API_URL}/v6/deployments?projectId=${projectId}&limit=${limit}${teamQuery}`,
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to list deployments: ${error}`);
    }

    const data = await response.json();
    return data.deployments || [];
}

/**
 * Cancel a deployment
 */
export async function cancelDeployment(deploymentId: string): Promise<void> {
    const { token, teamId } = getConfig();
    const query = buildTeamQuery(teamId);

    const response = await fetch(
        `${VERCEL_API_URL}/v12/deployments/${deploymentId}/cancel${query}`,
        {
            method: "PATCH",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

    if (!response.ok && response.status !== 404) {
        const error = await response.text();
        throw new Error(`Failed to cancel deployment: ${error}`);
    }
}

/**
 * Delete a deployment
 */
export async function deleteDeployment(deploymentId: string): Promise<void> {
    const { token, teamId } = getConfig();
    const query = buildTeamQuery(teamId);

    const response = await fetch(
        `${VERCEL_API_URL}/v13/deployments/${deploymentId}${query}`,
        {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

    if (!response.ok && response.status !== 404) {
        const error = await response.text();
        throw new Error(`Failed to delete deployment: ${error}`);
    }
}

/**
 * Get deployment build logs
 */
export async function getDeploymentLogs(deploymentId: string): Promise<string[]> {
    const { token, teamId } = getConfig();
    const teamQuery = teamId ? `&teamId=${teamId}` : "";

    const response = await fetch(
        `${VERCEL_API_URL}/v3/deployments/${deploymentId}/events?builds=1${teamQuery}`,
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

    if (!response.ok) {
        return [];
    }

    const events = await response.json();
    return events
        .filter((e: { type: string; payload?: { text?: string } }) =>
            e.type === "stdout" || e.type === "stderr"
        )
        .map((e: { payload?: { text?: string } }) => e.payload?.text || "");
}

/**
 * Wait for deployment to complete
 */
export async function waitForDeployment(
    deploymentId: string,
    maxWaitMs: number = 300000, // 5 minutes
    pollIntervalMs: number = 5000 // 5 seconds
): Promise<VercelDeployment> {
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitMs) {
        const deployment = await getDeployment(deploymentId);

        if (!deployment) {
            throw new Error("Deployment not found");
        }

        if (deployment.readyState === "READY") {
            return deployment;
        }

        if (deployment.readyState === "ERROR" || deployment.readyState === "CANCELED") {
            throw new Error(`Deployment ${deployment.readyState.toLowerCase()}`);
        }

        await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    }

    throw new Error("Deployment timeout");
}

/**
 * Prepare files for Vercel deployment from code files map
 */
export function prepareFilesForDeployment(
    codeFiles: Record<string, string>
): DeploymentFile[] {
    return Object.entries(codeFiles).map(([filePath, content]) => {
        // Remove leading slash if present
        const normalizedPath = filePath.startsWith("/") ? filePath.slice(1) : filePath;
        // Base64 encode the content
        const encodedContent = Buffer.from(content || "").toString("base64");

        return {
            file: normalizedPath,
            data: encodedContent,
            encoding: "base64" as const,
        };
    });
}

/**
 * Validate platform configuration
 */
export function validateConfiguration(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!process.env.VERCEL_PLATFORM_TOKEN) {
        errors.push("VERCEL_PLATFORM_TOKEN is not set");
    }

    // VERCEL_TEAM_ID is optional for personal accounts
    if (!process.env.VERCEL_TEAM_ID) {
        console.warn("VERCEL_TEAM_ID is not set - deployments will use personal account");
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}

/**
 * Get Vercel project URL
 */
export function getProjectDashboardUrl(projectName: string): string {
    const teamId = process.env.VERCEL_TEAM_ID;
    if (teamId) {
        return `https://vercel.com/${teamId}/${projectName}`;
    }
    return `https://vercel.com/dashboard/${projectName}`;
}
