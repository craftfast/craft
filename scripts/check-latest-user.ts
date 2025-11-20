import { prisma } from "../src/lib/db";

async function checkLatestUser() {
    const user = await prisma.user.findFirst({
        orderBy: { createdAt: "desc" },
    });

    if (user) {
        console.log("\n📊 Latest User:");
        console.log("   Email:", user.email);
        console.log("   Name:", user.name);
        console.log("   Razorpay Customer ID:", user.razorpayCustomerId || "❌ Not set");
        console.log("   Account Balance:", `$${user.accountBalance.toString()}`);
        console.log("   Created:", user.createdAt);
        console.log("   Age:", Math.floor((Date.now() - user.createdAt.getTime()) / 1000), "seconds");
    }

    await prisma.$disconnect();
}

checkLatestUser();
