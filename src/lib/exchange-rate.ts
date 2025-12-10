/**
 * Exchange Rate Service
 * 
 * Centralized service for fetching and caching USD to INR exchange rates.
 * Uses Redis for persistent caching across serverless invocations.
 * 
 * Used by:
 * - /api/exchange-rate endpoint (for frontend display)
 * - Razorpay currency utilities (for payment calculations)
 */

import { Redis } from "@upstash/redis";

// Redis client for caching
const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL || "",
    token: process.env.UPSTASH_REDIS_REST_TOKEN || "",
});

const CACHE_KEY = "craft:exchange-rate:usd-inr";
const CACHE_DURATION_SECONDS = 12 * 60 * 60; // 12 hours

// Fallback rate from environment variable
const FALLBACK_RATE = parseFloat(process.env.FALLBACK_USD_TO_INR_RATE || '84.50');

/**
 * Fetch current USD to INR exchange rate
 * Uses Redis cache with 12-hour TTL, falls back to env variable if API fails
 */
export async function getUsdToInrRate(): Promise<number> {
    // Check Redis cache first
    try {
        const cached = await redis.get<number>(CACHE_KEY);
        if (cached !== null && typeof cached === 'number') {
            return cached;
        }
    } catch (error) {
        console.warn('Redis cache read failed:', error);
    }

    try {
        // Try to fetch from exchange rate API
        const response = await fetch(
            'https://api.exchangerate-api.com/v4/latest/USD',
            { next: { revalidate: 43200 } } // 12 hours
        );

        if (response.ok) {
            const data = await response.json();
            const rate = data.rates?.INR;

            if (rate && typeof rate === 'number') {
                // Cache in Redis
                try {
                    await redis.set(CACHE_KEY, rate, { ex: CACHE_DURATION_SECONDS });
                    console.log(`Exchange rate cached: 1 USD = ${rate} INR`);
                } catch (error) {
                    console.warn('Redis cache write failed:', error);
                }
                return rate;
            }
        }
    } catch (error) {
        console.warn('Failed to fetch exchange rate:', error);
    }

    console.log(`Using fallback exchange rate: 1 USD = ${FALLBACK_RATE} INR`);
    return FALLBACK_RATE;
}

/**
 * Get the fallback exchange rate (for error responses)
 */
export function getFallbackRate(): number {
    return FALLBACK_RATE;
}
