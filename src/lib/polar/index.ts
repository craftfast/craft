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
 * Balance Top-Up Product ID
 * This is a Pay What You Want product for adding balance to user accounts
 */
export const POLAR_BALANCE_TOPUP_PRODUCT_ID = process.env.POLAR_BALANCE_TOPUP_PRODUCT_ID;

/**
 * Validate that balance top-up product is configured
 */
export function validateProductConfiguration(): { valid: boolean; missing: string[] } {
    const missing: string[] = [];

    if (!POLAR_BALANCE_TOPUP_PRODUCT_ID) {
        missing.push("POLAR_BALANCE_TOPUP_PRODUCT_ID");
    }

    return {
        valid: missing.length === 0,
        missing,
    };
}
