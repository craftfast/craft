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
    PRO_500: process.env.POLAR_PRODUCT_PRO_500,
    PRO_2000: process.env.POLAR_PRODUCT_PRO_2000,
    PRO_5000: process.env.POLAR_PRODUCT_PRO_5000,
    PRO_10000: process.env.POLAR_PRODUCT_PRO_10000,
} as const;

/**
 * Get product ID by monthly credits
 */
export function getProductIdByCredits(monthlyCredits: number): string | undefined {
    switch (monthlyCredits) {
        case 500:
            return POLAR_PRODUCTS.PRO_500;
        case 2000:
            return POLAR_PRODUCTS.PRO_2000;
        case 5000:
            return POLAR_PRODUCTS.PRO_5000;
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

    if (!POLAR_PRODUCTS.PRO_500) missing.push("POLAR_PRODUCT_PRO_500");
    if (!POLAR_PRODUCTS.PRO_2000) missing.push("POLAR_PRODUCT_PRO_2000");
    if (!POLAR_PRODUCTS.PRO_5000) missing.push("POLAR_PRODUCT_PRO_5000");
    if (!POLAR_PRODUCTS.PRO_10000) missing.push("POLAR_PRODUCT_PRO_10000");

    return {
        valid: missing.length === 0,
        missing,
    };
}
