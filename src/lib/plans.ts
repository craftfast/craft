/**
 * Plan Management Utility
 * Provides easy access to plan details from database
 */

import { prisma } from "@/lib/db";

export interface PlanDetails {
    id: string;
    name: string;
    displayName: string;
    description: string | null;
    priceUsdPerCredit: number;
    priceInrPerCredit: number;
    minCredits: number;
    maxCredits: number;
    creditIncrement: number;
    dailyLimit: number | null;
    features: string[];
    isActive: boolean;
    sortOrder: number;
}

/**
 * Get all active plans ordered by sortOrder
 */
export async function getAllPlans(): Promise<PlanDetails[]> {
    const plans = await prisma.plan.findMany({
        where: {
            isActive: true,
        },
        orderBy: {
            sortOrder: "asc",
        },
    });

    return plans.map((plan) => ({
        ...plan,
        features: plan.features as string[],
    }));
}

/**
 * Get a specific plan by name
 */
export async function getPlanByName(
    planName: string
): Promise<PlanDetails | null> {
    const plan = await prisma.plan.findUnique({
        where: {
            name: planName.toUpperCase(),
        },
    });

    if (!plan) return null;

    return {
        ...plan,
        features: plan.features as string[],
    };
}

/**
 * Calculate price for a given plan and credit amount
 */
export async function calculatePlanPrice(
    planName: string,
    credits: number,
    currency: "USD" | "INR"
): Promise<number | null> {
    const plan = await getPlanByName(planName);
    if (!plan) return null;

    const pricePerCredit =
        currency === "USD" ? plan.priceUsdPerCredit : plan.priceInrPerCredit;
    return credits * pricePerCredit;
}

/**
 * Get plan price in smallest currency unit (cents/paise) for payment processing
 */
export async function getPlanPriceInSmallestUnit(
    planName: string,
    credits: number,
    currency: "USD" | "INR"
): Promise<number | null> {
    const price = await calculatePlanPrice(planName, credits, currency);
    if (price === null) return null;

    // Convert to smallest unit (multiply by 100 for cents/paise)
    return Math.round(price * 100);
}

/**
 * Validate if credit amount is valid for a plan
 */
export async function isValidCreditAmount(
    planName: string,
    credits: number
): Promise<boolean> {
    const plan = await getPlanByName(planName);
    if (!plan) return false;

    // Check if credits are within range
    if (credits < plan.minCredits || credits > plan.maxCredits) {
        return false;
    }

    // Check if credits are a valid increment
    if (plan.creditIncrement > 0) {
        return (credits - plan.minCredits) % plan.creditIncrement === 0;
    }

    return true;
}

/**
 * Get available credit options for a plan (for dropdowns/selectors)
 */
export async function getPlanCreditOptions(
    planName: string
): Promise<number[]> {
    const plan = await getPlanByName(planName);
    if (!plan) return [];

    // For Free plan or plans with no increment, return fixed amount
    if (plan.creditIncrement === 0) {
        return [plan.minCredits];
    }

    // Generate all possible credit options
    const options: number[] = [];
    for (
        let credits = plan.minCredits;
        credits <= plan.maxCredits;
        credits += plan.creditIncrement
    ) {
        options.push(credits);
    }

    return options;
}

/**
 * Get common/recommended credit options for UI display
 */
export async function getRecommendedCreditOptions(
    planName: string
): Promise<Array<{ credits: number; label: string; recommended?: boolean }>> {
    const plan = await getPlanByName(planName);
    if (!plan) return [];

    // For Free plan
    if (plan.name === "FREE") {
        return [{ credits: plan.minCredits, label: "20 credits (included)" }];
    }

    // Recommended credit tiers for Pro/Business plans
    const recommendations = [
        { credits: 100, label: "Light users", recommended: false },
        { credits: 200, label: "Regular users", recommended: true },
        { credits: 500, label: "Active developers", recommended: false },
        { credits: 1000, label: "Small teams", recommended: false },
        { credits: 2000, label: "Growing teams", recommended: false },
        { credits: 5000, label: "Large teams", recommended: false },
        { credits: 10000, label: "Power users", recommended: false },
    ];

    return recommendations.filter(
        (rec) => rec.credits >= plan.minCredits && rec.credits <= plan.maxCredits
    );
}

/**
 * Compare two plans and get feature differences
 */
export async function comparePlans(
    planName1: string,
    planName2: string
): Promise<{
    plan1: PlanDetails;
    plan2: PlanDetails;
    priceDifference: { usd: number; inr: number };
    uniqueFeatures1: string[];
    uniqueFeatures2: string[];
} | null> {
    const plan1 = await getPlanByName(planName1);
    const plan2 = await getPlanByName(planName2);

    if (!plan1 || !plan2) return null;

    // Calculate price difference for same credit amount (using minimum)
    const credits = Math.min(plan1.minCredits, plan2.minCredits);
    const usdDiff = Math.abs(
        credits * (plan1.priceUsdPerCredit - plan2.priceUsdPerCredit)
    );
    const inrDiff = Math.abs(
        credits * (plan1.priceInrPerCredit - plan2.priceInrPerCredit)
    );

    // Find unique features
    const uniqueFeatures1 = plan1.features.filter(
        (f) => !plan2.features.includes(f)
    );
    const uniqueFeatures2 = plan2.features.filter(
        (f) => !plan1.features.includes(f)
    );

    return {
        plan1,
        plan2,
        priceDifference: { usd: usdDiff, inr: inrDiff },
        uniqueFeatures1,
        uniqueFeatures2,
    };
}

/**
 * Get plan by ID
 */
export async function getPlanById(planId: string): Promise<PlanDetails | null> {
    const plan = await prisma.plan.findUnique({
        where: {
            id: planId,
        },
    });

    if (!plan) return null;

    return {
        ...plan,
        features: plan.features as string[],
    };
}
