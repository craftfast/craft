/**
 * API Rate Limiting with Upstash Redis
 * 
 * Provides rate limiting for API endpoints to prevent abuse.
 * Uses Upstash Redis for distributed rate limiting across instances.
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

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
 * Check if rate limit is exceeded for a given identifier
 * Returns true if allowed, false if rate limited
 */
export async function checkRateLimit(
    limiter: Ratelimit,
    identifier: string
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
        // If Redis is unavailable, allow the request but log the error
        console.error("Rate limit check failed:", error);
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
