/**
 * Script to clear Razorpay customer IDs from local database
 * 
 * This doesn't delete customers from Razorpay (not possible via API),
 * but clears the local references so new customers will be created
 * on next payment.
 * 
 * Usage: npx tsx scripts/clear-razorpay-customer-ids.ts
 */

import "dotenv/config";
import { prisma } from "../src/lib/db";

async function main() {
    console.log("🔄 Clearing Razorpay Customer IDs from local database...\n");

    try {
        // Count users with Razorpay customer IDs
        const usersWithCustomerId = await prisma.user.count({
            where: {
                razorpayCustomerId: { not: null },
            },
        });

        console.log(`📊 Found ${usersWithCustomerId} users with Razorpay customer IDs`);

        if (usersWithCustomerId === 0) {
            console.log("\n✅ No Razorpay customer IDs to clear.");
            return;
        }

        // List them first
        const users = await prisma.user.findMany({
            where: {
                razorpayCustomerId: { not: null },
            },
            select: {
                id: true,
                email: true,
                razorpayCustomerId: true,
            },
        });

        console.log("\n📋 Users with Razorpay customer IDs:");
        for (const user of users) {
            console.log(`   - ${user.email}: ${user.razorpayCustomerId}`);
        }

        // Confirm before proceeding
        console.log("\n⚠️  This will clear all Razorpay customer ID references.");
        console.log("   New customers will be created on next payment.\n");

        // Clear all Razorpay customer IDs
        const result = await prisma.user.updateMany({
            where: {
                razorpayCustomerId: { not: null },
            },
            data: {
                razorpayCustomerId: null,
            },
        });

        console.log(`✅ Cleared ${result.count} Razorpay customer IDs from local database.`);
        console.log("\n   Note: The customers still exist in Razorpay, but new ones will be");
        console.log("   created when users make their next payment.");

    } catch (error) {
        console.error("\n❌ Error:", error instanceof Error ? error.message : error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
