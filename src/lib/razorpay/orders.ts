/**
 * Razorpay Order Management
 * 
 * Handles order creation for payments and top-ups.
 */

import { razorpayClient, toSmallestUnit, RAZORPAY_CURRENCY } from "./index";
import { getOrCreateRazorpayCustomer } from "./customer";

export interface CreateOrderParams {
    userId: string;
    userName: string;
    userEmail: string;
    amount: number; // In main currency unit (e.g., USD/INR)
    description: string;
    notes?: Record<string, string>;
}

/**
 * Create a Razorpay order for payment
 */
export async function createRazorpayOrder(params: CreateOrderParams) {
    const { userId, userName, userEmail, amount, description, notes = {} } = params;

    try {
        // Try to get or create customer (may return null if customer already exists but can't be fetched)
        const customer = await getOrCreateRazorpayCustomer({
            userId,
            name: userName,
            email: userEmail,
        });

        // Create order (receipt max 40 chars)
        const timestamp = Date.now().toString();
        const userIdShort = userId.slice(0, 8); // Use first 8 chars of userId
        const receipt = `rcpt_${userIdShort}_${timestamp}`.slice(0, 40);

        // Build notes - customer_id is optional
        const orderNotes: Record<string, string> = {
            user_id: userId,
            description,
            ...notes,
        };

        if (customer?.id) {
            orderNotes.customer_id = customer.id;
        }

        const order = await razorpayClient.orders.create({
            amount: toSmallestUnit(amount),
            currency: RAZORPAY_CURRENCY,
            receipt,
            notes: orderNotes,
        });

        console.log(`Created Razorpay order ${order.id} for user ${userId} - Amount: ${amount} ${RAZORPAY_CURRENCY}`);

        return {
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            customerId: customer?.id || null,
        };
    } catch (error) {
        console.error("Error creating Razorpay order:", error);
        throw new Error("Failed to create Razorpay order");
    }
}

/**
 * Fetch order details from Razorpay
 */
export async function fetchRazorpayOrder(orderId: string) {
    try {
        const order = await razorpayClient.orders.fetch(orderId);
        return order;
    } catch (error) {
        console.error("Error fetching Razorpay order:", error);
        throw error;
    }
}

/**
 * Fetch payment details from Razorpay
 */
export async function fetchRazorpayPayment(paymentId: string) {
    try {
        const payment = await razorpayClient.payments.fetch(paymentId);
        return payment;
    } catch (error) {
        console.error("Error fetching Razorpay payment:", error);
        throw error;
    }
}
