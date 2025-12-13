import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import { prisma } from "@/lib/db";
import { getOrCreateProjectSandbox } from "@/lib/e2b/sandbox-manager";
import { decryptValue } from "@/lib/crypto";
import { acquireRedisLock } from "@/lib/redis-lock";

/**
 * POST /api/sandbox/[projectId]
 * Create or reuse sandbox for a project
 * 
 * Production notes:
 * - Has 90s overall timeout to prevent hanging
 * - Limits restart attempts to prevent infinite loops
 * - Uses Redis distributed lock (multi-instance safe for Vercel)
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ projectId: string }> }
) {
    const { projectId } = await params;
    const operationStartTime = Date.now();
    const OPERATION_TIMEOUT_MS = 90000; // 90 seconds max

    // Acquire Redis distributed lock to prevent concurrent operations on the same sandbox
    // This works across multiple Vercel instances
    const releaseLock = await acquireRedisLock(`sandbox:lock:${projectId}`, {
        ttlMs: 90000,      // Lock expires after 90s (matches operation timeout)
        timeoutMs: 60000,  // Wait up to 60s to acquire lock
    });

    try {
        const session = await getSession();

        if (!session?.user?.id) {
            await releaseLock();
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Verify project ownership
        const project = await prisma.project.findFirst({
            where: {
                id: projectId,
                userId: session.user.id,
            },
            select: {
                id: true,
            },
        });

        if (!project) {
            await releaseLock();
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        // Use sandbox manager - will resume paused sandbox if exists, or create new one
        console.log(`� Getting or creating sandbox for project: ${projectId}`);

        const sandboxOpts = {
            metadata: { projectId, userId: session.user.id },
        };

        // Use sandbox manager - will resume paused sandbox if exists, or create new one
        const sandboxInfo = await getOrCreateProjectSandbox(projectId, sandboxOpts);
        const sandbox = sandboxInfo.sandbox;

        console.log(`✅ Sandbox ready: ${sandbox.sandboxId}`);

        // Fetch project environment variables
        console.log("🔐 Fetching environment variables...");
        const envVars = await prisma.projectEnvironmentVariable.findMany({
            where: {
                projectId,
                deletedAt: null,
            },
            select: {
                key: true,
                value: true,
                isSecret: true,
            },
        });

        // Decrypt secret values and build env object
        const envObject: Record<string, string> = {};
        for (const envVar of envVars) {
            try {
                const value = envVar.isSecret ? decryptValue(envVar.value) : envVar.value;
                envObject[envVar.key] = value;
            } catch (error) {
                console.warn(`⚠️ Failed to decrypt env var ${envVar.key}, using raw value`);
                envObject[envVar.key] = envVar.value;
            }
        }

        console.log(`✅ Loaded ${envVars.length} environment variables:`, Object.keys(envObject));

        // Write .env file to sandbox (always update with latest values)
        console.log("📝 Writing .env file to sandbox...");
        const envContent = Object.keys(envObject).length > 0
            ? Object.entries(envObject)
                .map(([key, value]) => `${key}="${value.replace(/"/g, '\\"')}"`)
                .join('\n')
            : '# No environment variables configured yet\n# Add them in Project Settings > Environment';

        try {
            await sandbox.files.write('/home/user/project/.env', envContent);
            console.log(`✅ .env file written with ${Object.keys(envObject).length} variables`);
        } catch (error) {
            console.error("❌ Failed to write .env file:", error);
        }

        // Check if .env file changed (to determine if restart is needed)
        let envFileChanged = false;
        try {
            const existingEnv = await sandbox.files.read('/home/user/project/.env.previous');
            envFileChanged = existingEnv !== envContent;
        } catch {
            // File doesn't exist yet, assume changed
            envFileChanged = true;
        }

        // Save current env for next comparison
        try {
            await sandbox.files.write('/home/user/project/.env.previous', envContent);
        } catch (error) {
            console.warn("⚠️ Could not save .env backup for comparison");
        }

        // ⚡ OPTIMIZATION: Sandbox is source of truth!
        // Files are already in the sandbox (from E2B template or AI edits via writeFileToSandbox)
        // We do NOT inject files from database - that would overwrite sandbox state
        // AI writes directly to sandbox → Next.js HMR detects changes → Auto-reloads preview
        // Preview iframe stays connected, no restarts needed!
        console.log("⚡ Sandbox has all files already (source of truth) - skipping injection");

        // Ensure /home/user/project directory exists
        console.log("� Ensuring project directory exists...");
        try {
            await sandbox.commands.run("mkdir -p /home/user/project");
            console.log("✅ Project directory ready");
        } catch (error) {
            console.warn("⚠️ Failed to create project directory:", error);
        }

        // Ensure dev server is running on port 3000
        console.log("🔍 Checking if dev server is running on port 3000...");

        let isServerRunning = false;
        let needsRestart = false;

        // Strategy: Check process first (fast), then fallback to port check if needed
        // 1. Check if Next.js process is running
        try {
            const processCheck = await sandbox.commands.run(
                "pgrep -f 'next dev|next-server' || echo 'none'",
                { timeoutMs: 2000 }
            );
            const hasProcess = processCheck.stdout?.trim() && processCheck.stdout.trim() !== 'none';

            if (hasProcess) {
                console.log("✅ Next.js process is running");

                // Process exists, do a quick port check to confirm it's responding
                try {
                    const portCheck = await sandbox.commands.run(
                        "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000 || echo '000'",
                        { timeoutMs: 3000 }
                    );
                    const statusCode = portCheck.stdout?.trim() || '000';
                    isServerRunning = statusCode.startsWith('2') || statusCode === '404';

                    if (isServerRunning) {
                        console.log(`✅ Dev server is responding (HTTP ${statusCode})`);
                    } else {
                        console.log(`⚠️ Process running but port not responding (HTTP ${statusCode})`);
                    }
                } catch (err) {
                    // Port check failed but process exists - give it a moment
                    console.log("⏳ Process exists but port check failed, trying once more...");
                    await new Promise(resolve => setTimeout(resolve, 1000));

                    try {
                        const retry = await sandbox.commands.run(
                            "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000 || echo '000'",
                            { timeoutMs: 3000 }
                        );
                        const statusCode = retry.stdout?.trim() || '000';
                        isServerRunning = statusCode.startsWith('2') || statusCode === '404';

                        if (isServerRunning) {
                            console.log(`✅ Dev server responding on retry (HTTP ${statusCode})`);
                        }
                    } catch {
                        console.log("⚠️ Port still not responding after retry");
                    }
                }
            } else {
                console.log("⚠️ No Next.js process found");
            }
        } catch (error) {
            console.log("⚠️ Could not check process, will check port directly");

            // Fallback: Direct port check using simpler netstat
            try {
                const portCheck = await sandbox.commands.run(
                    "netstat -tuln | grep ':3000 ' || echo 'not_found'",
                    { timeoutMs: 2000 }
                );
                const portInUse = !portCheck.stdout?.includes('not_found');

                if (portInUse) {
                    console.log("✅ Port 3000 is in use");
                    isServerRunning = true;
                } else {
                    console.log("⚠️ Port 3000 not in use");
                }
            } catch {
                console.log("⚠️ Netstat check also failed");
            }
        }

        // Force restart if environment variables changed
        if (isServerRunning && envFileChanged) {
            console.log("🔄 Environment variables changed - restarting server to apply changes...");
            needsRestart = true;
            isServerRunning = false;
        }

        // If not running, need to start
        if (!isServerRunning) {
            console.log("⚠️ Dev server not running, needs to start");
            needsRestart = true; // ✅ FIX: Actually set needsRestart to true!

            try {
                // Use pkill to cleanly kill any stale processes
                // This is more reliable than finding PIDs manually
                await sandbox.commands.run(
                    "pkill -f 'next dev' || pkill -f 'next-server' || true",
                    { timeoutMs: 3000 }
                );
                await new Promise(resolve => setTimeout(resolve, 1500)); // Wait for cleanup
                console.log("✅ Cleanup complete");
            } catch (killError) {
                console.log("⚠️ Cleanup warning (non-critical):", killError);
            }
        }

        // Start dev server only if needed
        if (needsRestart) {
            try {
                // Merge project env vars with system env vars
                const devServerEnvs = {
                    NODE_ENV: "development",
                    PORT: "3000",
                    HOSTNAME: "0.0.0.0",
                    NEXT_TELEMETRY_DISABLED: "1",
                    ...envObject, // Include project's environment variables
                };

                // Start the dev server in the background
                const devProcess = await sandbox.commands.run(
                    "pnpm dev",
                    {
                        background: true,
                        envs: devServerEnvs,
                    }
                );
                console.log(`✅ Dev server started with 'pnpm dev' (PID: ${devProcess.pid || 'unknown'})`);

                // Wait for the server to become ready (up to 40 seconds for Next.js compilation)
                console.log("⏳ Waiting for Next.js to compile and start...");
                const startTime = Date.now();
                let isReady = false;
                let consecutiveSuccesses = 0;
                const requiredChecks = envFileChanged ? 2 : 1; // 2 checks for restart, 1 for fresh start

                while (Date.now() - startTime < 40000 && !isReady) {
                    await new Promise(resolve => setTimeout(resolve, 2000)); // Check every 2s

                    try {
                        const check = await sandbox.commands.run(
                            "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000 || echo 'failed'",
                            { timeoutMs: 3000 }
                        );

                        const code = check.stdout?.trim() || '';
                        if (code !== 'failed' && /^[2-5]\d\d$/.test(code)) {
                            consecutiveSuccesses++;
                            console.log(`✓ Server responding (HTTP ${code}) - ${consecutiveSuccesses}/${requiredChecks} checks`);

                            // Require 2 consecutive checks only for restarts, 1 for fresh starts
                            if (consecutiveSuccesses >= requiredChecks) {
                                isReady = true;
                                const elapsed = Math.floor((Date.now() - startTime) / 1000);
                                console.log(`✅ Dev server is ready! (HTTP ${code}) - took ${elapsed}s`);
                            }
                        } else {
                            consecutiveSuccesses = 0; // Reset counter on failure
                        }
                    } catch (checkError) {
                        consecutiveSuccesses = 0; // Reset counter on error
                        // Continue waiting
                    }
                }

                if (!isReady) {
                    console.warn(`⚠️ Dev server may not be fully ready yet after 30s`);

                    // Log diagnostics
                    try {
                        const psResult = await sandbox.commands.run("ps aux | grep -E 'node|pnpm|next'", { timeoutMs: 2000 });
                        console.log("📊 Running processes:", psResult.stdout);
                    } catch (err) {
                        // Ignore
                    }
                }
            } catch (startError) {
                console.error(`❌ Failed to start dev server:`, startError);
                throw new Error("Failed to start Next.js dev server");
            }
        }

        // Get the preview URL
        const previewUrl = `https://${sandbox.getHost(3000)}`;
        console.log(`🔗 Preview URL: ${previewUrl}`);

        // Verify external URL is accessible (for resumed sandboxes, port forwarding may take a moment)
        console.log("🔍 Verifying external URL accessibility...");
        let isExternallyAccessible = false;
        const maxRetries = 5;

        for (let i = 0; i < maxRetries; i++) {
            try {
                const response = await fetch(previewUrl, {
                    method: 'HEAD',
                    signal: AbortSignal.timeout(5000)
                });
                if (response.ok || response.status === 404) {
                    isExternallyAccessible = true;
                    console.log(`✅ External URL is accessible (HTTP ${response.status})`);
                    break;
                } else {
                    console.log(`⚠️ External URL returned HTTP ${response.status}`);
                }
            } catch (error) {
                if (i < maxRetries - 1) {
                    const delay = (i + 1) * 1500;
                    console.log(`⏳ External URL not ready yet (attempt ${i + 1}/${maxRetries}), retrying in ${delay / 1000}s...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }

        // If external URL is not accessible, try restarting the dev server
        if (!isExternallyAccessible) {
            // Check operation timeout before attempting restart
            if (Date.now() - operationStartTime > OPERATION_TIMEOUT_MS) {
                console.error("❌ Operation timeout exceeded before restart attempt");
                releaseLock();
                return NextResponse.json({
                    error: "Sandbox operation timed out. Please try again.",
                    status: "timeout",
                }, { status: 504 });
            }

            try {
                // Kill existing processes
                await sandbox.commands.run(
                    "pkill -f 'next dev' || pkill -f 'next-server' || true",
                    { timeoutMs: 3000 }
                );
                await new Promise(resolve => setTimeout(resolve, 2000));

                // Restart the dev server
                await sandbox.commands.run(
                    "cd /home/user/project && pnpm dev",
                    {
                        background: true,
                        envs: {
                            NODE_ENV: "development",
                            PORT: "3000",
                            HOSTNAME: "0.0.0.0",
                            NEXT_TELEMETRY_DISABLED: "1",
                        },
                    }
                );
                console.log("✅ Dev server restarted");

                // Wait for server to start
                console.log("⏳ Waiting for dev server to start...");
                await new Promise(resolve => setTimeout(resolve, 5000));

                // Try external URL again
                for (let i = 0; i < 5; i++) {
                    try {
                        const response = await fetch(previewUrl, {
                            method: 'HEAD',
                            signal: AbortSignal.timeout(5000)
                        });
                        if (response.ok || response.status === 404) {
                            isExternallyAccessible = true;
                            console.log(`✅ External URL is now accessible (HTTP ${response.status})`);
                            break;
                        }
                    } catch (error) {
                        if (i < 4) {
                            await new Promise(resolve => setTimeout(resolve, 2000));
                        }
                    }
                }
            } catch (restartError) {
                console.error("❌ Failed to restart dev server:", restartError);
            }
        }

        // Final check - if still not accessible, return error
        if (!isExternallyAccessible) {
            const elapsed = Math.floor((Date.now() - operationStartTime) / 1000);
            console.error(`❌ External URL is not accessible after restart attempt (${elapsed}s elapsed)`);
            await releaseLock();
            return NextResponse.json({
                sandboxId: sandbox.sandboxId,
                url: previewUrl,
                status: "error",
                error: "The preview is taking longer than expected to start. This could be due to:",
                details: [
                    "Network connectivity issues with the sandbox",
                    "The Next.js app may have build errors",
                    "Heavy dependencies taking time to install"
                ],
                suggestion: "Try refreshing the page in a moment, or check the sandbox logs for errors.",
            }, { status: 503 });
        }

        // Final operation timeout check
        const totalElapsed = Date.now() - operationStartTime;
        if (totalElapsed > OPERATION_TIMEOUT_MS) {
            console.warn(`⚠️ Operation completed but exceeded timeout (${totalElapsed}ms)`);
        }

        // Release lock before returning
        await releaseLock();

        // Log success metrics for monitoring
        const totalDuration = Date.now() - operationStartTime;
        console.log(`✅ [${projectId}] Sandbox ready in ${totalDuration}ms`, {
            sandboxId: sandbox.sandboxId,
            duration: totalDuration,
            hadRestart: !isServerRunning,
        });

        // Return sandbox info
        return NextResponse.json({
            sandboxId: sandbox.sandboxId,
            url: previewUrl,
            status: "ready",
            message: "Sandbox is ready with files from source of truth (E2B sandbox)",
        });

    } catch (error) {
        // Always release lock on error
        await releaseLock();

        const elapsed = Date.now() - operationStartTime;
        console.error(`❌ [${projectId}] Sandbox error after ${elapsed}ms:`, error);

        // Distinguish between different error types for better debugging
        let errorMessage = "Failed to create sandbox";
        let statusCode = 500;

        if (error instanceof Error) {
            if (error.message.includes("timeout")) {
                errorMessage = "Sandbox operation timed out";
                statusCode = 504;
            } else if (error.message.includes("lock")) {
                errorMessage = "Another sandbox operation is in progress. Please wait and try again.";
                statusCode = 429;
            } else if (error.message.includes("Failed to start Next.js")) {
                errorMessage = "Failed to start the development server";
                statusCode = 503;
            }
        }

        return NextResponse.json(
            {
                error: errorMessage,
                details: error instanceof Error ? error.message : String(error),
                projectId,
            },
            { status: statusCode }
        );
    }
}

/**
 * GET /api/sandbox/[projectId]
 * Check sandbox status
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ projectId: string }> }
) {
    try {
        const session = await getSession();

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { projectId } = await params;

        // Verify project ownership
        const project = await prisma.project.findFirst({
            where: {
                id: projectId,
                userId: session.user.id,
            },
        });

        if (!project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        // Check if sandbox exists in database
        if (!project.sandboxId) {
            return NextResponse.json(
                { status: "inactive", url: null },
                { status: 200 }
            );
        }

        // Try to connect to the sandbox to check its status
        try {
            const { Sandbox } = await import("e2b");
            const sandbox = await Sandbox.connect(project.sandboxId);

            return NextResponse.json({
                sandboxId: project.sandboxId,
                url: `https://${sandbox.getHost(3000)}`,
                status: "running",
            });
        } catch (error) {
            // Sandbox might be paused or terminated
            return NextResponse.json({
                sandboxId: project.sandboxId,
                status: "paused",
                url: null,
            });
        }
    } catch (error) {
        console.error("Error getting sandbox:", error);
        return NextResponse.json(
            { error: "Failed to get sandbox" },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/sandbox/[projectId]
 * Health check endpoint
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ projectId: string }> }
) {
    try {
        const session = await getSession();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { projectId } = await params;

        // Get project to find sandbox ID
        const project = await prisma.project.findFirst({
            where: {
                id: projectId,
                userId: session.user.id,
            },
            select: {
                sandboxId: true,
            },
        });

        if (!project?.sandboxId) {
            return NextResponse.json({
                healthy: false,
                status: "inactive",
                message: "No sandbox found"
            });
        }

        // Try to connect to check if sandbox is running
        try {
            const { Sandbox } = await import("e2b");
            await Sandbox.connect(project.sandboxId);

            return NextResponse.json({
                healthy: true,
                status: "running",
                sandboxId: project.sandboxId,
            });
        } catch (error) {
            return NextResponse.json({
                healthy: false,
                status: "paused",
                sandboxId: project.sandboxId,
                message: "Sandbox is paused"
            });
        }
    } catch (error) {
        console.error("Health check error:", error);
        return NextResponse.json(
            { healthy: false, error: "Health check failed" },
            { status: 500 }
        );
    }
}
