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
// With 4 vCPUs (for better UX): $0.20/hour = $4.80/day
// Goal: Close sandboxes within 5 minutes of inactivity for better balance
const SANDBOX_TIMEOUT = 5 * 60 * 1000; // 5 minutes (balance between UX and cost)

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
                    // OPTIMIZATION: Write all files in parallel (much faster than sequential)
                    await Promise.all(
                        Object.entries(files).map(async ([filePath, content]) => {
                            const normalizedPath = filePath.startsWith("/")
                                ? `/home/user/project${filePath.startsWith("/") ? filePath : `/${filePath}`}`
                                : `/home/user/project/${filePath}`;

                            await sandboxData!.sandbox.files.write(normalizedPath, content as string);
                        })
                    );

                    console.log(`✅ Files updated successfully in parallel`);

                    // Build System 2.0: Dev server is always running from template
                    // Hot reload will automatically pick up file changes
                    // No need to restart the dev server or reinstall dependencies
                    console.log("✅ Next.js will hot-reload automatically (Build System 2.0)");

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

        // Build System 2.0: Use template alias instead of template ID
        // Templates are now defined as code (see src/lib/e2b/template.ts)
        // This provides 14× faster builds and AI-friendly configuration
        // Reference: https://e2b.dev/docs/template/quickstart
        const templateAlias = process.env.NODE_ENV === "development"
            ? "craft-nextjs-dev"
            : "craft-nextjs";

        const sandboxOpts = {
            metadata: { projectId, userId: session.user.email },
            timeoutMs: 15 * 60 * 1000, // 15 minutes for better UX (can extend if needed)
            // Note: CPU/RAM configured in template definition (src/lib/e2b/template.ts)
        };

        // Always use template for instant startup (~150ms)
        // Template has Next.js dev server already running
        const sandbox = await Sandbox.create(templateAlias, sandboxOpts);

        console.log(`✅ Sandbox created: ${sandbox.sandboxId} (Build System 2.0 🚀)`);

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

        // OPTIMIZATION: Write files in parallel instead of sequentially (80%+ faster)
        // Reference: https://e2b.dev/docs/filesystem/read-write
        await Promise.all(
            Object.entries(projectFiles).map(async ([filePath, content]) => {
                // Build System 2.0: Use /home/user/project as workdir (set in template)
                const normalizedPath = filePath.startsWith("/")
                    ? `/home/user/project${filePath}`
                    : `/home/user/project/${filePath}`;

                await sandbox.files.write(normalizedPath, content as string);
            })
        );

        console.log(`✅ All files written in parallel`);

        try {
            // Build System 2.0: Dev server is ALREADY RUNNING from template's setStartCmd!
            // The template was snapshotted with Next.js dev server running on port 3000
            // Dependencies are pre-installed, hot reload will pick up new files automatically
            console.log("✅ Build System 2.0: Dependencies pre-installed, dev server running, files will hot-reload 🚀");

            // Store sandbox reference (no dev server PID needed, it's from the template)
            activeSandboxes.set(projectId, {
                sandbox,
                lastAccessed: new Date(),
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
