/**
 * Polar.sh Integration Utility
 * Handles payment processing for Premium plan subscriptions using Polar.sh Next.js SDK
 */

import { Polar } from "@polar-sh/sdk";

export interface PolarResponse {
    checkoutId: string;
    customerId: string;
    status: string;
}

export interface PolarOptions {
    amount: number; // Amount in smallest currency unit (e.g., cents for USD)
    currency: string; // "USD" or "EUR"
    productName: string;
    productDescription: string;
    successUrl?: string;
    email?: string;
    onSuccess?: (response: PolarResponse) => void;
    onFailure?: (error: Error | { error: string }) => void;
}

// Initialize Polar client
export function getPolarClient() {
    const accessToken = process.env.POLAR_ACCESS_TOKEN;
    if (!accessToken) {
        throw new Error("POLAR_ACCESS_TOKEN environment variable is not set");
    }

    const server = process.env.POLAR_SERVER as "sandbox" | "production" | undefined;

    return new Polar({
        accessToken,
        server: server || "sandbox", // Default to sandbox for safety
    });
}

/**
 * Create a Polar checkout URL using the Next.js adapter
 * This calls a helper endpoint to build the checkout URL with the price ID
 * 
 * @see https://polar.sh/docs/integrate/sdk/adapters/nextjs
 */
export async function createPolarCheckout(options: PolarOptions): Promise<string> {
    try {
        // Call helper endpoint to get the checkout URL with proper price ID
        const response = await fetch("/api/payment/get-checkout-url", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                email: options.email,
                successUrl: options.successUrl || `${window.location.origin}/dashboard?payment=success`,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(
                errorData.message ||
                `Payment initialization failed (${response.status}). Please try again later or contact support.`
            );
        }

        const data = await response.json();

        if (!data.checkoutUrl) {
            throw new Error("Checkout URL not received from server");
        }

        return data.checkoutUrl;
    } catch (error) {
        console.error("Payment initiation error:", error);
        const errorMessage = error instanceof Error
            ? error.message
            : "Payment could not be initiated. Please try again later or contact support at support@craft.tech";

        if (options.onFailure) {
            options.onFailure({ error: errorMessage });
        }

        throw error;
    }
}

/**
 * Initiate Polar payment by redirecting to checkout
 */
export async function initiatePolarPayment(options: PolarOptions): Promise<void> {
    try {
        const checkoutUrl = await createPolarCheckout(options);

        // Redirect to Polar checkout
        window.location.href = checkoutUrl;
    } catch (error) {
        if (options.onFailure) {
            const errorMessage = error instanceof Error
                ? error.message
                : "Payment could not be initiated";
            options.onFailure({ error: errorMessage });
        }
    }
}

/**
 * Get checkout status from Polar
 */
export async function getCheckoutStatus(
    checkoutId: string
): Promise<{ verified: boolean; message?: string; error?: string; status?: string }> {
    try {
        const response = await fetch(`/api/payment/status?checkoutId=${checkoutId}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            throw new Error("Failed to fetch checkout status");
        }

        const result = await response.json();
        return result;
    } catch (error) {
        console.error("Payment verification error:", error);
        return {
            verified: false,
            error: "Failed to verify payment. Please contact support at support@craft.tech",
        };
    }
}

/**
 * Format amount for display
 */
export function formatAmount(amount: number, currency: string): string {
    const formatter = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currency,
        minimumFractionDigits: 2,
    });
    return formatter.format(amount / 100); // Convert from smallest unit
}

/**
 * Get currency symbol
 */
export function getCurrencySymbol(currency: string): string {
    const symbols: Record<string, string> = {
        USD: "$",
        EUR: "€",
        GBP: "£",
        INR: "₹",
    };
    return symbols[currency] || currency;
}

/**
 * Convert amount to smallest currency unit (cents, paise, etc.)
 */
export function toSmallestUnit(amount: number): number {
    return Math.round(amount * 100);
}

/**
 * Convert amount from smallest currency unit
 */
export function fromSmallestUnit(amount: number): number {
    return amount / 100;
}
