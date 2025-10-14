/**
 * Pricing Constants
 * Centralized pricing information for the Craft platform
 * Token-based pricing model - Pro plan includes 10M tokens/month with top-up option
 */

export const PRICING = {
    FREE: {
        name: "Free",
        priceMonthly: 0,
        displayPriceMonthly: "$0",
        databaseStorageGB: 0.5,
        maxProjects: 3,
        monthlyTokens: 1000000, // 1M tokens/month (hard limit)
        features: {
            aiChat: true,
            unlimitedProjects: false,
            vercelDeployment: true,
            figmaImport: true,
            githubSync: true,
            databaseAccess: "limited",
            customDomain: false,
            privateProjects: false,
            support: "community",
            prioritySupport: false,
            removeBranding: false,
            trainingOptOut: false,
            sso: false,
            dedicatedSupport: false,
            canPurchaseTokens: false,
        },
    },
    PRO: {
        name: "Pro",
        priceMonthly: 150,
        displayPriceMonthly: "$150",
        databaseStorageGB: 5,
        maxProjects: null, // Unlimited
        monthlyTokens: 10000000, // 10M tokens/month included
        features: {
            aiChat: true,
            unlimitedProjects: true,
            vercelDeployment: true,
            figmaImport: true,
            githubSync: true,
            databaseAccess: "full",
            customDomain: true,
            privateProjects: true,
            support: "priority",
            prioritySupport: true,
            removeBranding: true,
            trainingOptOut: false,
            sso: false,
            dedicatedSupport: false,
            canPurchaseTokens: true, // Can top-up tokens as needed
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
            vercelDeployment: true,
            figmaImport: true,
            githubSync: true,
            databaseAccess: "unlimited",
            customDomain: true,
            privateProjects: true,
            support: "dedicated",
            prioritySupport: true,
            removeBranding: true,
            trainingOptOut: true,
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
        },
    },
} as const;

export const TOKEN_PRICING = {
    PAY_AS_YOU_GO: 20, // $20 per 1M tokens for top-up
} as const;

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
