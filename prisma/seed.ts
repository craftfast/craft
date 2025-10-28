import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("🌱 Seeding database with plan data...");

    // Update or create plans (upsert to avoid foreign key constraint issues)
    console.log("✅ Upserting plans...");

    // Plan data based on current credit-based pricing model
    const plans = [
        {
            name: "HOBBY",
            displayName: "Hobby",
            description: "Try Craft with basic features. Limited to 3 projects.",
            priceMonthlyUsd: 0,
            maxProjects: 3, // Limited to 3 projects
            dailyCredits: 1, // 1 credit per day
            monthlyCredits: 30, // Approximate: 1 credit/day * 30 days
            sortOrder: 0,
            features: [
                "1 credit per day (~30 credits/month)",
                "Up to 3 projects",
                "AI-powered chat interface",
                "Live preview environment",
                "Supabase integration (database & storage)",
                "Craft branding on projects",
                "Community support",
            ],
        },
        {
            name: "PRO",
            displayName: "Pro",
            description: "Everything you need to build and scale your app.",
            priceMonthlyUsd: 25, // Base Pro tier starts at $25
            maxProjects: 999, // Unlimited projects
            dailyCredits: 10, // Base Pro tier: 10 credits/day
            monthlyCredits: 300, // Approximate: 10 credits/day * 30 days
            sortOrder: 1,
            features: [
                "Everything in hobby, plus:",
                "10-1000 credits per day (based on tier)",
                "Unlimited projects",
                "Import from Figma & GitHub",
                "Deploy to vercel",
                "Priority email support",
            ],
        },
        {
            name: "ENTERPRISE",
            displayName: "Enterprise",
            description: "Custom solutions for large teams and organizations.",
            priceMonthlyUsd: 0, // Contact sales for pricing
            maxProjects: 999999, // Unlimited
            dailyCredits: null, // Custom allocation
            monthlyCredits: null, // Custom allocation
            sortOrder: 2,
            features: [
                "All Pro features, plus:",
                "Custom daily credit allocation",
                "Dedicated account manager",
                "Priority support & SLA",
                "Custom integrations",
                "Advanced security features",
                "Volume discounts",
                "Custom contract terms",
            ],
        },
    ];

    for (const planData of plans) {
        const plan = await prisma.plan.upsert({
            where: { name: planData.name },
            update: planData,
            create: planData,
        });
        console.log(`✅ Upserted plan: ${plan.displayName} (${plan.name})`);
    }

    console.log("\n🎉 Database seeding completed successfully!");
    console.log("\nPlan Summary:");
    console.log("- HOBBY: Free forever, 1 credit/day (~30/month), up to 3 projects");
    console.log("- PRO: $25-2500/month, 10-1000 credits/day, unlimited projects");
    console.log("- ENTERPRISE: Contact sales, custom daily credit allocation, dedicated support");
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
