#!/usr/bin/env tsx
/**
 * Polar Environment Verification Script
 * 
 * Verifies that Polar is correctly configured for the current environment.
 * Run this before testing to ensure you're using the right credentials.
 * 
 * Usage:
 *   pnpm tsx scripts/verify-polar-env.ts
 */

import "dotenv/config";

interface VerificationResult {
    status: "✅" | "⚠️" | "❌";
    message: string;
}

const results: VerificationResult[] = [];

function check(condition: boolean, passMessage: string, failMessage: string): void {
    if (condition) {
        results.push({ status: "✅", message: passMessage });
    } else {
        results.push({ status: "❌", message: failMessage });
    }
}

function warn(message: string): void {
    results.push({ status: "⚠️", message });
}

async function verifyPolarEnvironment() {
    console.log("\n🔍 Polar Environment Verification");
    console.log("=".repeat(60) + "\n");

    // 1. Check POLAR_SERVER
    const polarServer = process.env.POLAR_SERVER || "sandbox";
    console.log(`Environment: ${polarServer.toUpperCase()}\n`);

    if (polarServer === "sandbox") {
        results.push({
            status: "✅",
            message: "Using SANDBOX environment (safe for testing)",
        });
    } else if (polarServer === "production") {
        warn("Using PRODUCTION environment - real charges will occur!");
        warn("Make sure you intend to test with production data");
    } else {
        results.push({
            status: "❌",
            message: `Invalid POLAR_SERVER value: "${polarServer}" (must be "sandbox" or "production")`,
        });
    }

    // 2. Check POLAR_ACCESS_TOKEN
    const accessToken = process.env.POLAR_ACCESS_TOKEN;
    check(
        !!accessToken && accessToken !== "your_token_here",
        "POLAR_ACCESS_TOKEN is set",
        "POLAR_ACCESS_TOKEN is missing or not configured"
    );

    if (accessToken) {
        if (polarServer === "sandbox" && !accessToken.includes("sandbox")) {
            warn("Token doesn't appear to be a sandbox token (usually contains 'sandbox')");
            warn("Verify you're using the correct token from https://sandbox.polar.sh");
        }
    }

    // 3. Check POLAR_ORGANIZATION_ID
    const orgId = process.env.POLAR_ORGANIZATION_ID;
    check(
        !!orgId && orgId !== "your_org_id",
        "POLAR_ORGANIZATION_ID is set",
        "POLAR_ORGANIZATION_ID is missing or not configured"
    );

    // 4. Check POLAR_WEBHOOK_SECRET
    const webhookSecret = process.env.POLAR_WEBHOOK_SECRET;
    check(
        !!webhookSecret && webhookSecret !== "your_webhook_secret",
        "POLAR_WEBHOOK_SECRET is set",
        "POLAR_WEBHOOK_SECRET is missing (webhooks won't be verified)"
    );

    // 5. Check Product IDs
    const productIds = [
        "POLAR_PRO_500_PRODUCT_ID",
        "POLAR_PRO_1200_PRODUCT_ID",
        "POLAR_PRO_3000_PRODUCT_ID",
        "POLAR_PRO_7000_PRODUCT_ID",
        "POLAR_PRO_16000_PRODUCT_ID",
        "POLAR_PRO_30000_PRODUCT_ID",
        "POLAR_PRO_55000_PRODUCT_ID",
        "POLAR_PRO_100000_PRODUCT_ID",
    ];

    const configuredProducts = productIds.filter(
        (id) => process.env[id] && process.env[id] !== `your_${id.toLowerCase()}`
    );

    if (configuredProducts.length === 0) {
        warn("No product IDs configured - checkout will fail");
        warn("Configure at least one tier in .env file");
    } else {
        results.push({
            status: "✅",
            message: `${configuredProducts.length} product tier(s) configured`,
        });
    }

    // 6. Test API Connection
    if (accessToken && accessToken !== "your_token_here") {
        try {
            const apiBase =
                polarServer === "production"
                    ? "https://api.polar.sh/v1"
                    : "https://sandbox-api.polar.sh/v1";

            console.log("\n📡 Testing API Connection...\n");

            const response = await fetch(`${apiBase}/customers/?limit=1`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
            });

            if (response.ok) {
                results.push({
                    status: "✅",
                    message: `API connection successful to ${polarServer} environment`,
                });

                // Check organization access
                if (orgId && orgId !== "your_org_id") {
                    const orgResponse = await fetch(`${apiBase}/organizations/${orgId}`, {
                        method: "GET",
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                            "Content-Type": "application/json",
                        },
                    });

                    if (orgResponse.ok) {
                        const org = await orgResponse.json();
                        results.push({
                            status: "✅",
                            message: `Organization access verified: ${org.name || orgId}`,
                        });
                    } else {
                        results.push({
                            status: "❌",
                            message: `Cannot access organization ${orgId} (${orgResponse.status})`,
                        });
                    }
                }
            } else {
                const errorText = await response.text();
                results.push({
                    status: "❌",
                    message: `API connection failed: ${response.status} ${errorText}`,
                });

                if (response.status === 401) {
                    warn("Access token is invalid or expired - generate a new one");
                }
            }
        } catch (error) {
            results.push({
                status: "❌",
                message: `Network error: ${error instanceof Error ? error.message : "Unknown error"}`,
            });
        }
    }

    // 7. Database Check
    try {
        const { prisma } = await import("../src/lib/db");

        // Check if Polar migration is applied - try both User and user table names
        let userFields = await prisma.$queryRaw<Array<{ column_name: string }>>`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'User' 
      AND column_name IN ('polarCustomerId', 'polarCustomerExtId')
    `;

        // If no results, try lowercase table name
        if (userFields.length === 0) {
            userFields = await prisma.$queryRaw<Array<{ column_name: string }>>`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'user' 
        AND column_name IN ('polarCustomerId', 'polarCustomerExtId')
      `;
        }

        if (userFields.length === 2) {
            results.push({
                status: "✅",
                message: "Database schema includes Polar fields",
            });
        } else {
            results.push({
                status: "❌",
                message: `Database schema missing Polar fields - run migrations (found ${userFields.length} fields)`,
            });
        }

        await prisma.$disconnect();
    } catch (error) {
        results.push({
            status: "❌",
            message: `Database check failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        });
    }

    // Print Results
    console.log("\n" + "=".repeat(60));
    console.log("Verification Results");
    console.log("=".repeat(60) + "\n");

    results.forEach((result) => {
        console.log(`${result.status} ${result.message}`);
    });

    console.log("\n" + "=".repeat(60) + "\n");

    // Summary
    const errors = results.filter((r) => r.status === "❌").length;
    const warnings = results.filter((r) => r.status === "⚠️").length;
    const passed = results.filter((r) => r.status === "✅").length;

    if (errors > 0) {
        console.log(`❌ ${errors} error(s) found - fix these before testing`);
        process.exit(1);
    } else if (warnings > 0) {
        console.log(`⚠️  ${warnings} warning(s) - review these carefully`);
        console.log(`✅ ${passed} checks passed`);
    } else {
        console.log(`✅ All checks passed! Environment is ready for testing.`);
    }

    // Environment-specific tips
    console.log("\n📚 Helpful Resources:\n");

    if (polarServer === "sandbox") {
        console.log("Sandbox Dashboard: https://sandbox.polar.sh/dashboard");
        console.log("Sandbox API Docs:  https://api.polar.sh/docs");
        console.log("Test Cards:        https://docs.polar.sh/api/testing");
    } else {
        console.log("Production Dashboard: https://polar.sh/dashboard");
        console.log("Production API Docs:  https://api.polar.sh/docs");
    }

    console.log("\n");
}

// Run verification
verifyPolarEnvironment().catch((error) => {
    console.error("\n❌ Verification failed:", error);
    process.exit(1);
});
