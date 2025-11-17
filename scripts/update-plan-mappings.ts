import { prisma } from "../src/lib/db";

/**
 * Manual Polar Product Mapping Script
 * 
 * Use this script to manually map your Polar products to your plans.
 * 
 * Steps:
 * 1. Go to Polar Dashboard: https://sandbox.polar.sh/dashboard/products
 * 2. Copy the Product ID for each product
 * 3. Update the mapping below
 * 4. Run: npx tsx scripts/update-plan-mappings.ts
 */

// ⚠️ UPDATE THESE MAPPINGS WITH YOUR ACTUAL POLAR PRODUCT IDs
const PRODUCT_MAPPINGS: Record<string, string> = {
    // Plan Name -> Polar Product ID (from .env file)
    "PRO_100": process.env.POLAR_PRO_100_PRODUCT_ID || "",      // 100 credits/month - $25/mo
    "PRO_200": process.env.POLAR_PRO_200_PRODUCT_ID || "",      // 200 credits/month - $50/mo
    "PRO_400": process.env.POLAR_PRO_400_PRODUCT_ID || "",      // 400 credits/month - $100/mo
    "PRO_800": process.env.POLAR_PRO_800_PRODUCT_ID || "",      // 800 credits/month - $200/mo
    "PRO_1200": process.env.POLAR_PRO_1200_PRODUCT_ID || "",    // 1,200 credits/month - $300/mo
    "PRO_1800": process.env.POLAR_PRO_1800_PRODUCT_ID || "",    // 1,800 credits/month - $450/mo
    "PRO_2500": process.env.POLAR_PRO_2500_PRODUCT_ID || "",    // 2,500 credits/month - $625/mo
    "PRO_3500": process.env.POLAR_PRO_3500_PRODUCT_ID || "",    // 3,500 credits/month - $875/mo
    "PRO_5000": process.env.POLAR_PRO_5000_PRODUCT_ID || "",    // 5,000 credits/month - $1,250/mo
    "PRO_7000": process.env.POLAR_PRO_7000_PRODUCT_ID || "",    // 7,000 credits/month - $1,750/mo
    "PRO_10000": process.env.POLAR_PRO_10000_PRODUCT_ID || "",  // 10,000 credits/month - $2,250/mo
};

async function updatePlanMappings() {
    try {
        console.log("\n🔄 Updating Plan -> Polar Product Mappings...\n");
        console.log("=".repeat(80));

        let updated = 0;
        let skipped = 0;
        const missingEnvVars: string[] = [];

        for (const [planName, polarProductId] of Object.entries(PRODUCT_MAPPINGS)) {
            // Skip if not set
            if (!polarProductId || polarProductId === "YOUR_POLAR_PRODUCT_ID_HERE") {
                console.log(`⏭️  Skipping ${planName} - no product ID in .env file`);
                missingEnvVars.push(`POLAR_${planName}_PRODUCT_ID`);
                skipped++;
                continue;
            }

            // Update the plan
            const result = await prisma.plan.updateMany({
                where: { name: planName },
                data: { polarProductId },
            });

            if (result.count > 0) {
                console.log(`✅ Updated ${planName} -> ${polarProductId}`);
                updated++;
            } else {
                console.log(`⚠️  Plan "${planName}" not found in database`);
            }
        }

        console.log("\n" + "=".repeat(80));
        console.log(`\nSummary:`);
        console.log(`  ✅ Updated: ${updated}`);
        console.log(`  ⏭️  Skipped: ${skipped}`);

        if (missingEnvVars.length > 0) {
            console.log(`\n⚠️  Missing environment variables:`);
            missingEnvVars.forEach(envVar => {
                console.log(`   - ${envVar}`);
            });
            console.log(`\n💡 Please add these to your .env file and re-run the script.`);
        } else if (skipped > 0) {
            console.log(`\n💡 To complete the mapping:`);
            console.log(`   1. Visit: https://sandbox.polar.sh/dashboard/products`);
            console.log(`   2. Copy each Product ID`);
            console.log(`   3. Add them to your .env file`);
            console.log(`   4. Re-run: npx tsx scripts/update-plan-mappings.ts\n`);
        } else {
            console.log(`\n🎉 All plans mapped successfully!\n`);
        }

        // Show verification query
        if (updated > 0) {
            console.log(`\n📊 Verify mappings with:`);
            console.log(`   npx prisma studio`);
            console.log(`   or run: npx tsx scripts/check-plans.ts\n`);
        }

    } catch (error) {
        console.error("\n❌ Error updating mappings:", error);
    } finally {
        await prisma.$disconnect();
    }
}

updatePlanMappings();
