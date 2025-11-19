/**
 * AI Usage Tracking - OpenRouter Style
 * Tracks AI model usage and deducts exact provider costs from user balance
 */

import { prisma } from "@/lib/db";
import { AVAILABLE_MODELS, getModelConfig } from "@/lib/models/config";
import {
    getDefaultMonthlyCredits,
    MINIMUM_BALANCE_THRESHOLD,
    calculateAICost,
    getModelPricing
} from "@/lib/pricing-constants";

// ============================================================================
// NEW BALANCE SYSTEM
// ============================================================================

/**
 * Check if user has sufficient balance for operation
 * Replaces subscription-based credit checking
 */
export async function checkUserBalance(
    userId: string,
    estimatedCost: number
): Promise<{
    allowed: boolean;
    balance: number;
    estimatedCost: number;
    reason?: string;
}> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { accountBalance: true },
    });

    const balance = Number(user?.accountBalance || 0);
    const allowed = balance >= estimatedCost && balance >= MINIMUM_BALANCE_THRESHOLD;

    return {
        allowed,
        balance,
        estimatedCost,
        reason: allowed
            ? undefined
            : balance < MINIMUM_BALANCE_THRESHOLD
                ? `Minimum balance of $${MINIMUM_BALANCE_THRESHOLD.toFixed(2)} required. Please add credits.`
                : `Insufficient balance. Need $${estimatedCost.toFixed(2)}, have $${balance.toFixed(2)}. Please add credits.`,
    };
}

/**
 * Deduct balance for usage (atomic transaction)
 */
export async function deductBalance(
    userId: string,
    amount: number,
    type: "AI_USAGE" | "SANDBOX_USAGE" | "STORAGE_USAGE" | "DATABASE_USAGE" | "DEPLOYMENT",
    description: string,
    metadata?: Record<string, unknown>
): Promise<number> {
    return await prisma.$transaction(async (tx) => {
        const user = await tx.user.findUnique({
            where: { id: userId },
            select: { accountBalance: true },
        });

        if (!user) {
            throw new Error(`User ${userId} not found`);
        }

        const balanceBefore = Number(user.accountBalance || 0);
        const balanceAfter = balanceBefore - amount;

        // Update user balance
        await tx.user.update({
            where: { id: userId },
            data: { accountBalance: balanceAfter },
        });

        // Create transaction record
        await tx.balanceTransaction.create({
            data: {
                userId,
                type,
                amount: -amount, // Negative for deductions
                balanceBefore,
                balanceAfter,
                description,
                metadata: metadata || {},
            },
        });

        return balanceAfter;
    });
}

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
 * Track AI usage and deduct from balance
 * Records token usage and deducts exact provider cost (no markup)
 */
export async function trackAIUsage(
    usage: AIUsageRecord
): Promise<{ id: string; providerCostUsd: number; balanceAfter: number }> {
    const totalTokens = usage.inputTokens + usage.outputTokens;
    const providerCostUsd = calculateCost(
        usage.model,
        usage.inputTokens,
        usage.outputTokens
    );

    // Deduct from balance and create usage record in transaction
    const result = await prisma.$transaction(async (tx) => {
        // Create usage record
        const record = await tx.aICreditUsage.create({
            data: {
                userId: usage.userId,
                projectId: usage.projectId,
                model: usage.model,
                inputTokens: usage.inputTokens,
                outputTokens: usage.outputTokens,
                totalTokens,
                providerCostUsd,
                endpoint: usage.endpoint,
                callType: usage.callType || "agent",
            },
        });

        // Deduct from user balance
        const user = await tx.user.findUnique({
            where: { id: usage.userId },
            select: { accountBalance: true },
        });

        if (!user) {
            throw new Error(`User ${usage.userId} not found`);
        }

        const balanceBefore = Number(user.accountBalance || 0);
        const balanceAfter = balanceBefore - providerCostUsd;

        await tx.user.update({
            where: { id: usage.userId },
            data: { accountBalance: balanceAfter },
        });

        // Create balance transaction record
        await tx.balanceTransaction.create({
            data: {
                userId: usage.userId,
                type: "AI_USAGE",
                amount: -providerCostUsd,
                balanceBefore,
                balanceAfter,
                description: `AI model usage: ${usage.model} (${usage.inputTokens} input + ${usage.outputTokens} output tokens)`,
                metadata: {
                    usageId: record.id,
                    model: usage.model,
                    inputTokens: usage.inputTokens,
                    outputTokens: usage.outputTokens,
                    totalTokens,
                    endpoint: usage.endpoint,
                    callType: usage.callType || "agent",
                },
            },
        });

        return {
            id: record.id,
            providerCostUsd: record.providerCostUsd,
            balanceAfter,
        };
    });

    return result;
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
    const totalCostUsd = records.reduce((sum: number, r: typeof records[number]) => sum + Number(r.providerCostUsd), 0);

    // Group by model
    const byModel: Record<string, { tokens: number; costUsd: number }> = {};
    for (const record of records) {
        if (!byModel[record.model]) {
            byModel[record.model] = { tokens: 0, costUsd: 0 };
        }
        byModel[record.model].tokens += record.totalTokens;
        byModel[record.model].costUsd += Number(record.providerCostUsd);
    }

    return {
        totalTokens,
        totalCostUsd,
        byModel,
    };
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
    const totalCostUsd = records.reduce((sum: number, r: typeof records[number]) => sum + Number(r.providerCostUsd), 0);

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
    const totalCostUsd = records.reduce((sum: number, r: typeof records[number]) => sum + Number(r.providerCostUsd), 0);

    return {
        totalTokens,
        totalCostUsd,
    };
}

// ============================================================================
// LEGACY SUBSCRIPTION FUNCTIONS - TO BE DELETED
// These are kept temporarily to avoid breaking existing code
// Will be removed in cleanup phase
// ============================================================================

/**
 * @deprecated Use checkUserBalance instead
 * Kept for backward compatibility during transition
 */
export async function getCurrentPeriodAIUsage(userId: string): Promise<{
    totalTokens: number;
    totalCostUsd: number;
    byModel: Record<string, { tokens: number; costUsd: number }>;
}> {
    // Return current month usage as fallback
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return getUserAIUsageInRange(userId, startDate, endDate);
}
