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
    priceMonthlyUsd: number;
    maxProjects: number | null;
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
 * Get monthly plan price in USD
 */
export async function getPlanMonthlyPrice(
    planName: string
): Promise<number | null> {
    const plan = await getPlanByName(planName);
    if (!plan) return null;

    return plan.priceMonthlyUsd;
}

/**
 * Get plan price in smallest currency unit (cents) for payment processing
 */
export async function getPlanPriceInSmallestUnit(
    planName: string
): Promise<number | null> {
    const price = await getPlanMonthlyPrice(planName);
    if (price === null) return null;

    // Convert to cents (multiply by 100)
    return Math.round(price * 100);
}

/**
 * Check if a plan allows unlimited projects
 */
export async function hasUnlimitedProjects(
    planName: string
): Promise<boolean> {
    const plan = await getPlanByName(planName);
    if (!plan) return false;

    // maxProjects of 1000 or more is considered "unlimited"
    return plan.maxProjects === null || plan.maxProjects >= 1000;
}

/**
 * Get plan resource limits
 */
export async function getPlanLimits(planName: string): Promise<{
    maxProjects: number | null;
} | null> {
    const plan = await getPlanByName(planName);
    if (!plan) return null;

    return {
        maxProjects: plan.maxProjects,
    };
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
    priceDifference: number;
    uniqueFeatures1: string[];
    uniqueFeatures2: string[];
} | null> {
    const plan1 = await getPlanByName(planName1);
    const plan2 = await getPlanByName(planName2);

    if (!plan1 || !plan2) return null;

    // Calculate monthly price difference in USD
    const usdDiff = Math.abs(plan1.priceMonthlyUsd - plan2.priceMonthlyUsd);

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
        priceDifference: usdDiff,
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
