/**
 * Pricing Constants
 * Centralized pricing information for the Craft platform
 * Monthly credit-based system with unified consumption model
 * Credits cover AI generation, sandbox usage, database, storage, and deployments
 */

import { AVAILABLE_MODELS } from "@/lib/models/config";

export const PRICING = {
    HOBBY: {
        name: "Hobby",
        priceMonthly: 0,
        displayPriceMonthly: "Free",
        maxProjects: 3, // Limited to 3 projects
        monthlyCredits: 10, // 10 credits per month
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
            craftBranding: true, // Craft branding on projects
        },
    },
    PRO: {
        name: "Pro",
        displayName: "Pro",
        maxProjects: null, // Unlimited
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
            craftBranding: false,
        },
    },
    ENTERPRISE: {
        name: "Enterprise",
        priceMonthly: 0, // Contact sales for pricing
        displayPriceMonthly: "Contact Sales",
        maxProjects: null, // Unlimited
        monthlyCredits: null, // Custom allocation
        features: {
            aiChat: true,
            unlimitedProjects: true,
            figmaImport: true,
            githubSync: true,
            supabaseIntegration: true,
            vercelDeployment: true,
            customDomain: true,
            privateProjects: true,
            support: "dedicated",
            prioritySupport: true,
            removeBranding: true,
            trainingOptOut: true,
            sso: true,
            dedicatedSupport: true,
            craftBranding: false,
            // Enterprise-specific features
            customCreditAllocation: true, // Custom AI credit allocation
            dedicatedAccountManager: true, // Personal point of contact
            prioritySLA: true, // Priority support with SLA
            customIntegrations: true, // Custom integrations
            advancedSecurity: true, // Advanced security features
            volumeDiscounts: true, // Volume pricing available
            customContracts: true, // Custom contract terms
        },
    },
} as const;

// Pro plan tiers with monthly credit allocations
// Credits cover: AI generation, sandbox, database, storage, deployments
export const PRO_TIERS = [
    { monthlyCredits: 100, priceMonthly: 25, displayPrice: "$25/mo", polarEnvKey: "POLAR_PRO_100_PRODUCT_ID" },
    { monthlyCredits: 200, priceMonthly: 50, displayPrice: "$50/mo", polarEnvKey: "POLAR_PRO_200_PRODUCT_ID" },
    { monthlyCredits: 400, priceMonthly: 100, displayPrice: "$100/mo", polarEnvKey: "POLAR_PRO_400_PRODUCT_ID" },
    { monthlyCredits: 800, priceMonthly: 200, displayPrice: "$200/mo", polarEnvKey: "POLAR_PRO_800_PRODUCT_ID" },
    { monthlyCredits: 1200, priceMonthly: 300, displayPrice: "$300/mo", polarEnvKey: "POLAR_PRO_1200_PRODUCT_ID" },
    { monthlyCredits: 1800, priceMonthly: 450, displayPrice: "$450/mo", polarEnvKey: "POLAR_PRO_1800_PRODUCT_ID" },
    { monthlyCredits: 2500, priceMonthly: 625, displayPrice: "$625/mo", polarEnvKey: "POLAR_PRO_2500_PRODUCT_ID" },
    { monthlyCredits: 3500, priceMonthly: 875, displayPrice: "$875/mo", polarEnvKey: "POLAR_PRO_3500_PRODUCT_ID" },
    { monthlyCredits: 5000, priceMonthly: 1250, displayPrice: "$1,250/mo", polarEnvKey: "POLAR_PRO_5000_PRODUCT_ID" },
    { monthlyCredits: 7000, priceMonthly: 1750, displayPrice: "$1,750/mo", polarEnvKey: "POLAR_PRO_7000_PRODUCT_ID" },
    { monthlyCredits: 10000, priceMonthly: 2250, displayPrice: "$2,250/mo", polarEnvKey: "POLAR_PRO_10000_PRODUCT_ID" },
] as const;

/**
 * Generate model multipliers dynamically from config
 * This ensures pricing is always in sync with available models
 */
