import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Sandbox } from "@e2b/code-interpreter";
import { getTemplateAlias } from "@/lib/e2b/template";

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

// Export for use by AI tools
export const activeSandboxes = global.activeSandboxes;

// Export the type for use in tools.ts
export type SandboxData = {
    sandbox: Sandbox;
    lastAccessed: Date;
    devServerPid?: number;
};

// Helper to extract dependencies from package.json content
function extractDependencies(packageJsonContent: string): string[] {
    try {
        const pkg = JSON.parse(packageJsonContent);
        const deps = [
            ...Object.keys(pkg.dependencies || {}),
            ...Object.keys(pkg.devDependencies || {})
        ];
        return deps;
    } catch (error) {
        console.error("Failed to parse package.json:", error);
        return [];
    }
}

// Helper function to install dependencies in a sandbox
async function installDependencies(
    sandbox: Sandbox,
    packages: string[]
): Promise<{ success: boolean; output: string; error?: string }> {
    if (!packages || packages.length === 0) {
        return { success: true, output: "" };
    }

    // Validate package names
    const validPackages = packages.filter((pkg) => {
        if (typeof pkg !== "string") return false;
        // Basic validation for npm package names
        const validPattern = /^(@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/i;
        return validPattern.test(pkg) && pkg.length <= 214;
    });

    if (validPackages.length === 0) {
        return { success: false, output: "", error: "No valid package names provided" };
    }

    console.log(`📦 Installing ${validPackages.length} package(s): ${validPackages.join(", ")}`);

    try {
        // Use commands.run() instead of runCode() for shell commands
        // This is the correct method for running bash commands in E2B sandboxes
        const installCommand = `cd /home/user/project && npm install ${validPackages.join(" ")}`;

        const result = await sandbox.commands.run(installCommand);

        // Check if installation was successful (exit code 0)
        const success = result.exitCode === 0;

        if (success) {
            console.log(`✅ Successfully installed: ${validPackages.join(", ")}`);
        } else {
            console.error(`❌ Installation failed:`, result.stderr || result.stdout);
        }

        return {
            success,
            output: result.stdout || "",
            error: result.exitCode !== 0 ? (result.stderr || "Installation failed") : undefined,
        };
    } catch (error) {
        console.error("Error installing packages:", error);
        return {
            success: false,
            output: "",
            error: error instanceof Error ? error.message : "Failed to install packages",
        };
    }
}

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

                // Check if package.json is being updated
                let needsDependencyInstall = false;
                let dependenciesToInstall: string[] = [];

                if (files["package.json"]) {
                    const deps = extractDependencies(files["package.json"] as string);
                    if (deps.length > 0) {
                        needsDependencyInstall = true;
                        dependenciesToInstall = deps;
                        console.log(`📦 Detected ${deps.length} dependencies in package.json`);
                    }
                }

                try {
                    // OPTIMIZATION: Write all files in parallel (much faster than sequential)
                    await Promise.all(
                        Object.entries(files).map(async ([filePath, content]) => {
                            // Remove leading slash if present and ensure proper path
                            const cleanPath = filePath.startsWith("/") ? filePath.slice(1) : filePath;
                            const normalizedPath = `/home/user/project/${cleanPath}`;

                            await sandboxData!.sandbox.files.write(normalizedPath, content as string);
                        })
                    );

                    console.log(`✅ Files updated successfully in parallel`);

                    // If package.json was updated with dependencies, install them
                    if (needsDependencyInstall && dependenciesToInstall.length > 0) {
                        console.log(`🔄 Installing dependencies...`);
                        const installResult = await installDependencies(sandboxData.sandbox, dependenciesToInstall);
                        if (installResult.success) {
                            console.log(`✅ Dependencies installed successfully`);

                            // Kill old dev server if it exists
                            if (sandboxData.devServerPid) {
                                try {
                                    await sandboxData.sandbox.commands.run(`kill ${sandboxData.devServerPid}`);
                                    console.log(`🔄 Killed old dev server (PID: ${sandboxData.devServerPid})`);
                                } catch (error) {
                                    console.warn(`⚠️ Could not kill old dev server:`, error);
                                }
                            }

                            // Restart dev server after dependency install
                            console.log(`🚀 Restarting dev server after dependency install...`);
                            const devProcess = await sandboxData.sandbox.commands.run(
                                "cd /home/user/project && npm run dev -- -H 0.0.0.0 -p 3000",
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
                            sandboxData.devServerPid = devProcess.pid;
                            console.log(`✅ Dev server restarted with PID: ${devProcess.pid || 'N/A'}`);
                        } else {
                            console.warn(`⚠️ Failed to install dependencies: ${installResult.error}`);
                        }
                    } else {
                        // Files updated, Next.js hot reload should pick up changes automatically
                        console.log("✅ Files updated, Next.js will hot-reload automatically");
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

        // Use our pre-built Next.js template (Build System 2.0)
        // This template has all dependencies pre-installed and dev server pre-running
        // Sandboxes spawn in ~150ms with Next.js already hot-reloading
        const templateAlias = getTemplateAlias();
        console.log(`📦 Using template: ${templateAlias}`);

        const sandboxOpts = {
            template: templateAlias, // Use our pre-built template
            metadata: { projectId, userId: session.user.email },
            timeoutMs: 15 * 60 * 1000, // 15 minutes for better UX (can extend if needed)
        };

        // Create sandbox from template - dev server is ALREADY RUNNING!
        const sandbox = await Sandbox.create(sandboxOpts);

        console.log(`✅ Sandbox created: ${sandbox.sandboxId} (Build System 2.0 🚀)`);
        console.log(`✅ Next.js dev server already running, dependencies pre-installed`);

        // Prepare project files
        // Priority: Files from database (template + AI edits) > Default fallback
        const projectFiles = files && Object.keys(files).length > 0
            ? files
            : {};

        // If project has files from database, write them to sandbox
        if (Object.keys(projectFiles).length === 0) {
            console.log(`📝 No custom files - using template defaults`);
            // Store sandbox info and return - template has default files
            activeSandboxes.set(projectId, {
                sandbox,
                lastAccessed: new Date(),
            });

            return NextResponse.json({
                sandboxId: projectId,
                url: `https://${sandbox.getHost(3000)}`,
                status: "created",
                message: "Sandbox created with default Next.js template",
            });
        }

        // Write all files to sandbox filesystem
        console.log(`📝 Writing ${Object.keys(projectFiles).length} files...`);

        // OPTIMIZATION: Write files in parallel instead of sequentially (80%+ faster)
        // Reference: https://e2b.dev/docs/filesystem/read-write
        await Promise.all(
            Object.entries(projectFiles).map(async ([filePath, content]) => {
                // Build System 2.0: Files are relative to /home/user/project
                // Remove leading slash if present and ensure proper path
                const cleanPath = filePath.startsWith("/") ? filePath.slice(1) : filePath;
                const normalizedPath = `/home/user/project/${cleanPath}`;

                await sandbox.files.write(normalizedPath, content as string);
            })
        );

        console.log(`✅ All files written in parallel`);

        // Check if new dependencies were added to package.json
        if (projectFiles["package.json"]) {
            const deps = extractDependencies(projectFiles["package.json"] as string);
            // Only install if there are additional dependencies beyond the template
            // Template already has: react, react-dom, next, typescript, tailwindcss, etc.
            const templateDeps = ["react", "react-dom", "next", "typescript", "@types/node", "@types/react", "@types/react-dom", "@tailwindcss/postcss", "tailwindcss", "autoprefixer", "postcss"];
            const newDeps = deps.filter(dep => !templateDeps.includes(dep));

            if (newDeps.length > 0) {
                console.log(`📦 Installing ${newDeps.length} new dependencies: ${newDeps.join(", ")}`);
                const installResult = await installDependencies(sandbox, newDeps);
                if (installResult.success) {
                    console.log(`✅ New dependencies installed successfully`);
                } else {
                    console.warn(`⚠️ Failed to install new dependencies: ${installResult.error}`);
                }
            } else {
                console.log(`✅ All dependencies already pre-installed in template`);
            }
        }

        try {
            // Start Next.js dev server manually
            // Note: Template's setStartCmd may not be working, so we start it explicitly
            console.log("🚀 Starting Next.js dev server manually...");

            const startCommand = "cd /home/user/project && npm run dev -- -H 0.0.0.0 -p 3000";
            const devProcess = await sandbox.commands.run(startCommand, {
                background: true, // Run in background so it doesn't block
                envs: {
                    NODE_ENV: "development",
                    PORT: "3000",
                    HOSTNAME: "0.0.0.0",
                    NEXT_TELEMETRY_DISABLED: "1",
                },
            });

            console.log(`✅ Dev server started with PID: ${devProcess.pid || 'N/A'}`);

            // Wait a moment for the server to start binding to the port
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Store sandbox reference with dev server info
            activeSandboxes.set(projectId, {
                sandbox,
                lastAccessed: new Date(),
                devServerPid: devProcess.pid,
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
