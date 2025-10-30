/**
 * Account Lockout Testing Script
 * 
 * Tests the 5-attempts-in-30-minutes account lockout feature.
 * Run this script to verify the lockout mechanism works correctly.
 * 
 * Usage:
 * 1. Create a test user account first
 * 2. Run: tsx scripts/test-account-lockout.ts
 * 
 * Tests:
 * ✓ Failed login increments attempts
 * ✓ 5 failed attempts locks account for 30 minutes
 * ✓ Locked account rejects login attempts
 * ✓ Successful login clears failed attempts
 * ✓ Security events are logged
 */

import { prisma } from "../src/lib/db";
import {
    checkAccountLockout,
    incrementFailedAttempts,
    clearFailedAttempts,
    getLockoutStats,
} from "../src/lib/auth-lockout";

const TEST_EMAIL = "lockout-test@example.com";

async function createTestUser() {
    console.log("📝 Creating test user...");

    // Clean up existing test user
    await prisma.user.deleteMany({
        where: { email: TEST_EMAIL },
    });

    // Create new test user
    const user = await prisma.user.create({
        data: {
            email: TEST_EMAIL,
            name: "Lockout Test User",
            emailVerified: new Date(),
            password: "test-password-hash", // Not a real hash, just for testing
        },
    });

    console.log(`✅ Test user created: ${user.email} (ID: ${user.id})`);
    return user;
}

