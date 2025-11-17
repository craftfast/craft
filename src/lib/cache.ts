/**
 * Simple In-Memory Cache for Credit Availability
 * Uses a Map with TTL for caching to reduce database load
 * 
 * Note: This is an in-memory cache, so it will be cleared on server restart.
 * For production with multiple instances, consider using Redis instead.
 */

interface CacheEntry<T> {
    value: T;
    expiresAt: number;
}

class SimpleCache<T> {
    private cache = new Map<string, CacheEntry<T>>();

    set(key: string, value: T, ttlSeconds: number): void {
        const expiresAt = Date.now() + (ttlSeconds * 1000);
        this.cache.set(key, { value, expiresAt });
    }

    get(key: string): T | null {
        const entry = this.cache.get(key);

        if (!entry) {
            return null;
        }

        // Check if expired
        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            return null;
        }

        return entry.value;
    }

    delete(key: string): void {
        this.cache.delete(key);
    }

    clear(): void {
        this.cache.clear();
    }

    // Clean up expired entries periodically
    cleanup(): number {
        const now = Date.now();
        let deletedCount = 0;

        for (const [key, entry] of this.cache.entries()) {
            if (now > entry.expiresAt) {
                this.cache.delete(key);
                deletedCount++;
            }
        }

        return deletedCount;
    }

    size(): number {
        return this.cache.size;
    }
}

// Export singleton instance
export const creditCache = new SimpleCache<{
    allowed: boolean;
    reason?: string;
    monthlyCreditsUsed: number;
    monthlyCreditsLimit: number;
    creditsRemaining: number;
    planName: "HOBBY" | "PRO" | "ENTERPRISE";
    periodEnd: Date;
    referralCredits?: number;
}>();

// Clean up expired cache entries every 5 minutes
if (typeof setInterval !== 'undefined') {
    setInterval(() => {
        const deleted = creditCache.cleanup();
        if (deleted > 0) {
            console.log(`🧹 Cleaned up ${deleted} expired cache entries`);
        }
    }, 5 * 60 * 1000);
}

/**
 * Helper to generate cache key for user credits
 */
export function getCreditCacheKey(userId: string): string {
    return `credits:${userId}`;
}

/**
 * Helper to invalidate user's credit cache
 */
export function invalidateCreditCache(userId: string): void {
    creditCache.delete(getCreditCacheKey(userId));
}
