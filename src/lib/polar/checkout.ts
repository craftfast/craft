/**
 * Polar Checkout Service
 * 
 * Handles checkout session creation and management.
 */

import { prisma } from "@/lib/db";
import { getPriceIdForPlan } from "./products";

const POLAR_API_BASE = process.env.POLAR_SERVER === "production"
    ? "https://api.polar.sh/v1"
    : "https://sandbox-api.polar.sh/v1";

const POLAR_HEADERS = {
    "Authorization": `Bearer ${process.env.POLAR_ACCESS_TOKEN}`,
    "Content-Type": "application/json",
};

interface CheckoutSessionParams {
    userId: string;
    monthlyCredits: number;
    successUrl?: string;
    embedOrigin?: string;
}

interface PolarCheckoutSession {
    id: string;
    url: string;
    customer_id?: string | null;
    product_price_id: string;
    embed_origin?: string | null;
    success_url?: string | null;
    metadata?: Record<string, any>;
}

/**
 * Create a checkout session for a user
 */
export async function createCheckoutSession(params: CheckoutSessionParams) {
    try {
        const { userId, monthlyCredits, successUrl, embedOrigin } = params;

        // Get user
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new Error("User not found");
        }

        // Get price ID for the selected plan
        const priceId = await getPriceIdForPlan(monthlyCredits);

        if (!priceId) {
            throw new Error(`No price found for ${monthlyCredits} credits/month plan`);
        }

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

        // Create checkout session
        const response = await fetch(`${POLAR_API_BASE}/checkouts/custom/`, {
            method: "POST",
            headers: POLAR_HEADERS,
            body: JSON.stringify({
                product_price_id: priceId,
                customer_email: user.email,
                customer_id: user.polarCustomerId || undefined,
                embed_origin: embedOrigin || baseUrl,
                success_url: successUrl || `${baseUrl}/dashboard?payment=success`,
                metadata: {
                    userId: user.id,
                    purchaseType: "subscription",
                    planName: "PRO",
                    monthlyCredits: monthlyCredits.toString(),
                    billingPeriod: "MONTHLY",
                },
            }),
        });

        if (!response.ok) {
            throw new Error(`Failed to create checkout session: ${await response.text()}`);
        }

        const checkout: PolarCheckoutSession = await response.json();

        console.log(`Created checkout session ${checkout.id} for user ${userId}`);

        return {
            success: true,
            checkout,
            checkoutUrl: checkout.url,
        };
    } catch (error) {
        console.error("Error creating checkout session:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}

/**
 * Get checkout session details
 */
export async function getCheckoutSession(checkoutId: string) {
    try {
        const response = await fetch(`${POLAR_API_BASE}/checkouts/custom/${checkoutId}`, {
            method: "GET",
            headers: POLAR_HEADERS,
        });

        if (!response.ok) {
            throw new Error(`Failed to get checkout session: ${await response.text()}`);
        }

        const checkout: PolarCheckoutSession = await response.json();

        return {
            success: true,
            checkout,
        };
    } catch (error) {
        console.error("Error getting checkout session:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}

/**
 * Get checkout session from client
 * 
 * This can be called from the client side using a checkout ID
 * without authentication to check status.
 */
export async function getCheckoutSessionFromClient(checkoutId: string) {
    try {
        const response = await fetch(
            `${POLAR_API_BASE}/checkouts/custom/${checkoutId}/client`,
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );

        if (!response.ok) {
            throw new Error(`Failed to get checkout session: ${await response.text()}`);
        }

        const checkout = await response.json();

        return {
            success: true,
            checkout,
        };
    } catch (error) {
        console.error("Error getting checkout session from client:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}
