import { prisma } from "@/lib/db";

export interface UsageData {
    apiCalls: { current: number; limit: number; percentage: number };
    aiTokens: { current: number; limit: number; percentage: number };
    storage: { current: number; limit: number; percentage: number };
    bandwidth: { current: number; limit: number; percentage: number };
    builds: { current: number; limit: number; percentage: number };
}

/**
 * Get AI token usage from chat messages
 */
async function getAITokenUsage(projectId: string): Promise<{
    current: number;
    limit: number;
    percentage: number;
}> {
    try {
        // Get current month's date range
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        const messages = await prisma.chatMessage.findMany({
            where: {
                projectId,
                createdAt: {
                    gte: startOfMonth,
                    lte: endOfMonth,
                },
            },
            select: {
                content: true,
                role: true,
            },
        });

        // Rough estimation: ~4 characters per token
        const totalTokens = messages.reduce((sum, msg) => {
            return sum + Math.ceil(msg.content.length / 4);
        }, 0);

        const limit = 1000000; // 1M tokens default
        const percentage = Math.min(100, Math.round((totalTokens / limit) * 100));

        return {
            current: totalTokens,
            limit,
            percentage,
        };
    } catch (error) {
        console.error("Error calculating AI token usage:", error);
        return { current: 0, limit: 1000000, percentage: 0 };
    }
}

/**
 * Get storage usage from files
 */
async function getStorageUsage(projectId: string): Promise<{
    current: number;
    limit: number;
    percentage: number;
}> {
    try {
        const files = await prisma.file.findMany({
            where: {
                projectId,
                isDeleted: false,
            },
            select: {
                size: true,
            },
        });

        // Also include knowledge files
        const knowledgeFiles = await prisma.knowledgeFile.findMany({
            where: {
                projectId,
            },
            select: {
                size: true,
            },
        });

        const totalSize =
            files.reduce((sum, file) => sum + file.size, 0) +
            knowledgeFiles.reduce((sum, file) => sum + file.size, 0);

        const limit = 5000 * 1024 * 1024; // 5GB in bytes
        const percentage = Math.min(100, Math.round((totalSize / limit) * 100));

        return {
            current: totalSize,
            limit,
            percentage,
        };
    } catch (error) {
        console.error("Error calculating storage usage:", error);
        return { current: 0, limit: 5000 * 1024 * 1024, percentage: 0 };
    }
}

/**
 * Get build count from deployments
 */
async function getBuildCount(projectId: string): Promise<{
    current: number;
    limit: number;
    percentage: number;
}> {
    try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const builds = await prisma.projectDeployment.count({
            where: {
                projectId,
                createdAt: {
                    gte: startOfMonth,
                },
            },
        });

        const limit = 100; // 100 builds per month
        const percentage = Math.min(100, Math.round((builds / limit) * 100));

        return {
            current: builds,
            limit,
            percentage,
        };
    } catch (error) {
        console.error("Error calculating build count:", error);
        return { current: 0, limit: 100, percentage: 0 };
    }
}

/**
 * Get comprehensive project usage data
 */
export async function getProjectUsage(
    projectId: string,
    userId: string
): Promise<UsageData> {
    try {
        const [aiTokens, storage, builds] = await Promise.all([
            getAITokenUsage(projectId),
            getStorageUsage(projectId),
            getBuildCount(projectId),
        ]);

        return {
            apiCalls: { current: 0, limit: 10000, percentage: 0 }, // Placeholder
            aiTokens,
            storage,
            bandwidth: { current: 0, limit: 100000 * 1024 * 1024, percentage: 0 }, // Placeholder
            builds,
        };
    } catch (error) {
        console.error("Error getting project usage:", error);
        return {
            apiCalls: { current: 0, limit: 10000, percentage: 0 },
            aiTokens: { current: 0, limit: 1000000, percentage: 0 },
            storage: { current: 0, limit: 5000 * 1024 * 1024, percentage: 0 },
            bandwidth: { current: 0, limit: 100000 * 1024 * 1024, percentage: 0 },
            builds: { current: 0, limit: 100, percentage: 0 },
        };
    }
}

/**
 * Get service costs for a project
 */
export async function getServiceCosts(projectId: string): Promise<{
    services: Array<{
        name: string;
        provider: string;
        cost: number;
        usage: {
            [key: string]: string | number;
        };
    }>;
    total: number;
}> {
    try {
        // Get AI token usage
        const aiTokens = await getAITokenUsage(projectId);
        const aiCost = (aiTokens.current / 1000000) * 3.0; // $3 per 1M tokens (example)

        // Get storage
        const storage = await getStorageUsage(projectId);
        const storageCost = (storage.current / (1024 * 1024 * 1024)) * 0.15; // $0.15 per GB

        // Get deployments
        const builds = await getBuildCount(projectId);
        const deploymentCost = builds.current * 0.1; // $0.10 per build

        const services: Array<{
            name: string;
            provider: string;
            cost: number;
            usage: Record<string, string | number>;
        }> = [
                {
                    name: "AI (Anthropic)",
                    provider: "anthropic",
                    cost: Number(aiCost.toFixed(2)),
                    usage: {
                        tokens: `${(aiTokens.current / 1000).toFixed(0)}K`,
                        requests: 0,
                    },
                },
                {
                    name: "Storage",
                    provider: "r2",
                    cost: Number(storageCost.toFixed(2)),
                    usage: {
                        size: `${(storage.current / (1024 * 1024)).toFixed(2)} MB`,
                        files: 0,
                    },
                },
                {
                    name: "Deployments",
                    provider: "vercel",
                    cost: Number(deploymentCost.toFixed(2)),
                    usage: {
                        builds: builds.current,
                        bandwidth: "0 GB",
                    },
                },
            ];

        const total = services.reduce((sum, service) => sum + service.cost, 0);

        return {
            services,
            total: Number(total.toFixed(2)),
        };
    } catch (error) {
        console.error("Error calculating service costs:", error);
        return {
            services: [],
            total: 0,
        };
    }
}
