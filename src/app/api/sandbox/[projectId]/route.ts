import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Sandbox } from "@e2b/code-interpreter";

// Store active sandboxes in global state (in production, use Redis)
declare global {
    var activeSandboxes: Map<string, {
        sandbox: Sandbox;
        lastAccessed: Date;
        devServerPid?: number;
    }>;
}

if (!global.activeSandboxes) {
    global.activeSandboxes = new Map();
}

const activeSandboxes = global.activeSandboxes;

// 💰 COST OPTIMIZATION: Aggressively cleanup inactive sandboxes
// E2B charges $0.000028/second for 2 vCPUs = $0.10/hour = $2.40/day
// Goal: Close sandboxes within 3 minutes of inactivity to minimize costs
const SANDBOX_TIMEOUT = 3 * 60 * 1000; // 3 minutes (reduced from 15 min)

setInterval(() => {
    const now = new Date();
    let cleanedCount = 0;

    for (const [projectId, { sandbox, lastAccessed }] of activeSandboxes) {
        const idleTime = now.getTime() - lastAccessed.getTime();

        if (idleTime > SANDBOX_TIMEOUT) {
            sandbox.kill().catch((error) => {
                console.warn(`⚠️  Error closing sandbox ${projectId}:`, error.message);
            });
            activeSandboxes.delete(projectId);
            cleanedCount++;
            console.log(`💰 Cost-saving: Closed idle sandbox ${projectId} (idle: ${Math.round(idleTime / 1000)}s)`);
        }
    }

    if (cleanedCount > 0) {
        console.log(`💰 Cleanup: ${cleanedCount} sandbox(es) closed, ${activeSandboxes.size} active (saved ~$${(cleanedCount * 0.10).toFixed(2)}/hr)`);
    }
}, 60 * 1000); // Check every 1 minute (increased frequency for faster cleanup)

