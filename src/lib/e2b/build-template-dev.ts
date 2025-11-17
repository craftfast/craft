/**
 * E2B Template Builder - Development
 * 
 * Builds the Craft E2B template and registers it with E2B for development use.
 * 
 * Run with: pnpm e2b:build:dev
 */

import { config } from "dotenv";
import { Template, defaultBuildLogger } from "e2b";
import { craftTemplate } from "./craft-template";

// Load environment variables from .env
config();

async function buildDevTemplate() {
    console.log("🏗️  Building Craft E2B template for development...");
    console.log(`📦 Template: craft-next-dev`);
    console.log(`📝 Description: Craft Next.js 15 + shadcn/ui base project (pre-built)\n`);

    // Check for E2B API key
    const apiKey = process.env.E2B_API_KEY;
    if (!apiKey) {
        console.error("❌ Error: E2B_API_KEY environment variable is not set");
        console.error("\nPlease set your E2B API key:");
        console.error("1. Get your API key from: https://e2b.dev/docs/api-key");
        console.error("2. Add to .env or .env.local:");
        console.error("   E2B_API_KEY=your_api_key_here\n");
        process.exit(1);
    }

    try {
        console.log("⏳ Building template (this may take 5-10 minutes - installing Next.js + shadcn/ui)...\n");

        // Build the template using E2B's static method
        // Note: This is a long-running operation (5-10 minutes)
        await Template.build(craftTemplate, {
            alias: "craft-next-dev",
            cpuCount: 2,
            memoryMB: 1024,
            apiKey, // Pass API key explicitly
            onBuildLogs: defaultBuildLogger({ minLevel: "info" }),
        });

        console.log("\n✅ Template built successfully!");
        console.log(`🆔 Template alias: craft-next-dev`);
        console.log(`\n📋 Next steps:`);
        console.log(`1. Update E2B_TEMPLATE_ID in .env or .env.local:`);
        console.log(`   E2B_TEMPLATE_ID="craft-next-dev"`);
        console.log(`\n2. Restart your dev server to use the new template`);
        console.log(`\n3. Test creating a new project`);
    } catch (error) {
        console.error("\n❌ Template build failed:");

        if (error instanceof Error) {
            // Check for network errors
            if (error.message.includes("ECONNRESET") || error.message.includes("fetch failed")) {
                console.error("\n⚠️  Network connection error during build.");
                console.error("The build may have succeeded on E2B's servers.");
                console.error("\nTo verify:");
                console.error("1. Check E2B dashboard: https://e2b.dev/dashboard");
                console.error("2. Look for template: craft-next-dev");
                console.error("3. If it exists, add to .env:");
                console.error("   E2B_TEMPLATE_ID=\"craft-next-dev\"");
                console.error("\nIf template doesn't exist, try running this command again.");
            } else {
                console.error(error.message);
            }
        } else {
            console.error(error);
        }

        process.exit(1);
    }
}

buildDevTemplate();
