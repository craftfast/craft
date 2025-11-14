import { Polar } from "@polar-sh/sdk";
import { prisma } from "../src/lib/db";

async function mapPolarProducts() {
    try {
        // Initialize Polar client
        const accessToken = process.env.POLAR_ACCESS_TOKEN;
        if (!accessToken) {
            console.error("❌ POLAR_ACCESS_TOKEN not found in environment");
            process.exit(1);
        }

        const polar = new Polar({ accessToken });

        // Fetch all products
        console.log("\n🔍 Fetching Polar products...\n");
        const products = await polar.products.list({
            isArchived: false,
        });

        console.log("📦 Available Polar Products:");
        console.log("=".repeat(80));

        if (products.result.items.length === 0) {
            console.log("\n⚠️  No products found in Polar");
            console.log("   Please create products at: https://sandbox.polar.sh/dashboard");
            return;
        }

        products.result.items.forEach(product => {
            console.log(`\nProduct: ${product.name}`);
            console.log(`  ID: ${product.id}`);
            console.log(`  Description: ${product.description || "N/A"}`);
            console.log(`  Prices: ${product.prices?.length || 0}`);
            if (product.prices && product.prices.length > 0) {
                product.prices.forEach(price => {
                    const amount = 'priceAmount' in price ? price.priceAmount : 0;
                    console.log(`    - ${price.type}: $${(amount || 0) / 100}/month`);
                });
            }
        });

        console.log("\n" + "=".repeat(80));

        // Get current plans
        const plans = await prisma.plan.findMany({
            select: {
                id: true,
                name: true,
                polarProductId: true,
            },
        });

        console.log("\n\n📋 Mapping Suggestions:");
        console.log("=".repeat(80));

        // Try to auto-match by name
        for (const plan of plans) {
            const matchingProduct = products.result.items.find(p =>
                p.name.toLowerCase().includes(plan.name.toLowerCase()) ||
                plan.name.toLowerCase().includes(p.name.toLowerCase())
            );

            console.log(`\n${plan.name} Plan:`);
            if (matchingProduct) {
                console.log(`  ✅ Suggested match: ${matchingProduct.name}`);
                console.log(`  Product ID: ${matchingProduct.id}`);
                console.log(`  \nTo update, run:`);
                console.log(`  npx prisma db execute --stdin <<< "UPDATE \\"Plan\\" SET \\"polarProductId\\" = '${matchingProduct.id}' WHERE id = '${plan.id}';"`);
            } else {
                console.log(`  ⚠️  No automatic match found`);
                console.log(`  Please manually map to a product ID`);
            }
        }

        console.log("\n" + "=".repeat(80));
        console.log("\n💡 You can also update all at once by running the SQL commands above\n");

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await prisma.$disconnect();
    }
}

mapPolarProducts();
