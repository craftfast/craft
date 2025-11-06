/**
 * Polar Products Service
 * 
 * Handles product and price synchronization with Polar.
 */

import { prisma } from "@/lib/db";
import { getProductIdByCredits } from "./index";

const POLAR_API_BASE = process.env.POLAR_SERVER === "production"
    ? "https://api.polar.sh/v1"
    : "https://sandbox-api.polar.sh/v1";

const POLAR_HEADERS = {
    "Authorization": `Bearer ${process.env.POLAR_ACCESS_TOKEN}`,
    "Content-Type": "application/json",
};

interface PolarProduct {
    id: string;
    name: string;
    description?: string | null;
    prices: PolarPrice[];
    is_archived: boolean;
    organization_id: string;
    metadata?: Record<string, unknown>;
}

interface PolarPrice {
    id: string;
    type: "recurring" | "one_time";
    price_amount: number;
    price_currency: string;
    recurring_interval?: "month" | "year";
}

/**
 * Get product details from Polar
 */
export async function getProductDetails(productId: string) {
    try {
        const response = await fetch(`${POLAR_API_BASE}/products/${productId}`, {
            method: "GET",
            headers: POLAR_HEADERS,
        });

        if (!response.ok) {
            throw new Error(`Failed to get product: ${await response.text()}`);
        }

        const product: PolarProduct = await response.json();
        return { success: true, product };
    } catch (error) {
        console.error("Error getting product details:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}

/**
 * Sync product IDs from environment to database
 * 
 * This updates the Plan records with their corresponding Polar product IDs.
 */
export async function syncProductsToDatabase() {
    try {
        const updates: Promise<unknown>[] = [];

        // Map of monthly credits to product environment variable
        const creditsMap = {
            500: "POLAR_PRODUCT_PRO_500",
            2000: "POLAR_PRODUCT_PRO_2000",
            5000: "POLAR_PRODUCT_PRO_5000",
            10000: "POLAR_PRODUCT_PRO_10000",
        };

        for (const [credits, envVar] of Object.entries(creditsMap)) {
            const productId = process.env[envVar];

            if (!productId) {
                console.warn(`Missing environment variable ${envVar}`);
                continue;
            }

            // Get product details from Polar
            const result = await getProductDetails(productId);

            if (!result.success || !result.product) {
                console.error(`Failed to get details for product ${productId}`);
                continue;
            }

            const product = result.product;
            const priceId = product.prices[0]?.id;

            if (!priceId) {
                console.error(`Product ${productId} has no prices`);
                continue;
            }

            // Update the plan in database
            const updatePromise = prisma.plan.updateMany({
                where: {
                    name: "PRO",
                    monthlyCredits: parseInt(credits),
                },
                data: {
                    polarProductId: productId,
                    polarPriceId: priceId,
                },
            });

            updates.push(updatePromise);
            console.log(`Syncing plan with ${credits} credits to product ${productId}`);
        }

        await Promise.all(updates);

        console.log("Product sync completed");
        return { success: true };
    } catch (error) {
        console.error("Error syncing products:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}

/**
 * Get price ID for a plan
 */
export async function getPriceIdForPlan(monthlyCredits: number): Promise<string | null> {
    try {
        const plan = await prisma.plan.findFirst({
            where: {
                name: "PRO",
                monthlyCredits,
            },
            select: {
                polarPriceId: true,
                polarProductId: true,
            },
        });

        if (plan?.polarPriceId) {
            return plan.polarPriceId;
        }

        // If no price ID in database, try to get from product
        const productId = getProductIdByCredits(monthlyCredits);

        if (!productId) {
            return null;
        }

        const result = await getProductDetails(productId);

        if (result.success && result.product) {
            const priceId = result.product.prices[0]?.id;

            // Update database with price ID for future use
            if (priceId) {
                await prisma.plan.updateMany({
                    where: {
                        name: "PRO",
                        monthlyCredits,
                    },
                    data: {
                        polarPriceId: priceId,
                    },
                });
            }

            return priceId || null;
        }

        return null;
    } catch (error) {
        console.error("Error getting price ID:", error);
        return null;
    }
}

/**
 * List all products from Polar
 */
export async function listProducts() {
    try {
        const response = await fetch(
            `${POLAR_API_BASE}/products/?limit=100`,
            {
                method: "GET",
                headers: POLAR_HEADERS,
            }
        );

        if (!response.ok) {
            throw new Error(`Failed to list products: ${await response.text()}`);
        }

        const data = await response.json();
        return {
            success: true,
            products: data.items as PolarProduct[],
            pagination: data.pagination,
        };
    } catch (error) {
        console.error("Error listing products:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}
