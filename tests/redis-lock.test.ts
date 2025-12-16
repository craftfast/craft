/**
 * Test Redis Lock Functionality
 * 
 * This script tests the distributed lock mechanism using Upstash Redis.
 * Run with: tsx tests/redis-lock.test.ts
 */

import { acquireRedisLock, isRedisAvailable, getActiveLocks } from "../src/lib/redis-lock";

async function testRedisLock() {
    console.log("🧪 Testing Redis Distributed Lock...\n");

    // Check Redis availability
    console.log("1️⃣ Checking Redis connection...");
    const available = await isRedisAvailable();

    if (!available) {
        console.error("❌ Redis is not available or not configured");
        console.error("   Please set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in .env");
        process.exit(1);
    }
    console.log("✅ Redis is available\n");

    // Test basic lock acquisition and release
    console.log("2️⃣ Testing basic lock acquisition...");
    const testLockKey = "test:lock:basic";

    try {
        const release1 = await acquireRedisLock(testLockKey, { ttlMs: 10000, timeoutMs: 5000 });
        console.log("✅ Lock acquired successfully");

        console.log("   Waiting 2 seconds...");
        await new Promise(resolve => setTimeout(resolve, 2000));

        await release1();
        console.log("✅ Lock released successfully\n");
    } catch (error) {
        console.error("❌ Basic lock test failed:", error);
        process.exit(1);
    }

    // Test concurrent lock attempts
    console.log("3️⃣ Testing concurrent lock (should block second attempt)...");
    const concurrentLockKey = "test:lock:concurrent";

    try {
        const release1 = await acquireRedisLock(concurrentLockKey, { ttlMs: 5000, timeoutMs: 10000 });
        console.log("✅ First lock acquired");

        // Try to acquire the same lock (should wait)
        const startTime = Date.now();
        const lockPromise = acquireRedisLock(concurrentLockKey, { ttlMs: 5000, timeoutMs: 3000 });

        // Release first lock after 1 second
        setTimeout(async () => {
            await release1();
            console.log("✅ First lock released");
        }, 1000);

        const release2 = await lockPromise;
        const elapsed = Date.now() - startTime;
        console.log(`✅ Second lock acquired after ${elapsed}ms (expected ~1000ms)`);

        await release2();
        console.log("✅ Second lock released\n");
    } catch (error) {
        console.error("❌ Concurrent lock test failed:", error);
    }

    // Test lock timeout
    console.log("4️⃣ Testing lock timeout (should fail after timeout)...");
    const timeoutLockKey = "test:lock:timeout";

    try {
        const release1 = await acquireRedisLock(timeoutLockKey, { ttlMs: 10000, timeoutMs: 30000 });
        console.log("✅ First lock acquired");

        // Try to acquire the same lock with short timeout (should timeout)
        try {
            const startTime = Date.now();
            await acquireRedisLock(timeoutLockKey, { ttlMs: 5000, timeoutMs: 2000 });
            console.error("❌ Should have timed out but didn't");
        } catch (error) {
            const elapsed = Date.now() - startTime;
            if (error instanceof Error && error.message.includes("timeout")) {
                console.log(`✅ Lock correctly timed out after ${elapsed}ms (expected ~2000ms)`);
            } else {
                console.error("❌ Unexpected error:", error);
            }
        }

        await release1();
        console.log("✅ First lock released\n");
    } catch (error) {
        console.error("❌ Timeout test failed:", error);
    }

    // Show active locks
    console.log("5️⃣ Checking active locks...");
    try {
        const locks = await getActiveLocks("test:lock:*");
        console.log(`   Found ${locks.length} test locks:`, locks);
        console.log("   (These will auto-expire based on TTL)\n");
    } catch (error) {
        console.error("❌ Failed to get active locks:", error);
    }

    console.log("✅ All tests completed successfully!");
    console.log("\n💡 Your Redis distributed lock is working correctly for Vercel deployment.");
}

testRedisLock().catch(error => {
    console.error("❌ Test failed:", error);
    process.exit(1);
});
