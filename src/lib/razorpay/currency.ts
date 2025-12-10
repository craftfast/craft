/**
 * Currency Conversion Utilities for Razorpay
 * 
 * All payments are charged in INR for simplified accounting and GST compliance.
 * - Internal credits are always in USD
 * - Checkout amounts are converted from USD to INR
 * - Razorpay's Dynamic Currency Conversion (DCC) allows international 
 *   customers to see/pay in their local currency at checkout
 * 
 * Uses a fallback exchange rate from env if API is unavailable.
 */

// Fallback exchange rate from environment variable
// Set FALLBACK_USD_TO_INR_RATE in .env (e.g., FALLBACK_USD_TO_INR_RATE=84.50)
const FALLBACK_USD_TO_INR_RATE = parseFloat(process.env.FALLBACK_USD_TO_INR_RATE || '84.50');

// Cache for exchange rate (12 hour cache)
let cachedRate: { rate: number; timestamp: number } | null = null;
const CACHE_DURATION_MS = 12 * 60 * 60 * 1000; // 12 hours

/**
 * Fetch current USD to INR exchange rate
 * Uses fallback if API fails
 */
export async function getUsdToInrRate(): Promise<number> {
    // Check cache first
    if (cachedRate && Date.now() - cachedRate.timestamp < CACHE_DURATION_MS) {
        return cachedRate.rate;
    }

    try {
        // Try to fetch from a free exchange rate API
        // You can replace this with a more reliable API in production
        const response = await fetch(
            'https://api.exchangerate-api.com/v4/latest/USD',
            { next: { revalidate: 43200 } } // Cache for 12 hours
        );

        if (response.ok) {
            const data = await response.json();
            const rate = data.rates?.INR;

            if (rate && typeof rate === 'number') {
                cachedRate = { rate, timestamp: Date.now() };
                console.log(`Exchange rate fetched: 1 USD = ${rate} INR`);
                return rate;
            }
        }
    } catch (error) {
        console.warn('Failed to fetch exchange rate, using fallback:', error);
    }

    // Return fallback rate if API fails
    console.log(`Using fallback exchange rate: 1 USD = ${FALLBACK_USD_TO_INR_RATE} INR`);
    return FALLBACK_USD_TO_INR_RATE;
}

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
 */
export function getPaymentCurrency(_countryCode: string | null | undefined): 'INR' {
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
