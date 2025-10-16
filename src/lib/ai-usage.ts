/**
 * AI Token Usage Tracking
 * Tracks AI model usage and costs for billing
 */

import { prisma } from "@/lib/db";

// AI Model pricing per 1M tokens (in USD)
// Updated from OpenRouter pricing (October 16, 2025)
const MODEL_PRICING = {
    // Claude models
    "claude-sonnet-4.5": { input: 3.0, output: 15.0 },
    "claude-sonnet-3.5": { input: 3.0, output: 15.0 },
    "claude-haiku-4.5": { input: 1.0, output: 5.0 },

    // GPT models
    "gpt-5": { input: 1.25, output: 10.0 },
    "gpt-5-mini": { input: 0.25, output: 2.0 },
    "gpt-4-turbo": { input: 10.0, output: 30.0 },

    // Gemini models
    "gemini-2.5-pro": { input: 1.25, output: 10.0 },
    "gemini-2.5-flash": { input: 0.3, output: 2.5 },

    // Grok models
    "grok-2": { input: 2.0, output: 6.0 },

    // Default fallback
    default: { input: 1.0, output: 3.0 },
} as const;

export interface AIUsageRecord {
    teamId: string;
    userId: string;
    projectId: string;
    model: string;
    inputTokens: number;
    outputTokens: number;
    endpoint?: string;
}

/**
 * Calculate cost for AI usage
 */
function calculateCost(
    model: string,
    inputTokens: number,
    outputTokens: number
): number {
    const pricing =
        MODEL_PRICING[model as keyof typeof MODEL_PRICING] || MODEL_PRICING.default;

    // Cost per 1M tokens, so divide by 1,000,000
    const inputCost = (inputTokens / 1000000) * pricing.input;
    const outputCost = (outputTokens / 1000000) * pricing.output;

    return inputCost + outputCost;
}

/**
 * Track AI token usage
 */
export async function trackAIUsage(
    usage: AIUsageRecord
): Promise<{ id: string; costUsd: number }> {
    const totalTokens = usage.inputTokens + usage.outputTokens;
    const costUsd = calculateCost(
        usage.model,
        usage.inputTokens,
        usage.outputTokens
    );

    const record = await prisma.aITokenUsage.create({
        data: {
            teamId: usage.teamId,
            userId: usage.userId,
            projectId: usage.projectId,
            model: usage.model,
            inputTokens: usage.inputTokens,
            outputTokens: usage.outputTokens,
            totalTokens,
            costUsd,
            endpoint: usage.endpoint,
        },
    });

    return {
        id: record.id,
        costUsd: record.costUsd,
    };
}

/**
 * Get AI usage for a team in a date range
 */
export async function getTeamAIUsage(
    teamId: string,
    startDate: Date,
    endDate: Date
): Promise<{
    totalTokens: number;
    totalCostUsd: number;
    byModel: Record<string, { tokens: number; costUsd: number }>;
}> {
    const records = await prisma.aITokenUsage.findMany({
        where: {
            teamId,
            createdAt: {
                gte: startDate,
                lte: endDate,
            },
        },
    });

    const totalTokens = records.reduce((sum, r) => sum + r.totalTokens, 0);
    const totalCostUsd = records.reduce((sum, r) => sum + r.costUsd, 0);

    // Group by model
    const byModel: Record<string, { tokens: number; costUsd: number }> = {};
    for (const record of records) {
        if (!byModel[record.model]) {
            byModel[record.model] = { tokens: 0, costUsd: 0 };
        }
        byModel[record.model].tokens += record.totalTokens;
        byModel[record.model].costUsd += record.costUsd;
    }

    return {
        totalTokens,
        totalCostUsd,
        byModel,
    };
}

/**
 * Get AI usage for current billing period
 */
export async function getCurrentPeriodAIUsage(teamId: string): Promise<{
    totalTokens: number;
    totalCostUsd: number;
    byModel: Record<string, { tokens: number; costUsd: number }>;
}> {
    // Get team's subscription to determine billing period
    const subscription = await prisma.teamSubscription.findUnique({
        where: { teamId },
    });

    if (!subscription) {
        // No subscription, use current month
        const now = new Date();
        const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        return getTeamAIUsage(teamId, startDate, endDate);
    }

    return getTeamAIUsage(
        teamId,
        subscription.currentPeriodStart,
        subscription.currentPeriodEnd
    );
}

/**
 * Get AI usage by project
 */
export async function getProjectAIUsage(
    projectId: string,
    startDate: Date,
    endDate: Date
): Promise<{
    totalTokens: number;
    totalCostUsd: number;
}> {
    const records = await prisma.aITokenUsage.findMany({
        where: {
            projectId,
            createdAt: {
                gte: startDate,
                lte: endDate,
            },
        },
    });

    const totalTokens = records.reduce((sum, r) => sum + r.totalTokens, 0);
    const totalCostUsd = records.reduce((sum, r) => sum + r.costUsd, 0);

    return {
        totalTokens,
        totalCostUsd,
    };
}

/**
 * Get AI usage by user
 */
