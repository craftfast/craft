import { prisma } from "../src/lib/db";

/**
 * Seed Pro Tier Plans
 * 
 * This script creates all Pro tier plans with their corresponding Polar product IDs.
 * Run this script to populate the database with Pro tier plans.
 * 
 * Usage: npx tsx scripts/seed-pro-tiers.ts
 */

const PRO_TIER_PLANS = [
    {
        name: "PRO_100",
        displayName: "Pro 100",
        description: "Perfect for small projects and side hustles",
        priceMonthlyUsd: 25,
        maxProjects: 999,
        monthlyCredits: 100,
        sortOrder: 10,
        polarProductId: process.env.POLAR_PRO_100_PRODUCT_ID,
        features: [
            "100 credits per month",
            "Unlimited projects",
            "All AI models",
            "Import from Figma & GitHub",
            "Deploy to Vercel",
            "No Craft branding",
            "Priority email support",
        ],
    },
    {
        name: "PRO_200",
        displayName: "Pro 200",
        description: "Great for active developers",
        priceMonthlyUsd: 50,
        maxProjects: 999,
        monthlyCredits: 200,
        sortOrder: 11,
        polarProductId: process.env.POLAR_PRO_200_PRODUCT_ID,
        features: [
            "200 credits per month",
            "Unlimited projects",
            "All AI models",
            "Import from Figma & GitHub",
            "Deploy to Vercel",
            "No Craft branding",
            "Priority email support",
        ],
    },
    {
        name: "PRO_400",
        displayName: "Pro 400",
        description: "Ideal for professional developers",
        priceMonthlyUsd: 100,
        maxProjects: 999,
        monthlyCredits: 400,
        sortOrder: 12,
        polarProductId: process.env.POLAR_PRO_400_PRODUCT_ID,
        features: [
            "400 credits per month",
            "Unlimited projects",
            "All AI models",
            "Import from Figma & GitHub",
            "Deploy to Vercel",
            "No Craft branding",
            "Priority email support",
        ],
    },
    {
        name: "PRO_800",
        displayName: "Pro 800",
        description: "Perfect for growing teams",
        priceMonthlyUsd: 200,
        maxProjects: 999,
        monthlyCredits: 800,
        sortOrder: 13,
        polarProductId: process.env.POLAR_PRO_800_PRODUCT_ID,
        features: [
            "800 credits per month",
            "Unlimited projects",
            "All AI models",
            "Import from Figma & GitHub",
            "Deploy to Vercel",
            "No Craft branding",
            "Priority email support",
        ],
    },
    {
        name: "PRO_1200",
        displayName: "Pro 1,200",
        description: "Great for productive teams",
        priceMonthlyUsd: 300,
        maxProjects: 999,
        monthlyCredits: 1200,
        sortOrder: 14,
        polarProductId: process.env.POLAR_PRO_1200_PRODUCT_ID,
        features: [
            "1,200 credits per month",
            "Unlimited projects",
            "All AI models",
            "Import from Figma & GitHub",
            "Deploy to Vercel",
            "No Craft branding",
            "Priority email support",
        ],
    },
    {
        name: "PRO_1800",
        displayName: "Pro 1,800",
        description: "Excellent for scaling teams",
        priceMonthlyUsd: 450,
        maxProjects: 999,
        monthlyCredits: 1800,
        sortOrder: 15,
        polarProductId: process.env.POLAR_PRO_1800_PRODUCT_ID,
        features: [
            "1,800 credits per month",
            "Unlimited projects",
            "All AI models",
            "Import from Figma & GitHub",
            "Deploy to Vercel",
            "No Craft branding",
            "Priority email support",
        ],
    },
    {
        name: "PRO_2500",
        displayName: "Pro 2,500",
        description: "Ideal for high-volume development",
        priceMonthlyUsd: 625,
        maxProjects: 999,
        monthlyCredits: 2500,
        sortOrder: 16,
        polarProductId: process.env.POLAR_PRO_2500_PRODUCT_ID,
        features: [
            "2,500 credits per month",
            "Unlimited projects",
            "All AI models",
            "Import from Figma & GitHub",
            "Deploy to Vercel",
            "No Craft branding",
            "Priority email support",
        ],
    },
    {
        name: "PRO_3500",
        displayName: "Pro 3,500",
        description: "Perfect for large teams",
        priceMonthlyUsd: 875,
        maxProjects: 999,
        monthlyCredits: 3500,
        sortOrder: 17,
        polarProductId: process.env.POLAR_PRO_3500_PRODUCT_ID,
        features: [
            "3,500 credits per month",
            "Unlimited projects",
            "All AI models",
            "Import from Figma & GitHub",
            "Deploy to Vercel",
            "No Craft branding",
            "Priority email support",
        ],
    },
    {
        name: "PRO_5000",
        displayName: "Pro 5,000",
        description: "Great for enterprise-scale development",
        priceMonthlyUsd: 1250,
        maxProjects: 999,
        monthlyCredits: 5000,
        sortOrder: 18,
        polarProductId: process.env.POLAR_PRO_5000_PRODUCT_ID,
        features: [
            "5,000 credits per month",
            "Unlimited projects",
            "All AI models",
            "Import from Figma & GitHub",
            "Deploy to Vercel",
            "No Craft branding",
            "Priority email support",
        ],
    },
    {
        name: "PRO_7000",
        displayName: "Pro 7,000",
        description: "Excellent for high-throughput teams",
        priceMonthlyUsd: 1750,
        maxProjects: 999,
        monthlyCredits: 7000,
        sortOrder: 19,
        polarProductId: process.env.POLAR_PRO_7000_PRODUCT_ID,
        features: [
            "7,000 credits per month",
            "Unlimited projects",
            "All AI models",
            "Import from Figma & GitHub",
            "Deploy to Vercel",
            "No Craft branding",
            "Priority email support",
        ],
    },
    {
        name: "PRO_10000",
        displayName: "Pro 10,000",
        description: "Maximum tier for power users",
        priceMonthlyUsd: 2250,
        maxProjects: 999,
        monthlyCredits: 10000,
        sortOrder: 20,
        polarProductId: process.env.POLAR_PRO_10000_PRODUCT_ID,
        features: [
            "10,000 credits per month",
            "Unlimited projects",
            "All AI models",
            "Import from Figma & GitHub",
            "Deploy to Vercel",
            "No Craft branding",
            "Priority email support",
        ],
    },
];

