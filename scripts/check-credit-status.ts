import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const user = await prisma.user.findFirst({
        include: {
            subscription: {
                include: {
                    plan: true,
                },
            },
        },
    });

    if (!user || !user.subscription) {
        console.log("❌ No user found");
        return;
    }

    const now = new Date();
    const lastReset = new Date(user.subscription.lastCreditReset);

    // Calculate next reset time (midnight UTC)
    const nextReset = new Date(lastReset);
    nextReset.setUTCDate(nextReset.getUTCDate() + 1);
    nextReset.setUTCHours(0, 0, 0, 0);

    const hoursUntilReset = Math.max(0, (nextReset.getTime() - now.getTime()) / (1000 * 60 * 60));

    console.log("📊 Credit Status Report");
    console.log("========================\n");
    console.log(`User: ${user.email}`);
    console.log(`Plan: ${user.subscription.plan.displayName}`);
    console.log(`\nDaily Credit Limit: ${user.subscription.plan.dailyCredits}`);
    console.log(`Daily Credits Used: ${user.subscription.dailyCreditsUsed}`);
    console.log(`Credits Remaining: ${Number(user.subscription.plan.dailyCredits) - Number(user.subscription.dailyCreditsUsed)}`);
    console.log(`\nLast Reset: ${lastReset.toLocaleString()}`);
    console.log(`Next Reset: ${nextReset.toLocaleString()} (${hoursUntilReset.toFixed(1)} hours from now)`);
    console.log(`\nCurrent Time (Local): ${now.toLocaleString()}`);
    console.log(`Current Time (UTC): ${now.toUTCString()}`);

    // Check if we should reset
    const isNewDay =
        now.getUTCFullYear() !== lastReset.getUTCFullYear() ||
        now.getUTCMonth() !== lastReset.getUTCMonth() ||
        now.getUTCDate() !== lastReset.getUTCDate();

    if (isNewDay) {
        console.log("\n⚠️  Credits should have been reset but weren't!");
        console.log("   The automatic reset may not have triggered.");
    } else {
        console.log("\n✅ Credits are up to date (same UTC day)");
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
