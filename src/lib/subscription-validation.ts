/**
 * Subscription Data Validation Utilities
 * Ensures data integrity for subscription and credit operations
 */

import { Decimal } from "@prisma/client/runtime/library";

/**
 * Validate credit amount is non-negative
 */
export function validateCredits(credits: number | Decimal, fieldName = "credits"): number {
    const value = typeof credits === "number" ? credits : credits.toNumber();

    if (value < 0) {
        throw new Error(`${fieldName} cannot be negative: ${value}`);
    }

    if (!isFinite(value)) {
        throw new Error(`${fieldName} must be a finite number: ${value}`);
    }

    return value;
}

/**
 * Validate credit usage doesn't exceed reasonable limits
 */
export function validateCreditUsage(params: {
    creditsUsed: number | Decimal;
    creditsLimit: number;
    allowOverage?: boolean;
}): void {
    const { creditsUsed, creditsLimit, allowOverage = false } = params;
    const used = typeof creditsUsed === "number" ? creditsUsed : creditsUsed.toNumber();

    validateCredits(used, "creditsUsed");
    validateCredits(creditsLimit, "creditsLimit");

    if (!allowOverage && used > creditsLimit * 1.1) {
        // Allow 10% overage for rounding/race conditions
        throw new Error(
            `Credit usage (${used}) exceeds limit (${creditsLimit}) by more than 10%`
        );
    }
}

/**
 * Validate billing period dates
 */
export function validateBillingPeriod(start: Date, end: Date): void {
    if (!(start instanceof Date) || isNaN(start.getTime())) {
        throw new Error("Invalid billing period start date");
    }

    if (!(end instanceof Date) || isNaN(end.getTime())) {
        throw new Error("Invalid billing period end date");
    }

    if (start >= end) {
        throw new Error(
            `Billing period start (${start.toISOString()}) must be before end (${end.toISOString()})`
        );
    }

    // Validate period is reasonable (between 1 day and 366 days)
    const durationDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);

    if (durationDays < 1) {
        throw new Error(`Billing period too short: ${durationDays} days`);
    }

    if (durationDays > 366) {
        throw new Error(`Billing period too long: ${durationDays} days`);
    }
}

/**
 * Validate model name is in allowed list
 */
const VALID_MODELS = [
    "claude-haiku-4-5",
    "claude-sonnet-4-5",
    "anthropic/claude-sonnet-4.5",
    "anthropic/claude-haiku-4.5",
    "gpt-5",
    "gpt-5-mini",
    "openai/gpt-5",
    "openai/gpt-5-mini",
    "x-ai/grok-4-fast",
    "grok-4-fast",
] as const;

export function validateModelName(model: string): void {
    if (!model || typeof model !== "string") {
        throw new Error("Model name is required and must be a string");
    }

    // Allow any model for flexibility, but log warning for unknown models
    if (!VALID_MODELS.includes(model as any)) {
        console.warn(`⚠️ Unknown model name: ${model}`);
    }
}

/**
 * Validate token counts
 */
export function validateTokens(params: {
    inputTokens: number;
    outputTokens: number;
}): void {
    const { inputTokens, outputTokens } = params;

    if (!Number.isInteger(inputTokens) || inputTokens < 0) {
        throw new Error(`Invalid input tokens: ${inputTokens}`);
    }

    if (!Number.isInteger(outputTokens) || outputTokens < 0) {
        throw new Error(`Invalid output tokens: ${outputTokens}`);
    }

    // Reasonable limits: max 1M tokens per request (sanity check)
    const MAX_TOKENS = 1_000_000;

    if (inputTokens > MAX_TOKENS) {
        throw new Error(`Input tokens (${inputTokens}) exceeds maximum (${MAX_TOKENS})`);
    }

    if (outputTokens > MAX_TOKENS) {
        throw new Error(`Output tokens (${outputTokens}) exceeds maximum (${MAX_TOKENS})`);
    }
}

/**
 * Validate plan name
 */
export function validatePlanName(planName: string): void {
    const validPlans = ["HOBBY", "PRO", "ENTERPRISE"];

    if (!validPlans.includes(planName)) {
        throw new Error(`Invalid plan name: ${planName}. Must be one of: ${validPlans.join(", ")}`);
    }
}

/**
 * Validate subscription status transition
 */
export function validateStatusTransition(
    currentStatus: string,
    newStatus: string
): void {
    // Define valid status transitions
    const validTransitions: Record<string, string[]> = {
        ACTIVE: ["PAST_DUE", "CANCELLED", "UNPAID"],
        PAST_DUE: ["ACTIVE", "CANCELLED", "UNPAID", "EXPIRED"],
        CANCELLED: ["ACTIVE", "EXPIRED"],
        TRIALING: ["ACTIVE", "CANCELLED", "EXPIRED"],
        UNPAID: ["ACTIVE", "CANCELLED", "EXPIRED"],
        EXPIRED: ["ACTIVE"],
    };

    const allowed = validTransitions[currentStatus] || [];

    if (!allowed.includes(newStatus) && currentStatus !== newStatus) {
        console.warn(
            `⚠️ Unusual status transition: ${currentStatus} → ${newStatus}`
        );
    }
}
