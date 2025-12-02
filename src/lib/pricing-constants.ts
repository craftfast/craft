/**
 * Pricing Constants
 * OpenRouter-style transparent pay-as-you-go pricing
 * Users top up balance with 10% platform fee, then pay exact provider costs
 */

import { AVAILABLE_MODELS } from "@/lib/models/config";
import { EMAILS, USAGE_LIMITS } from "@/lib/constants";

// Re-export USAGE_LIMITS for convenience
export { USAGE_LIMITS };

// ============================================================================
// BALANCE & TOP-UP SYSTEM
// ============================================================================

export const PLATFORM_FEE_PERCENT = 0.10; // 10% platform fee on top-ups
export const GST_PERCENT = 0.18; // 18% GST (India)
export const MINIMUM_BALANCE_AMOUNT = 10; // Minimum $10 balance top-up
export const MINIMUM_CHECKOUT_AMOUNT = 11; // $10 + 10% fee
export const MINIMUM_BALANCE_THRESHOLD = 0.50; // Block operations below $0.50
export const LOW_BALANCE_WARNING_THRESHOLD = 5.00; // Warn when balance < $5

// Suggested top-up amounts (what user sees)
export const SUGGESTED_TOPUP_AMOUNTS = [25, 50, 100, 250, 500, 1000];

/**
 * Calculate checkout amount from desired balance (includes 10% platform fee + 18% GST)
 * Example: $100 desired balance = $100 + $10 fee + $19.80 GST = $129.80 checkout amount
 */
export function getCheckoutAmount(desiredBalance: number): number {
    const withFee = desiredBalance * (1 + PLATFORM_FEE_PERCENT);
    const withGST = withFee * (1 + GST_PERCENT);
    return Math.ceil(withGST * 100) / 100;
}

/**
 * Get breakdown of fees for a given balance amount
 */
export function getFeeBreakdown(desiredBalance: number): {
    balance: number;
    platformFee: number;
    gst: number;
    total: number;
} {
    const platformFee = desiredBalance * PLATFORM_FEE_PERCENT;
    const subtotal = desiredBalance + platformFee;
    const gst = subtotal * GST_PERCENT;
    const total = Math.ceil((subtotal + gst) * 100) / 100;
    return {
        balance: desiredBalance,
        platformFee: Math.ceil(platformFee * 100) / 100,
        gst: Math.ceil(gst * 100) / 100,
        total,
    };
}

/**
 * Calculate balance from checkout amount (removes 10% fee + 18% GST)
 * Example: $129.80 checkout = $100 balance credited
 */
export function getBalanceFromCheckout(checkoutAmount: number): number {
    const withoutGST = checkoutAmount / (1 + GST_PERCENT);
    const balance = withoutGST / (1 + PLATFORM_FEE_PERCENT);
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
