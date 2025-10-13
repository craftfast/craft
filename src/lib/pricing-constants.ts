/**
 * Pricing Constants
 * Centralized pricing information for the Craft platform
 * Usage-based pricing model - pay only for what you use
 */

export const PRICING = {
    FREE: {
        name: "Free",
        priceMonthly: 0,
        priceYearly: 0,
        displayPriceMonthly: "$0",
        displayPriceYearly: "$0",
        databaseStorageGB: 0.5,
        maxProjects: 3,
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
        },
    },
    PRO: {
        name: "Pro",
        priceMonthly: 25,
        priceYearly: 250, // ~17% discount (10 months price)
        displayPriceMonthly: "$25",
        displayPriceYearly: "$250",
        databaseStorageGB: 5,
        maxProjects: null, // Unlimited
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
        },
    },
    BUSINESS: {
        name: "Business",
        priceMonthly: 50,
        priceYearly: 500, // ~17% discount (10 months price)
        displayPriceMonthly: "$50",
        displayPriceYearly: "$500",
        databaseStorageGB: 20,
        maxProjects: null, // Unlimited
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
            trainingOptOut: true,
            sso: true,
            dedicatedSupport: false,
        },
    },
    ENTERPRISE: {
        name: "Enterprise",
        priceMonthly: null, // Contact sales
        priceYearly: null, // Contact sales
        displayPriceMonthly: "Custom",
        displayPriceYearly: "Custom",
        databaseStorageGB: null, // Unlimited
        maxProjects: null, // Unlimited
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
        },
    },
} as const;

export const BILLING_PERIOD = {
    MONTHLY: {
        id: "MONTHLY",
        name: "Monthly",
        label: "Monthly",
    },
    YEARLY: {
        id: "YEARLY",
        name: "Yearly",
        label: "Yearly",
        discount: "Save ~17%",
    },
} as const;

export const TOKEN_PRICING = {
    PAY_AS_YOU_GO: 20, // $20 per 1M tokens
} as const;

export const SUPPORT_EMAIL = "support@craft.tech";
export const SALES_EMAIL = "sales@craft.tech";

export type PlanName = keyof typeof PRICING;
export type BillingPeriod = keyof typeof BILLING_PERIOD;

/**
 * Get plan price by plan name and billing period
 */
export function getPlanPrice(
    planName: PlanName,
    billingPeriod: BillingPeriod
): number {
    const plan = PRICING[planName];
    if (billingPeriod === "YEARLY") {
        return plan.priceYearly ?? 0;
    }
    return plan.priceMonthly ?? 0;
}

/**
 * Get display price by plan name and billing period
 */
export function getDisplayPrice(
    planName: PlanName,
    billingPeriod: BillingPeriod
): string {
    const plan = PRICING[planName];
    if (billingPeriod === "YEARLY") {
        return plan.displayPriceYearly;
    }
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
