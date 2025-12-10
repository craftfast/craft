/**
 * Exchange Rate API
 * GET /api/exchange-rate
 * 
 * Returns the current USD to INR exchange rate.
 * Used for displaying estimated INR amounts to Indian customers.
 */

import { NextResponse } from "next/server";

// Cache exchange rate for 12 hours
let cachedRate: { rate: number; timestamp: number } | null = null;
const CACHE_DURATION_MS = 12 * 60 * 60 * 1000; // 12 hours
// Fallback rate from environment variable
const FALLBACK_RATE = parseFloat(process.env.FALLBACK_USD_TO_INR_RATE || '84.50');

async function fetchExchangeRate(): Promise<number> {
    // Check cache first
    if (cachedRate && Date.now() - cachedRate.timestamp < CACHE_DURATION_MS) {
        return cachedRate.rate;
    }

    try {
        // Try to fetch from a free exchange rate API
        const response = await fetch(
            'https://api.exchangerate-api.com/v4/latest/USD',
            { next: { revalidate: 43200 } } // 12 hours
        );

        if (response.ok) {
            const data = await response.json();
            const rate = data.rates?.INR;

            if (rate && typeof rate === 'number') {
                cachedRate = { rate, timestamp: Date.now() };
                return rate;
            }
        }
    } catch (error) {
        console.warn('Failed to fetch exchange rate:', error);
    }

    return FALLBACK_RATE;
}

export async function GET() {
    try {
        const rate = await fetchExchangeRate();

        return NextResponse.json({
            success: true,
            rate,
            currency: 'INR',
            base: 'USD',
            updated: new Date().toISOString(),
        });
    } catch (error) {
        console.error("Error fetching exchange rate:", error);
        return NextResponse.json({
            success: true,
            rate: FALLBACK_RATE,
            currency: 'INR',
            base: 'USD',
            fallback: true,
        });
    }
}
