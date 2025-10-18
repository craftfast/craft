/**
 * Pricing Constants
 * Centralized pricing information for the Craft platform
 * Pro plan includes generous AI usage allocation - code without anxiety
 */

export const PRICING = {
    HOBBY: {
        name: "Hobby",
        priceMonthly: 0,
        displayPriceMonthly: "Free",
        databaseStorageGB: 0.05, // 50 MB
        fileStorageGB: 0.1, // 100 MB
        maxProjects: 3, // Limited to 3 projects
        monthlyTokens: 100000, // 100k tokens/month
        features: {
            aiChat: true,
            unlimitedProjects: false,
            figmaImport: false,
            githubSync: false,
            databaseAccess: "limited",
            customDomain: false,
            privateProjects: false,
            support: "community",
            prioritySupport: false,
            removeBranding: false,
            trainingOptOut: false,
            sso: false,
            dedicatedSupport: false,
            canPurchaseTokens: false, // Cannot purchase tokens on Hobby
            payAsYouGo: false,
            craftBranding: true, // Craft branding on projects
        },
    },
    PRO: {
        name: "Pro",
        priceMonthly: 25,
        displayPriceMonthly: "$25/mo",
        databaseStorageGB: 0.5, // 500 MB free
        fileStorageGB: 1, // 1 GB free
        maxProjects: 999, // Unlimited
        monthlyTokens: 10000000, // 10M tokens/month
        features: {
            aiChat: true,
            unlimitedProjects: true,
            figmaImport: true,
            githubSync: true,
            databaseAccess: "full",
            customDomain: false, // Not implemented yet
            privateProjects: true,
            support: "priority",
            prioritySupport: true,
            removeBranding: true,
            trainingOptOut: false,
            sso: false,
            dedicatedSupport: false,
            canPurchaseTokens: true, // Can purchase additional tokens at $5/1M
            payAsYouGo: true, // Pay-as-you-go for infrastructure
        },
    },
    ENTERPRISE: {
        name: "Enterprise",
        priceMonthly: null, // Contact sales
        displayPriceMonthly: "Custom",
        databaseStorageGB: null, // Unlimited
        maxProjects: null, // Unlimited
        monthlyTokens: null, // Unlimited
        features: {
            aiChat: true,
            unlimitedProjects: true,
            figmaImport: true,
            githubSync: true,
            databaseAccess: "unlimited",
            customDomain: false, // Not implemented yet - can be custom implemented for Enterprise
            privateProjects: true,
            support: "dedicated",
            prioritySupport: true,
            removeBranding: true,
            trainingOptOut: false,
            sso: true,
            dedicatedSupport: true,
            customSecurity: true,
            slaGuarantees: true,
            customIntegrations: true,
            advancedAnalytics: true,
            onboardingServices: true,
            customConnections: true,
            groupBasedAccess: true,
            customDesignSystems: true,
            canPurchaseTokens: true,
            auditLogs: true,
            compliance: true,
            customLimits: true,
            accountManager: true,
        },
    },
} as const;

export const TOKEN_PRICING = {
    PAY_AS_YOU_GO: 5, // $5 per 1M tokens for top-up (both input and output included)
} as const;

export const CREDIT_TIERS = [
    { tokens: 1000000, price: 5, display: "1M tokens - $5", polarEnvKey: "POLAR_TOKEN_1M_PRODUCT_ID" },
    { tokens: 5000000, price: 22, display: "5M tokens - $22", polarEnvKey: "POLAR_TOKEN_5M_PRODUCT_ID" },
    { tokens: 10000000, price: 42, display: "10M tokens - $42", polarEnvKey: "POLAR_TOKEN_10M_PRODUCT_ID" },
    { tokens: 25000000, price: 100, display: "25M tokens - $100", polarEnvKey: "POLAR_TOKEN_25M_PRODUCT_ID" },
    { tokens: 50000000, price: 187, display: "50M tokens - $187", polarEnvKey: "POLAR_TOKEN_50M_PRODUCT_ID" },
    { tokens: 100000000, price: 350, display: "100M tokens - $350", polarEnvKey: "POLAR_TOKEN_100M_PRODUCT_ID" },
    { tokens: 250000000, price: 812, display: "250M tokens - $812", polarEnvKey: "POLAR_TOKEN_250M_PRODUCT_ID" },
    { tokens: 500000000, price: 1500, display: "500M tokens - $1,500", polarEnvKey: "POLAR_TOKEN_500M_PRODUCT_ID" },
    { tokens: 1000000000, price: 2750, display: "1000M tokens - $2,750", polarEnvKey: "POLAR_TOKEN_1000M_PRODUCT_ID" },
] as const;

export function getCreditTiers() {
    return CREDIT_TIERS;
}

export const SUPPORT_EMAIL = "support@craft.tech";
export const SALES_EMAIL = "sales@craft.tech";

export type PlanName = keyof typeof PRICING;

/**
 * Get plan monthly price
 */
export function getPlanPrice(planName: PlanName): number {
    const plan = PRICING[planName];
    return plan.priceMonthly ?? 0;
}

/**
 * Get display price
 */
export function getDisplayPrice(planName: PlanName): string {
    const plan = PRICING[planName];
    return plan.displayPriceMonthly;
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
