/**
 * Pricing Constants
 * Centralized pricing information for the Craft platform
 * Credit-based system with daily credit allocation
 * Users get daily credit allocation based on their plan
 * Users connect their own Supabase for database and storage
 */

export const PRICING = {
    HOBBY: {
        name: "Hobby",
        priceMonthly: 0,
        displayPriceMonthly: "Free",
        maxProjects: 3, // Limited to 3 projects
        dailyCredits: 1, // 1 credit per day (~30 credits/month)
        monthlyCredits: 30, // Approximate monthly credits
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
        dailyCredits: null, // Custom allocation
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

// Pro plan tiers with different daily credit allocations
export const PRO_TIERS = [
    { dailyCredits: 10, monthlyCredits: 300, priceMonthly: 25, displayPrice: "$25/mo", polarEnvKey: "POLAR_PRO_10_PRODUCT_ID" },
    { dailyCredits: 20, monthlyCredits: 600, priceMonthly: 50, displayPrice: "$50/mo", polarEnvKey: "POLAR_PRO_20_PRODUCT_ID" },
    { dailyCredits: 40, monthlyCredits: 1200, priceMonthly: 100, displayPrice: "$100/mo", polarEnvKey: "POLAR_PRO_40_PRODUCT_ID" },
    { dailyCredits: 80, monthlyCredits: 2400, priceMonthly: 200, displayPrice: "$200/mo", polarEnvKey: "POLAR_PRO_80_PRODUCT_ID" },
    { dailyCredits: 120, monthlyCredits: 3600, priceMonthly: 300, displayPrice: "$300/mo", polarEnvKey: "POLAR_PRO_120_PRODUCT_ID" },
    { dailyCredits: 200, monthlyCredits: 6000, priceMonthly: 500, displayPrice: "$500/mo", polarEnvKey: "POLAR_PRO_200_PRODUCT_ID" },
    { dailyCredits: 300, monthlyCredits: 9000, priceMonthly: 750, displayPrice: "$750/mo", polarEnvKey: "POLAR_PRO_300_PRODUCT_ID" },
    { dailyCredits: 400, monthlyCredits: 12000, priceMonthly: 1000, displayPrice: "$1,000/mo", polarEnvKey: "POLAR_PRO_400_PRODUCT_ID" },
    { dailyCredits: 500, monthlyCredits: 15000, priceMonthly: 1250, displayPrice: "$1,250/mo", polarEnvKey: "POLAR_PRO_500_PRODUCT_ID" },
    { dailyCredits: 750, monthlyCredits: 22500, priceMonthly: 1875, displayPrice: "$1,875/mo", polarEnvKey: "POLAR_PRO_750_PRODUCT_ID" },
    { dailyCredits: 1000, monthlyCredits: 30000, priceMonthly: 2500, displayPrice: "$2,500/mo", polarEnvKey: "POLAR_PRO_1000_PRODUCT_ID" },
] as const;

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

// Helper function to get Pro tier by daily credits
export function getProTier(dailyCredits: number) {
    return PRO_TIERS.find(tier => tier.dailyCredits === dailyCredits);
}

export const SUPPORT_EMAIL = "support@craft.fast";
export const SALES_EMAIL = "sales@craft.fast";

export type PlanName = "HOBBY" | "PRO" | "ENTERPRISE";

/**
 * Get plan monthly price for a specific Pro tier
 */
export function getPlanPrice(planName: PlanName, dailyCredits?: number): number {
    if (planName === "PRO" && dailyCredits) {
        const tier = getProTier(dailyCredits);
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
export function getDisplayPrice(planName: PlanName, dailyCredits?: number): string {
    if (planName === "PRO" && dailyCredits) {
        const tier = getProTier(dailyCredits);
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
