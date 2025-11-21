import { PrismaClient } from "@prisma/client";
import { getAvailableCodingModels, getDefaultCodingModel } from "../src/lib/models/config";

const prisma = new PrismaClient();

async function main() {
    console.log("🌱 Seeding database...");

    // ========================================================================
    // MODEL PREFERENCES SYNC
    // Ensure all users have valid model preferences matching current config
    // ========================================================================
    console.log("\n🤖 Syncing model preferences...");

    const availableModels = getAvailableCodingModels().map((m) => m.id);
    const defaultModel = getDefaultCodingModel();

    console.log(`   Available models: ${availableModels.join(", ")}`);
    console.log(`   Default model: ${defaultModel}`);

    // Get all users
    const users = await prisma.user.findMany({
        select: {
            id: true,
            email: true,
            preferredCodingModel: true,
            enabledCodingModels: true,
        },
    });

    console.log(`   Found ${users.length} users to check`);

    let updatedCount = 0;

    for (const user of users) {
        let needsUpdate = false;
        const updates: any = {};

        // Filter out invalid models from enabled list
        const validEnabledModels = user.enabledCodingModels.filter((modelId: string) =>
            availableModels.includes(modelId)
        );

        // Check if enabled models list changed
        if (validEnabledModels.length !== user.enabledCodingModels.length) {
            needsUpdate = true;
            updates.enabledCodingModels = validEnabledModels.length > 0 ? validEnabledModels : availableModels;
            console.log(`   ⚠️  User ${user.email}: Removed deprecated models from enabled list`);
        }

        // If no valid models, reset to all available
        if (validEnabledModels.length === 0) {
            needsUpdate = true;
            updates.enabledCodingModels = availableModels;
            console.log(`   ⚠️  User ${user.email}: Reset enabled models to all available`);
        }

        // Check if preferred model is valid
        if (user.preferredCodingModel && !availableModels.includes(user.preferredCodingModel)) {
            needsUpdate = true;
            updates.preferredCodingModel = defaultModel;
            console.log(`   ⚠️  User ${user.email}: Reset invalid preferred model to default`);
        }

        // Ensure preferred model is in enabled list
        const finalEnabledModels = updates.enabledCodingModels || validEnabledModels;
        const finalPreferredModel = updates.preferredCodingModel || user.preferredCodingModel || defaultModel;

        if (!finalEnabledModels.includes(finalPreferredModel)) {
            needsUpdate = true;
            updates.enabledCodingModels = [...finalEnabledModels, finalPreferredModel];
            console.log(`   ⚠️  User ${user.email}: Added preferred model to enabled list`);
        }

        // Update user if needed
        if (needsUpdate) {
            await prisma.user.update({
                where: { id: user.id },
                data: updates,
            });
            updatedCount++;
        }
    }

    console.log(`   ✅ Updated ${updatedCount} users with valid model preferences`);

    // ========================================================================
    // PAYMENT & BILLING INFO
    // ========================================================================
    console.log("\n✅ Craft uses a pure pay-as-you-go model:");
    console.log("   - No subscription plans or tiers");
    console.log("   - Users top up balance anytime via Razorpay");
    console.log("   - Pay only for actual usage");

    console.log("\n💰 Balance System:");
    console.log("   - 1 credit = $1 USD");
    console.log("   - Powered by Razorpay payment gateway");
    console.log("   - 10% platform fee on top-ups");
    console.log("   - Balance stored in User.accountBalance");
    console.log("   - Actual usage costs deducted directly");

    console.log("\n📊 Usage Billing:");
    console.log("   - AI models billed at actual provider cost");
    console.log("   - Sandbox/compute billed at actual resource cost");
    console.log("   - No credit multipliers or conversions");
    console.log("   - Direct USD deduction from balance");

    console.log("\n🎉 Seed completed!");
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error("❌ Error seeding database:", e);
        await prisma.$disconnect();
        process.exit(1);
    });
