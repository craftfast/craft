/**
 * Polar Customer Service
 * 
 * Handles customer creation, synchronization, and state management with Polar.
 * Uses direct API calls for maximum reliability and control.
 */

import { prisma } from "@/lib/db";
import type { User } from "@prisma/client";

const POLAR_API_BASE = process.env.POLAR_SERVER === "production"
    ? "https://api.polar.sh/v1"
    : "https://sandbox-api.polar.sh/v1";

const POLAR_HEADERS = {
    "Authorization": `Bearer ${process.env.POLAR_ACCESS_TOKEN}`,
    "Content-Type": "application/json",
};

interface PolarCustomer {
    id: string;
    email: string;
    external_id?: string | null;
    name?: string | null;
    created_at: string;
    modified_at?: string | null;
    organization_id: string;
    metadata?: Record<string, any>;
}

/**
 * Create a Polar customer for a new user
 * 
 * This should be called during user registration to ensure
 * every user has a corresponding Polar customer record.
 */
export async function createPolarCustomer(user: User) {
    try {
        // Check if customer already exists
        if (user.polarCustomerId) {
            console.log(`User ${user.id} already has Polar customer: ${user.polarCustomerId}`);
            return { success: true, customerId: user.polarCustomerId };
        }

        // Create customer in Polar
        const response = await fetch(`${POLAR_API_BASE}/customers/`, {
            method: "POST",
            headers: POLAR_HEADERS,
            body: JSON.stringify({
                email: user.email,
                external_id: user.id, // Use our user ID as external ID
                name: user.name || undefined,
                metadata: {
                    craftUserId: user.id,
                    createdAt: user.createdAt.toISOString(),
                },
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            console.error("Polar API error:", error);

            // If customer already exists with this email, try to find and link it
            if (response.status === 422 && error.includes("already exists")) {
                return await linkExistingPolarCustomer(user);
            }

            throw new Error(`Failed to create Polar customer: ${error}`);
        }

        const customer: PolarCustomer = await response.json();

        // Update user with Polar customer ID
        await prisma.user.update({
            where: { id: user.id },
            data: {
                polarCustomerId: customer.id,
                polarCustomerExtId: user.id,
            },
        });

        console.log(`Created Polar customer ${customer.id} for user ${user.id}`);

        return {
            success: true,
            customerId: customer.id,
        };
    } catch (error) {
        console.error("Error creating Polar customer:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}

/**
 * Link existing Polar customer to our user
 */
export async function linkExistingPolarCustomer(user: User) {
    try {
        // Search for existing customer by email
        const response = await fetch(
            `${POLAR_API_BASE}/customers/?email=${encodeURIComponent(user.email)}`,
            {
                method: "GET",
                headers: POLAR_HEADERS,
            }
        );

        if (!response.ok) {
            throw new Error(`Failed to search for customer: ${await response.text()}`);
        }

        const data = await response.json();

        if (data.items && data.items.length > 0) {
            const existingCustomer: PolarCustomer = data.items[0];

            // Update our database with the existing customer ID
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    polarCustomerId: existingCustomer.id,
                    polarCustomerExtId: user.id,
                },
            });

            console.log(`Linked existing Polar customer ${existingCustomer.id} to user ${user.id}`);

            return {
                success: true,
                customerId: existingCustomer.id,
            };
        }

        throw new Error("Customer exists but could not be found");
    } catch (error) {
        console.error("Error linking existing Polar customer:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}

/**
 * Sync user data with Polar customer
 * 
 * Updates the Polar customer record with the latest user data.
 */
export async function syncPolarCustomer(user: User) {
    try {
        if (!user.polarCustomerId) {
            console.log(`User ${user.id} has no Polar customer ID, creating one`);
            return await createPolarCustomer(user);
        }

        // Update customer in Polar
        const response = await fetch(`${POLAR_API_BASE}/customers/${user.polarCustomerId}`, {
            method: "PATCH",
            headers: POLAR_HEADERS,
            body: JSON.stringify({
                email: user.email,
                name: user.name || undefined,
                metadata: {
                    craftUserId: user.id,
                    lastSyncedAt: new Date().toISOString(),
                },
            }),
        });

        if (!response.ok) {
            throw new Error(`Failed to update Polar customer: ${await response.text()}`);
        }

        console.log(`Synced Polar customer ${user.polarCustomerId} for user ${user.id}`);

        return { success: true };
    } catch (error) {
        console.error("Error syncing Polar customer:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}

/**
 * Get customer state from Polar
 * 
 * Returns the complete customer state including subscriptions,
 * benefits, and usage meters.
 */
export async function getPolarCustomerState(userId: string) {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new Error("User not found");
        }

        if (!user.polarCustomerExtId && !user.polarCustomerId) {
            throw new Error("User not synced with Polar");
        }

        // Use external ID endpoint if available, otherwise use customer ID
        const endpoint = user.polarCustomerExtId
            ? `${POLAR_API_BASE}/customers/state/external/${encodeURIComponent(user.polarCustomerExtId)}`
            : `${POLAR_API_BASE}/customers/state/${user.polarCustomerId}`;

        const response = await fetch(endpoint, {
            method: "GET",
            headers: POLAR_HEADERS,
        });

        if (!response.ok) {
            throw new Error(`Failed to get customer state: ${await response.text()}`);
        }

        const customerState = await response.json();

        return {
            success: true,
            state: customerState,
        };
    } catch (error) {
        console.error("Error getting Polar customer state:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}

/**
 * Get Polar customer by user ID
 */
export async function getPolarCustomer(userId: string) {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user?.polarCustomerId) {
            return null;
        }

        const response = await fetch(`${POLAR_API_BASE}/customers/${user.polarCustomerId}`, {
            method: "GET",
            headers: POLAR_HEADERS,
        });

        if (!response.ok) {
            throw new Error(`Failed to get customer: ${await response.text()}`);
        }

        const customer: PolarCustomer = await response.json();
        return customer;
    } catch (error) {
        console.error("Error getting Polar customer:", error);
        return null;
    }
}

/**
 * Delete Polar customer
 * 
 * This should be called when a user deletes their account.
 */
export async function deletePolarCustomer(userId: string) {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user?.polarCustomerId) {
            return { success: true, message: "No Polar customer to delete" };
        }

        const response = await fetch(`${POLAR_API_BASE}/customers/${user.polarCustomerId}`, {
            method: "DELETE",
            headers: POLAR_HEADERS,
        });

        if (!response.ok && response.status !== 404) {
            throw new Error(`Failed to delete customer: ${await response.text()}`);
        }

        console.log(`Deleted Polar customer ${user.polarCustomerId} for user ${userId}`);

        return { success: true };
    } catch (error) {
        console.error("Error deleting Polar customer:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}
