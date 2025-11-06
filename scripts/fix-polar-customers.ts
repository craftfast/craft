/**
 * Script to create Polar customers for existing users who don't have one
 * 
 * Run with: pnpm tsx scripts/fix-polar-customers.ts
 */

import { prisma } from "../src/lib/db";
import { createPolarCustomer } from "../src/lib/polar/customer";

async function fixPolarCustomers() {
    console.log("🔍 Checking for users without Polar customers...\n");

    try {
        // Find all users without Polar customer IDs
        const usersWithoutPolar = await prisma.user.findMany({
            where: {
                polarCustomerId: null,
            },
        });

        console.log(`Found ${usersWithoutPolar.length} users without Polar customers\n`);

        if (usersWithoutPolar.length === 0) {
            console.log("✅ All users have Polar customers!");
            return;
        }

        // Create Polar customers for each user
        for (const user of usersWithoutPolar) {
            console.log(`\n🔄 Processing user: ${user.email} (ID: ${user.id})`);

            try {
                const result = await createPolarCustomer(user);

                if (result.success && 'customerId' in result) {
                    console.log(`✅ Created Polar customer for ${user.email}`);
                } else if (!result.success && 'error' in result) {
                    console.error(`❌ Failed to create Polar customer for ${user.email}: ${result.error}`);
                }
            } catch (error) {
                console.error(`❌ Error processing ${user.email}:`, error);
            }

            // Add a small delay to avoid rate limiting
            await new Promise((resolve) => setTimeout(resolve, 500));
        }

        console.log("\n✅ Finished processing all users");

        // Show summary
        const remainingWithoutPolar = await prisma.user.findMany({
            where: {
                polarCustomerId: null,
            },
        });

        console.log(`\n📊 Summary:`);
        console.log(`   Total users processed: ${usersWithoutPolar.length}`);
        console.log(`   Successfully created: ${usersWithoutPolar.length - remainingWithoutPolar.length}`);
        console.log(`   Failed: ${remainingWithoutPolar.length}`);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

fixPolarCustomers();
