import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("🗑️  Removing ALL subscription plans...\n");

    // Get all plans
    const allPlans = await prisma.plan.findMany({
        include: {
            _count: {
                select: {
                    subscriptions: true,
                },
            },
        },
    });

    console.log(`Found ${allPlans.length} plans in database\n`);

    for (const plan of allPlans) {
        if (plan._count.subscriptions > 0) {
            console.warn(`⚠️  ${plan.displayName} (${plan.name}) has ${plan._count.subscriptions} subscriptions`);
            console.warn(`    Marking as inactive instead of deleting...`);

            await prisma.plan.update({
                where: { id: plan.id },
                data: { isActive: false },
            });
            console.log(`    ✅ Marked ${plan.name} as inactive\n`);
        } else {
            await prisma.plan.delete({
                where: { id: plan.id },
            });
            console.log(`✅ Deleted plan: ${plan.displayName} (${plan.name})\n`);
        }
    }

    const remainingPlans = await prisma.plan.findMany({
        select: {
            name: true,
            displayName: true,
            isActive: true,
            _count: {
                select: {
                    subscriptions: true,
                },
            },
        },
    });

    console.log("\n📊 Final Status:");
    console.log("================");

    if (remainingPlans.length === 0) {
        console.log("✅ All plans removed - pure pay-as-you-go system active!");
    } else {
        console.log(`⚠️  ${remainingPlans.length} plans remaining (have active subscriptions):`);
        for (const plan of remainingPlans) {
            console.log(`   - ${plan.displayName} (${plan.name})`);
            console.log(`     Status: ${plan.isActive ? "Active" : "Inactive"}`);
            console.log(`     Subscriptions: ${plan._count.subscriptions}`);
        }
        console.log("\n💡 These plans are kept for users with existing subscriptions.");
        console.log("   New users will use the pay-as-you-go balance system.");
    }
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error("❌ Error removing plans:", e);
        await prisma.$disconnect();
        process.exit(1);
    });
