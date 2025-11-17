import { prisma } from "../src/lib/db";

async function checkLatestUser() {
    const user = await prisma.user.findFirst({
        orderBy: { createdAt: "desc" },
    });

    if (user) {
        console.log("\n📊 Latest User:");
        console.log("   Email:", user.email);
        console.log("   Name:", user.name);
        console.log("   Polar Customer ID:", user.polarCustomerId || "❌ Not set");
        console.log("   Polar External ID:", user.polarCustomerExtId || "❌ Not set");
        console.log("   Created:", user.createdAt);
        console.log("   Age:", Math.floor((Date.now() - user.createdAt.getTime()) / 1000), "seconds");
    }

    await prisma.$disconnect();
}

checkLatestUser();
