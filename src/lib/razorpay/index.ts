/**
 * Razorpay SDK Client
 * 
 * Central configuration for the Razorpay SDK client.
 * This client is used across all Razorpay integration services.
 * 
 * Uses lazy initialization to prevent app crashes when credentials
 * are not configured (e.g., development without payments).
 */

import Razorpay from "razorpay";
import { RAZORPAY_CONFIG } from "@/lib/razorpay-config";

// Lazy-initialized singleton client
let _razorpayClient: Razorpay | null = null;

/**
 * Get or create the Razorpay client instance
 * Throws an error if credentials are not configured
 */
export function getRazorpayClient(): Razorpay {
    if (_razorpayClient) {
        return _razorpayClient;
    }

    if (!RAZORPAY_CONFIG.keyId || !RAZORPAY_CONFIG.keySecret) {
        throw new Error(
            "RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables are required for payment operations"
        );
    }

    _razorpayClient = new Razorpay({
        key_id: RAZORPAY_CONFIG.keyId,
        key_secret: RAZORPAY_CONFIG.keySecret,
    });

    return _razorpayClient;
}

/**
 * Check if Razorpay is configured
 */
export function isRazorpayConfigured(): boolean {
    return !!(RAZORPAY_CONFIG.keyId && RAZORPAY_CONFIG.keySecret);
}

// Legacy export for backward compatibility - use getRazorpayClient() instead
export const razorpayClient = {
    get orders() {
        return getRazorpayClient().orders;
    },
    get payments() {
        return getRazorpayClient().payments;
    },
    get customers() {
        return getRazorpayClient().customers;
    },
    get subscriptions() {
        return getRazorpayClient().subscriptions;
    },
    get refunds() {
        return getRazorpayClient().refunds;
    },
};

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
