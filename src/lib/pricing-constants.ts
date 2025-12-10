/**
 * Pricing Constants
 * OpenRouter-style transparent pay-as-you-go pricing
 * Users top up balance with 10% platform fee, then pay exact provider costs
 * 
 * Tax Rules (Updated December 2024):
 * - 18% GST applies on TOTAL amount (credits + platform fee) for ALL customers
 * - All payments are charged in INR for simplified accounting
 * - Razorpay's DCC allows international customers to pay in their currency
 * 
 * Policy Change: Previously, GST only applied to Indian customers. Now GST applies
 * to all customers regardless of location for simplified compliance and uniform pricing.
 * 
 * Example ($100 credits):
 *   Credits: $100 + Platform Fee: $10 = Subtotal: $110
 *   GST (18% of $110): $19.80
 *   Total: $129.80 USD (converted to INR at checkout)
 */

// Import directly from @/data to avoid pulling in prisma via @/lib/models/config
// This is critical for client-side components that use pricing constants
import { AI_MODELS_BY_ID } from "@/data";
import { EMAILS, USAGE_LIMITS } from "@/lib/constants";

// Re-export USAGE_LIMITS for convenience
export { USAGE_LIMITS };

// ============================================================================
// BALANCE & TOP-UP SYSTEM
// ============================================================================

export const PLATFORM_FEE_PERCENT = 0.10; // 10% platform fee on top-ups
export const GST_PERCENT = 0.18; // 18% GST on total amount (credits + platform fee) for ALL customers
export const MINIMUM_BALANCE_AMOUNT = 10; // Minimum $10 balance top-up
export const MAXIMUM_BALANCE_AMOUNT = 3500; // Maximum $3,500 balance top-up (≈₹5,00,000 Razorpay limit after fees)
export const MINIMUM_CHECKOUT_AMOUNT = 11; // $10 + 10% fee
export const MINIMUM_BALANCE_THRESHOLD = 0.50; // Block operations below $0.50
export const LOW_BALANCE_WARNING_THRESHOLD = 5.00; // Warn when balance < $5

// Suggested top-up amounts (what user sees)
export const SUGGESTED_TOPUP_AMOUNTS = [25, 50, 100, 250, 500, 1000];

/**
 * Check if a country is India
 * Note: GST now applies to all customers, this is kept for reference/analytics
 */
export function isIndianCustomer(countryCode: string | null | undefined): boolean {
    return countryCode?.toUpperCase() === 'IN';
}

/**
 * Calculate checkout amount from desired balance
 * All customers: (credits + platform fee) + 18% GST on total
 * 
 * Example: ($100 credits + $10 fee) × 1.18 = $129.80
 * 
 * Note: countryCode parameter kept for backward compatibility but no longer used
 * since GST now applies to all customers regardless of location.
 */
export function getCheckoutAmount(desiredBalance: number, _countryCode?: string | null): number {
    const platformFee = desiredBalance * PLATFORM_FEE_PERCENT;
    const subtotal = desiredBalance + platformFee;
    const gst = subtotal * GST_PERCENT; // 18% GST for all customers
    const total = subtotal + gst;
    return Math.ceil(total * 100) / 100;
}

/**
 * Get breakdown of fees for a given balance amount
 * GST (18%) applies to total amount (credits + platform fee) for ALL customers
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
    const subtotal = desiredBalance + platformFee;
    const gst = subtotal * GST_PERCENT; // 18% GST for all customers
    const total = Math.ceil((subtotal + gst) * 100) / 100;
    return {
        balance: desiredBalance,
        platformFee: Math.ceil(platformFee * 100) / 100,
        gst: Math.ceil(gst * 100) / 100,
        total,
        isIndian,
    };
}

/**
 * Calculate balance from checkout amount (removes fees)
 * All customers: removes platform fee + GST on total
 * 
 * Note: countryCode parameter kept for backward compatibility but no longer used
 * since GST now applies to all customers regardless of location.
 */
export function getBalanceFromCheckout(checkoutAmount: number, _countryCode?: string | null): number {
    // Formula: total = (balance + fee) * (1 + gst_rate)
    // total = (balance * 1.1) * 1.18 = balance * 1.298
    const feeMultiplier = (1 + PLATFORM_FEE_PERCENT) * (1 + GST_PERCENT);
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
    const model = AI_MODELS_BY_ID[modelId];
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
