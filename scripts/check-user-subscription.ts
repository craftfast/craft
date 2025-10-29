import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("🔍 Checking user subscriptions...\n");

    // Get all users
    const users = await prisma.user.findMany({
        include: {
            subscription: {
                include: {
                    plan: true,
                },
            },
        },
        orderBy: {
            createdAt: 'desc',
        },
    });

    console.log(`Found ${users.length} user(s):\n`);

    for (const user of users) {
        console.log(`📧 User: ${user.email}`);
        console.log(`   ID: ${user.id}`);
        console.log(`   Created: ${user.createdAt}`);
        console.log(`   Email Verified: ${user.emailVerified ? '✅' : '❌'}`);

        if (user.subscription) {
            console.log(`   ✅ Subscription:`);
            console.log(`      Plan: ${user.subscription.plan.displayName} (${user.subscription.plan.name})`);
            console.log(`      Status: ${user.subscription.status}`);
            console.log(`      Daily Credits Used: ${user.subscription.dailyCreditsUsed}`);
            console.log(`      Daily Credits Limit: ${user.subscription.plan.dailyCredits}`);
            console.log(`      Last Credit Reset: ${user.subscription.lastCreditReset}`);
        } else {
            console.log(`   ❌ NO SUBSCRIPTION FOUND!`);
            console.log(`      This user needs a subscription assigned.`);
        }
        console.log('');
    }

    // Check if there are users without subscriptions
    const usersWithoutSubscriptions = users.filter(u => !u.subscription);

    if (usersWithoutSubscriptions.length > 0) {
        console.log(`\n⚠️  Found ${usersWithoutSubscriptions.length} user(s) without subscriptions!`);
        console.log(`   Run fix-user-subscriptions.ts to fix this.\n`);
    } else {
        console.log(`\n✅ All users have subscriptions!\n`);
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
