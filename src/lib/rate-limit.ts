import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Initialize Redis client
const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Create rate limiter for authentication endpoints
// 5 attempts per hour per IP address (prevents brute force attacks)
export const authRateLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, "1 h"),
    analytics: true,
    prefix: "ratelimit:auth",
});

// Stricter rate limiter for password reset requests
// 3 attempts per hour per IP address
export const passwordResetRateLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(3, "1 h"),
    analytics: true,
    prefix: "ratelimit:password-reset",
});

// Rate limiter for email verification requests
// 10 attempts per hour per IP address
export const emailVerificationRateLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, "1 h"),
    analytics: true,
    prefix: "ratelimit:email-verification",
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

/**
 * Check rate limit for password reset requests
 * More strict than general auth rate limiting
 */
export async function checkPasswordResetRateLimit(identifier: string) {
    return await passwordResetRateLimiter.limit(identifier);
}

/**
 * Check rate limit for email verification requests
 * More lenient than auth rate limiting
 */
export async function checkEmailVerificationRateLimit(identifier: string) {
    return await emailVerificationRateLimiter.limit(identifier);
}
