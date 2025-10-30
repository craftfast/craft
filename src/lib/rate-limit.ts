import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Initialize Redis client
const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Create rate limiter for authentication endpoints
// 5 attempts per hour per IP address
export const authRateLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, "1 h"),
    analytics: true,
    prefix: "ratelimit:auth",
});

/**
 * Extract IP address from request headers
 * Supports both direct connections and proxied requests
 */
export function getClientIp(request: Request): string {
    // Check common proxy headers first
    const forwardedFor = request.headers.get("x-forwarded-for");
    if (forwardedFor) {
        // x-forwarded-for can contain multiple IPs, use the first one
        return forwardedFor.split(",")[0].trim();
    }

    const realIp = request.headers.get("x-real-ip");
    if (realIp) {
        return realIp.trim();
    }

    // Fallback to a generic identifier if no IP is found
    // This shouldn't happen in production but prevents errors in dev
    return "unknown";
}

/**
 * Check rate limit for a given identifier
 * Returns { success: boolean, limit, remaining, reset }
 */
export async function checkRateLimit(identifier: string) {
    return await authRateLimiter.limit(identifier);
}
