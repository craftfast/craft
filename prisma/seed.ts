import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("🌱 Seeding database with plan data...");

    // Update or create plans (upsert to avoid foreign key constraint issues)
    console.log("✅ Upserting plans...");

    // Plan data based on current usage-based pricing model
    const plans = [
        {
            name: "HOBBY",
            displayName: "Hobby",
            description: "Try Craft with basic features. Limited to 3 projects.",
            priceMonthlyUsd: 0,
            maxProjects: 3, // Limited to 3 projects
            monthlyTokenLimit: 100000, // 100k tokens per month
            canPurchaseTokens: false, // Cannot purchase additional tokens on Hobby
            sortOrder: 0,
            features: [
                "100k AI tokens per month",
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
            priceMonthlyUsd: 50,
            maxProjects: 999, // Unlimited projects
            monthlyTokenLimit: 10000000, // 10M tokens per month
            canPurchaseTokens: true, // Can purchase additional tokens at $5/1M
            sortOrder: 1,
            features: [
                "Everything in hobby, plus:",
                "10M AI tokens per month",
                "Unlimited projects",
                "Purchase additional AI credits at $5 per million tokens",
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
            monthlyTokenLimit: null, // Custom allocation
            canPurchaseTokens: true,
            sortOrder: 2,
            features: [
                "All Pro features, plus:",
                "Custom AI token allocation",
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
    console.log("- HOBBY: Free forever, 100k tokens/month, up to 3 projects");
    console.log("- PRO: $50/month, 10M tokens/month, unlimited projects, purchase more at $5/1M");
    console.log("- ENTERPRISE: Contact sales, custom token allocation, dedicated support");
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
