/**
 * Distributed Lock with Redis (Upstash)
 * 
 * Provides distributed locking for Vercel multi-instance deployments.
 * Uses Upstash Redis REST API for serverless compatibility.
 * 
 * This prevents race conditions where multiple Vercel instances
 * try to perform the same operation simultaneously.
 */

import { redis } from "./redis-client";

interface RedisLockOptions {
    /** Lock expiry time in milliseconds (default: 60000 = 60s) */
    ttlMs?: number;
    /** Maximum time to wait for lock acquisition in milliseconds (default: 60000 = 60s) */
    timeoutMs?: number;
    /** Interval between retry attempts in milliseconds (default: 500ms) */
    retryIntervalMs?: number;
    /** If true, throw error when Redis is unavailable instead of falling back (default: false) */
    requireLock?: boolean;
}

/**
 * Acquire a distributed lock using Redis SET NX (set if not exists)
 * 
 * @param lockKey - Unique identifier for the lock (e.g., "sandbox:lock:project-123")
 * @param options - Lock configuration options
 * @returns A release function that should be called in a finally block
 * 
 * @example
 * ```typescript
 * const release = await acquireRedisLock("sandbox:lock:project-123");
 * try {
 *   // Your critical section code here
 * } finally {
 *   await release();
 * }
 * ```
 */
export async function acquireRedisLock(
    lockKey: string,
    options: RedisLockOptions = {}
): Promise<() => Promise<void>> {
    const {
        ttlMs = 60000,          // Lock expires after 60s (prevents deadlocks)
        timeoutMs = 60000,      // Wait up to 60s to acquire lock
        retryIntervalMs = 500,  // Check every 500ms
        requireLock = false     // If true, fail instead of fallback
    } = options;

    const lockValue = `${Date.now()}-${Math.random()}`; // Unique lock value
    const startTime = Date.now();

    console.log(`🔒 Attempting to acquire lock: ${lockKey}`);

    // Try to acquire lock with retries
    while (true) {
        // Check if we've exceeded timeout
        if (Date.now() - startTime > timeoutMs) {
            throw new Error(`Failed to acquire lock "${lockKey}" - timeout after ${timeoutMs}ms`);
        }

        try {
            // SET key value NX PX milliseconds
            // NX = only set if key doesn't exist (atomic lock acquisition)
            // PX = set expiry in milliseconds (auto-cleanup)
            const result = await redis.set(lockKey, lockValue, {
                nx: true,           // Only set if not exists
                px: ttlMs,          // Expiry time in milliseconds
            });

            if (result === "OK") {
                console.log(`✅ Acquired lock: ${lockKey}`);

                // Return release function
                return async () => {
                    try {
                        // Only delete if the lock value matches (prevents deleting someone else's lock)
                        const script = `
                            if redis.call("get", KEYS[1]) == ARGV[1] then
                                return redis.call("del", KEYS[1])
                            else
                                return 0
                            end
                        `;

                        await redis.eval(script, [lockKey], [lockValue]);
                        console.log(`🔓 Released lock: ${lockKey}`);
                    } catch (error) {
                        console.error(`❌ Error releasing lock ${lockKey}:`, error);
                    }
                };
            }

            // Lock is held by another instance, wait and retry
            console.log(`⏳ Lock ${lockKey} is held by another instance, retrying...`);
            await new Promise(resolve => setTimeout(resolve, retryIntervalMs));
        } catch (error) {
            console.error(`❌ Error acquiring lock ${lockKey}:`, error);

            // If requireLock is true, throw error instead of falling back
            if (requireLock) {
                throw new Error(`Failed to acquire required lock "${lockKey}" - Redis unavailable`);
            }

            // If Redis is unavailable, fall back to allowing the operation
            // WARNING: This creates a race condition risk - operations may execute concurrently
            console.warn(`⚠️ [CRITICAL] Redis unavailable for lock "${lockKey}" - proceeding WITHOUT distributed lock!`);
            console.warn(`⚠️ [CRITICAL] Resource: ${lockKey} - Race conditions possible across multiple Vercel instances`);
            console.warn(`⚠️ [CRITICAL] Monitor for duplicate operations or data inconsistencies`);

            return async () => {
                console.log(`⚠️ No-op lock release (Redis was unavailable for: ${lockKey})`);
            };
        }
    }
}

// Re-export Redis health check from centralized client
export { checkRedisHealth as isRedisAvailable } from "./redis-client";

/**
 * Get all active locks (for debugging/monitoring)
 * @param pattern - Lock key pattern (e.g., "sandbox:lock:*")
 */
export async function getActiveLocks(pattern: string = "*"): Promise<string[]> {
    try {
        // Use SCAN to iterate over keys matching the pattern (production-safe)
        let cursor = "0";
        let keys: string[] = [];
        do {
            // SCAN cursor MATCH pattern COUNT 100
            const [nextCursor, foundKeys] = await redis.scan(cursor, {
                match: pattern,
                count: 100,
            });
            cursor = nextCursor;
            if (Array.isArray(foundKeys)) {
                keys.push(...foundKeys);
            }
        } while (cursor !== "0");
        return keys;
    } catch (error) {
        console.error("Error fetching active locks:", error);
        return [];
    }
}
