import { prisma } from "../src/lib/db";

async function checkBalance() {
    const user = await prisma.user.findUnique({
        where: { email: "sudheerkm72@gmail.com" },
        select: {
            id: true,
            email: true,
            name: true,
            accountBalance: true,
        },
    });

    if (!user) {
        console.log("User not found");
        return;
    }

    console.log("\n💰 User Balance:");
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.name || "N/A"}`);
    console.log(`   Balance: $${user.accountBalance.toString()}`);

    // Get recent transactions
    const transactions = await prisma.balanceTransaction.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 5,
    });

    if (transactions.length > 0) {
        console.log("\n📜 Recent Transactions:");
        transactions.forEach((tx, i) => {
            console.log(`   ${i + 1}. ${tx.type} - $${tx.amount} (${tx.description})`);
        });
    }

    // Get payment transactions
    const payments = await prisma.paymentTransaction.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 3,
    });

    if (payments.length > 0) {
        console.log("\n💳 Recent Payments:");
        payments.forEach((p, i) => {
            console.log(`   ${i + 1}. ${p.status} - $${p.amount} ${p.currency} (${p.paymentMethod})`);
        });
    }

    console.log();
}

checkBalance().then(() => process.exit(0));
