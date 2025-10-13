import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("🌱 Seeding database with plan data...");

    // Delete existing plans (for clean seeding)
    await prisma.plan.deleteMany();
    console.log("✅ Cleared existing plans");

    // Create plans based on current usage-based pricing model
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
                "Pay-as-you-go AI usage",
                "Access to multiple AI models",
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
            maxProjects: null, // Unlimited
            databaseSizeGb: 5,
            storageSizeGb: 10,
            sortOrder: 1,
            features: [
                "All Hobby features, plus:",
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
                "Custom AI model allocations",
                "On-premise deployment options",
                "Custom integrations",
                "Volume discounts",
            ],
        },
    ];

    for (const planData of plans) {
        const plan = await prisma.plan.create({
            data: planData,
        });
        console.log(`✅ Created plan: ${plan.displayName} (${plan.name})`);
    }

    console.log("\n🎉 Database seeding completed successfully!");
    console.log("\nPlan Summary:");
    console.log("- HOBBY: Free forever, pay-as-you-go AI usage");
    console.log("- PRO: $25/month, usage-based billing");
    console.log("- ENTERPRISE: Custom pricing, dedicated support");
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
