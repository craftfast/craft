/**
 * AI Credit Usage Tracking
 * Tracks AI model usage with daily credit limits (1 credit = 10,000 tokens)
 */

import { prisma } from "@/lib/db";
import { creditCache, getCreditCacheKey, invalidateCreditCache } from "@/lib/cache";
import { validateTokens, validateModelName, validateCredits } from "@/lib/subscription-validation";
import { AVAILABLE_MODELS, getModelConfig } from "@/lib/models/config";
import { getDefaultMonthlyCredits } from "@/lib/pricing-constants";

/**
 * Generate model pricing dynamically from config
 * Single source of truth for all model pricing
 */
function generateModelPricing(): Record<string, { input: number; output: number }> {
    const pricing: Record<string, { input: number; output: number }> = {};

    // Generate from AVAILABLE_MODELS (single source of truth)
    Object.values(AVAILABLE_MODELS).forEach(model => {
        if (model.pricing) {
            pricing[model.id] = model.pricing;
        }
    });

    // Add legacy model for project naming (Grok)
    pricing['grok-4-fast'] = { input: 0.05, output: 0.15 };
    pricing['x-ai/grok-4-fast'] = { input: 0.05, output: 0.15 };

    // Legacy/alternative model names for backwards compatibility
    pricing['anthropic/claude-sonnet-4.5'] = pricing['claude-sonnet-4.5'] || { input: 3.0, output: 15.0 };
    pricing['anthropic/claude-haiku-4.5'] = pricing['claude-haiku-4-5'] || { input: 1.0, output: 5.0 };

    return pricing;
}

