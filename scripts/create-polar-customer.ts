import { prisma } from "../src/lib/db";
import { createPolarCustomer } from "../src/lib/polar/customer";

async function createCustomerForUser() {
    const user = await prisma.user.findFirst({
        orderBy: { createdAt: "desc" },
    });

    if (!user) {
        console.log("No user found");
        return;
    }

    console.log(`\n🔄 Creating Polar customer for: ${user.email}`);

    const result = await createPolarCustomer(user);

    if (result.success && 'customerId' in result) {
        console.log(`✅ Success! Customer ID: ${result.customerId}`);
    } else if (!result.success && 'error' in result) {
        console.log(`❌ Failed: ${result.error}`);
    }

    await prisma.$disconnect();
}

createCustomerForUser();