async function seedProTiers() {
    try {
        console.log("\n🌱 Seeding Pro Tier Plans...\n");
        console.log("=".repeat(80));

        let created = 0;
        let updated = 0;
        let skipped = 0;
        const missingEnvVars: string[] = [];

        for (const planData of PRO_TIER_PLANS) {
            // Check if Polar product ID is set
            if (!planData.polarProductId) {
                console.log(`⚠️  ${planData.displayName}: Missing Polar product ID in .env`);
                missingEnvVars.push(`POLAR_${planData.name}_PRODUCT_ID`);
                skipped++;
                continue;
            }

            // Upsert the plan
            const existingPlan = await prisma.plan.findUnique({
                where: { name: planData.name },
            });

            const plan = await prisma.plan.upsert({
                where: { name: planData.name },
                update: planData,
                create: planData,
            });

            if (existingPlan) {
                console.log(`✅ Updated: ${plan.displayName} (${plan.name}) -> ${plan.polarProductId}`);
                updated++;
            } else {
                console.log(`✨ Created: ${plan.displayName} (${plan.name}) -> ${plan.polarProductId}`);
                created++;
            }
        }

        console.log("\n" + "=".repeat(80));
        console.log(`\n📊 Summary:`);
        console.log(`  ✨ Created: ${created}`);
        console.log(`  ✅ Updated: ${updated}`);
        console.log(`  ⏭️  Skipped: ${skipped}`);

        if (missingEnvVars.length > 0) {
            console.log(`\n⚠️  Missing environment variables:`);
            missingEnvVars.forEach(envVar => {
                console.log(`   - ${envVar}`);
            });
            console.log(`\n💡 Add these to your .env file and re-run the script.`);
        } else {
            console.log(`\n🎉 All Pro tier plans seeded successfully!`);
            console.log(`\n📋 Verify with: npx tsx scripts/check-plans.ts\n`);
        }

    } catch (error) {
        console.error("\n❌ Error seeding Pro tiers:", error);
    } finally {
        await prisma.$disconnect();
    }
}

seedProTiers();
