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
            description: "The perfect starting place for your next project.",
            priceMonthlyUsd: 0,
            priceMonthlyInr: 0,
            maxProjects: 20,
            databaseSizeGb: 0.5,
            storageSizeGb: 1,
            monthlyTokenLimit: 1000000, // 1M tokens hard limit
            canPurchaseTokens: false, // Cannot purchase additional tokens
            sortOrder: 0,
            features: [
                "Import from Figma & GitHub",
                "AI-powered chat interface",
                "Live preview environment",
                "Up to 20 projects",
                "Integrated database & storage",
                "Authentication",
                "Hosting & deployment",
                "Community support",
                "1M AI tokens per month",
                "Access to lite AI models",
                "500MB database storage",
                "1GB file storage",
                "1,000 MAU auth free",
                "100GB bandwidth free",
            ],
        },
        {
            name: "PRO",
            displayName: "Pro",
            description: "Everything you need to build and scale your app.",
            priceMonthlyUsd: 25,
            priceMonthlyInr: 2075,
            maxProjects: 999999, // Virtually unlimited
            databaseSizeGb: 5,
            storageSizeGb: 10,
            monthlyTokenLimit: 10000000, // 10M tokens included
            canPurchaseTokens: true, // Can purchase additional tokens
            sortOrder: 1,
            features: [
                "All Hobby features, plus:",
                "10M AI tokens included per month",
                "Purchase additional AI tokens",
                "Unlimited projects",
                "Custom domains",
                "Priority AI processing",
                "Advanced code generation",
                "Remove Craft branding",
                "Email support",
                "5GB database storage",
                "10GB file storage free",
                "10,000 MAU auth free",
                "500GB bandwidth free",
                "Usage-based billing for overages",
            ],
        },
        {
            name: "ENTERPRISE",
            displayName: "Enterprise",
            description: "Security, performance, and dedicated support.",
            priceMonthlyUsd: 0, // Custom pricing
            priceMonthlyInr: 0, // Custom pricing
            maxProjects: null, // Unlimited
            databaseSizeGb: 999999, // Virtually unlimited
            storageSizeGb: 999999, // Virtually unlimited
            monthlyTokenLimit: null, // Unlimited tokens
            canPurchaseTokens: true, // Custom pricing model
            sortOrder: 2,
            features: [
                "All Pro features, plus:",
                "Unlimited AI tokens",
                "Custom token allocations",
                "SSO & SAML authentication",
                "Advanced security controls",
                "Audit logs & compliance",
                "Custom database & storage limits",
                "99.9% uptime SLA",
                "Dedicated account manager",
                "24/7 priority support",
                "Custom AI model allocations",
                "On-premise deployment options",
                "Custom integrations",
                "Volume discounts",
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
    console.log("- HOBBY: Free forever, 1M tokens/month (hard limit)");
    console.log("- PRO: $25/month, 10M tokens included + purchase more");
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
