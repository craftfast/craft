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
            databaseSizeGb: 0.05, // 50 MB
            storageSizeGb: 0.1, // 100 MB
            monthlyTokenLimit: 100000, // 100k tokens per month
            canPurchaseTokens: false, // Cannot purchase additional tokens on Hobby
            sortOrder: 0,
            features: [
                "100k AI tokens per month",
                "Up to 3 projects",
                "AI-powered chat interface",
                "Live preview environment",
                "Integrated database & storage",
                "Authentication",
                "Craft branding on projects",
                "Community support",
            ],
        },
        {
            name: "PRO",
            displayName: "Pro",
            description: "Everything you need to build and scale your app.",
            priceMonthlyUsd: 25,
            maxProjects: 999, // Unlimited projects
            databaseSizeGb: 0.5, // 500 MB free
            storageSizeGb: 1, // 1 GB free
            monthlyTokenLimit: 10000000, // 10M tokens per month
            canPurchaseTokens: true, // Can purchase additional tokens at $5/1M
            sortOrder: 1,
            features: [
                "Everything in hobby, plus:",
                "10M AI tokens per month",
                "Unlimited projects",
                "Purchase additional AI credits at $5 per million tokens",
                "Import from Figma & GitHub",
                "Remove Craft branding",
                "Pay-as-you-go for infrastructure",
                "Priority email support",
            ],
        },
        {
            name: "ENTERPRISE",
            displayName: "Enterprise",
            description: "Security, performance, and dedicated support.",
            priceMonthlyUsd: 0, // Custom pricing
            maxProjects: 999999, // Unlimited
            databaseSizeGb: 999999, // Virtually unlimited
            storageSizeGb: 999999, // Virtually unlimited
            monthlyTokenLimit: null, // Unlimited tokens
            canPurchaseTokens: true, // Custom pricing model
            sortOrder: 2,
            features: [
                "All Pro features, plus:",
                "SSO & SAML authentication",
                "Advanced security controls",
                "Audit logs & compliance",
                "Custom database & storage limits",
                "99.9% uptime SLA",
                "Dedicated account manager",
                "24/7 priority support",
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
    console.log("- PRO: $25/month, 10M tokens/month, unlimited projects, purchase more at $5/1M");
    console.log("- ENTERPRISE: Custom pricing, unlimited tokens");
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
