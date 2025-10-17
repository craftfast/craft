/**
 * E2B Build System 2.0 - Production Template Builder
 * 
 * This script builds the production version of our Next.js sandbox template.
 * Run with: pnpm build:e2b:prod
 * 
 * The built template will be cached in E2B's cloud and can be spawned in ~150ms.
 */

import "dotenv/config";
import { Template } from "e2b";
import { nextjsTemplate, buildOptions } from "../src/lib/e2b/template";

async function main() {
    console.log("🚀 Building E2B production template...\n");

    if (!process.env.E2B_API_KEY) {
        console.error("❌ E2B_API_KEY not found in environment variables");
        console.error("   Please add it to your .env file");
        process.exit(1);
    }

    try {
        await Template.build(nextjsTemplate, {
            ...buildOptions,
            alias: "craft-nextjs", // Production alias
        });

        console.log("\n✅ Production template built successfully!");
        console.log(`   Template alias: craft-nextjs`);
        console.log("\n💡 You can now create sandboxes with:");
        console.log(`   const sandbox = await Sandbox.create("craft-nextjs");`);
    } catch (error) {
        console.error("\n❌ Build failed:", error);
        process.exit(1);
    }
}

main().catch(console.error);
