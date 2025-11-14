/**
 * Verify E2B Sandbox Functionality
 * 
 * This script:
 * 1. Creates a sandbox from the craft-nextjs-dev template
 * 2. Gets the sandbox URL
 * 3. Automatically kills the sandbox after 1 minute
 */

import { config } from "dotenv";
import { Sandbox } from "e2b";

// Load environment variables
config();

const KILL_TIMEOUT_MS = 60000; // 1 minute

async function verifySandbox() {
    let sandbox: Sandbox | null = null;

    try {
        const templateId = process.env.E2B_TEMPLATE_ID || "craft-next-dev";
        console.log(`🔍 Creating E2B sandbox from ${templateId} template...\n`);

        sandbox = await Sandbox.create(templateId, {
            timeoutMs: 120000, // 2 minutes to create
        });

        console.log(`✅ Sandbox created: ${sandbox.sandboxId}\n`);

        // Get the sandbox URL
        const url = `https://${sandbox.getHost(3000)}`;
        console.log(`\n🌐 Sandbox URL: ${url}\n`);
        console.log(`📝 Sandbox ID: ${sandbox.sandboxId}\n`);

        // Set up auto-kill after 1 minute
        console.log(`⏱️  Sandbox will be killed in 1 minute...\n`);

        setTimeout(async () => {
            console.log("\n⏰ 1 minute elapsed, killing sandbox...\n");
            if (sandbox) {
                await sandbox.kill();
                console.log("✅ Sandbox killed successfully\n");
                process.exit(0);
            }
        }, KILL_TIMEOUT_MS);

    } catch (error) {
        console.error("\n❌ Error:", error);
        if (sandbox) {
            console.log("\n🧹 Cleaning up sandbox...");
            await sandbox.kill();
        }
        process.exit(1);
    }
}

console.log("🔍 Verifying E2B Sandbox Functionality...\n");
verifySandbox();
