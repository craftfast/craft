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

    if (!user) {
        console.log("❌ No user found");
        return;
    }

    console.log("📊 AI Credit Usage Report");
    console.log("========================\n");
    console.log(`User: ${user.email}`);
    console.log(`Plan: ${user.subscription?.plan.displayName}\n`);

    // Get all AI credit usage records for this user
    const creditUsage = await prisma.aICreditUsage.findMany({
        where: {
            userId: user.id,
        },
        orderBy: {
            createdAt: 'desc',
        },
    });

    if (creditUsage.length === 0) {
        console.log("❌ No credit usage records found!");
        console.log("\nThis might indicate:");
        console.log("1. No AI usage has been tracked yet");
        console.log("2. Records were deleted");
        console.log("3. Credits were deducted without actual usage\n");
        return;
    }

    console.log(`Found ${creditUsage.length} AI credit usage record(s):\n`);

    let totalTokens = 0;
    let totalCredits = 0;

    creditUsage.forEach((usage, index) => {
        const tokens = Number(usage.totalTokens);
        const credits = Number(usage.creditsUsed); // Now using the actual credits from DB

        totalTokens += tokens;
        totalCredits += credits;

        console.log(`${index + 1}. ${usage.createdAt.toLocaleString()}`);
        console.log(`   Project: ${usage.projectId || 'N/A'}`);
        console.log(`   Model: ${usage.model}`);
        console.log(`   Call Type: ${usage.callType}`);
        console.log(`   Input Tokens: ${usage.inputTokens.toLocaleString()}`);
        console.log(`   Output Tokens: ${usage.outputTokens.toLocaleString()}`);
        console.log(`   Total Tokens: ${tokens.toLocaleString()}`);
        console.log(`   Credits Used: ${credits.toFixed(4)} (multiplier: ${usage.modelMultiplier}x)`);
        console.log(`   Cost: $${Number(usage.costUsd).toFixed(4)}`);
        console.log('');
    });

    console.log("Summary:");
    console.log("========================");
    console.log(`Total Tokens Used: ${totalTokens.toLocaleString()}`);
    console.log(`Total Credits Used: ${totalCredits.toFixed(4)} credit(s)`);
    console.log(`Total Cost: $${creditUsage.reduce((sum, u) => sum + Number(u.costUsd), 0).toFixed(4)}`);

    if (user.subscription) {
        console.log(`\nCurrent Credits Status:`);
        console.log(`Daily Limit: ${user.subscription.plan.dailyCredits}`);
        console.log(`Used Today: ${user.subscription.dailyCreditsUsed}`);
        console.log(`Remaining: ${Number(user.subscription.plan.dailyCredits) - Number(user.subscription.dailyCreditsUsed)}`);
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
