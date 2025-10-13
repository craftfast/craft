/**
 * Verify Script: Check teams and their subscriptions
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("🔍 Checking all teams and their subscriptions...\n");

    const teams = await prisma.team.findMany({
        include: {
            subscription: {
                include: {
                    plan: true,
                },
            },
            owner: {
                select: {
                    email: true,
                    name: true,
                },
            },
        },
    });

    console.log(`📊 Found ${teams.length} team(s)\n`);

    for (const team of teams) {
        console.log(`Team: ${team.name} (${team.id})`);
        console.log(`  Owner: ${team.owner.name || team.owner.email}`);
        if (team.subscription) {
            console.log(`  Plan: ${team.subscription.plan.displayName} (${team.subscription.plan.name})`);
            console.log(`  Status: ${team.subscription.status}`);
            console.log(`  Period: ${team.subscription.currentPeriodStart.toLocaleDateString()} - ${team.subscription.currentPeriodEnd.toLocaleDateString()}`);
            console.log(`  ✅ HAS SUBSCRIPTION`);
        } else {
            console.log(`  ❌ NO SUBSCRIPTION`);
        }
        console.log("");
    }
}

main()
    .catch((error) => {
        console.error("❌ Error:", error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