// AI Model pricing per 1M tokens (in USD)
// Dynamically generated from config.ts (single source of truth)
const MODEL_PRICING = {
    ...generateModelPricing(),
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
 * Generate model credit multipliers dynamically from config
 * Single source of truth for all model multipliers
 * 
 * Base rate: 1.0x = 10,000 tokens per credit
 * Multipliers are based on output token pricing from config.ts
 */
function generateModelCreditMultipliers(): Record<string, number> {
    const multipliers: Record<string, number> = {};

    // Generate from AVAILABLE_MODELS (single source of truth)
    Object.values(AVAILABLE_MODELS).forEach(model => {
        multipliers[model.id] = model.creditMultiplier;
    });

    // Legacy/alternative model names for backwards compatibility
    multipliers['anthropic/claude-haiku-4.5'] = multipliers['claude-haiku-4-5'] || 0.5;
    multipliers['anthropic/claude-sonnet-4.5'] = multipliers['claude-sonnet-4.5'] || 1.5;

    return multipliers;
}

/**
 * Model-based credit multipliers
 * Dynamically generated from config.ts (single source of truth)
 */
const MODEL_CREDIT_MULTIPLIERS: Record<string, number> = {
    ...generateModelCreditMultipliers(),
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
 * - claude-haiku-4-5: 1.0x (standard/default)
 * - claude-sonnet-4.5: 2.0x (premium)
 * 
 * @example tokensToCredits(10000) => 1.00 credit (default 1.0x)
 * @example tokensToCredits(10000, "claude-haiku-4-5") => 1.00 credit (1.0x: 10000 * 1.0 / 10000 = 1.0)
 * @example tokensToCredits(10000, "claude-sonnet-4.5") => 2.00 credits (2.0x: 10000 * 2.0 / 10000 = 2.0)
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
    referralCredits?: number; // Added: bonus credits from referrals
}> {
    // Check cache first (5 minute TTL)
    const cacheKey = getCreditCacheKey(userId);
    const cached = creditCache.get(cacheKey);

    if (cached) {
        return cached;
    }

    // Reset credits if billing period has ended
    await resetMonthlyCreditsIfNeeded(userId);

    // Get user's subscription with plan details
    const subscription = await prisma.userSubscription.findUnique({
        where: { userId },
        include: { plan: true },
    });

    // Determine monthly credit limit from plan (using single source of truth)
    let planName: "HOBBY" | "PRO" | "ENTERPRISE" = "HOBBY";
    let monthlyCreditsLimit: number;

    if (subscription?.plan) {
        planName = subscription.plan.name as "HOBBY" | "PRO" | "ENTERPRISE";
        monthlyCreditsLimit = subscription.plan.monthlyCredits || getDefaultMonthlyCredits(planName);
    } else {
        // No subscription yet - use default for HOBBY plan
        monthlyCreditsLimit = getDefaultMonthlyCredits("HOBBY");
    }

    // Get referral credits (1 credit per active referral)
    // Limit: Maximum 50 referral credits
    // Expiration: Only count referrals from last 365 days
    const REFERRAL_CREDIT_LIMIT = 50;
    const REFERRAL_CREDIT_EXPIRY_DAYS = 365;

    const oneYearAgo = new Date();
    oneYearAgo.setDate(oneYearAgo.getDate() - REFERRAL_CREDIT_EXPIRY_DAYS);

    const activeReferralsCount = await prisma.user.count({
        where: {
            referredById: userId,
            deletedAt: null,
            createdAt: {
                gte: oneYearAgo, // Only count referrals from last year
            },
        },
    });

    const referralCredits = Math.min(activeReferralsCount, REFERRAL_CREDIT_LIMIT);

    // Add referral credits to total limit
    const totalMonthlyLimit = monthlyCreditsLimit + referralCredits;

    const monthlyCreditsUsed = subscription?.monthlyCreditsUsed
        ? subscription.monthlyCreditsUsed.toNumber() // Use Decimal.toNumber() for precision
        : 0;
    const creditsRemaining = Math.round(Math.max(0, totalMonthlyLimit - monthlyCreditsUsed) * 100) / 100;
    const periodEnd = subscription?.currentPeriodEnd || new Date();

    // Check if usage is allowed
    let allowed = true;
    let reason: string | undefined;

    if (monthlyCreditsUsed >= totalMonthlyLimit) {
        allowed = false;
        const daysUntilReset = Math.ceil((periodEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        reason = `Monthly credit limit reached. Credits reset in ${daysUntilReset} days.`;
    }

    const result = {
        allowed,
        reason,
        monthlyCreditsUsed,
        monthlyCreditsLimit: totalMonthlyLimit,
        creditsRemaining,
        planName,
        periodEnd,
        referralCredits,
    };

    // Cache the result for 5 minutes to reduce database load
    creditCache.set(cacheKey, result, 300);

    return result;
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
    // Validate input data
    validateTokens({
        inputTokens: params.inputTokens,
        outputTokens: params.outputTokens,
    });
    validateModelName(params.model);

    // Track the usage
    const usage = await trackAIUsage(params);

    // Calculate credits used with model-based multiplier
    const totalTokens = params.inputTokens + params.outputTokens;
    const creditsUsed = tokensToCredits(totalTokens, params.model);
    const modelMultiplier = getModelCreditMultiplier(params.model);

    // Validate credits are positive
    validateCredits(creditsUsed, "creditsUsed");

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

    // Invalidate cache after updating credits
    invalidateCreditCache(params.userId);

    // Check if user should receive credit usage warning
    const updatedAvailability = await checkUserCreditAvailability(params.userId);
    const percentUsed = (updatedAvailability.monthlyCreditsUsed / updatedAvailability.monthlyCreditsLimit) * 100;

    // Send warning emails at 90% and 95% thresholds
    if ((percentUsed >= 90 && percentUsed < 92) || (percentUsed >= 95 && percentUsed < 97)) {
        try {
            const user = await prisma.user.findUnique({
                where: { id: params.userId },
                select: { email: true, name: true, subscription: { include: { plan: true } } },
            });

            if (user && user.subscription) {
                const daysUntilReset = Math.ceil(
                    (updatedAvailability.periodEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                );

                const { sendCreditWarningEmail } = await import("@/lib/subscription-emails");
                await sendCreditWarningEmail({
                    user: {
                        email: user.email,
                        name: user.name,
                    },
                    planName: user.subscription.plan.displayName || user.subscription.plan.name,
                    percentUsed,
                    creditsUsed: updatedAvailability.monthlyCreditsUsed,
                    creditsLimit: updatedAvailability.monthlyCreditsLimit,
                    creditsRemaining: updatedAvailability.creditsRemaining,
                    daysUntilReset,
                });

                console.log(`📧 Sent ${percentUsed >= 95 ? '95%' : '90%'} credit usage warning to ${user.email}`);
            }
        } catch (emailError) {
            console.error('Failed to send credit warning email:', emailError);
            // Don't fail the request if email fails
        }
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
