import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import { prisma } from "@/lib/db";
import { getOrCreateProjectSandbox, pauseSandbox, getSandboxRegistry, keepSandboxAlive } from "@/lib/e2b/sandbox-manager";

// Phase 3: Use the sandbox manager's registry
// The manager handles pause/resume automatically
export const activeSandboxes = getSandboxRegistry();

// Legacy export for backward compatibility with tools.ts
export type SandboxData = {
    sandbox: unknown; // Type from e2b-sandbox-manager
    lastAccessed: Date;
    devServerPid?: number;
};

// Phase 3: Cleanup is now handled by sandbox-manager.ts
// The manager automatically pauses sandboxes after 5 min and kills after 30 min
// No manual cleanup needed here - it's centralized in the manager

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
            timeoutMs: 15 * 60 * 1000, // 15 minutes for better UX
        };

        // Use sandbox manager - will resume paused sandbox if exists, or create new one
        const sandboxInfo = await getOrCreateProjectSandbox(projectId, sandboxOpts);
        const sandbox = sandboxInfo.sandbox;

        console.log(`✅ Sandbox ready: ${sandbox.sandboxId} (${sandboxInfo.isPaused ? 'resumed from paused state' : 'newly created'})`);

        // Keep sandbox alive for 15 minutes to ensure it doesn't timeout during operations
        await keepSandboxAlive(sandbox.sandboxId, 15 * 60 * 1000);

        // Update last accessed time
        sandboxInfo.lastAccessed = new Date();

        // ⚡ OPTIMIZATION: Sandbox is source of truth!
        // Files are already in the sandbox (from E2B template or previous AI edits)
        // We do NOT inject files from database - that would overwrite sandbox state
        // AI uses generateFiles to write to sandbox, then syncFilesToDB to persist
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
        try {
            const portCheck = await sandbox.commands.run(
                "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000 || echo 'failed'",
                { timeoutMs: 2000 }
            );
            const httpCode = portCheck.stdout?.trim() || '';
            isServerRunning = httpCode !== 'failed' && /^[2-5]\d\d$/.test(httpCode);

            if (isServerRunning) {
                console.log(`✅ Dev server is already running on port 3000 (HTTP ${httpCode})`);
            }
        } catch (error) {
            console.log("⚠️ Port check failed, will start dev server");
        }

        // Start dev server if not running
        if (!isServerRunning) {
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

        // Return sandbox info
        return NextResponse.json({
            sandboxId: sandbox.sandboxId,
            url: `https://${sandbox.getHost(3000)}`,
            status: sandboxInfo.isPaused ? "resumed" : "created",
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

        // Check if sandbox exists in registry
        const sandboxRegistry = getSandboxRegistry();
        let sandboxInfo;

        for (const [sandboxId, info] of sandboxRegistry.entries()) {
            if (info.projectId === projectId) {
                sandboxInfo = info;
                break;
            }
        }

        if (!sandboxInfo) {
            return NextResponse.json(
                { status: "inactive", url: null },
                { status: 200 }
            );
        }

        // Update last accessed time
        sandboxInfo.lastAccessed = new Date();

        return NextResponse.json({
            sandboxId: sandboxInfo.sandboxId,
            url: `https://${sandboxInfo.sandbox.getHost(3000)}`,
            status: sandboxInfo.isPaused ? "paused" : "running",
        });
    } catch (error) {
        console.error("Error getting sandbox:", error);
        return NextResponse.json(
            { error: "Failed to get sandbox" },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/sandbox/[projectId]
 * Pause sandbox (don't kill it - we want to reuse it later)
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ projectId: string }> }
) {
    try {
        const session = await getSession();

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { projectId } = await params;

        // Check if sandbox exists in the registry
        const projectSandboxMap = getSandboxRegistry();
        const sandboxRegistry = getSandboxRegistry();

        // Find sandbox by project ID
        let sandboxIdToDelete: string | undefined;
        for (const [sandboxId, sandboxInfo] of sandboxRegistry.entries()) {
            if (sandboxInfo.projectId === projectId) {
                sandboxIdToDelete = sandboxId;
                break;
            }
        }

        if (sandboxIdToDelete) {
            // Pause the sandbox instead of killing it (paused = FREE)
            console.log(`⏸️  Pausing sandbox for project: ${projectId}`);
            await pauseSandbox(sandboxIdToDelete);
            console.log(`✅ Sandbox paused (can be resumed later): ${sandboxIdToDelete}`);
        } else {
            console.log(`ℹ️  No active sandbox found for project: ${projectId}`);
        }

        return NextResponse.json({ status: "paused" });
    } catch (error) {
        console.error("Error pausing sandbox:", error);
        return NextResponse.json(
            { error: "Failed to pause sandbox" },
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
        const { projectId } = await params;

        // Check if sandbox exists in registry
        const sandboxRegistry = getSandboxRegistry();
        let sandboxInfo;

        for (const [sandboxId, info] of sandboxRegistry.entries()) {
            if (info.projectId === projectId) {
                sandboxInfo = info;
                break;
            }
        }

        if (!sandboxInfo) {
            return NextResponse.json({
                healthy: false,
                status: "inactive",
                message: "Sandbox not running"
            });
        }

        // Update last accessed time
        sandboxInfo.lastAccessed = new Date();
        const idleTime = Date.now() - sandboxInfo.lastAccessed.getTime();

        return NextResponse.json({
            healthy: true,
            status: sandboxInfo.isPaused ? "paused" : "running",
            sandboxId: sandboxInfo.sandboxId,
            idleTime: Math.round(idleTime / 1000),
        });
    } catch (error) {
        console.error("Health check error:", error);
        return NextResponse.json(
            { healthy: false, error: "Health check failed" },
            { status: 500 }
        );
    }
}
