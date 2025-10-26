/**
 * Pricing Constants
 * Centralized pricing information for the Craft platform
 * Pro plan includes generous AI usage allocation - code without anxiety
 * Users connect their own Supabase for database and storage
 */

export const PRICING = {
    HOBBY: {
        name: "Hobby",
        priceMonthly: 0,
        displayPriceMonthly: "Free",
        maxProjects: 3, // Limited to 3 projects
        monthlyTokens: 100000, // 100k tokens/month
        features: {
            aiChat: true,
            unlimitedProjects: false,
            figmaImport: false,
            githubSync: false,
            supabaseIntegration: true,
            vercelDeployment: true,
            customDomain: false,
            privateProjects: false,
            support: "community",
            prioritySupport: false,
            removeBranding: false,
            trainingOptOut: false,
            sso: false,
            dedicatedSupport: false,
            canPurchaseTokens: false, // Cannot purchase tokens on Hobby
            craftBranding: true, // Craft branding on projects
        },
    },
    PRO: {
        name: "Pro",
        priceMonthly: 50,
        displayPriceMonthly: "$50/mo",
        maxProjects: 999, // Unlimited
        monthlyTokens: 10000000, // 10M tokens/month
        features: {
            aiChat: true,
            unlimitedProjects: true,
            figmaImport: true,
            githubSync: true,
            supabaseIntegration: true,
            vercelDeployment: true,
            customDomain: false, // Not implemented yet
            privateProjects: true,
            support: "priority",
            prioritySupport: true,
            removeBranding: true,
            trainingOptOut: false,
            sso: false,
            dedicatedSupport: false,
            canPurchaseTokens: true, // Can purchase additional tokens at $5/1M
        },
    },
    AGENT: {
        name: "Agent",
        priceMonthly: 5000,
        displayPriceMonthly: "$5,000/mo",
        maxProjects: null, // Unlimited
        monthlyTokens: 100000000, // 100M tokens/month
        features: {
            aiChat: true,
            unlimitedProjects: true,
            figmaImport: true,
            githubSync: true,
            supabaseIntegration: true,
            vercelDeployment: true,
            customDomain: false, // Not implemented yet
            privateProjects: true,
            support: "dedicated",
            prioritySupport: true,
            removeBranding: true,
            trainingOptOut: false,
            sso: false,
            dedicatedSupport: true,
            canPurchaseTokens: true,
            craftBranding: false,
            // Agent-specific features
            longRunningTasks: true, // Can delegate long-running tasks
            expertOversight: true, // Expert review and oversight
            backgroundExecution: true, // Tasks execute in background
            featureDelegation: true, // Can delegate entire features
            advancedCodeGeneration: true, // Advanced AI capabilities
            architectureReview: true, // Architecture and design review
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

export const SUPPORT_EMAIL = "support@craft.fast";
export const SALES_EMAIL = "sales@craft.fast";

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
