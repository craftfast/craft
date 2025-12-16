/**
 * Centralized Redis Client
 * 
 * Single Redis instance shared across all modules.
 * Uses Upstash Redis REST API for serverless compatibility.
 * 
 * Why centralized?
 * - Single configuration point
 * - Easier to mock for testing
 * - Better resource management
 * - Consistent error handling
 */

import { Redis } from "@upstash/redis";

/**
 * Singleton Redis client instance
 * Configured with Upstash REST API credentials
 */
export const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL || "",
    token: process.env.UPSTASH_REDIS_REST_TOKEN || "",
});

/**
 * Check if Redis is properly configured and available
 */
export async function isRedisConfigured(): Promise<boolean> {
    return !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

/**
 * Health check - verify Redis connection works
 */
export async function checkRedisHealth(): Promise<boolean> {
    try {
        if (!await isRedisConfigured()) {
            return false;
        }
        await redis.ping();
        return true;
    } catch (error) {
        console.error("Redis health check failed:", error);
        return false;
    }
}

/**
 * Redis key prefixes for namespacing
 */
export const REDIS_PREFIXES = {
    CACHE: "craft:cache",
    AGENT_LOOP: "craft:agent-loop",
    TOOL_CONTEXT: "craft:tool-context",
    STATS_CACHE: "craft:stats-cache",
    SANDBOX_LOCK: "sandbox:lock",
    RATE_LIMIT_CHAT: "craft:ratelimit:chat",
    RATE_LIMIT_API: "craft:ratelimit:api",
    RATE_LIMIT_PUBLIC: "craft:ratelimit:open",
    EXCHANGE_RATE: "craft:exchange-rate",
} as const;

/**
 * Common TTL values (in seconds)
 */
export const REDIS_TTL = {
    SHORT: 60,              // 1 minute
    MEDIUM: 5 * 60,         // 5 minutes
    LONG: 60 * 60,          // 1 hour
    VERY_LONG: 24 * 60 * 60, // 24 hours
    AGENT_LOOP: 30 * 60,    // 30 minutes
    TOOL_CONTEXT: 10 * 60,  // 10 minutes
    SANDBOX_LOCK: 90,       // 90 seconds
    EXCHANGE_RATE: 12 * 60 * 60, // 12 hours
} as const;
