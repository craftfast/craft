// Quick database check
import { prisma } from "../src/lib/db";

async function checkDatabase() {
    try {
        const result = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND column_name IN ('polarCustomerId', 'polarCustomerExtId')
    `;

        console.log("Database check result:", result);

        await prisma.$disconnect();
    } catch (error) {
        console.error("Error:", error);
        await prisma.$disconnect();
    }
}

checkDatabase();
