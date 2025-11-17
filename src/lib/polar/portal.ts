/**
 * Polar Customer Portal Service
 * 
 * Handles customer portal session creation for self-service subscription management.
 */

import { prisma } from "@/lib/db";

const POLAR_API_BASE = process.env.POLAR_SERVER === "production"
    ? "https://api.polar.sh/v1"
    : "https://sandbox-api.polar.sh/v1";

const POLAR_HEADERS = {
    "Authorization": `Bearer ${process.env.POLAR_ACCESS_TOKEN}`,
    "Content-Type": "application/json",
};

interface PortalSessionParams {
    userId: string;
    returnUrl?: string;
}

interface PolarPortalSession {
    url: string;
    customer_id: string;
    created_at: string;
    expires_at: string;
}

/**
 * Create a customer portal session
 * 
 * Allows users to:
 * - Cancel subscriptions
 * - Update payment methods
 * - View billing history
 * - Download invoices
 */
export async function createPortalSession(params: PortalSessionParams) {
    try {
        const { userId, returnUrl } = params;

        // Get user with Polar customer ID
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                polarCustomerId: true,
                email: true,
            },
        });

        if (!user) {
            throw new Error("User not found");
        }

        if (!user.polarCustomerId) {
            throw new Error("User does not have a Polar customer account");
        }

        // Create portal session using correct Polar API endpoint
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const defaultReturnUrl = `${baseUrl}/?settings=billing`;

        const response = await fetch(`${POLAR_API_BASE}/customer-sessions`, {
            method: "POST",
            headers: POLAR_HEADERS,
            body: JSON.stringify({
                customer_id: user.polarCustomerId,
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            console.error("Polar API error:", error);
            throw new Error(`Failed to create portal session: ${error}`);
        }

        const session = await response.json();

        console.log(`Created portal session for user ${userId}:`, session);

        return {
            success: true,
            portalUrl: session.customer_portal_url || session.url,
            expiresAt: session.expires_at,
        };
    } catch (error) {
        console.error("Error creating portal session:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}

/**
 * Get customer subscription details for portal preview
 */
export async function getCustomerSubscriptionDetails(userId: string) {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                subscription: {
                    include: {
                        plan: true,
                    },
                },
            },
        });

        if (!user) {
            throw new Error("User not found");
        }

        if (!user.subscription) {
            return {
                success: true,
                hasSubscription: false,
            };
        }

        return {
            success: true,
            hasSubscription: true,
            subscription: {
                planName: user.subscription.plan.displayName,
                status: user.subscription.status,
                currentPeriodEnd: user.subscription.currentPeriodEnd,
                cancelAtPeriodEnd: user.subscription.cancelAtPeriodEnd,
                cancelledAt: user.subscription.cancelledAt,
                priceMonthlyUsd: user.subscription.plan.priceMonthlyUsd,
                monthlyCredits: user.subscription.plan.monthlyCredits,
            },
        };
    } catch (error) {
        console.error("Error getting subscription details:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}
