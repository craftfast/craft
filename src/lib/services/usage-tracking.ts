import { prisma } from "@/lib/db";
import { USAGE_LIMITS, INFRASTRUCTURE_COSTS } from "@/lib/pricing-constants";

export interface UsageData {
    apiCalls: { current: number; limit: number; percentage: number };
    aiTokens: { current: number; limit: number; percentage: number };
    storage: { current: number; limit: number; percentage: number };
    bandwidth: { current: number; limit: number; percentage: number };
    builds: { current: number; limit: number; percentage: number };
}

/**
 * Get AI token usage from chat messages
 * 
 * Note: This is for display purposes only. With pay-as-you-go model,
 * there are no hard limits - users are billed for actual usage.
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

        // Use a high reference limit for percentage display (pay-as-you-go has no real limit)
        const referenceLimit = 10_000_000; // 10M tokens as reference
        const percentage = Math.min(100, Math.round((totalTokens / referenceLimit) * 100));

        return {
            current: totalTokens,
            limit: referenceLimit,
            percentage,
        };
    } catch (error) {
        console.error("Error calculating AI token usage:", error);
        return { current: 0, limit: 10_000_000, percentage: 0 };
    }
}

/**
 * Get storage usage from files
 * 
 * Note: This is for display purposes. With pay-as-you-go model,
 * users are billed for actual usage from their balance.
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

        const limit = USAGE_LIMITS.STORAGE_BYTES;
        const percentage = Math.min(100, Math.round((totalSize / limit) * 100));

        return {
            current: totalSize,
            limit,
            percentage,
        };
    } catch (error) {
        console.error("Error calculating storage usage:", error);
        return { current: 0, limit: USAGE_LIMITS.STORAGE_BYTES, percentage: 0 };
    }
}

/**
 * Get build count from deployments
 * 
 * Note: This is for display purposes. With pay-as-you-go model,
 * users are billed for actual usage from their balance.
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

        const limit = USAGE_LIMITS.BUILDS_PER_MONTH;
        const percentage = Math.min(100, Math.round((builds / limit) * 100));

        return {
            current: builds,
            limit,
            percentage,
        };
    } catch (error) {
        console.error("Error calculating build count:", error);
        return { current: 0, limit: USAGE_LIMITS.BUILDS_PER_MONTH, percentage: 0 };
    }
}

/**
 * Get comprehensive project usage data
 * 
 * Note: These are reference limits for display purposes.
 * With pay-as-you-go model, there are no hard limits.
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
            apiCalls: { current: 0, limit: USAGE_LIMITS.API_CALLS_PER_MONTH, percentage: 0 },
            aiTokens,
            storage,
            bandwidth: { current: 0, limit: USAGE_LIMITS.BANDWIDTH_BYTES, percentage: 0 },
            builds,
        };
    } catch (error) {
        console.error("Error getting project usage:", error);
        return {
            apiCalls: { current: 0, limit: USAGE_LIMITS.API_CALLS_PER_MONTH, percentage: 0 },
            aiTokens: { current: 0, limit: 10_000_000, percentage: 0 },
            storage: { current: 0, limit: USAGE_LIMITS.STORAGE_BYTES, percentage: 0 },
            bandwidth: { current: 0, limit: USAGE_LIMITS.BANDWIDTH_BYTES, percentage: 0 },
            builds: { current: 0, limit: USAGE_LIMITS.BUILDS_PER_MONTH, percentage: 0 },
        };
    }
}

/**
 * Get service costs for a project
 * 
 * Note: These are estimates based on INFRASTRUCTURE_COSTS constants.
 * Actual costs are calculated in real-time from provider APIs.
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
        // Get AI token usage - cost is calculated per-model in ai-usage.ts
        const aiTokens = await getAITokenUsage(projectId);
        // Rough estimate using average cost (actual cost is model-specific)
        const aiCost = (aiTokens.current / 1_000_000) * 3.0;

        // Get storage - use INFRASTRUCTURE_COSTS
        const storage = await getStorageUsage(projectId);
        const storageCost = (storage.current / (1024 * 1024 * 1024)) * INFRASTRUCTURE_COSTS.storage.perGBMonth;

        // Get deployments - use INFRASTRUCTURE_COSTS
        const builds = await getBuildCount(projectId);
        const deploymentCost = builds.current * INFRASTRUCTURE_COSTS.deployment.perDeploy;

        const services: Array<{
            name: string;
            provider: string;
            cost: number;
            usage: Record<string, string | number>;
        }> = [
                {
                    name: "AI (Multi-provider)",
                    provider: "multi",
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
