import { Polar } from "@polar-sh/sdk";

async function checkProducts() {
    const polar = new Polar({
        accessToken: process.env.POLAR_ACCESS_TOKEN!,
        server: "sandbox",
    });

    console.log("\n📦 Polar Products:\n" + "=".repeat(80));

    const products = await polar.products.list({
        organizationId: process.env.POLAR_ORGANIZATION_ID!,
    });

    for (const product of products.result?.items || []) {
        console.log(`\n${product.name}`);
        console.log(`  Product ID: ${product.id}`);
        console.log(`  Type: ${product.type || 'N/A'}`);

        if (product.prices && product.prices.length > 0) {
            console.log(`  Prices:`);
            for (const price of product.prices) {
                console.log(`    - Price ID: ${price.id}`);
                console.log(`      Amount: $${price.priceAmount ? price.priceAmount / 100 : 'PWYW'}`);
                console.log(`      Type: ${price.type || 'N/A'}`);
            }
        } else {
            console.log(`  ⚠️  No prices found`);
        }
    }

    console.log("\n" + "=".repeat(80));
}

checkProducts().catch(console.error);
