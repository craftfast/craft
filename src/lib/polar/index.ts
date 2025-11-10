/**
 * Polar SDK Client
 * 
 * Central configuration for the Polar SDK client.
 * This client is used across all Polar integration services.
 */

import { Polar } from "@polar-sh/sdk";

// Validate environment variables
if (!process.env.POLAR_ACCESS_TOKEN) {
    throw new Error("POLAR_ACCESS_TOKEN environment variable is required");
}

// Create singleton Polar client instance
export const polarClient = new Polar({
    accessToken: process.env.POLAR_ACCESS_TOKEN,
    server: (process.env.POLAR_SERVER as "sandbox" | "production") || "sandbox",
});

// Export server type for conditional logic
export const POLAR_SERVER = (process.env.POLAR_SERVER as "sandbox" | "production") || "sandbox";
export const IS_PRODUCTION = POLAR_SERVER === "production";

// Export organization ID
export const POLAR_ORGANIZATION_ID = process.env.POLAR_ORGANIZATION_ID;

/**
 * Product IDs by tier
 * These are configured in environment variables
 */
export const POLAR_PRODUCTS = {
    PRO_100: process.env.POLAR_PRO_100_PRODUCT_ID,
    PRO_200: process.env.POLAR_PRO_200_PRODUCT_ID,
    PRO_400: process.env.POLAR_PRO_400_PRODUCT_ID,
    PRO_800: process.env.POLAR_PRO_800_PRODUCT_ID,
    PRO_1200: process.env.POLAR_PRO_1200_PRODUCT_ID,
    PRO_1800: process.env.POLAR_PRO_1800_PRODUCT_ID,
    PRO_2500: process.env.POLAR_PRO_2500_PRODUCT_ID,
    PRO_3500: process.env.POLAR_PRO_3500_PRODUCT_ID,
    PRO_5000: process.env.POLAR_PRO_5000_PRODUCT_ID,
    PRO_7000: process.env.POLAR_PRO_7000_PRODUCT_ID,
    PRO_10000: process.env.POLAR_PRO_10000_PRODUCT_ID,
} as const;

/**
 * Get product ID by monthly credits
 */
export function getProductIdByCredits(monthlyCredits: number): string | undefined {
    switch (monthlyCredits) {
        case 100:
            return POLAR_PRODUCTS.PRO_100;
        case 200:
            return POLAR_PRODUCTS.PRO_200;
        case 400:
            return POLAR_PRODUCTS.PRO_400;
        case 800:
            return POLAR_PRODUCTS.PRO_800;
        case 1200:
            return POLAR_PRODUCTS.PRO_1200;
        case 1800:
            return POLAR_PRODUCTS.PRO_1800;
        case 2500:
            return POLAR_PRODUCTS.PRO_2500;
        case 3500:
            return POLAR_PRODUCTS.PRO_3500;
        case 5000:
            return POLAR_PRODUCTS.PRO_5000;
        case 7000:
            return POLAR_PRODUCTS.PRO_7000;
        case 10000:
            return POLAR_PRODUCTS.PRO_10000;
        default:
            return undefined;
    }
}

/**
 * Validate that all required product IDs are configured
 */
export function validateProductConfiguration(): { valid: boolean; missing: string[] } {
    const missing: string[] = [];

    if (!POLAR_PRODUCTS.PRO_100) missing.push("POLAR_PRO_100_PRODUCT_ID");
    if (!POLAR_PRODUCTS.PRO_200) missing.push("POLAR_PRO_200_PRODUCT_ID");
    if (!POLAR_PRODUCTS.PRO_400) missing.push("POLAR_PRO_400_PRODUCT_ID");
    if (!POLAR_PRODUCTS.PRO_800) missing.push("POLAR_PRO_800_PRODUCT_ID");
    if (!POLAR_PRODUCTS.PRO_1200) missing.push("POLAR_PRO_1200_PRODUCT_ID");
    if (!POLAR_PRODUCTS.PRO_1800) missing.push("POLAR_PRO_1800_PRODUCT_ID");
    if (!POLAR_PRODUCTS.PRO_2500) missing.push("POLAR_PRO_2500_PRODUCT_ID");
    if (!POLAR_PRODUCTS.PRO_3500) missing.push("POLAR_PRO_3500_PRODUCT_ID");
    if (!POLAR_PRODUCTS.PRO_5000) missing.push("POLAR_PRO_5000_PRODUCT_ID");
    if (!POLAR_PRODUCTS.PRO_7000) missing.push("POLAR_PRO_7000_PRODUCT_ID");
    if (!POLAR_PRODUCTS.PRO_10000) missing.push("POLAR_PRO_10000_PRODUCT_ID");

    return {
        valid: missing.length === 0,
        missing,
    };
}
