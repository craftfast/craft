import { prisma } from "../src/lib/db";

async function checkPlans() {
    try {
        const plans = await prisma.plan.findMany({
            select: {
                id: true,
                name: true,
                polarProductId: true,
            },
        });

        console.log("\n📋 Current Plans:");
        console.log("=".repeat(80));

        plans.forEach(plan => {
            console.log(`\nPlan: ${plan.name}`);
            console.log(`  ID: ${plan.id}`);
            console.log(`  Polar Product ID: ${plan.polarProductId || "❌ NOT SET"}`);
        });

        console.log("\n" + "=".repeat(80));
        console.log(`\nTotal plans: ${plans.length}`);
        console.log(`Plans with Polar mapping: ${plans.filter(p => p.polarProductId).length}`);
        console.log(`Plans missing Polar mapping: ${plans.filter(p => !p.polarProductId).length}\n`);

    } catch (error) {
        console.error("Error checking plans:", error);
    } finally {
        await prisma.$disconnect();
    }
}

checkPlans();
