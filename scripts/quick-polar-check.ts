#!/usr/bin/env tsx
/**
 * Quick Polar Environment Check
 * Simple version for quick verification
 */

import "dotenv/config";

async function quickCheck() {
    console.log("\n🔍 Polar Quick Check");
    console.log("=".repeat(60) + "\n");

    const polarServer = process.env.POLAR_SERVER || "sandbox";
    const accessToken = process.env.POLAR_ACCESS_TOKEN;
    const orgId = process.env.POLAR_ORGANIZATION_ID;

    console.log(`Environment: ${polarServer.toUpperCase()}`);
    console.log(`Access Token: ${accessToken ? "✅ Set" : "❌ Missing"}`);
    console.log(`Organization ID: ${orgId ? "✅ Set" : "❌ Missing"}`);

    // Check product IDs
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

    console.log(`Product IDs: ✅ ${configuredProducts.length} configured\n`);

    // Test API
    if (accessToken) {
        console.log("Testing API connection...");
        try {
            const apiBase =
                polarServer === "production"
                    ? "https://api.polar.sh/v1"
                    : "https://sandbox-api.polar.sh/v1";

            const response = await fetch(`${apiBase}/customers/?limit=1`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
            });

            if (response.ok) {
                console.log("✅ API connection successful!\n");

                if (orgId) {
                    const orgResponse = await fetch(`${apiBase}/organizations/${orgId}`, {
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                            "Content-Type": "application/json",
                        },
                    });

                    if (orgResponse.ok) {
                        const org = await orgResponse.json();
                        console.log(`✅ Organization: ${org.name || orgId}\n`);
                    }
                }

                console.log("🎉 Ready for testing!\n");
            } else {
                console.log(`❌ API connection failed: ${response.status}\n`);
            }
        } catch (error) {
            console.log(`❌ Network error: ${error}\n`);
        }
    }
}

quickCheck();
