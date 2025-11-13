import { Sandbox } from "@e2b/code-interpreter";
import "dotenv/config";

async function checkSandboxPreview() {
    const sandboxId = "igpw6q4fzvm9288fys7ru";

    try {
        console.log(`🔍 Connecting to sandbox: ${sandboxId}`);
        const sandbox = await Sandbox.connect(sandboxId);

        console.log(`✅ Connected to sandbox`);
        console.log(`📍 Sandbox host: ${sandbox.getHost(3000)}`);
        console.log(`🔗 Preview URL: https://${sandbox.getHost(3000)}`);

        // Check running processes first
        console.log(`\n� Checking running processes...`);
        try {
            const processes = await sandbox.commands.run("ps aux | grep -E 'node|next|pnpm' | grep -v grep", { timeoutMs: 3000 });
            console.log(processes.stdout || "No processes found");
        } catch (e) {
            console.log("⚠️ Failed to check processes");
        }

        // Check if port 3000 is listening
        console.log(`\n� Checking if port 3000 is listening...`);
        try {
            const portCheck = await sandbox.commands.run(
                "netstat -tlnp 2>/dev/null | grep :3000 || ss -tlnp 2>/dev/null | grep :3000 || echo 'no listener'",
                { timeoutMs: 3000 }
            );
            console.log(`📊 Port status: ${portCheck.stdout?.trim() || 'not listening'}`);
        } catch (e) {
            console.log("⚠️ Port check failed");
        }

        // Check project directory
        console.log(`\n📁 Checking project directory...`);
        try {
            const dirCheck = await sandbox.commands.run("ls -la /home/user/project", { timeoutMs: 3000 });
            console.log(dirCheck.stdout);
        } catch (e) {
            console.log("⚠️ Failed to list directory");
        }

        // Don't kill - let E2B auto-pause handle it
        console.log(`\n✅ Diagnostic complete (sandbox will auto-pause after timeout)`);

    } catch (error) {
        console.error(`❌ Error:`, error);
    }
}

checkSandboxPreview();
