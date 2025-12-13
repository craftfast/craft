/**
 * Build Screenshot Template (Development)
 * 
 * Builds the screenshot-only E2B template for development/testing.
 * Template name: craft-screenshot-dev
 */

import { config } from "dotenv";
import { Template } from "e2b";
import { screenshotTemplate, screenshotTemplateMetadata } from "./screenshot-template";

// Load environment variables
config();

async function buildScreenshotTemplateDev() {
    console.log("🏗️ Building Craft Screenshot Template (DEV)...\n");

    try {
        const templateName = `${screenshotTemplateMetadata.name}-dev`;

        console.log(`📦 Template: ${templateName}`);
        console.log(`📝 Description: ${screenshotTemplateMetadata.description}`);
        console.log(`🏷️ Version: ${screenshotTemplateMetadata.version}\n`);

        console.log("⏳ Building template (this may take 2-3 minutes)...");
        console.log("   - Installing Chromium browser");
        console.log("   - Setting up Puppeteer");
        console.log("   - Creating screenshot script\n");

        // Check for E2B API key
        const apiKey = process.env.E2B_API_KEY;
        if (!apiKey) {
            throw new Error("E2B_API_KEY environment variable is not set");
        }

        // Build the template
        await Template.build(screenshotTemplate, {
            alias: templateName,
            apiKey,
        });

        console.log("✅ Screenshot template built successfully!\n");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log("📋 Next Steps:");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
        console.log(`1. Update E2B_SCREENSHOT_TEMPLATE_ID in .env or .env.local:`);
        console.log(`   E2B_SCREENSHOT_TEMPLATE_ID="${templateName}"`);
        console.log("\n2. The screenshot API will now use this template");
        console.log("\n3. Test screenshot capture in your app");
        console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    } catch (error) {
        console.error("❌ Failed to build screenshot template:", error);

        if (error instanceof Error) {
            console.error("\nError details:");
            console.error(error.message);

            if (error.message.includes("API key")) {
                console.error("\n💡 Make sure E2B_API_KEY is set:");
                console.error("   E2B_API_KEY=\"your-api-key-here\"");
            }
        }

        process.exit(1);
    }
}

// Run the build
buildScreenshotTemplateDev();