/**
 * POST /api/sandbox/[projectId]
 * Create or reuse sandbox for a project
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ projectId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { projectId } = await params;

        // Verify project ownership and get project data with files
        const project = await prisma.project.findFirst({
            where: {
                id: projectId,
                user: {
                    email: session.user.email,
                },
            },
            select: {
                id: true,
                codeFiles: true,
            },
        });

        if (!project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        // Get files from request body or use files from database
        const { files: requestFiles } = await request.json();

        // Priority: request files > database files
        const files = requestFiles && Object.keys(requestFiles).length > 0
            ? requestFiles
            : (project.codeFiles as Record<string, string> || {});

        console.log(`📦 Project ${projectId}: ${Object.keys(files).length} files`);

        // Check if sandbox already exists
        let sandboxData = activeSandboxes.get(projectId);

        if (sandboxData) {
            // Reuse existing sandbox
            sandboxData.lastAccessed = new Date();

            // If files are provided, update them in the sandbox
            if (files && Object.keys(files).length > 0) {
                console.log(`🔄 Updating ${Object.keys(files).length} files in sandbox`);

                try {
                    const fileEntries = Object.entries(files);

                    // Write all files to the sandbox using filesystem API
                    for (const [filePath, content] of fileEntries) {
                        const normalizedPath = filePath.startsWith("/")
                            ? `/home/user${filePath}`
                            : `/home/user/${filePath}`;

                        await sandboxData.sandbox.files.write(normalizedPath, content as string);
                    }

                    console.log(`✅ Files updated successfully`);

                    // Check if package.json was updated (dependencies changed)
                    const packageJsonUpdated = "package.json" in files;

                    if (packageJsonUpdated) {
                        console.log("📦 package.json updated, reinstalling dependencies...");

                        // Use commands.run() for shell commands (E2B best practice)
                        const installCmd = await sandboxData.sandbox.commands.run(
                            'cd /home/user && npm install --legacy-peer-deps',
                            { timeoutMs: 120000 }
                        );

                        if (installCmd.exitCode === 0) {
                            console.log("✅ Dependencies reinstalled");

                            // Restart dev server
                            if (sandboxData.devServerPid) {
                                await sandboxData.sandbox.commands.run(
                                    `kill ${sandboxData.devServerPid}`
                                ).catch(() => { });
                            }

                            // Start new dev server - listen on 0.0.0.0 for E2B access
                            const devCmd = await sandboxData.sandbox.commands.run(
                                'cd /home/user && npx next dev -H 0.0.0.0 -p 3000 > /tmp/nextjs.log 2>&1 &',
                                { background: true }
                            );

                            sandboxData.devServerPid = devCmd.pid;
                            console.log(`🚀 Dev server restarted on 0.0.0.0:3000 (PID: ${devCmd.pid})`);
                        }
                    } else {
                        // For non-dependency updates, verify dev server is still running
                        console.log("🔍 Verifying dev server health...");
                        const healthCheck = await sandboxData.sandbox.commands.run(
                            'curl -s http://0.0.0.0:3000 > /dev/null && echo "healthy" || echo "down"',
                            { timeoutMs: 5000 }
                        );

                        if (healthCheck.stdout.includes('down')) {
                            console.warn("⚠️  Dev server appears down, restarting...");

                            // Kill old process if exists
                            if (sandboxData.devServerPid) {
                                await sandboxData.sandbox.commands.run(
                                    `kill ${sandboxData.devServerPid}`
                                ).catch(() => { });
                            }

                            // Restart dev server - CRITICAL: Use -H 0.0.0.0 for network access
                            const devCmd = await sandboxData.sandbox.commands.run(
                                'cd /home/user && npx next dev -H 0.0.0.0 -p 3000 > /tmp/nextjs.log 2>&1 &',
                                { background: true }
                            );

                            sandboxData.devServerPid = devCmd.pid;
                            console.log(`🚀 Dev server restarted on 0.0.0.0:3000 (PID: ${devCmd.pid})`);
                        } else {
                            console.log("✅ Dev server is healthy, Next.js will hot-reload automatically");
                        }
                    }

                } catch (error: unknown) {
                    console.error("Error updating files:", error);

                    // Check if it's a timeout error (sandbox no longer exists)
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    if (errorMessage.includes('not found') || errorMessage.includes('timeout')) {
                        console.warn("⚠️ Sandbox timed out or not found, removing from cache and recreating...");
                        activeSandboxes.delete(projectId);
                        sandboxData = undefined; // Force recreation below
                    } else {
                        // Other error, but still return the sandbox info
                        return NextResponse.json({
                            sandboxId: projectId,
                            url: `https://${sandboxData.sandbox.getHost(3000)}`,
                            status: "running",
                            filesUpdated: false,
                            error: "Failed to update files",
                        });
                    }
                }
            }

            // If we still have sandboxData at this point, return success
            if (sandboxData) {
                return NextResponse.json({
                    sandboxId: projectId,
                    url: `https://${sandboxData.sandbox.getHost(3000)}`,
                    status: "running",
                    filesUpdated: files && Object.keys(files).length > 0,
                });
            }
        }

        // Create new sandbox (either first time or after timeout)

        // Create new sandbox
        console.log(`🚀 Creating NEW sandbox for project: ${projectId}`);

        const sandbox = await Sandbox.create({
            metadata: { projectId, userId: session.user.email },
            timeoutMs: 5 * 60 * 1000, // 💰 5 minutes E2B timeout (cost optimization)
        });

        console.log(`✅ Sandbox created: ${sandbox.sandboxId}`);

        // Prepare project files
        // Priority: Files from database (template + AI edits) > Default fallback
        const projectFiles = files && Object.keys(files).length > 0
            ? files
            : {};

        if (Object.keys(projectFiles).length === 0) {
            console.warn(`⚠️ No files found for project ${projectId}. Sandbox may not start correctly.`);
            return NextResponse.json(
                { error: "No project files available. Please generate files first using the AI chat." },
                { status: 400 }
            );
        }

        // Write all files to sandbox filesystem
        console.log(`📝 Writing ${Object.keys(projectFiles).length} files...`);
        for (const [filePath, content] of Object.entries(projectFiles)) {
            const normalizedPath = filePath.startsWith("/")
                ? `/home/user${filePath}`
                : `/home/user/${filePath}`;

            await sandbox.files.write(normalizedPath, content as string);
        }

        console.log(`✅ All files written`);

        try {
            // Install dependencies using commands.run() (E2B best practice)
            console.log("📦 Installing dependencies...");

            const installCmd = await sandbox.commands.run(
                'cd /home/user && npm install --legacy-peer-deps',
                {
                    timeoutMs: 120000,
                }
            );

            if (installCmd.exitCode !== 0) {
                console.error("❌ npm install failed:", installCmd.stderr);
                throw new Error(`npm install failed with exit code ${installCmd.exitCode}`);
            }

            console.log("✅ Dependencies installed");

            // Start Next.js dev server using commands.run() in background
            // IMPORTANT: Use -H 0.0.0.0 to listen on all interfaces (required for E2B sandbox access)
            console.log("🚀 Starting Next.js dev server on 0.0.0.0:3000...");

            const devServerCmd = await sandbox.commands.run(
                'cd /home/user && npx next dev -H 0.0.0.0 -p 3000 > /tmp/nextjs.log 2>&1 &',
                { background: true }
            );

            const devServerPid = devServerCmd.pid;
            console.log(`📝 Dev server starting (PID: ${devServerPid})`);

            // Wait for Next.js to compile
            console.log("⏳ Waiting for compilation (15-20s)...");
            await new Promise(resolve => setTimeout(resolve, 20000));

            // Verify server is running - check logs for "Ready" message
            console.log("🔍 Verifying server...");
            const logsCmd = await sandbox.commands.run('tail -30 /tmp/nextjs.log');
            console.log("📋 Server logs:", logsCmd.stdout);

            if (logsCmd.stdout.includes('Ready in') || logsCmd.stdout.includes('✓ Ready')) {
                console.log("✅ Next.js server is ready and compiled!");
            } else {
                console.warn("⚠️  Server may still be starting...");
            }

            // Also check if port is listening
            const portCheck = await sandbox.commands.run(
                'netstat -tuln | grep :3000 || lsof -i :3000 || echo "Checking..."',
                { timeoutMs: 5000 }
            );
            if (portCheck.stdout.includes('3000')) {
                console.log("✅ Port 3000 is listening");
            }

            // Store sandbox reference with dev server PID
            activeSandboxes.set(projectId, {
                sandbox,
                lastAccessed: new Date(),
                devServerPid,
            });

            console.log(`💾 Sandbox stored. Active: ${activeSandboxes.size}`);

            const sandboxUrl = `https://${sandbox.getHost(3000)}`;
            console.log(`🌐 Sandbox URL: ${sandboxUrl}`);
            console.log(`📍 Sandbox ID: ${sandbox.sandboxId}`);

            return NextResponse.json({
                sandboxId: projectId,
                url: sandboxUrl,
                status: "created",
            });

        } catch (error) {
            console.error("❌ Error setting up sandbox:", error);

            // Cleanup on failure
            await sandbox.kill().catch(() => { });

            throw error;
        }

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
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { projectId } = await params;

        // Verify project ownership
        const project = await prisma.project.findFirst({
            where: {
                id: projectId,
                user: { email: session.user.email },
            },
        });

        if (!project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        const sandboxData = activeSandboxes.get(projectId);

        if (!sandboxData) {
            return NextResponse.json(
                { status: "inactive", url: null },
                { status: 200 }
            );
        }

        // Update last accessed time
        sandboxData.lastAccessed = new Date();

        return NextResponse.json({
            sandboxId: projectId,
            url: `https://${sandboxData.sandbox.getHost(3000)}`,
            status: "running",
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
 * Stop and remove sandbox
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ projectId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { projectId } = await params;

        const sandboxData = activeSandboxes.get(projectId);

        if (sandboxData) {
            await sandboxData.sandbox.kill();
            activeSandboxes.delete(projectId);
            console.log(`🗑️  Sandbox deleted: ${projectId}`);
        }

        return NextResponse.json({ status: "closed" });
    } catch (error) {
        console.error("Error closing sandbox:", error);
        return NextResponse.json(
            { error: "Failed to close sandbox" },
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
        const sandboxData = activeSandboxes.get(projectId);

        if (!sandboxData) {
            return NextResponse.json({
                healthy: false,
                status: "inactive",
                message: "Sandbox not running"
            });
        }

        // Update last accessed time
        sandboxData.lastAccessed = new Date();
        const idleTime = Date.now() - sandboxData.lastAccessed.getTime();

        return NextResponse.json({
            healthy: true,
            status: "running",
            sandboxId: projectId,
            idleTime: Math.round(idleTime / 1000),
            timeoutIn: Math.round((SANDBOX_TIMEOUT - idleTime) / 1000),
        });
    } catch (error) {
        console.error("Health check error:", error);
        return NextResponse.json(
            { healthy: false, error: "Health check failed" },
            { status: 500 }
        );
    }
}