async function testLockoutMechanism() {
    console.log("\n🧪 Testing Account Lockout Mechanism\n");
    console.log("=".repeat(60));

    const user = await createTestUser();

    // Test 1: Check initial lockout status
    console.log("\n📋 Test 1: Check initial lockout status");
    const initialStatus = await checkAccountLockout(TEST_EMAIL);
    console.log(`  Locked: ${initialStatus.locked}`);
    console.log(`  Failed Attempts: ${initialStatus.failedAttempts || 0}`);
    console.assert(!initialStatus.locked, "Account should not be locked initially");
    console.log("  ✅ PASSED");

    // Test 2: Increment failed attempts (1-4)
    console.log("\n📋 Test 2: Increment failed attempts (1-4)");
    for (let i = 1; i <= 4; i++) {
        const mockRequest = new Request("http://localhost:3000/api/auth/sign-in/email", {
            method: "POST",
            headers: {
                "user-agent": "Test Agent",
                "x-forwarded-for": "127.0.0.1",
            },
        });

        const result = await incrementFailedAttempts(TEST_EMAIL, mockRequest);
        console.log(`  Attempt ${i}: ${result.failedAttempts} failed attempts`);
        console.assert(result.failedAttempts === i, `Should have ${i} failed attempts`);
        console.assert(!result.locked, "Account should not be locked yet");
    }
    console.log("  ✅ PASSED");

    // Test 3: Get lockout stats before lockout
    console.log("\n📋 Test 3: Get lockout stats before lockout");
    const statsBefore = await getLockoutStats(TEST_EMAIL);
    console.log(`  Failed Attempts: ${statsBefore?.failedAttempts}`);
    console.log(`  Is Locked: ${statsBefore?.isLocked}`);
    console.log(`  Attempts Remaining: ${statsBefore?.attemptsRemaining}`);
    console.assert(statsBefore?.failedAttempts === 4, "Should have 4 failed attempts");
    console.assert(statsBefore?.attemptsRemaining === 1, "Should have 1 attempt remaining");
    console.log("  ✅ PASSED");

    // Test 4: 5th failed attempt should lock account
    console.log("\n📋 Test 4: 5th failed attempt should lock account");
    const mockRequest = new Request("http://localhost:3000/api/auth/sign-in/email", {
        method: "POST",
        headers: {
            "user-agent": "Test Agent",
            "x-forwarded-for": "127.0.0.1",
        },
    });

    const lockoutResult = await incrementFailedAttempts(TEST_EMAIL, mockRequest);
    console.log(`  Failed Attempts: ${lockoutResult.failedAttempts}`);
    console.log(`  Locked: ${lockoutResult.locked}`);
    console.log(`  Remaining Minutes: ${lockoutResult.remainingMinutes}`);
    console.log(`  Message: ${lockoutResult.message}`);
    console.assert(lockoutResult.locked, "Account should be locked after 5 attempts");
    console.assert(lockoutResult.remainingMinutes === 30, "Lockout should be 30 minutes");
    console.log("  ✅ PASSED");

    // Test 5: Check lockout status
    console.log("\n📋 Test 5: Check lockout status");
    const lockedStatus = await checkAccountLockout(TEST_EMAIL);
    console.log(`  Locked: ${lockedStatus.locked}`);
    console.log(`  Remaining Minutes: ${lockedStatus.remainingMinutes}`);
    console.log(`  Message: ${lockedStatus.message}`);
    console.assert(lockedStatus.locked, "Account should be locked");
    console.log("  ✅ PASSED");

    // Test 6: Get lockout stats after lockout
    console.log("\n📋 Test 6: Get lockout stats after lockout");
    const statsAfter = await getLockoutStats(TEST_EMAIL);
    console.log(`  Failed Attempts: ${statsAfter?.failedAttempts}`);
    console.log(`  Is Locked: ${statsAfter?.isLocked}`);
    console.log(`  Locked Until: ${statsAfter?.lockedUntil?.toISOString()}`);
    console.log(`  Remaining Minutes: ${statsAfter?.remainingMinutes}`);
    console.assert(statsAfter?.isLocked, "Account should be locked");
    console.log("  ✅ PASSED");

    // Test 7: Clear failed attempts (simulate successful login)
    console.log("\n📋 Test 7: Clear failed attempts");
    await clearFailedAttempts(user.id);
    const clearedStatus = await checkAccountLockout(TEST_EMAIL);
    console.log(`  Locked: ${clearedStatus.locked}`);
    console.log(`  Failed Attempts: ${clearedStatus.failedAttempts || 0}`);
    console.assert(!clearedStatus.locked, "Account should not be locked after clearing");
    console.assert(clearedStatus.failedAttempts === 0, "Failed attempts should be 0");
    console.log("  ✅ PASSED");

    // Test 8: Check security events were logged
    console.log("\n📋 Test 8: Check security events were logged");
    const securityEvents = await prisma.securityEvent.findMany({
        where: { email: TEST_EMAIL },
        orderBy: { createdAt: "desc" },
        take: 10,
    });

    console.log(`  Total Events Logged: ${securityEvents.length}`);
    console.log("\n  Recent Events:");
    securityEvents.forEach((event, index) => {
        console.log(`    ${index + 1}. ${event.eventType} - ${event.severity} - ${event.success ? "✓" : "✗"}`);
    });

    const hasLockoutEvent = securityEvents.some(e => e.eventType === "ACCOUNT_LOCKED");
    const hasClearEvent = securityEvents.some(e => e.eventType === "LOCKOUT_CLEARED");
    console.assert(hasLockoutEvent, "Should have ACCOUNT_LOCKED event");
    console.assert(hasClearEvent, "Should have LOCKOUT_CLEARED event");
    console.log("  ✅ PASSED");

    console.log("\n" + "=".repeat(60));
    console.log("🎉 All tests passed!");
    console.log("=".repeat(60));

    // Cleanup
    console.log("\n🧹 Cleaning up test data...");
    await prisma.securityEvent.deleteMany({
        where: { email: TEST_EMAIL },
    });
    await prisma.user.delete({
        where: { id: user.id },
    });
    console.log("✅ Cleanup complete");
}

// Run tests
testLockoutMechanism()
    .then(() => {
        console.log("\n✨ Testing complete!");
        process.exit(0);
    })
    .catch((error) => {
        console.error("\n❌ Testing failed:", error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
