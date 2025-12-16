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

// Infrastructure costs - exact provider pricing with zero markup
// Source: Official pricing pages linked in /pricing
export const INFRASTRUCTURE_COSTS = {
    // E2B Sandbox - per second billing (2 vCPU default)
    // Source: https://e2b.dev/pricing
    sandbox: {
        perSecond: 0.000028, // $0.000028/s for 2 vCPU (default)
        perMinute: 0.00168, // $0.000028 * 60 = $0.00168/min
        perHour: 0.1008, // ~$0.10/hour for 2 vCPU
    },

    // Supabase for Platforms - usage-based pricing
    // Source: https://supabase.com/pricing
    // Includes: Database, Auth, File Storage (for app files), Edge Functions
    supabase: {
        computePerHour: 0.018, // $0.018/hour per instance (pauses after 15 min)
        computePerMonth: 13, // ~$13/month if always on
        databaseStoragePerGBMonth: 0.125, // $0.125/GB/month
        fileStoragePerGBMonth: 0.021, // $0.021/GB/month (app files)
        egressPerGB: 0.09, // $0.09/GB transferred
        authPerMAU: 0.00325, // $0.00325/MAU over 50K free
        edgeFunctionsPerMillion: 2.0, // $2.00/1M invocations
        realtimeMessagesPerMillion: 2.5, // $2.50/1M messages
        realtimeConcurrentConnections: 10, // $10/1K connections
    },

    // Vercel for Platforms - usage-based (Fluid Compute pricing)
    // Source: https://vercel.com/docs/functions/usage-and-pricing
    // Pro plan: $20/mo includes 4 hours CPU, 360 GB-hrs memory, 1M invocations
    vercel: {
        // Fluid Compute pricing (US-East region, iad1)
        activeCPUPerHour: 0.128, // $0.128/CPU-hour (only charged during execution)
        provisionedMemoryPerGBHour: 0.0106, // $0.0106/GB-hour
        invocationsPerMillion: 0.60, // $0.60/1M invocations
        // Included with Pro plan ($20/mo)
        includedCPUHours: 4, // 4 hours Active CPU
        includedMemoryGBHours: 360, // 360 GB-hrs provisioned memory
        includedInvocations: 1_000_000, // 1M function invocations
        // Note: Actual costs passed through at cost via Vercel for Platforms
    },
} as const;

// ============================================================================
// LEGACY / DEPRECATED - Use EMAILS from @/lib/constants instead
// ============================================================================

/** @deprecated Use EMAILS.SUPPORT from @/lib/constants */
export const SUPPORT_EMAIL = EMAILS.SUPPORT;
/** @deprecated Use EMAILS.SALES from @/lib/constants */
export const SALES_EMAIL = EMAILS.SALES;