export async function getUserAIUsage(
    userId: string,
    startDate: Date,
    endDate: Date
): Promise<{
    totalTokens: number;
    totalCostUsd: number;
}> {
    const records = await prisma.aITokenUsage.findMany({
        where: {
            userId,
            createdAt: {
                gte: startDate,
                lte: endDate,
            },
        },
    });

    const totalTokens = records.reduce((sum, r) => sum + r.totalTokens, 0);
    const totalCostUsd = records.reduce((sum, r) => sum + r.costUsd, 0);

    return {
        totalTokens,
        totalCostUsd,
    };
}

/**
 * Get available AI models for a plan
 */
export function getAvailableModels(
    planName: "HOBBY" | "PRO" | "ENTERPRISE"
): string[] {
    if (planName === "HOBBY") {
        return [
            "claude-haiku-4.5",
            "gpt-5-mini",
            "gemini-2.5-flash",
            "claude-sonnet-3.5",
        ];
    }

    if (planName === "PRO") {
        return [
            ...getAvailableModels("HOBBY"),
            "gpt-5",
            "claude-sonnet-4.5",
            "gemini-2.5-pro",
            "grok-2",
        ];
    }

    // ENTERPRISE gets all models
    return Object.keys(MODEL_PRICING).filter((key) => key !== "default");
}

/**
 * Check if team can use a specific model
 */
export async function canUseModel(
    teamId: string,
    model: string
): Promise<boolean> {
    const subscription = await prisma.teamSubscription.findUnique({
        where: { teamId },
        include: { plan: true },
    });

    const planName = (subscription?.plan.name as "HOBBY" | "PRO" | "ENTERPRISE") || "HOBBY";
    const availableModels = getAvailableModels(planName);

    return availableModels.includes(model);
}

// ============================================================================
// TOKEN PURCHASE TRACKING
// ============================================================================

/**
 * Record a token purchase
 */
export async function recordTokenPurchase(params: {
    teamId: string;
    userId: string;
    tokenAmount: number;
    priceUsd: number;
    polarCheckoutId?: string;
    polarPaymentId?: string;
}): Promise<{ id: string; success: boolean }> {
    const purchase = await prisma.tokenPurchase.create({
        data: {
            teamId: params.teamId,
            userId: params.userId,
            tokenAmount: params.tokenAmount,
            priceUsd: params.priceUsd,
            tokensRemaining: params.tokenAmount,
            status: "completed",
            polarCheckoutId: params.polarCheckoutId,
            polarPaymentId: params.polarPaymentId,
            expiresAt: null, // Tokens never expire
        },
    });

    return {
        id: purchase.id,
        success: true,
    };
}

/**
 * Get team's purchased token balance
 */
export async function getTeamTokenBalance(teamId: string): Promise<{
    totalPurchased: number;
    totalUsed: number;
    remaining: number;
}> {
    // Get all completed token purchases for the team
    const purchases = await prisma.tokenPurchase.findMany({
        where: {
            teamId,
            status: "completed",
        },
    });

    const totalPurchased = purchases.reduce(
        (sum, p) => sum + p.tokenAmount,
        0
    );

    const remaining = purchases.reduce((sum, p) => sum + p.tokensRemaining, 0);
    const totalUsed = totalPurchased - remaining;

    return {
        totalPurchased,
        totalUsed,
        remaining,
    };
}

/**
 * Deduct tokens from purchased balance
 * This should be called after AI usage to reduce the purchased token balance
 */
export async function deductPurchasedTokens(
    teamId: string,
    tokensToDeduct: number
): Promise<{ success: boolean; remaining: number }> {
    // Get purchases with remaining tokens, oldest first
    const purchases = await prisma.tokenPurchase.findMany({
        where: {
            teamId,
            status: "completed",
            tokensRemaining: {
                gt: 0,
            },
        },
        orderBy: {
            purchasedAt: "asc", // Use oldest purchases first
        },
    });

    let remainingToDeduct = tokensToDeduct;

    // Deduct from purchases until we've used all tokens needed
    for (const purchase of purchases) {
        if (remainingToDeduct <= 0) break;

        const deductFromThis = Math.min(
            purchase.tokensRemaining,
            remainingToDeduct
        );

        await prisma.tokenPurchase.update({
            where: { id: purchase.id },
            data: {
                tokensRemaining: purchase.tokensRemaining - deductFromThis,
            },
        });

        remainingToDeduct -= deductFromThis;
    }

    const balance = await getTeamTokenBalance(teamId);

    return {
        success: remainingToDeduct === 0,
        remaining: balance.remaining,
    };
}

/**
 * Get token purchase history for a team
 */
export async function getTeamTokenPurchases(
    teamId: string
): Promise<
    Array<{
        id: string;
        tokenAmount: number;
        priceUsd: number;
        tokensRemaining: number;
        purchasedAt: Date;
        status: string;
    }>
> {
    const purchases = await prisma.tokenPurchase.findMany({
        where: { teamId },
        orderBy: {
            purchasedAt: "desc",
        },
    });

    return purchases.map((p) => ({
        id: p.id,
        tokenAmount: p.tokenAmount,
        priceUsd: p.priceUsd,
        tokensRemaining: p.tokensRemaining,
        purchasedAt: p.purchasedAt,
        status: p.status,
    }));
}
