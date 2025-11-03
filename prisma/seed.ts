import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("🌱 Seeding database with plan data...");

    // Update or create plans (upsert to avoid foreign key constraint issues)
    console.log("✅ Upserting plans...");

    // Plan data based on monthly credit-based pricing model
    const plans = [
        {
            name: "HOBBY",
            displayName: "Hobby",
            description: "Try Craft with basic features. Limited to 3 projects.",
            priceMonthlyUsd: 0,
            maxProjects: 3, // Limited to 3 projects
            monthlyCredits: 100, // 100 credits per month
            sortOrder: 0,
            features: [
                "100 credits per month",
                "Up to 3 projects",
                "AI-powered code generation",
                "Sandbox environments",
                "Live preview",
                "Database & storage included",
                "Craft branding on projects",
                "Community support",
            ],
        },
        {
            name: "PRO",
            displayName: "Pro",
            description: "Everything you need to build and scale your apps.",
            priceMonthlyUsd: 25, // Base Pro tier starts at $25
            maxProjects: 999, // Unlimited projects
            monthlyCredits: 500, // Base Pro tier: 500 credits/month
            sortOrder: 1,
            features: [
                "Everything in Hobby, plus:",
                "500-100,000 credits/month (based on tier)",
                "Unlimited projects",
                "All AI models",
                "Import from Figma & GitHub",
                "Deploy to Vercel",
                "No Craft branding",
                "Priority email support",
            ],
        },
        {
            name: "ENTERPRISE",
            displayName: "Enterprise",
            description: "Custom solutions for large teams and organizations.",
            priceMonthlyUsd: 0, // Contact sales for pricing
            maxProjects: 999999, // Unlimited
            monthlyCredits: 0, // Custom allocation
            sortOrder: 2,
            features: [
                "All Pro features, plus:",
                "Custom monthly credit allocation",
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
    console.log("- HOBBY: Free forever, 100 credits/month, up to 3 projects");
    console.log("- PRO: $25-2000/month, 500-100,000 credits/month, unlimited projects");
    console.log("- ENTERPRISE: Contact sales, custom monthly credit allocation, dedicated support");
    console.log("\nCredit Usage:");
    console.log("- AI Generation: 1 credit = 10,000 tokens (varies by model)");
    console.log("- Sandbox: 0.1 credits/minute (6 credits/hour)");
    console.log("- Database: 0.5 credits/GB/month storage + 0.01 credits/hour compute");
    console.log("- Storage (R2): 0.2 credits/GB/month");
    console.log("- Deployment: 1 credit per deploy");
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
