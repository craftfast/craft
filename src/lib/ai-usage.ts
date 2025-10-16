/**
 * AI Token Usage Tracking
 * Tracks AI model usage and costs for billing
 */

import { prisma } from "@/lib/db";

// AI Model pricing per 1M tokens (in USD)
// Updated from OpenRouter pricing (October 16, 2025)
const MODEL_PRICING = {
    // Claude models (with full OpenRouter path)
    "anthropic/claude-sonnet-4.5": { input: 3.0, output: 15.0 },
    "anthropic/claude-sonnet-3.5": { input: 3.0, output: 15.0 },
    "anthropic/claude-haiku-4.5": { input: 1.0, output: 5.0 },

    // Claude models (short names for backwards compatibility)
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

    // Grok models (with full OpenRouter path)
    "x-ai/grok-4-fast": { input: 0.05, output: 0.15 },
    "x-ai/grok-2": { input: 2.0, output: 6.0 },

    // Grok models (short names for backwards compatibility)
    "grok-4-fast": { input: 0.05, output: 0.15 },
    "grok-2": { input: 2.0, output: 6.0 },

    // Default fallback
    default: { input: 1.0, output: 3.0 },
} as const;

export interface AIUsageRecord {
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
}/**
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
 * Get AI usage for a user in a date range
 */
export async function getUserAIUsageInRange(
    userId: string,
    startDate: Date,
    endDate: Date
): Promise<{
    totalTokens: number;
    totalCostUsd: number;
    byModel: Record<string, { tokens: number; costUsd: number }>;
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
export async function getCurrentPeriodAIUsage(userId: string): Promise<{
    totalTokens: number;
    totalCostUsd: number;
    byModel: Record<string, { tokens: number; costUsd: number }>;
}> {
    // Get user's subscription to determine billing period
    const subscription = await prisma.userSubscription.findUnique({
        where: { userId },
    });

    if (!subscription) {
        // No subscription, use current month
        const now = new Date();
        const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        return getUserAIUsageInRange(userId, startDate, endDate);
    }

    return getUserAIUsageInRange(
        userId,
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

// ============================================================================
// TOKEN PURCHASE TRACKING
// ============================================================================

/**
 * Record a token purchase
 */
export async function recordTokenPurchase(params: {
    userId: string;
    tokenAmount: number;
    priceUsd: number;
    polarCheckoutId?: string;
    polarPaymentId?: string;
}): Promise<{ id: string; success: boolean }> {
    const purchase = await prisma.tokenPurchase.create({
        data: {
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
 * Get user's purchased token balance
 */
export async function getUserTokenBalance(userId: string): Promise<{
    totalPurchased: number;
    totalUsed: number;
    remaining: number;
}> {
    // Get all completed token purchases for the user
    const purchases = await prisma.tokenPurchase.findMany({
        where: {
            userId,
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
    userId: string,
    tokensToDeduct: number
): Promise<{ success: boolean; remaining: number }> {
    // Get purchases with remaining tokens, oldest first
    const purchases = await prisma.tokenPurchase.findMany({
        where: {
            userId,
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

    const balance = await getUserTokenBalance(userId);

    return {
        success: remainingToDeduct === 0,
        remaining: balance.remaining,
    };
}

/**
 * Get token purchase history for a user
 */
export async function getUserTokenPurchases(
    userId: string
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
        where: { userId },
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

// ============================================================================
// TOKEN LIMIT CHECKING
// ============================================================================

/**
 * Check if user can use AI based on subscription limits and purchased tokens
 */
export async function checkUserTokenAvailability(
    userId: string
): Promise<{
    allowed: boolean;
    reason?: string;
    subscriptionTokensUsed: number;
    subscriptionTokenLimit: number | null;
    purchasedTokensRemaining: number;
    totalAvailable: number;
}> {
    // Get user's subscription with plan details
    const subscription = await prisma.userSubscription.findUnique({
        where: { userId },
        include: { plan: true },
    });

    // Get current period usage
    const currentUsage = await getCurrentPeriodAIUsage(userId);

    // Get purchased token balance
    const purchasedBalance = await getUserTokenBalance(userId);

    // Determine subscription token limit from plan
    let subscriptionLimit: number | null = null;

    if (subscription?.plan) {
        subscriptionLimit = subscription.plan.monthlyTokenLimit;
    } else {
        // No subscription = free tier limits (100k tokens)
        subscriptionLimit = 100000;
    }

    // Calculate available tokens
    const subscriptionTokensUsed = currentUsage.totalTokens;
    const subscriptionTokensRemaining = subscriptionLimit !== null
        ? Math.max(0, subscriptionLimit - subscriptionTokensUsed)
        : Infinity;

    const totalAvailable = subscriptionTokensRemaining === Infinity
        ? Infinity
        : subscriptionTokensRemaining + purchasedBalance.remaining;

    // Check if usage is allowed
    let allowed = true;
    let reason: string | undefined;

    if (subscriptionLimit !== null && subscriptionTokensUsed >= subscriptionLimit) {
        // Subscription limit reached, check purchased tokens
        if (purchasedBalance.remaining <= 0) {
            allowed = false;
            reason = "Monthly token limit reached. Purchase additional tokens to continue.";
        }
    }

    return {
        allowed,
        reason,
        subscriptionTokensUsed,
        subscriptionTokenLimit: subscriptionLimit,
        purchasedTokensRemaining: purchasedBalance.remaining,
        totalAvailable: totalAvailable === Infinity ? -1 : totalAvailable,
    };
}

/**
 * Process AI usage: track it and deduct from appropriate balance
 */
export async function processAIUsage(params: {
    userId: string;
    projectId: string;
    model: string;
    inputTokens: number;
    outputTokens: number;
    endpoint?: string;
}): Promise<{
    success: boolean;
    usageId: string;
    costUsd: number;
    deductedFromPurchased: number;
}> {
    // Track the usage
    const usage = await trackAIUsage(params);

    // Get user's subscription with plan details
    const subscription = await prisma.userSubscription.findUnique({
        where: { userId: params.userId },
        include: { plan: true },
    });

    // Determine subscription token limit from plan
    let subscriptionLimit: number | null = null;
    if (subscription?.plan) {
        subscriptionLimit = subscription.plan.monthlyTokenLimit;
    } else {
        subscriptionLimit = 100000; // Default to free tier (100k tokens)
    }

    // Get current period usage (before this request)
    const currentUsage = await getCurrentPeriodAIUsage(params.userId);

    const totalTokens = params.inputTokens + params.outputTokens;
    const newTotalUsage = currentUsage.totalTokens + totalTokens;

    // Determine how many tokens to deduct from purchased balance
    let tokensToDeductFromPurchased = 0;

    if (subscriptionLimit !== null && newTotalUsage > subscriptionLimit) {
        // Exceeded subscription limit, deduct overage from purchased tokens
        tokensToDeductFromPurchased = totalTokens;

        // If previous usage already exceeded limit, deduct all
        // Otherwise, only deduct the overage
        if (currentUsage.totalTokens < subscriptionLimit) {
            tokensToDeductFromPurchased = newTotalUsage - subscriptionLimit;
        }
    }

    // Deduct from purchased balance if needed
    let deductedFromPurchased = 0;
    if (tokensToDeductFromPurchased > 0) {
        const result = await deductPurchasedTokens(params.userId, tokensToDeductFromPurchased);
        deductedFromPurchased = result.success ? tokensToDeductFromPurchased : 0;
    }

    return {
        success: true,
        usageId: usage.id,
        costUsd: usage.costUsd,
        deductedFromPurchased,
    };
}