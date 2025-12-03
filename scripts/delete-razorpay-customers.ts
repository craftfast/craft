/**
 * Script to delete all customers from Razorpay Test Console
 * 
 * Usage: npx tsx scripts/delete-razorpay-customers.ts
 * 
 * WARNING: This will delete ALL customers in your Razorpay account.
 * Only use this in TEST mode, never in production!
 */

import "dotenv/config";

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
    console.error("❌ RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set in .env");
    process.exit(1);
}

// Safety check - ensure we're in test mode
if (!RAZORPAY_KEY_ID.startsWith("rzp_test_")) {
    console.error("❌ SAFETY CHECK FAILED: This script only works with test API keys (rzp_test_*)");
    console.error("   Your key starts with:", RAZORPAY_KEY_ID.substring(0, 10));
    process.exit(1);
}

const authHeader = `Basic ${Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString("base64")}`;

interface RazorpayCustomer {
    id: string;
    name: string;
    email: string;
    contact: string;
    created_at: number;
}

interface CustomersResponse {
    entity: string;
    count: number;
    items: RazorpayCustomer[];
}

async function fetchCustomers(skip: number = 0, count: number = 100): Promise<CustomersResponse> {
    const response = await fetch(
        `https://api.razorpay.com/v1/customers?count=${count}&skip=${skip}`,
        {
            method: "GET",
            headers: {
                "Authorization": authHeader,
                "Content-Type": "application/json",
            },
        }
    );

    if (!response.ok) {
        throw new Error(`Failed to fetch customers: ${response.status} ${await response.text()}`);
    }

    return response.json();
}

async function deleteCustomer(customerId: string): Promise<boolean> {
    // Note: Razorpay doesn't have a direct delete API for customers
    // We can only "edit" them to remove PII or leave them
    // However, in test mode, customers are automatically cleaned up periodically

    // Alternative: We can fetch and list them, but actual deletion 
    // requires using the Razorpay Dashboard or contacting support

    console.log(`  ⚠️  Customer ${customerId} - Razorpay doesn't support customer deletion via API`);
    console.log(`      You can delete customers manually from: https://dashboard.razorpay.com/app/customers`);
    return false;
}

async function main() {
    console.log("🔍 Razorpay Customer Cleanup Script (Test Mode Only)");
    console.log("=====================================================\n");

    try {
        let allCustomers: RazorpayCustomer[] = [];
        let skip = 0;
        const batchSize = 100;

        // Fetch all customers with pagination
        console.log("📋 Fetching all customers...\n");

        while (true) {
            const response = await fetchCustomers(skip, batchSize);
            allCustomers = allCustomers.concat(response.items);

            console.log(`   Fetched ${response.items.length} customers (total: ${allCustomers.length})`);

            if (response.items.length < batchSize) {
                break;
            }
            skip += batchSize;
        }

        if (allCustomers.length === 0) {
            console.log("\n✅ No customers found in your Razorpay test account.");
            return;
        }

        console.log(`\n📊 Found ${allCustomers.length} customers:\n`);

        // Display customer list
        console.log("┌────────────────────────────┬────────────────────────────────────┬─────────────────────┐");
        console.log("│ Customer ID                │ Email                              │ Created             │");
        console.log("├────────────────────────────┼────────────────────────────────────┼─────────────────────┤");

        for (const customer of allCustomers) {
            const createdDate = new Date(customer.created_at * 1000).toISOString().split("T")[0];
            const id = customer.id.padEnd(26);
            const email = (customer.email || "N/A").padEnd(36).substring(0, 36);
            console.log(`│ ${id} │ ${email} │ ${createdDate}          │`);
        }

        console.log("└────────────────────────────┴────────────────────────────────────┴─────────────────────┘");

        console.log("\n⚠️  IMPORTANT: Razorpay API does not support customer deletion.");
        console.log("   To delete customers, you must:");
        console.log("   1. Go to https://dashboard.razorpay.com/app/customers");
        console.log("   2. Select customers and delete them manually");
        console.log("   3. Or contact Razorpay support for bulk deletion");
        console.log("\n   In TEST mode, Razorpay periodically cleans up test data automatically.");

        // Export customer IDs for manual deletion
        console.log("\n📤 Customer IDs for manual deletion:");
        console.log("   " + allCustomers.map(c => c.id).join("\n   "));

    } catch (error) {
        console.error("\n❌ Error:", error instanceof Error ? error.message : error);
        process.exit(1);
    }
}

main();
