/**
 * API Rate Limiting with Upstash Redis
 * 
 * Provides rate limiting for API endpoints to prevent abuse.
 * Uses Upstash Redis for distributed rate limiting across instances.
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const IS_PRODUCTION = process.env.NODE_ENV === "production";

// Create Redis client (uses UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN env vars)
const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL || "",
    token: process.env.UPSTASH_REDIS_REST_TOKEN || "",
});

/**
 * Rate limiter for AI chat endpoints
 * Allows 20 requests per minute per user
 */
export const chatRateLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(20, "1 m"),
    analytics: true,
    prefix: "craft:ratelimit:chat",
});

/**
 * Rate limiter for general API endpoints
 * Allows 100 requests per minute per user
 */
export const apiRateLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, "1 m"),
    analytics: true,
    prefix: "craft:ratelimit:api",
});

/**
 * Rate limiter for sandbox operations (more expensive)
 * Allows 10 requests per minute per user
 */
export const sandboxRateLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, "1 m"),
    analytics: true,
    prefix: "craft:ratelimit:sandbox",
});

/**
 * Rate limiter for payment/billing operations (critical - fail closed)
 * Allows 10 requests per minute per user
 */
export const paymentRateLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, "1 m"),
    analytics: true,
    prefix: "craft:ratelimit:payment",
});

/**
 * Rate limiter for auth operations (critical - fail closed)
 * Allows 5 requests per minute per IP
 */
export const authRateLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, "1 m"),
    analytics: true,
    prefix: "craft:ratelimit:auth",
});

/**
 * Rate limiter for environment variable operations (sensitive data)
 * Allows 30 requests per minute per user to prevent enumeration attacks
 */
export const envVarRateLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(30, "1 m"),
    analytics: true,
    prefix: "craft:ratelimit:envvar",
});

/**
 * Check if rate limit is exceeded for a given identifier
 * 
 * @param limiter - The rate limiter to use
 * @param identifier - Unique identifier (e.g., user ID, IP address)
 * @param failClosed - If true, deny requests when Redis is unavailable (for critical endpoints)
 */
export async function checkRateLimit(
    limiter: Ratelimit,
    identifier: string,
    failClosed: boolean = false
): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
    try {
        const result = await limiter.limit(identifier);
        return {
            success: result.success,
            limit: result.limit,
            remaining: result.remaining,
            reset: result.reset,
        };
    } catch (error) {
        console.error("Rate limit check failed:", error);

        // For critical endpoints (payments, auth), fail closed in production
        if (failClosed && IS_PRODUCTION) {
            console.error("⚠️ Rate limiting failed closed for critical endpoint");
            return {
                success: false,
                limit: 0,
                remaining: 0,
                reset: 0,
            };
        }

        // For non-critical endpoints, allow the request but log the error
        return {
            success: true,
            limit: 0,
            remaining: 0,
            reset: 0,
        };
    }
}

/**
 * Get rate limit headers for response
 */
export function getRateLimitHeaders(result: { limit: number; remaining: number; reset: number }) {
    return {
        "X-RateLimit-Limit": result.limit.toString(),
        "X-RateLimit-Remaining": result.remaining.toString(),
        "X-RateLimit-Reset": result.reset.toString(),
    };
}
