/**
 * Pricing Constants
 * OpenRouter-style transparent pay-as-you-go pricing
 * Users top up balance with 10% platform fee, then pay exact provider costs
 * 
 * Tax Rules:
 * - India: 18% GST applies on PLATFORM FEE ONLY (not on credits)
 * - International: 0% GST (export of services is zero-rated under Indian GST)
 * 
 * Legal basis: Credits are pass-through costs to AI providers (pure agent).
 * GST applies only to our service charge (platform fee), not the underlying transaction.
 */

import { AVAILABLE_MODELS } from "@/lib/models/config";
import { EMAILS, USAGE_LIMITS } from "@/lib/constants";

// Re-export USAGE_LIMITS for convenience
export { USAGE_LIMITS };

// ============================================================================
// BALANCE & TOP-UP SYSTEM
// ============================================================================

export const PLATFORM_FEE_PERCENT = 0.10; // 10% platform fee on top-ups
export const GST_PERCENT = 0.18; // 18% GST on platform fee (India only)
export const MINIMUM_BALANCE_AMOUNT = 10; // Minimum $10 balance top-up
export const MINIMUM_CHECKOUT_AMOUNT = 11; // $10 + 10% fee
export const MINIMUM_BALANCE_THRESHOLD = 0.50; // Block operations below $0.50
export const LOW_BALANCE_WARNING_THRESHOLD = 5.00; // Warn when balance < $5

// Suggested top-up amounts (what user sees)
export const SUGGESTED_TOPUP_AMOUNTS = [25, 50, 100, 250, 500, 1000];

/**
 * Check if a country is India (for GST purposes)
 */
export function isIndianCustomer(countryCode: string | null | undefined): boolean {
    return countryCode?.toUpperCase() === 'IN';
}

/**
 * Calculate checkout amount from desired balance
 * - India: credits + platform fee + GST on platform fee only
 * - International: credits + platform fee only
 * 
 * Example (India): $100 credits + $10 fee + $1.80 GST (on fee) = $111.80
 * Example (International): $100 credits + $10 fee = $110.00
 */
export function getCheckoutAmount(desiredBalance: number, countryCode?: string | null): number {
    const platformFee = desiredBalance * PLATFORM_FEE_PERCENT;
    const gstOnFee = isIndianCustomer(countryCode) ? platformFee * GST_PERCENT : 0;
    const total = desiredBalance + platformFee + gstOnFee;
    return Math.ceil(total * 100) / 100;
}

/**
 * Get breakdown of fees for a given balance amount
 * GST applies only to platform fee for Indian customers
 */
export function getFeeBreakdown(desiredBalance: number, countryCode?: string | null): {
    balance: number;
    platformFee: number;
    gst: number;
    total: number;
    isIndian: boolean;
} {
    const isIndian = isIndianCustomer(countryCode);
    const platformFee = desiredBalance * PLATFORM_FEE_PERCENT;
    const gst = isIndian ? platformFee * GST_PERCENT : 0;
    const total = Math.ceil((desiredBalance + platformFee + gst) * 100) / 100;
    return {
        balance: desiredBalance,
        platformFee: Math.ceil(platformFee * 100) / 100,
        gst: Math.ceil(gst * 100) / 100,
        total,
        isIndian,
    };
}

/**
 * Calculate balance from checkout amount (removes fees based on country)
 * - India: removes platform fee + GST on fee
 * - International: removes platform fee only
 */
export function getBalanceFromCheckout(checkoutAmount: number, countryCode?: string | null): number {
    // Formula: total = balance + fee + gst_on_fee
    // total = balance + (balance * 0.1) + (balance * 0.1 * 0.18) for India
    // total = balance * (1 + 0.1 + 0.018) = balance * 1.118 for India
    // total = balance * 1.1 for International
    const feeMultiplier = isIndianCustomer(countryCode)
        ? (1 + PLATFORM_FEE_PERCENT + PLATFORM_FEE_PERCENT * GST_PERCENT)
        : (1 + PLATFORM_FEE_PERCENT);
    const balance = checkoutAmount / feeMultiplier;
    return Math.floor(balance * 100) / 100;
}

// ============================================================================
// PROVIDER COST RATES (No markup - exact provider pricing)
// ============================================================================

/**
 * AI Model Pricing (per 1M tokens)
 * Source: Direct from provider pricing pages
 * Note: No markup applied - users pay exact provider costs
 */
export const AI_MODEL_PRICING = {
    // Models are defined in @/lib/models/config
    // Each model has inputPrice and outputPrice per 1M tokens
    // These are used to calculate exact costs with zero markup
} as const;

/**
 * Get model pricing from config
 */
export function getModelPricing(modelId: string): { inputPrice: number; outputPrice: number } | null {
    const model = Object.values(AVAILABLE_MODELS).find(m => m.id === modelId);
    if (!model || !model.pricing) return null;

    return {
        inputPrice: model.pricing.inputTokens || 0,
        outputPrice: model.pricing.outputTokens || 0,
    };
}

/**
 * Calculate exact AI cost for token usage (no markup)
 */
export function calculateAICost(modelId: string, inputTokens: number, outputTokens: number): number {
    const pricing = getModelPricing(modelId);
    if (!pricing) return 0;

    const inputCost = (inputTokens / 1_000_000) * pricing.inputPrice;
    const outputCost = (outputTokens / 1_000_000) * pricing.outputPrice;

    return inputCost + outputCost;
}

// Infrastructure cost estimates (to be replaced with real API integration)
export const INFRASTRUCTURE_COSTS = {
    // E2B Sandbox - estimate until real API integration
    sandbox: {
        perMinute: 0.001, // $0.001 per minute (estimate)
    },

    // Neon Database - estimate until real API integration
    database: {
        storagePerGBMonth: 0.02, // $0.02 per GB/month (estimate)
        computePerHour: 0.001, // $0.001 per hour (estimate)
    },

    // Cloudflare R2 Storage - estimate until real API integration
    storage: {
        perGBMonth: 0.015, // $0.015 per GB/month
        perMillionOps: 0.36, // $0.36 per million operations
    },

    // Vercel Deployment - estimate
    deployment: {
        perDeploy: 0.01, // $0.01 per deployment (estimate)
    },
} as const;

// ============================================================================
// LEGACY / DEPRECATED - Use EMAILS from @/lib/constants instead
// ============================================================================

/** @deprecated Use EMAILS.SUPPORT from @/lib/constants */
export const SUPPORT_EMAIL = EMAILS.SUPPORT;
/** @deprecated Use EMAILS.SALES from @/lib/constants */
export const SALES_EMAIL = EMAILS.SALES;
