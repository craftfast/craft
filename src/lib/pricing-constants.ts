/**
 * Pricing Constants
 * Centralized pricing information for the Craft platform
 */

export const PRICING = {
    FREE: {
        name: "Free",
        priceMonthly: 0,
        priceYearly: 0,
        displayPriceMonthly: "$0",
        displayPriceYearly: "$0",
        creditsPerMonth: 20,
        dailyCreditLimit: 5, // Max 5 credits per day to prevent abuse
        creditRollover: false,
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
        creditsPerMonth: 100, // Base tier: 100 credits
        baseCredits: 100, // Base credit amount
        basePriceMonthly: 25, // Base price for 100 credits
        basePriceYearly: 250, // Base yearly price for 100 credits
        pricePerCreditMonthly: 0.25, // $25 / 100 credits = $0.25 per credit
        pricePerCreditYearly: 2.50, // $250 / 100 credits = $2.50 per credit per year
        minCredits: 100,
        maxCredits: 10000,
        dailyCreditLimit: null, // No daily limit
        creditRollover: true,
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
        creditsPerMonth: 100, // Base tier: 100 credits
        baseCredits: 100, // Base credit amount
        basePriceMonthly: 50, // Base price for 100 credits
        basePriceYearly: 500, // Base yearly price for 100 credits
        pricePerCreditMonthly: 0.50, // $50 / 100 credits = $0.50 per credit
        pricePerCreditYearly: 5.00, // $500 / 100 credits = $5.00 per credit per year
        minCredits: 100,
        maxCredits: 10000,
        dailyCreditLimit: null, // No daily limit
        creditRollover: true,
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
        creditsPerMonth: null, // Custom/Unlimited
        dailyCreditLimit: null, // No daily limit
        creditRollover: true,
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

/**
 * Get monthly credits for a plan
 */
export function getMonthlyCredits(planName: PlanName): number | null {
    return PRICING[planName].creditsPerMonth;
}

/**
 * Get daily credit limit for a plan (only applies to Free plan)
 */
export function getDailyCreditLimit(planName: PlanName): number | null {
    return PRICING[planName].dailyCreditLimit;
}

/**
 * Check if plan has daily credit limits
 */
export function hasDailyCreditLimit(planName: PlanName): boolean {
    return PRICING[planName].dailyCreditLimit !== null;
}

/**
 * Calculate price for a given number of credits (for tiered plans)
 * Only applies to PRO and BUSINESS plans
 */
export function calculateTierPrice(
    planName: "PRO" | "BUSINESS",
    credits: number,
    billingPeriod: BillingPeriod
): number {
    const plan = PRICING[planName];

    // Ensure credits are within allowed range
    const minCredits = plan.minCredits ?? 100;
    const maxCredits = plan.maxCredits ?? 10000;
    const clampedCredits = Math.max(minCredits, Math.min(maxCredits, credits));

    if (billingPeriod === "YEARLY") {
        return Math.round(clampedCredits * (plan.pricePerCreditYearly ?? 0));
    }
    return clampedCredits * (plan.pricePerCreditMonthly ?? 0);
}

/**
 * Get display price for a given number of credits
 */
export function getTierDisplayPrice(
    planName: "PRO" | "BUSINESS",
    credits: number,
    billingPeriod: BillingPeriod
): string {
    const price = calculateTierPrice(planName, credits, billingPeriod);

    if (billingPeriod === "YEARLY") {
        return `$${price.toLocaleString('en-US')}`;
    }
    return `$${price.toLocaleString('en-US')}`;
}

/**
 * Get suggested credit tiers for display
 */
export function getCreditTiers(): number[] {
    return [100, 200, 500, 1000, 2000, 5000, 10000];
}

/**
 * Validate if credits are within allowed range for a plan
 */
export function isValidCreditAmount(
    planName: "PRO" | "BUSINESS",
    credits: number
): boolean {
    const plan = PRICING[planName];
    const minCredits = plan.minCredits ?? 100;
    const maxCredits = plan.maxCredits ?? 10000;
    return credits >= minCredits && credits <= maxCredits && credits % 100 === 0;
}
