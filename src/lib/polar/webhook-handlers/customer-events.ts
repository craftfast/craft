/**
 * Polar Customer Event Handlers
 * 
 * Handles customer-related events from Polar webhooks.
 */

import { prisma } from "@/lib/db";

/**
 * Handle customer.created event
 */
export async function handleCustomerCreated(data: any) {
    console.log("Processing customer.created event:", data.id);

    try {
        const customer = data;

        // Check if we already have a user with this external ID
        if (customer.external_id) {
            const user = await prisma.user.findUnique({
                where: { polarCustomerExtId: customer.external_id },
            });

            if (user) {
                // Update with Polar customer ID
                await prisma.user.update({
                    where: { id: user.id },
                    data: {
                        polarCustomerId: customer.id,
                    },
                });

                console.log(`Linked existing user ${user.id} to Polar customer ${customer.id}`);
                return { success: true };
            }
        }

        // If no matching user found, log it (customer might have been created externally)
        console.log(`Customer ${customer.id} created but no matching user found`);
        return { success: true };
    } catch (error) {
        console.error("Error handling customer.created:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}

/**
 * Handle customer.updated event
 */
export async function handleCustomerUpdated(data: any) {
    console.log("Processing customer.updated event:", data.id);

    try {
        const customer = data;

        // Find user by customer ID
        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { polarCustomerId: customer.id },
                    { polarCustomerExtId: customer.external_id },
                ],
            },
        });

        if (!user) {
            console.log(`No user found for customer ${customer.id}`);
            return { success: true };
        }

        // Update user metadata if needed
        const updates: any = {};

        if (customer.email && customer.email !== user.email) {
            updates.email = customer.email;
        }

        if (customer.name && customer.name !== user.name) {
            updates.name = customer.name;
        }

        if (Object.keys(updates).length > 0) {
            await prisma.user.update({
                where: { id: user.id },
                data: updates,
            });
            console.log(`Updated user ${user.id} from customer data`);
        }

        return { success: true };
    } catch (error) {
        console.error("Error handling customer.updated:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}

/**
 * Handle customer.deleted event
 */
export async function handleCustomerDeleted(data: any) {
    console.log("Processing customer.deleted event:", data.id);

    try {
        const customer = data;

        // Find user by customer ID
        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { polarCustomerId: customer.id },
                    { polarCustomerExtId: customer.external_id },
                ],
            },
        });

        if (!user) {
            console.log(`No user found for deleted customer ${customer.id}`);
            return { success: true };
        }

        // Clear Polar customer IDs
        await prisma.user.update({
            where: { id: user.id },
            data: {
                polarCustomerId: null,
                polarCustomerExtId: null,
            },
        });

        console.log(`Cleared Polar customer IDs for user ${user.id}`);
        return { success: true };
    } catch (error) {
        console.error("Error handling customer.deleted:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}
