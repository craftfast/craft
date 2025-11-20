import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("🧹 Cleaning up deprecated PRO tier plans...\n");

    // List of deprecated plan names
    const deprecatedPlans = [
        "PRO_100",
        "PRO_200",
        "PRO_400",
        "PRO_800",
        "PRO_1200",
        "PRO_1800",
        "PRO_2500",
        "PRO_3500",
        "PRO_5000",
        "PRO_7000",
        "PRO_10000",
    ];

    // Check if any users are subscribed to these plans
    for (const planName of deprecatedPlans) {
        const plan = await prisma.plan.findUnique({
            where: { name: planName },
            include: {
                subscriptions: {
                    where: {
                        status: "ACTIVE",
                    },
                },
            },
        });

        if (plan && plan.subscriptions.length > 0) {
            console.warn(`⚠️  ${planName} has ${plan.subscriptions.length} active subscriptions - skipping deletion`);
        } else if (plan) {
            await prisma.plan.delete({
                where: { name: planName },
            });
            console.log(`✅ Deleted plan: ${planName}`);
        } else {
            console.log(`⏭️  Plan ${planName} not found - already deleted`);
        }
    }

    console.log("\n🎉 Cleanup completed!");
    console.log("\n📋 Remaining plans:");

    const remainingPlans = await prisma.plan.findMany({
        orderBy: { sortOrder: "asc" },
        select: {
            name: true,
            displayName: true,
            polarProductId: true,
            _count: {
                select: {
                    subscriptions: true,
                },
            },
        },
    });

    for (const plan of remainingPlans) {
        console.log(`  - ${plan.displayName} (${plan.name})`);
        console.log(`    Polar Product ID: ${plan.polarProductId || "❌ NOT SET"}`);
        console.log(`    Active subscriptions: ${plan._count.subscriptions}`);
    }
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error("❌ Error cleaning up plans:", e);
        await prisma.$disconnect();
        process.exit(1);
    });
