/**
 * Razorpay SDK Client
 * 
 * Central configuration for the Razorpay SDK client.
 * This client is used across all Razorpay integration services.
 */

import Razorpay from "razorpay";
import { RAZORPAY_CONFIG } from "@/lib/razorpay-config";

// Validate environment variables
if (!RAZORPAY_CONFIG.keyId || !RAZORPAY_CONFIG.keySecret) {
    throw new Error("RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables are required");
}

// Create singleton Razorpay client instance
export const razorpayClient = new Razorpay({
    key_id: RAZORPAY_CONFIG.keyId,
    key_secret: RAZORPAY_CONFIG.keySecret,
});

// Export configuration
export const RAZORPAY_CURRENCY = RAZORPAY_CONFIG.currency;
export const RAZORPAY_WEBHOOK_SECRET = RAZORPAY_CONFIG.webhookSecret;

/**
 * Convert amount to smallest currency unit (paise for INR, cents for USD)
 */
export function toSmallestUnit(amount: number): number {
    return Math.round(amount * 100);
}

/**
 * Convert amount from smallest currency unit to main unit
 */
export function fromSmallestUnit(amount: number): number {
    return amount / 100;
}
