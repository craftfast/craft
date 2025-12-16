/**
 * E2B Template Builder - Production
 * 
 * Builds the Craft E2B template and registers it with E2B for production use.
 * 
 * Run with: pnpm e2b:build:prod
 */

import { config } from "dotenv";
import { Template, defaultBuildLogger } from "e2b";
import { craftTemplate } from "./craft-template";

// Load environment variables from .env
config();

async function buildProdTemplate() {
    console.log("🏗️  Building Craft E2B template for production...");
    console.log(`📦 Template: craft-next`);
    console.log(`📝 Description: Craft Next.js 16 + shadcn/ui base project (pre-built)\n`);

    // Check for E2B API key
    const apiKey = process.env.E2B_API_KEY;
    if (!apiKey) {
        console.error("❌ Error: E2B_API_KEY environment variable is not set");
        console.error("\nPlease set your E2B API key:");
        console.error("1. Get your API key from: https://e2b.dev/docs/api-key");
        console.error("2. Add to production environment variables");
        console.error("   E2B_API_KEY=your_api_key_here\n");
        process.exit(1);
    }

    try {
        // Build the template using E2B's static method
        await Template.build(craftTemplate, {
            alias: "craft-next",
            cpuCount: 2,
            memoryMB: 1024,
            apiKey, // Pass API key explicitly
            onBuildLogs: defaultBuildLogger({ minLevel: "info" }),
        });

        console.log("\n✅ Template built successfully!");
        console.log(`🆔 Template alias: craft-next`);
        console.log(`\n📋 Next steps:`);
        console.log(`1. Update E2B_TEMPLATE_ID in production environment:`);
        console.log(`   E2B_TEMPLATE_ID="craft-next"`);
        console.log(`\n2. Deploy the updated environment variable`);
        console.log(`\n3. Verify in production:`);
        console.log(`   - Create a new project`);
        console.log(`   - Check sandbox spawn time (~150ms expected)`);
    } catch (error) {
        console.error("\n❌ Template build failed:");
        console.error(error);
        process.exit(1);
    }
}

buildProdTemplate();
