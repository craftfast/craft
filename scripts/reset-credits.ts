import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("🔄 Manually resetting monthly credits for all users...\n");

    const result = await prisma.userSubscription.updateMany({
        data: {
            monthlyCreditsUsed: 0,
            periodCreditsReset: new Date(),
        },
    });

    console.log(`✅ Reset credits for ${result.count} user subscription(s)\n`);

    // Show updated status
    const users = await prisma.user.findMany({
        include: {
            subscription: {
                include: {
                    plan: true,
                },
            },
        },
    });

    for (const user of users) {
        if (user.subscription) {
            console.log(`📧 ${user.email}`);
            console.log(`   Credits: ${user.subscription.monthlyCreditsUsed}/${user.subscription.plan.monthlyCredits} used`);
            console.log(`   Credits Remaining: ${Number(user.subscription.plan.monthlyCredits) - Number(user.subscription.monthlyCreditsUsed)}`);
            console.log('');
        }
    }
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error("❌ Error:", e);
        await prisma.$disconnect();
        process.exit(1);
    });
