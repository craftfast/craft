/**
 * Script to update existing users' enabled models to new defaults
 * Run with: pnpm tsx scripts/update-user-enabled-models.ts
 * 
 * New defaults:
 * - preferredModel: "claude-haiku-4-5"
 * - enabledModels: All 6 models (filtered by plan access):
 *   ["minimax/minimax-m2", "moonshotai/kimi-k2-thinking", "claude-haiku-4-5", "google/gemini-2.5-pro-001", "openai/gpt-5", "claude-sonnet-4.5"]
 */

import { PrismaClient } from "@prisma/client";
import { getDefaultEnabledModels, getDefaultSelectedModel, canUserAccessModel } from "../src/lib/models/config";

const prisma = new PrismaClient();

async function main() {
    console.log("🔄 Starting user enabled models update...\n");

    // Get all users with their subscriptions
    const users = await prisma.user.findMany({
        include: {
            subscription: {
                include: {
                    plan: true,
                },
            },
        },
    });

    console.log(`📊 Found ${users.length} users to process\n`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const user of users) {
        try {
            // Determine user's plan (default to HOBBY if no subscription)
            const planName = (user.subscription?.plan.name || "HOBBY") as "HOBBY" | "PRO" | "ENTERPRISE";

            // Get default enabled models
            const defaultModels = getDefaultEnabledModels();

            // Filter by what user can access
            const accessibleDefaults = defaultModels.filter((id) =>
                canUserAccessModel(id, planName)
            );

            // Keep user's currently enabled models that they can access
            const currentModels = user.enabledModels.filter((id) =>
                canUserAccessModel(id, planName)
            );

            // Merge: defaults + user's choices, ensure selected model is included
            const newEnabledModels = [...new Set([
                ...accessibleDefaults,
                ...currentModels,
                user.preferredModel, // Always include selected model
            ])];

            // Update only if different
            const needsUpdate =
                JSON.stringify([...user.enabledModels].sort()) !==
                JSON.stringify([...newEnabledModels].sort());

            if (needsUpdate) {
                await prisma.user.update({
                    where: { id: user.id },
                    data: { enabledModels: newEnabledModels },
                });

                console.log(
                    `✅ Updated ${user.email} (${planName}): ${user.enabledModels.join(", ")} → ${newEnabledModels.join(", ")}`
                );
                updatedCount++;
            } else {
                console.log(`⏭️  Skipped ${user.email} (${planName}): Already correct`);
                skippedCount++;
            }
        } catch (error) {
            console.error(`❌ Error updating user ${user.email}:`, error);
        }
    }

    console.log(`\n📈 Summary:`);
    console.log(`   ✅ Updated: ${updatedCount}`);
    console.log(`   ⏭️  Skipped: ${skippedCount}`);
    console.log(`   📊 Total: ${users.length}`);
    console.log(`\n✨ Done!`);
}

main()
    .catch((e) => {
        console.error("❌ Fatal error:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
