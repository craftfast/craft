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

        // Create new Razorpay customer
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
