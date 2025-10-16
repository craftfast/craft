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
            maxProjects: 999999, // Unlimited projects
            databaseSizeGb: 0.5,
            storageSizeGb: 1,
            monthlyTokenLimit: 100000, // 100k tokens included per month
            canPurchaseTokens: true, // Can purchase additional tokens at $5/1M
            sortOrder: 0,
            features: [
                "Import from Figma & GitHub",
                "AI-powered chat interface",
                "Live preview environment",
                "Unlimited projects",
                "Integrated database & storage",
                "Authentication",
                "Community support",
                "100k AI tokens included per month",
                "Purchase additional AI tokens ($5/1M)",
                "Pay-as-you-go for infrastructure overages",
                "Access to lite AI models",
                "500MB database storage",
                "1GB file storage",
                "1,000 MAU auth free",
                "100GB bandwidth free",
                "$0.10/GB database overage",
                "$0.05/GB storage overage",
            ],
        },
        {
            name: "PRO",
            displayName: "Pro",
            description: "Everything you need to build and scale your app.",
            priceMonthlyUsd: 150,
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
    console.log("- HOBBY: Free forever, 100k tokens/month + pay-as-you-go ($5/1M)");
    console.log("- PRO: $150/month, 10M tokens included + purchase more");
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
