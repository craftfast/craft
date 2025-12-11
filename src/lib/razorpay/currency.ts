/**
 * Currency Conversion Utilities for Razorpay
 * 
 * All payments are charged in INR for simplified accounting and GST compliance.
 * - Internal credits are always in USD
 * - Checkout amounts are converted from USD to INR
 * - Razorpay's Dynamic Currency Conversion (DCC) allows international 
 *   customers to see/pay in their local currency at checkout
 */

import { getUsdToInrRate } from "@/lib/exchange-rate";

// Re-export for convenience
export { getUsdToInrRate } from "@/lib/exchange-rate";

/**
 * Convert USD amount to INR
 */
export async function usdToInr(usdAmount: number): Promise<number> {
    const rate = await getUsdToInrRate();
    const inrAmount = usdAmount * rate;
    // Round to 2 decimal places
    return Math.round(inrAmount * 100) / 100;
}

/**
 * Convert INR amount to USD
 */
export async function inrToUsd(inrAmount: number): Promise<number> {
    const rate = await getUsdToInrRate();
    const usdAmount = inrAmount / rate;
    // Round to 2 decimal places
    return Math.round(usdAmount * 100) / 100;
}

/**
 * Get payment currency - always INR for simplified accounting
 * Razorpay's DCC allows international customers to pay in their currency
 * 
 * Note: countryCode parameter kept for API consistency with calculatePaymentAmount,
 * but is unused since all payments are now processed in INR.
 */
export function getPaymentCurrency(_countryCode?: string | null): 'INR' {
    return 'INR'; // Always charge in INR
}

/**
 * Format currency amount for display
 */
export function formatCurrency(amount: number, currency: 'INR' | 'USD'): string {
    if (currency === 'INR') {
        return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `$${amount.toFixed(2)}`;
}

/**
 * Get currency symbol
 */
export function getCurrencySymbol(currency: 'INR' | 'USD'): string {
    return currency === 'INR' ? '₹' : '$';
}

/**
 * Calculate payment amounts for checkout
 * All payments are in INR (converted from USD)
 * Razorpay's DCC allows international customers to pay in their currency
 */
export async function calculatePaymentAmount(
    usdAmount: number,
    _countryCode: string | null | undefined
): Promise<{
    currency: 'INR';
    chargeAmount: number;
    exchangeRate: number;
    originalUsdAmount: number;
}> {
    const rate = await getUsdToInrRate();
    const inrAmount = Math.round(usdAmount * rate * 100) / 100;
    return {
        currency: 'INR',
        chargeAmount: inrAmount,
        exchangeRate: rate,
        originalUsdAmount: usdAmount,
    };
}
