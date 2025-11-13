import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import { prisma } from "@/lib/db";
import { getOrCreateProjectSandbox } from "@/lib/e2b/sandbox-manager";

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
        let hasExistingProcess = false;

        // First, check if there's a Next.js process (from resumed sandbox)
        try {
            const processCheck = await sandbox.commands.run(
                "ps aux | grep -E 'next dev|next-server' | grep -v grep | wc -l",
                { timeoutMs: 2000 }
            );
            const processCount = parseInt(processCheck.stdout?.trim() || '0');
            hasExistingProcess = processCount > 0;
            
            if (hasExistingProcess) {
                console.log(`📦 Found ${processCount} existing Next.js process(es) - likely from resumed sandbox`);
            }
        } catch (error) {
            console.log("⚠️ Could not check for existing processes");
        }

        // Try internal port check
        try {
            const portCheck = await sandbox.commands.run(
                "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000 || echo 'failed'",
                { timeoutMs: 3000 }
            );
            const httpCode = portCheck.stdout?.trim() || '';
            isServerRunning = httpCode !== 'failed' && /^[2-5]\d\d$/.test(httpCode);

            if (isServerRunning) {
                console.log(`✅ Dev server is responding internally on port 3000 (HTTP ${httpCode})`);
                
                // Server is responding internally, but is it accessible externally?
                // Try to trigger port forwarding by making an external request
                if (hasExistingProcess) {
                    console.log("🔄 Existing process found - attempting to reconnect port forwarding...");
                    
                    // Get the URL and try to access it to trigger port forwarding
                    const previewUrl = `https://${sandbox.getHost(3000)}`;
                    try {
                        const externalCheck = await fetch(previewUrl, {
                            method: 'HEAD',
                            signal: AbortSignal.timeout(5000)
                        });
                        if (externalCheck.ok || externalCheck.status === 404) {
                            console.log(`✅ Port forwarding active - reusing existing process (no restart needed!)`);
                            // Exit early - no need to restart!
                            isServerRunning = true;
                        } else {
                            console.log(`⚠️ Port forwarding not working (HTTP ${externalCheck.status}), will restart`);
                            needsRestart = true;
                        }
                    } catch (externalError) {
                        console.log(`⚠️ External access failed, port forwarding may need reset - will restart process`);
                        needsRestart = true;
                    }
                }
            } else if (hasExistingProcess) {
                // Process exists but not responding - it's a zombie
                console.log("⚠️ Process exists but not responding - will kill and restart");
                needsRestart = true;
            }
        } catch (error) {
            console.log("⚠️ Port check failed");
            if (hasExistingProcess) {
                needsRestart = true;
            }
        }

        // Kill zombies if needed
        if (needsRestart) {
            console.log("🔧 Killing stale processes...");
            try {
                const pidsResult = await sandbox.commands.run(
                    "ps aux | grep -E 'next dev|next-server' | grep -v grep | awk '{print $2}'",
                    { timeoutMs: 2000 }
                );
                const pids = pidsResult.stdout?.trim();
                if (pids) {
                    console.log(`🔧 Killing PIDs: ${pids.split('\n').join(', ')}`);
                    await sandbox.commands.run(`kill -9 ${pids.split('\n').join(' ')}`, { timeoutMs: 2000 });
                    await new Promise(resolve => setTimeout(resolve, 500)); // Wait for cleanup
                    console.log("✅ Stale processes killed");
                }
            } catch (killError) {
                console.log("⚠️ Could not kill processes, will try to start anyway");
            }
        }

        // Start dev server if not running or needs restart
        if (!isServerRunning || needsRestart) {
            console.log("🚀 Starting Next.js dev server...");

            try {
                // Start the dev server in the background with full PATH to pnpm
                // pnpm is installed at /home/user/.local/share/pnpm in the E2B template
                // Use next dev directly with proper flags for external access
                const devProcess = await sandbox.commands.run(
                    "cd /home/user/project && /home/user/.local/share/pnpm/pnpm exec next dev -H 0.0.0.0 -p 3000",
                    {
                        background: true,
                        envs: {
                            NODE_ENV: "development",
                            PORT: "3000",
                            HOSTNAME: "0.0.0.0",
                            NEXT_TELEMETRY_DISABLED: "1",
                            PATH: "/home/user/.local/share/pnpm:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin",
                        },
                    }
                );
                console.log(`✅ Dev server started with 'next dev -H 0.0.0.0 -p 3000' (PID: ${devProcess.pid || 'unknown'})`);

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
        console.log(`🔗 Preview URL: ${previewUrl}`);

        // Verify external URL is accessible (for resumed sandboxes, port forwarding may take a moment)
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
