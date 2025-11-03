/**
 * AI Credit Usage Tracking
 * Tracks AI model usage with daily credit limits (1 credit = 10,000 tokens)
 */

import { prisma } from "@/lib/db";

// AI Model pricing per 1M tokens (in USD)
// Updated from OpenRouter pricing (October 16, 2025)
const MODEL_PRICING = {
    // Claude models (Anthropic direct API format)
    "claude-haiku-4-5": { input: 1.0, output: 5.0 },
    "claude-haiku-3-5": { input: 0.8, output: 4.0 },
    "claude-sonnet-4-5": { input: 3.0, output: 15.0 },
    "claude-sonnet-3-5": { input: 3.0, output: 15.0 },

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
    callType?: "agent" | "edit" | "chat"; // Type of AI interaction (defaults to "agent")
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
 * Track AI credit usage
 * Records token usage and converts to credits based on model multiplier
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

    // Calculate credits and model multiplier
    const creditsUsed = tokensToCredits(totalTokens, usage.model);
    const modelMultiplier = getModelCreditMultiplier(usage.model);

    const record = await prisma.aICreditUsage.create({
        data: {
            userId: usage.userId,
            projectId: usage.projectId,
            model: usage.model,
            inputTokens: usage.inputTokens,
            outputTokens: usage.outputTokens,
            totalTokens,
            costUsd,
            creditsUsed,
            modelMultiplier,
            endpoint: usage.endpoint,
            callType: usage.callType || "agent", // Default to "agent" if not specified
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
    const records = await prisma.aICreditUsage.findMany({
        where: {
            userId,
            createdAt: {
                gte: startDate,
                lte: endDate,
            },
        },
    });

    const totalTokens = records.reduce((sum: number, r: typeof records[number]) => sum + r.totalTokens, 0);
    const totalCostUsd = records.reduce((sum: number, r: typeof records[number]) => sum + r.costUsd, 0);

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
    const records = await prisma.aICreditUsage.findMany({
        where: {
            projectId,
            createdAt: {
                gte: startDate,
                lte: endDate,
            },
        },
    });

    const totalTokens = records.reduce((sum: number, r: typeof records[number]) => sum + r.totalTokens, 0);
    const totalCostUsd = records.reduce((sum: number, r: typeof records[number]) => sum + r.costUsd, 0);

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
    const records = await prisma.aICreditUsage.findMany({
        where: {
            userId,
            createdAt: {
                gte: startDate,
                lte: endDate,
            },
        },
    });

    const totalTokens = records.reduce((sum: number, r: typeof records[number]) => sum + r.totalTokens, 0);
    const totalCostUsd = records.reduce((sum: number, r: typeof records[number]) => sum + r.costUsd, 0);

    return {
        totalTokens,
        totalCostUsd,
    };
}

// ============================================================================
// DAILY CREDIT CHECKING (1 credit = 10,000 tokens)
// ============================================================================

/**
 * Credit conversion constants
 */
export const TOKENS_PER_CREDIT = 10000;

/**
 * Model-based credit multipliers
 * These multipliers adjust credit consumption based on model capability/cost
 * 
 * Base rate: 1.0x = 10,000 tokens per credit
 * 
 * Allowed Models:
 * - gpt-5-mini: 0.25x (cheap)
 * - claude-haiku-4.5: 0.5x (fast)
 * - gpt-5: 1.0x (standard/default)
 * - claude-sonnet-4.5: 1.5x (premium)
 */
const MODEL_CREDIT_MULTIPLIERS: Record<string, number> = {
    // Cheap tier
    "gpt-5-mini": 0.25,
    "openai/gpt-5-mini": 0.25,

    // Fast tier
    "claude-haiku-4-5": 0.5,
    "anthropic/claude-haiku-4.5": 0.5,

    // Standard tier (default)
    "gpt-5": 1.0,
    "openai/gpt-5": 1.0,

    // Premium tier
    "claude-sonnet-4.5": 1.5,
    "anthropic/claude-sonnet-4.5": 1.5,

    // Default fallback - Standard tier
    default: 1.0,
};

/**
 * Get credit multiplier for a specific model
 */
export function getModelCreditMultiplier(model: string): number {
    return MODEL_CREDIT_MULTIPLIERS[model] || MODEL_CREDIT_MULTIPLIERS.default;
}

/**
 * Convert tokens to credits with model-based multiplier (rounded to 2 decimal places)
 * 
 * @param tokens - Number of tokens used
 * @param model - AI model name (optional, defaults to 1.0x multiplier)
 * @returns Credits consumed (rounded to 2 decimal places, e.g., 0.25, 1.50, 2.00)
 * 
 * Supported Models:
 * - gpt-5-mini: 0.25x (cheap)
 * - claude-haiku-4.5: 0.5x (fast)
 * - gpt-5: 1.0x (standard/default)
 * - claude-sonnet-4.5: 1.5x (premium)
 * 
 * @example tokensToCredits(10000) => 1.00 credit (default 1.0x)
 * @example tokensToCredits(2500, "gpt-5-mini") => 0.06 credits (0.25x: 2500 * 0.25 / 10000 = 0.0625 -> 0.06)
 * @example tokensToCredits(5000, "claude-haiku-4.5") => 0.25 credits (0.5x: 5000 * 0.5 / 10000 = 0.25)
 * @example tokensToCredits(10000, "gpt-5") => 1.00 credit (1.0x: 10000 * 1.0 / 10000 = 1.0)
 * @example tokensToCredits(10000, "claude-sonnet-4.5") => 1.50 credits (1.5x: 10000 * 1.5 / 10000 = 1.5)
 */
export function tokensToCredits(tokens: number, model?: string): number {
    const multiplier = model ? getModelCreditMultiplier(model) : 1.0;
    const adjustedTokens = tokens * multiplier;
    const credits = adjustedTokens / TOKENS_PER_CREDIT;
    // Round to 2 decimal places
    return Math.round(credits * 100) / 100;
}

/**
 * Convert credits to tokens
 * @example creditsToTokens(1) => 10000 tokens
 */
export function creditsToTokens(credits: number): number {
    return credits * TOKENS_PER_CREDIT;
}

/**
 * Estimate credits needed for a message (with model-based multiplier)
 * This is a rough estimate - actual usage may vary
 * 
 * @param messageLength - Length of the input message
 * @param expectedResponseLength - Expected length of response (default: 2000)
 * @param model - AI model name (optional, for accurate multiplier)
 */
export function estimateCreditsForMessage(
    messageLength: number,
    expectedResponseLength: number = 2000,
    model?: string
): number {
    // Rough estimation: ~4 characters per token (common approximation)
    const estimatedInputTokens = Math.ceil(messageLength / 4);
    const estimatedOutputTokens = Math.ceil(expectedResponseLength / 4);
    const totalTokens = estimatedInputTokens + estimatedOutputTokens;
    return tokensToCredits(totalTokens, model);
}

/**
 * Reset monthly credits if needed (called at billing period renewal)
 */
async function resetMonthlyCreditsIfNeeded(userId: string): Promise<void> {
    const subscription = await prisma.userSubscription.findUnique({
        where: { userId },
    });

    if (!subscription) return;

    const now = new Date();
    const periodEnd = new Date(subscription.currentPeriodEnd);

    // Check if we've passed the billing period end
    if (now >= periodEnd) {
        // Reset monthly credits for new period
        await prisma.userSubscription.update({
            where: { userId },
            data: {
                monthlyCreditsUsed: 0,
                periodCreditsReset: now,
            },
        });
    }
}

/**
 * Check if user can use AI based on monthly credit limits
 */
export async function checkUserCreditAvailability(
    userId: string
): Promise<{
    allowed: boolean;
    reason?: string;
    monthlyCreditsUsed: number;
    monthlyCreditsLimit: number;
    creditsRemaining: number;
    planName: "HOBBY" | "PRO" | "ENTERPRISE";
    periodEnd: Date;
}> {
    // Reset credits if billing period has ended
    await resetMonthlyCreditsIfNeeded(userId);

    // Get user's subscription with plan details
    const subscription = await prisma.userSubscription.findUnique({
        where: { userId },
        include: { plan: true },
    });

    // Determine monthly credit limit from plan
    let monthlyCreditsLimit: number = 100; // Default to HOBBY tier
    let planName: "HOBBY" | "PRO" | "ENTERPRISE" = "HOBBY";

    if (subscription?.plan) {
        monthlyCreditsLimit = subscription.plan.monthlyCredits || 100;
        planName = subscription.plan.name as "HOBBY" | "PRO" | "ENTERPRISE";
    }

    const monthlyCreditsUsed = subscription?.monthlyCreditsUsed
        ? Number(subscription.monthlyCreditsUsed)
        : 0;
    const creditsRemaining = Math.round(Math.max(0, monthlyCreditsLimit - monthlyCreditsUsed) * 100) / 100;
    const periodEnd = subscription?.currentPeriodEnd || new Date();

    // Check if usage is allowed
    let allowed = true;
    let reason: string | undefined;

    if (monthlyCreditsUsed >= monthlyCreditsLimit) {
        allowed = false;
        const daysUntilReset = Math.ceil((periodEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        reason = `Monthly credit limit reached. Credits reset in ${daysUntilReset} days.`;
    }

    return {
        allowed,
        reason,
        monthlyCreditsUsed,
        monthlyCreditsLimit,
        creditsRemaining,
        planName,
        periodEnd,
    };
}

/**
 * Process AI usage: track it and deduct from monthly credits
 * Credits are calculated based on model tier multipliers
 */
export async function processAIUsage(params: {
    userId: string;
    projectId: string;
    model: string;
    inputTokens: number;
    outputTokens: number;
    endpoint?: string;
    callType?: "agent" | "edit" | "chat"; // Type of AI interaction (defaults to "agent")
}): Promise<{
    success: boolean;
    usageId: string;
    costUsd: number;
    creditsUsed: number;
    modelMultiplier: number; // Added for transparency
}> {
    // Track the usage
    const usage = await trackAIUsage(params);

    // Calculate credits used with model-based multiplier
    const totalTokens = params.inputTokens + params.outputTokens;
    const creditsUsed = tokensToCredits(totalTokens, params.model);
    const modelMultiplier = getModelCreditMultiplier(params.model);

    // Reset credits if billing period has ended
    await resetMonthlyCreditsIfNeeded(params.userId);

    // Get user's subscription
    const subscription = await prisma.userSubscription.findUnique({
        where: { userId: params.userId },
    });

    if (!subscription) {
        throw new Error("No subscription found for user");
    }

    // Update monthly credits used
    await prisma.userSubscription.update({
        where: { userId: params.userId },
        data: {
            monthlyCreditsUsed: {
                increment: creditsUsed,
            },
        },
    });

    // Update or create usage record for current billing period
    const existingUsageRecord = await prisma.usageRecord.findUnique({
        where: {
            subscriptionId_billingPeriodStart: {
                subscriptionId: subscription.id,
                billingPeriodStart: subscription.currentPeriodStart,
            },
        },
    });

    if (existingUsageRecord) {
        // Update existing record - increment credits and cost
        await prisma.usageRecord.update({
            where: { id: existingUsageRecord.id },
            data: {
                aiCreditsUsed: {
                    increment: creditsUsed,
                },
                totalCreditsUsed: {
                    increment: creditsUsed,
                },
                aiCostUsd: {
                    increment: usage.costUsd,
                },
                totalCostUsd: {
                    increment: usage.costUsd,
                },
            },
        });
    } else {
        // Create new record for this billing period
        await prisma.usageRecord.create({
            data: {
                userId: params.userId,
                subscriptionId: subscription.id,
                billingPeriodStart: subscription.currentPeriodStart,
                billingPeriodEnd: subscription.currentPeriodEnd,
                aiCreditsUsed: creditsUsed,
                totalCreditsUsed: creditsUsed,
                aiCostUsd: usage.costUsd,
                totalCostUsd: usage.costUsd,
            },
        });
    }

    return {
        success: true,
        usageId: usage.id,
        costUsd: usage.costUsd,
        creditsUsed,
        modelMultiplier,
    };
}
/**
 * Get detailed credit usage statistics
 */
export async function getCreditUsageStats(userId: string): Promise<{
    currentPeriod: {
        creditsUsed: number;
        creditsLimit: number;
        creditsRemaining: number;
        percentUsed: number;
        periodEnd: Date;
    };
    thisMonth: {
        totalCredits: number;
        totalTokens: number;
        totalCostUsd: number;
    };
}> {
    // Get current credit status
    const creditAvailability = await checkUserCreditAvailability(userId);

    // Get usage for current billing period
    const subscription = await prisma.userSubscription.findUnique({
        where: { userId },
    });

    let periodUsage = { totalTokens: 0, totalCostUsd: 0, byModel: {} };

    if (subscription) {
        periodUsage = await getUserAIUsageInRange(
            userId,
            subscription.currentPeriodStart,
            subscription.currentPeriodEnd
        );
    }

    // Get usage for current month
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const monthUsage = await getUserAIUsageInRange(userId, monthStart, monthEnd);

    // Calculate percentage used
    const percentUsed = creditAvailability.monthlyCreditsLimit
        ? (creditAvailability.monthlyCreditsUsed / creditAvailability.monthlyCreditsLimit) * 100
        : 0;

    return {
        currentPeriod: {
            creditsUsed: creditAvailability.monthlyCreditsUsed,
            creditsLimit: creditAvailability.monthlyCreditsLimit,
            creditsRemaining: creditAvailability.creditsRemaining,
            percentUsed: Math.round(percentUsed * 100) / 100,
            periodEnd: creditAvailability.periodEnd,
        },
        thisMonth: {
            totalCredits: tokensToCredits(monthUsage.totalTokens),
            totalTokens: monthUsage.totalTokens,
            totalCostUsd: monthUsage.totalCostUsd,
        },
    };
}
