/**
 * Pricing Constants
 * Centralized pricing information for the Craft platform
 * Monthly credit-based system with unified consumption model
 * Credits cover AI generation, sandbox usage, database, storage, and deployments
 */

export const PRICING = {
    HOBBY: {
        name: "Hobby",
        priceMonthly: 0,
        displayPriceMonthly: "Free",
        maxProjects: 3, // Limited to 3 projects
        monthlyCredits: 100, // 100 credits per month
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
    { monthlyCredits: 500, priceMonthly: 25, displayPrice: "$25/mo", polarEnvKey: "POLAR_PRO_500_PRODUCT_ID" },
    { monthlyCredits: 1200, priceMonthly: 50, displayPrice: "$50/mo", polarEnvKey: "POLAR_PRO_1200_PRODUCT_ID" },
    { monthlyCredits: 3000, priceMonthly: 100, displayPrice: "$100/mo", polarEnvKey: "POLAR_PRO_3000_PRODUCT_ID" },
    { monthlyCredits: 7000, priceMonthly: 200, displayPrice: "$200/mo", polarEnvKey: "POLAR_PRO_7000_PRODUCT_ID" },
    { monthlyCredits: 16000, priceMonthly: 400, displayPrice: "$400/mo", polarEnvKey: "POLAR_PRO_16000_PRODUCT_ID" },
    { monthlyCredits: 30000, priceMonthly: 700, displayPrice: "$700/mo", polarEnvKey: "POLAR_PRO_30000_PRODUCT_ID" },
    { monthlyCredits: 55000, priceMonthly: 1200, displayPrice: "$1,200/mo", polarEnvKey: "POLAR_PRO_55000_PRODUCT_ID" },
    { monthlyCredits: 100000, priceMonthly: 2000, displayPrice: "$2,000/mo", polarEnvKey: "POLAR_PRO_100000_PRODUCT_ID" },
] as const;

// Credit consumption rates for different resource types
export const CREDIT_RATES = {
    // AI Usage (existing - 1 credit = 10,000 tokens)
    ai: {
        baseRate: 10000, // tokens per credit
        modelMultipliers: {
            'claude-sonnet-4.5': 1.5,
            'claude-sonnet-3.5': 1.5,
            'claude-haiku-4.5': 0.5,
            'claude-haiku-3.5': 0.5,
            'gpt-5': 1.0,
            'gpt-5-mini': 0.25,
            'gemini-2.5-pro': 1.0,
            'gemini-2.5-flash': 0.3,
            'grok-4-fast': 0.1,
            'grok-2': 1.2,
        }
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
 * Get plan monthly price for a specific Pro tier
 */
export function getPlanPrice(planName: PlanName, monthlyCredits?: number): number {
    if (planName === "PRO" && monthlyCredits) {
        const tier = getProTier(monthlyCredits);
        return tier?.priceMonthly ?? 50; // Default to $50 if tier not found
    }
    if (planName === "PRO") {
        return 50; // Default Pro price
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
        return tier?.displayPrice ?? "$50/mo";
    }
    if (planName === "PRO") {
        return "$50/mo"; // Default Pro price
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
