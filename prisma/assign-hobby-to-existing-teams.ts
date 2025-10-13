/**
 * Migration Script: Assign HOBBY plan to existing teams without subscriptions
 * 
 * Run this script to fix existing teams that were created before the plan
 * assignment feature was implemented.
 * 
 * Usage: npx tsx prisma/assign-hobby-to-existing-teams.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("🔍 Finding teams without subscriptions...");

    // Find all teams without subscriptions
    const teamsWithoutSubscriptions = await prisma.team.findMany({
        where: {
            subscription: null,
        },
        select: {
            id: true,
            name: true,
            ownerId: true,
        },
    });

    console.log(`📊 Found ${teamsWithoutSubscriptions.length} teams without subscriptions`);

    if (teamsWithoutSubscriptions.length === 0) {
        console.log("✅ All teams already have subscriptions!");
        return;
    }

    // Get the HOBBY plan
    const hobbyPlan = await prisma.plan.findUnique({
        where: { name: "HOBBY" },
    });

    if (!hobbyPlan) {
        console.error("❌ HOBBY plan not found in database!");
        console.error("Please run: npx tsx prisma/seed.ts");
        return;
    }

    console.log(`✅ Found HOBBY plan: ${hobbyPlan.displayName}`);
    console.log("\n🔧 Assigning HOBBY plan to teams...\n");

    // Calculate period end (30 days from now)
    const periodStart = new Date();
    const periodEnd = new Date();
    periodEnd.setDate(periodEnd.getDate() + 30);

    let successCount = 0;
    let errorCount = 0;

    // Assign HOBBY plan to each team
    for (const team of teamsWithoutSubscriptions) {
        try {
            await prisma.teamSubscription.create({
                data: {
                    teamId: team.id,
                    planId: hobbyPlan.id,
                    status: "active",
                    currentPeriodStart: periodStart,
                    currentPeriodEnd: periodEnd,
                },
            });

            console.log(`✅ ${team.name} (${team.id})`);
            successCount++;
        } catch (error) {
            console.error(`❌ ${team.name} (${team.id}):`, error);
            errorCount++;
        }
    }

    console.log("\n📊 Migration Summary:");
    console.log(`   ✅ Success: ${successCount} teams`);
    console.log(`   ❌ Errors: ${errorCount} teams`);
    console.log(`   📈 Total: ${teamsWithoutSubscriptions.length} teams`);

    if (successCount > 0) {
        console.log("\n🎉 Migration completed successfully!");
    }
}

main()
    .catch((error) => {
        console.error("❌ Migration failed:", error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
