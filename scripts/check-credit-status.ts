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
    const periodStart = new Date(user.subscription.periodCreditsReset);
    const periodEnd = new Date(user.subscription.currentPeriodEnd);

    const daysUntilReset = Math.max(0, (periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    console.log("📊 Credit Status Report");
    console.log("========================\n");
    console.log(`User: ${user.email}`);
    console.log(`Plan: ${user.subscription.plan.displayName}`);
    console.log(`\nMonthly Credit Limit: ${user.subscription.plan.monthlyCredits}`);
    console.log(`Monthly Credits Used: ${user.subscription.monthlyCreditsUsed}`);
    console.log(`Credits Remaining: ${Number(user.subscription.plan.monthlyCredits) - Number(user.subscription.monthlyCreditsUsed)}`);
    console.log(`\nPeriod Start: ${periodStart.toLocaleString()}`);
    console.log(`Period End: ${periodEnd.toLocaleString()} (${daysUntilReset.toFixed(1)} days from now)`);
    console.log(`\nCurrent Time (Local): ${now.toLocaleString()}`);
    console.log(`Current Time (UTC): ${now.toUTCString()}`);

    // Check if we're past the period end
    const isPastPeriod = now >= periodEnd;

    if (isPastPeriod) {
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
