/**
 * Razorpay Order Management
 * 
 * Handles order creation for payments and top-ups.
 * Supports multi-currency: INR for Indian customers, USD for international.
 */

import { razorpayClient, toSmallestUnit } from "./index";
import { getOrCreateRazorpayCustomer } from "./customer";
import { calculatePaymentAmount, getPaymentCurrency } from "./currency";

export interface CreateOrderParams {
    userId: string;
    userName: string;
    userEmail: string;
    amount: number; // In USD (will be converted to INR for Indian customers)
    description: string;
    notes?: Record<string, string>;
    countryCode?: string | null; // Customer country for currency selection
}

/**
 * Create a Razorpay order for payment
 * - Indian customers: Charged in INR (converted from USD)
 * - International customers: Charged in USD
 */
export async function createRazorpayOrder(params: CreateOrderParams) {
    const { userId, userName, userEmail, amount, description, notes = {}, countryCode } = params;

    try {
        // Calculate payment amount and currency based on customer country
        const paymentInfo = await calculatePaymentAmount(amount, countryCode);
        const currency = paymentInfo.currency;
        const chargeAmount = paymentInfo.chargeAmount;

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

        // Build notes - include exchange rate info for INR payments
        const orderNotes: Record<string, string> = {
            user_id: userId,
            description,
            original_usd_amount: amount.toFixed(2),
            ...notes,
        };

        if (customer?.id) {
            orderNotes.customer_id = customer.id;
        }

        // Add exchange rate info for INR payments
        if (paymentInfo.exchangeRate) {
            orderNotes.exchange_rate = paymentInfo.exchangeRate.toFixed(4);
        }

        const order = await razorpayClient.orders.create({
            amount: toSmallestUnit(chargeAmount),
            currency: currency,
            receipt,
            notes: orderNotes,
        });

        console.log(`Created Razorpay order ${order.id} for user ${userId} - Amount: ${chargeAmount} ${currency} (USD: ${amount})`);

        return {
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            customerId: customer?.id || null,
            chargeAmount: chargeAmount,
            originalUsdAmount: amount,
            exchangeRate: paymentInfo.exchangeRate,
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