function generateModelMultipliers(): Record<string, number> {
    const multipliers: Record<string, number> = {};

    // Generate from AVAILABLE_MODELS (single source of truth)
    Object.values(AVAILABLE_MODELS).forEach(model => {
        multipliers[model.id] = model.creditMultiplier;
    });

    // Add legacy model for project naming (Grok)
    multipliers['grok-4-fast'] = 0.1;
    multipliers['x-ai/grok-4-fast'] = 0.1;

    return multipliers;
}

// Credit consumption rates for different resource types
export const CREDIT_RATES = {
    // AI Usage (1 credit = 10,000 tokens)
    // Multipliers dynamically generated from config.ts (single source of truth)
    ai: {
        baseRate: 10000, // tokens per credit
        modelMultipliers: generateModelMultipliers()
    },

    // Sandbox Usage (E2B)
    sandbox: {
        perMinute: 0.1, // 0.1 credits per minute
        perHour: 6, // 6 credits per hour
    },

    // Database Usage (Neon)
    database: {
        storagePerGBMonth: 0.5, // 0.5 credits per GB stored per month
        computePerHour: 0.01, // 0.01 credits per compute hour
    },

    // Storage Usage (R2)
    storage: {
        perGBMonth: 0.2, // 0.2 credits per GB stored per month
        perThousandOps: 0.001, // 0.001 credits per 1000 operations
    },

    // Deployment
    deployment: {
        perDeploy: 1, // 1 credit per deployment
    },
} as const;

// Get Pro tier features (same for all Pro tiers)
export function getProFeatures() {
    return {
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
    };
}

// Helper function to get Pro tier by monthly credits
export function getProTier(monthlyCredits: number) {
    return PRO_TIERS.find(tier => tier.monthlyCredits === monthlyCredits);
}

export const SUPPORT_EMAIL = "support@craft.fast";
export const SALES_EMAIL = "sales@craft.fast";

export type PlanName = "HOBBY" | "PRO" | "ENTERPRISE";

/**
 * Get default monthly credits for a plan (single source of truth)
 */
export function getDefaultMonthlyCredits(planName: PlanName): number {
    if (planName === "HOBBY") {
        return PRICING.HOBBY.monthlyCredits;
    }
    if (planName === "PRO") {
        return PRO_TIERS[0].monthlyCredits; // Default to first Pro tier (100 credits)
    }
    // ENTERPRISE has custom allocation, but use a reasonable default
    return 0;
}

/**
 * Get plan monthly price for a specific Pro tier
 */
export function getPlanPrice(planName: PlanName, monthlyCredits?: number): number {
    if (planName === "PRO" && monthlyCredits) {
        const tier = getProTier(monthlyCredits);
        return tier?.priceMonthly ?? 25; // Default to $25 if tier not found
    }
    if (planName === "PRO") {
        return 25; // Default Pro price
    }
    const plan = PRICING[planName];
    return plan.priceMonthly ?? 0;
}

/**
 * Get display price
 */
export function getDisplayPrice(planName: PlanName, monthlyCredits?: number): string {
    if (planName === "PRO" && monthlyCredits) {
        const tier = getProTier(monthlyCredits);
        return tier?.displayPrice ?? "$25/mo";
    }
    if (planName === "PRO") {
        return "$25/mo"; // Default Pro price
    }
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
    if (planName === "PRO") {
        const proFeatures = getProFeatures();
        return !!(proFeatures as Record<string, unknown>)[featureName];
    }
    const plan = PRICING[planName];
    return !!(plan.features as Record<string, unknown>)[featureName];
}

/**
 * Get credit tiers for the credit selector component
 * Returns an array of credit tier options with display names
 */
export function getCreditTiers() {
    return PRO_TIERS.map(tier => ({
        tokens: tier.monthlyCredits,
        display: `${tier.monthlyCredits.toLocaleString()} credits - ${tier.displayPrice}`,
        priceMonthly: tier.priceMonthly,
    }));
}
