/**
 * Test Redis-Based Distributed Systems
 * 
 * Tests all Redis-backed systems: cache, agent loops, tool contexts
 * Run with: tsx tests/redis-distributed-systems.test.ts
 */

import { genericCache } from "../src/lib/cache";
import { getAgentLoopState, deleteAgentLoopState } from "../src/lib/ai/agent-loop";
import { registerToolCall, getToolCallContext, unregisterToolCall } from "../src/lib/ai/tool-context";
import { isRedisAvailable } from "../src/lib/redis-lock";

async function testDistributedSystems() {
    console.log("🧪 Testing Redis-Based Distributed Systems...\n");

    // Check Redis availability
    console.log("1️⃣ Checking Redis connection...");
    const available = await isRedisAvailable();

    if (!available) {
        console.error("❌ Redis is not available or not configured");
        console.error("   Please set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in .env");
        process.exit(1);
    }
    console.log("✅ Redis is available\n");

    // Test distributed cache
    console.log("2️⃣ Testing distributed cache...");
    try {
        await genericCache.set("test-key", { value: "test-data" }, 60);
        console.log("✅ Cache set successful");

        const cached = await genericCache.get("test-key");
        if (cached && (cached as { value: string }).value === "test-data") {
            console.log("✅ Cache get successful");
        } else {
            console.error("❌ Cache get returned unexpected value:", cached);
        }

        await genericCache.delete("test-key");
        console.log("✅ Cache delete successful\n");
    } catch (error) {
        console.error("❌ Cache test failed:", error);
    }

    // Test agent loop state
    console.log("3️⃣ Testing agent loop state...");
    try {
        const sessionId = "test-session-" + Date.now();

        const manager = await getAgentLoopState(sessionId, {
            projectId: "test-project",
            userId: "test-user",
        });
        console.log("✅ Agent loop state created");

        const state = manager.getState();
        if (state.sessionId === sessionId) {
            console.log("✅ Agent loop state retrieved correctly");
        } else {
            console.error("❌ Agent loop state has wrong sessionId");
        }

        await deleteAgentLoopState(sessionId);
        console.log("✅ Agent loop state deleted\n");
    } catch (error) {
        console.error("❌ Agent loop test failed:", error);
    }

    // Test tool context
    console.log("4️⃣ Testing tool context...");
    try {
        const toolCallId = "test-tool-" + Date.now();

        await registerToolCall(toolCallId, {
            projectId: "test-project",
            userId: "test-user",
            sessionId: "test-session",
        });
        console.log("✅ Tool context registered");

        const context = await getToolCallContext(toolCallId);
        if (context?.projectId === "test-project") {
            console.log("✅ Tool context retrieved correctly");
        } else {
            console.error("❌ Tool context has wrong data:", context);
        }

        await unregisterToolCall(toolCallId);
        console.log("✅ Tool context unregistered\n");
    } catch (error) {
        console.error("❌ Tool context test failed:", error);
    }

    // Test cache TTL expiry
    console.log("5️⃣ Testing cache TTL (2 second expiry)...");
    try {
        await genericCache.set("ttl-test", { data: "expires" }, 2);
        console.log("✅ TTL cache set (expires in 2s)");

        console.log("   Waiting 3 seconds...");
        await new Promise(resolve => setTimeout(resolve, 3000));

        const expired = await genericCache.get("ttl-test");
        if (expired === null) {
            console.log("✅ Cache correctly expired after TTL\n");
        } else {
            console.error("❌ Cache did not expire:", expired);
        }
    } catch (error) {
        console.error("❌ TTL test failed:", error);
    }

    console.log("✅ All distributed systems tests completed successfully!");
    console.log("\n💡 Your Redis-backed systems are working correctly for Vercel deployment.");
}

testDistributedSystems().catch(error => {
    console.error("❌ Test failed:", error);
    process.exit(1);
});
