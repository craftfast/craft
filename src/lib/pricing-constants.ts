/**
 * Pricing Constants
 * Centralized pricing information for the Craft platform
 */

export const PRICING = {
    FREE: {
        name: "Free",
        priceUSD: 0,
        priceINR: 0,
        displayPriceUSD: "$0",
        displayPriceINR: "₹0",
        tokenAllowance: 0, // No included tokens
        tokensPerDay: 0,
        payAsYouGoPricePerMillionTokens: 20, // $20 per 1M tokens
        databaseStorageGB: 0.5,
        maxProjects: 1000,
        features: {
            aiChat: true,
            unlimitedProjects: true,
            vercelDeployment: true,
            figmaImport: true,
            githubSync: true,
            databaseAccess: "limited",
            ownApiKey: true,
            userMemory: "limited",
            support: "community",
            payAsYouGo: true,
            includedTokens: false,
            prioritySupport: false,
            humanOversight: false,
            extendedMemory: false,
            trainingOptOut: false,
            samlSSO: false,
            dedicatedSupport: false,
        },
    },
    PREMIUM: {
        name: "Premium",
        priceUSD: 500,
        priceINR: 41500,
        displayPriceUSD: "$500",
        displayPriceINR: "₹41,500",
        tokenAllowance: 30000000, // 30M tokens per month (1M per day * 30 days)
        tokensPerDay: 1000000, // 1M tokens per day
        databaseStorageGB: 10, // 10GB database storage
        maxProjects: null, // Unlimited
        features: {
            aiChat: true,
            unlimitedProjects: true,
            vercelDeployment: true,
            figmaImport: true,
            githubSync: true,
            databaseAccess: "full",
            ownApiKey: false, // Uses platform API key
            userMemory: "extended",
            support: "priority",
            payAsYouGo: false,
            includedTokens: true,
            prioritySupport: true,
            humanOversight: true,
            extendedMemory: true,
            advancedAI: true,
            fasterResponse: true,
            priorityQueue: true,
            enhancedContext: true,
            premiumIntegrations: true,
            trainingOptOut: false,
            samlSSO: false,
            dedicatedSupport: false,
        },
    },
    ENTERPRISE: {
        name: "Enterprise",
        priceUSD: null, // Contact sales
        priceINR: null, // Contact sales
        displayPriceUSD: "Contact Us",
        displayPriceINR: "Contact Us",
        tokenAllowance: null, // Unlimited
        tokensPerDay: null, // Unlimited
        databaseStorageGB: null, // Unlimited
        maxProjects: null, // Unlimited
        features: {
            aiChat: true,
            unlimitedProjects: true,
            vercelDeployment: true,
            figmaImport: true,
            githubSync: true,
            databaseAccess: "unlimited",
            ownApiKey: false,
            userMemory: "unlimited",
            support: "dedicated",
            payAsYouGo: false,
            includedTokens: true,
            prioritySupport: true,
            humanOversight: "on-demand",
            extendedMemory: true,
            advancedAI: true,
            fasterResponse: true,
            priorityQueue: true,
            enhancedContext: true,
            premiumIntegrations: true,
            trainingOptOut: true,
            samlSSO: true,
            dedicatedSupport: true,
            customSecurity: true,
            slaGuarantees: true,
            customIntegrations: true,
            advancedAnalytics: true,
        },
    },
} as const;

export const CURRENCY = {
    USD: {
        symbol: "$",
        code: "USD",
        name: "US Dollar",
    },
    INR: {
        symbol: "₹",
        code: "INR",
        name: "Indian Rupee",
    },
} as const;

export const TOKEN_PRICING = {
    PAY_AS_YOU_GO_USD: 20, // $20 per 1M tokens
    PAY_AS_YOU_GO_INR: 1660, // ₹1,660 per 1M tokens
} as const;

export const SUPPORT_EMAIL = "support@craft.tech";
export const SALES_EMAIL = "sales@craft.tech";

export type PlanName = keyof typeof PRICING;
export type CurrencyCode = keyof typeof CURRENCY;

/**
 * Get plan price by plan name and currency
 */
export function getPlanPrice(
    planName: PlanName,
    currency: CurrencyCode
): number {
    const plan = PRICING[planName];
    if (currency === "INR") {
        return plan.priceINR ?? 0;
    }
    return plan.priceUSD ?? 0;
}

/**
 * Get display price by plan name and currency
 */
export function getDisplayPrice(
    planName: PlanName,
    currency: CurrencyCode
): string {
    const plan = PRICING[planName];
    if (currency === "INR") {
        return plan.displayPriceINR;
    }
    return plan.displayPriceUSD;
}

/**
 * Check if user has access to a feature
 */
export function hasFeatureAccess(
    planName: PlanName,
    featureName: string
): boolean {
    const plan = PRICING[planName];
    return !!(plan.features as Record<string, unknown>)[featureName];
}

/**
 * Get token allowance for a plan
 */
export function getTokenAllowance(planName: PlanName): number | null {
    return PRICING[planName].tokenAllowance;
}

/**
 * Get daily token limit for a plan
 */
export function getDailyTokenLimit(planName: PlanName): number | null {
    return PRICING[planName].tokensPerDay;
}
