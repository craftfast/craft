import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import { prisma } from "@/lib/db";
import { getOrCreateProjectSandbox } from "@/lib/e2b/sandbox-manager";
import { decryptValue } from "@/lib/crypto";

/**
 * POST /api/sandbox/[projectId]
 * Create or reuse sandbox for a project
 */
export async function POST(
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
            select: {
                id: true,
            },
        });

        if (!project) {
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

        // Check if port 3000 is responding (health check)
        try {
            const portCheck = await sandbox.commands.run(
                "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000 || echo '000'",
                { timeoutMs: 3000 }
            );
            const statusCode = portCheck.stdout?.trim() || '000';
            isServerRunning = statusCode.startsWith('2') || statusCode === '404'; // 2xx or 404 means server is responding

            if (isServerRunning) {
                console.log(`✅ Dev server is already running and responding (HTTP ${statusCode})`);

                // Force restart if environment variables changed
                if (envFileChanged) {
                    console.log("🔄 Environment variables changed - restarting server to apply changes...");
                    needsRestart = true;
                }
            } else {
                console.log(`⚠️ Port 3000 not responding (HTTP ${statusCode})`);
                needsRestart = true;
            }
        } catch (error) {
            console.log("⚠️ Could not check port 3000, assuming server needs to start");
            needsRestart = true;
        }

        // Only restart if server is not running or not responding
        if (needsRestart) {
            console.log("🔧 Cleaning up any stale processes...");
            try {
                // Use pkill to cleanly kill the process tree by name
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

                // Wait for the server to become ready (up to 30 seconds)
                console.log("⏳ Waiting for Next.js to compile and start...");
                const startTime = Date.now();
                let isReady = false;

                while (Date.now() - startTime < 30000 && !isReady) {
                    await new Promise(resolve => setTimeout(resolve, 1500));

                    try {
                        const check = await sandbox.commands.run(
                            "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000 || echo 'failed'",
                            { timeoutMs: 2000 }
                        );

                        const code = check.stdout?.trim() || '';
                        if (code !== 'failed' && /^[2-5]\d\d$/.test(code)) {
                            isReady = true;
                            const elapsed = Math.floor((Date.now() - startTime) / 1000);
                            console.log(`✅ Dev server is ready! (HTTP ${code}) - took ${elapsed}s`);
                        }
                    } catch (checkError) {
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
        console.log(`🔗 Preview URL: ${previewUrl}`);        // Verify external URL is accessible (for resumed sandboxes, port forwarding may take a moment)
        console.log("🔍 Verifying external URL accessibility...");
        let isExternallyAccessible = false;
        const maxRetries = 3;

        for (let i = 0; i < maxRetries; i++) {
            try {
                const response = await fetch(previewUrl, {
                    method: 'HEAD',
                    signal: AbortSignal.timeout(3000)
                });
                if (response.ok || response.status === 404) { // 404 is fine, means server is responding
                    isExternallyAccessible = true;
                    console.log(`✅ External URL is accessible (HTTP ${response.status})`);
                    break;
                }
            } catch (error) {
                if (i < maxRetries - 1) {
                    console.log(`⏳ External URL not ready yet (attempt ${i + 1}/${maxRetries}), retrying in 1s...`);
                    await new Promise(resolve => setTimeout(resolve, 1000));
                } else {
                    console.warn(`⚠️ External URL verification failed after ${maxRetries} attempts, but returning URL anyway`);
                }
            }
        }

        // Return sandbox info
        return NextResponse.json({
            sandboxId: sandbox.sandboxId,
            url: previewUrl,
            status: "ready",
            message: "Sandbox is ready with files from source of truth (E2B sandbox)",
        });

    } catch (error) {
        console.error("Error creating sandbox:", error);
        return NextResponse.json(
            { error: "Failed to create sandbox" },
            { status: 500 }
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
