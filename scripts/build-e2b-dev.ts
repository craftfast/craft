/**
 * E2B Build System 2.0 - Development Template Builder
 * 
 * This script builds the development version of our Next.js sandbox template.
 * Run with: pnpm build:e2b:dev
 * 
 * The built template will be cached in E2B's cloud and can be spawned in ~150ms.
 */

import "dotenv/config";
import { Template } from "e2b";
import { nextjsTemplate, buildOptions } from "../src/lib/e2b/template";

async function main() {
    console.log("🚀 Building E2B development template...\n");

    if (!process.env.E2B_API_KEY) {
        console.error("❌ E2B_API_KEY not found in environment variables");
        console.error("   Please add it to your .env file");
        process.exit(1);
    }

    try {
        await Template.build(nextjsTemplate, {
            ...buildOptions,
            alias: "craft-nextjs-dev", // Development alias
        });

        console.log("\n✅ Development template built successfully!");
        console.log(`   Template alias: craft-nextjs-dev`);
        console.log("\n💡 You can now create sandboxes with:");
        console.log(`   const sandbox = await Sandbox.create("craft-nextjs-dev");`);
    } catch (error) {
        console.error("\n❌ Build failed:", error);
        process.exit(1);
    }
}

main().catch(console.error);
