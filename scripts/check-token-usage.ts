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

    console.log("📊 Token Usage Report");
    console.log("========================\n");
    console.log(`User: ${user.email}`);
    console.log(`Plan: ${user.subscription?.plan.displayName}\n`);

    // Get all AI token usage records for this user
    const tokenUsage = await prisma.aITokenUsage.findMany({
        where: {
            userId: user.id,
        },
        orderBy: {
            createdAt: 'desc',
        },
    });

    if (tokenUsage.length === 0) {
        console.log("❌ No token usage records found!");
        console.log("\nThis is strange - you have 1 credit used but no token usage records.");
        console.log("This might indicate:");
        console.log("1. Token usage tracking is not working properly");
        console.log("2. Records were deleted");
        console.log("3. Credits were deducted without actual usage\n");
        return;
    }

    console.log(`Found ${tokenUsage.length} token usage record(s):\n`);

    let totalTokens = 0;
    let totalCredits = 0;

    tokenUsage.forEach((usage, index) => {
        const tokens = Number(usage.totalTokens);
        const credits = Math.ceil(tokens / 10000); // 1 credit = 10,000 tokens

        totalTokens += tokens;
        totalCredits += credits;

        console.log(`${index + 1}. ${usage.createdAt.toLocaleString()}`);
        console.log(`   Project: ${usage.projectId || 'N/A'}`);
        console.log(`   Model: ${usage.model}`);
        console.log(`   Input Tokens: ${usage.inputTokens.toLocaleString()}`);
        console.log(`   Output Tokens: ${usage.outputTokens.toLocaleString()}`);
        console.log(`   Total Tokens: ${tokens.toLocaleString()}`);
        console.log(`   Credits Used: ~${credits} credit(s)`);
        console.log(`   Cost: $${Number(usage.costUsd).toFixed(4)}`);
        console.log('');
    });

    console.log("Summary:");
    console.log("========================");
    console.log(`Total Tokens Used: ${totalTokens.toLocaleString()}`);
    console.log(`Total Credits Used: ~${totalCredits} credit(s) (rounded up)`);
    console.log(`Total Cost: $${tokenUsage.reduce((sum, u) => sum + Number(u.costUsd), 0).toFixed(4)}`);

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
