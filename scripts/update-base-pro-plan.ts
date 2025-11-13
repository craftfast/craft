import { prisma } from "../src/lib/db";

/**
 * Update Base PRO Plan with Polar Product ID
 * 
 * This script updates the base PRO plan with the POLAR_PRO_PRODUCT_ID from .env
 */

async function updateBaseProPlan() {
    try {
        const polarProProductId = process.env.POLAR_PRO_PRODUCT_ID;

        if (!polarProProductId) {
            console.error("❌ POLAR_PRO_PRODUCT_ID not found in .env file");
            process.exit(1);
        }

        console.log("\n🔄 Updating base PRO plan...\n");
        console.log("=".repeat(80));

        const result = await prisma.plan.update({
            where: { name: "PRO" },
            data: { polarProductId: polarProProductId },
        });

        console.log(`✅ Updated PRO plan`);
        console.log(`   Polar Product ID: ${result.polarProductId}`);
        console.log(`   Monthly Credits: ${result.monthlyCredits}`);
        console.log(`   Price: $${result.priceMonthlyUsd}/month`);

        console.log("\n" + "=".repeat(80));
        console.log(`\n🎉 Base PRO plan updated successfully!\n`);

    } catch (error) {
        console.error("\n❌ Error updating PRO plan:", error);
    } finally {
        await prisma.$disconnect();
    }
}

updateBaseProPlan();
