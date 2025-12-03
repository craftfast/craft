/**
 * Razorpay Customer Management
 * 
 * Handles customer creation and management in Razorpay.
 */

import { razorpayClient } from "./index";
import { prisma } from "@/lib/db";

export interface CreateCustomerParams {
    userId: string;
    name: string;
    email: string;
}

interface RazorpayError {
    statusCode?: number;
    error?: {
        code?: string;
        description?: string;
    };
}

/**
 * Create or retrieve a Razorpay customer for a user
 */
export async function getOrCreateRazorpayCustomer(params: CreateCustomerParams) {
    const { userId, name, email } = params;

    try {
        // Check if user already has a Razorpay customer ID
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { razorpayCustomerId: true },
        });

        // If customer exists, return it
        if (user?.razorpayCustomerId) {
            try {
                const customer = await razorpayClient.customers.fetch(user.razorpayCustomerId);
                return customer;
            } catch (error) {
                console.warn(`Razorpay customer ${user.razorpayCustomerId} not found, creating new one`);
                // Customer doesn't exist in Razorpay, create new one
            }
        }

        // Try to create new Razorpay customer
        try {
            const customer = await razorpayClient.customers.create({
                name,
                email,
                notes: {
                    user_id: userId,
                },
            });

            // Update user with Razorpay customer ID
            await prisma.user.update({
                where: { id: userId },
                data: { razorpayCustomerId: customer.id },
            });

            console.log(`Created Razorpay customer ${customer.id} for user ${userId}`);

            return customer;
        } catch (createError) {
            const rzpError = createError as RazorpayError;

            // If customer already exists, fetch them by email
            if (rzpError.error?.code === "BAD_REQUEST_ERROR" &&
                rzpError.error?.description?.includes("Customer already exists")) {

                console.log(`Customer already exists for ${email}, fetching existing customer...`);

                // Fetch customers by email - Razorpay allows filtering
                const customers = await razorpayClient.customers.all({
                    count: 10,
                });

                // Find customer by email
                const existingCustomer = customers.items?.find(
                    (c: { email?: string }) => c.email === email
                );

                if (existingCustomer) {
                    // Update local database with existing customer ID
                    await prisma.user.update({
                        where: { id: userId },
                        data: { razorpayCustomerId: existingCustomer.id },
                    });

                    console.log(`Linked existing Razorpay customer ${existingCustomer.id} to user ${userId}`);
                    return existingCustomer;
                }

                // If we couldn't find by email in the list, try a broader search
                // or just proceed without customer (orders don't require customer_id)
                console.warn(`Could not find existing customer for ${email}, proceeding without customer ID`);
                return null;
            }

            // Re-throw other errors
            throw createError;
        }
    } catch (error) {
        console.error("Error creating Razorpay customer:", error);
        throw new Error("Failed to create Razorpay customer");
    }
}

/**
 * Update Razorpay customer details
 */
export async function updateRazorpayCustomer(customerId: string, data: { name?: string; email?: string }) {
    try {
        const customer = await razorpayClient.customers.edit(customerId, data);
        return customer;
    } catch (error) {
        console.error("Error updating Razorpay customer:", error);
        throw error;
    }
}
