/**
 * Distributed Cache with Redis (Upstash)
 * 
 * Replaces in-memory Map-based cache with Redis for Vercel multi-instance deployments.
 * Uses Upstash Redis REST API for serverless compatibility.
 */

import { redis, REDIS_PREFIXES } from "./redis-client";

class DistributedCache<T> {
    private prefix: string;

    constructor(prefix: string = REDIS_PREFIXES.CACHE) {
        this.prefix = prefix;
    }

    private getKey(key: string): string {
        return `${this.prefix}:${key}`;
    }

    async set(key: string, value: T, ttlSeconds: number): Promise<void> {
        try {
            const redisKey = this.getKey(key);
            await redis.set(redisKey, JSON.stringify(value), { ex: ttlSeconds });
        } catch (error) {
            console.error(`Redis cache set error for key ${key}:`, error);
            // Fail silently - cache is not critical
        }
    }

    async get(key: string): Promise<T | null> {
        try {
            const redisKey = this.getKey(key);
            const value = await redis.get<string>(redisKey);

            if (value === null) {
                return null;
            }

            return JSON.parse(value) as T;
        } catch (error) {
            console.error(`Redis cache get error for key ${key}:`, error);
            return null;
        }
    }

    async delete(key: string): Promise<void> {
        try {
            const redisKey = this.getKey(key);
            await redis.del(redisKey);
        } catch (error) {
            console.error(`Redis cache delete error for key ${key}:`, error);
        }
    }

    async clear(): Promise<void> {
        try {
            // Delete all keys with this prefix using SCAN (production-safe)
            const pattern = `${this.prefix}:*`;
            let cursor = "0";

            do {
                const [nextCursor, foundKeys] = await redis.scan(cursor, {
                    match: pattern,
                    count: 100,
                });
                cursor = nextCursor;

                if (Array.isArray(foundKeys) && foundKeys.length > 0) {
                    await redis.del(...foundKeys);
                }
            } while (cursor !== "0");
        } catch (error) {
            console.error("Redis cache clear error:", error);
        }
    }

    // Note: Redis automatically handles TTL expiry, no manual cleanup needed
    async size(): Promise<number> {
        try {
            const pattern = `${this.prefix}:*`;
            let cursor = "0";
            let count = 0;

            do {
                const [nextCursor, foundKeys] = await redis.scan(cursor, {
                    match: pattern,
                    count: 100,
                });
                cursor = nextCursor;

                if (Array.isArray(foundKeys)) {
                    count += foundKeys.length;
                }
            } while (cursor !== "0");

            return count;
        } catch (error) {
            console.error("Redis cache size error:", error);
            return 0;
        }
    }
}

// Export singleton instance for generic caching
// Uses Redis for distributed caching across Vercel instances
export const genericCache = new DistributedCache<unknown>(REDIS_PREFIXES.CACHE);
