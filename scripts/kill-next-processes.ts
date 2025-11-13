/**
 * Kill stale Next.js processes on port 3000 in a sandbox
 * Usage: npx tsx scripts/kill-next-processes.ts <sandboxId>
 */

import { Sandbox } from "e2b";
import { config } from "dotenv";

// Load environment variables
config();

const sandboxId = process.argv[2];

if (!sandboxId) {
    console.error("❌ Usage: npx tsx scripts/kill-next-processes.ts <sandboxId>");
    process.exit(1);
}

async function killNextProcesses() {
    try {
        console.log(`🔌 Connecting to sandbox: ${sandboxId}`);
        const sandbox = await Sandbox.connect(sandboxId);
        console.log(`✅ Connected to sandbox`);

        // Check what's running on port 3000
        console.log("\n🔍 Checking processes on port 3000...");
        const lsofResult = await sandbox.commands.run("lsof -ti:3000 || echo 'none'");
        const pids = lsofResult.stdout?.trim();

        // Also check for Next.js processes by name (in case port forwarding broke)
        console.log("\n🔍 Checking for Next.js processes by name...");
        const nextProcesses = await sandbox.commands.run("ps aux | grep -E 'next dev|next-server' | grep -v grep | awk '{print $2}'");
        const nextPids = nextProcesses.stdout?.trim();

        // Combine PIDs
        const allPids = [pids, nextPids].filter(p => p && p !== 'none').join('\n');

        if (!allPids || allPids === 'none') {
            console.log("✅ No Next.js processes found");
        } else {
            const pidArray = allPids.split('\n').filter(p => p && p !== 'none');
            console.log(`📋 Found PIDs: ${pidArray.join(', ')}`);

            // Show what these processes are
            try {
                const psResult = await sandbox.commands.run(`ps aux | grep -E '${pidArray.join('|')}'`);
                console.log("\n📊 Process details:");
                console.log(psResult.stdout);
            } catch (e) {
                // Ignore
            }

            // Kill them
            console.log(`\n🔧 Killing processes: ${pidArray.join(', ')}`);
            const killResult = await sandbox.commands.run(`kill -9 ${pidArray.join(' ')}`);
            console.log("✅ Processes killed");

            // Verify they're gone
            await new Promise(resolve => setTimeout(resolve, 500));
            const verifyResult = await sandbox.commands.run("lsof -ti:3000 || echo 'none'");
            const remainingPids = verifyResult.stdout?.trim();

            if (!remainingPids || remainingPids === 'none') {
                console.log("✅ Port 3000 is now free");
            } else {
                console.log(`⚠️ Some processes still remain: ${remainingPids}`);
            }
        }

        // Check all node processes
        console.log("\n📊 All Node.js/Next.js processes:");
        const allProcesses = await sandbox.commands.run("ps aux | grep -E 'node|next' | grep -v grep");
        console.log(allProcesses.stdout || "No processes found");

        console.log("\n✅ Done");
    } catch (error) {
        console.error("❌ Error:", error);
        process.exit(1);
    }
}

killNextProcesses();
