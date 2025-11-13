import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import { prisma } from "@/lib/db";
import { getOrCreateProjectSandbox, pauseSandbox, getSandboxRegistry } from "@/lib/e2b/sandbox-manager";

// Phase 3: Use the sandbox manager's registry
// The manager handles pause/resume automatically
export const activeSandboxes = getSandboxRegistry();

// Legacy export for backward compatibility with tools.ts
export type SandboxData = {
    sandbox: unknown; // Type from e2b-sandbox-manager
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
        // Use pnpm for better peer dependency handling and faster installs
        // Set PATH to include pnpm installation location
        const installCommand = `cd /home/user/project && PATH="/home/user/.local/share/pnpm:$PATH" pnpm add ${validPackages.join(" ")}`;

        const result = await sandbox.commands.run(installCommand);

        // Check if installation was successful (exit code 0)
        const success = result.exitCode === 0;

        if (success) {
            console.log(`✅ Successfully installed: ${validPackages.join(", ")}`);
        } else {
            console.error(`❌ Installation failed (exit code ${result.exitCode}):`);
            console.error(`STDOUT:`, result.stdout);
            console.error(`STDERR:`, result.stderr);
        }

        return {
            success,
            output: result.stdout || "",
            error: result.exitCode !== 0 ? (result.stderr || result.stdout || "Installation failed") : undefined,
        };
    } catch (error) {
        console.error("Error installing packages:", error);
        // Log the full error details for debugging
        if (error && typeof error === 'object' && 'result' in error) {
            const cmdError = error as { result?: { stdout?: string; stderr?: string; exitCode?: number } };
            console.error(`Command failed with exit code ${cmdError.result?.exitCode}`);
            console.error(`STDOUT:`, cmdError.result?.stdout);
            console.error(`STDERR:`, cmdError.result?.stderr);
        }
        return {
            success: false,
            output: "",
            error: error instanceof Error ? error.message : "Failed to install packages",
        };
    }
}

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

        // Verify project ownership and get project data with files
        const project = await prisma.project.findFirst({
            where: {
                id: projectId,
                userId: session.user.id,
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
                    // OPTIMIZATION: Write files sequentially to avoid race conditions
                    // Group by directory depth to ensure parent directories exist
                    const fileEntries = Object.entries(files).map(([filePath, content]) => {
                        const cleanPath = filePath.startsWith("/") ? filePath.slice(1) : filePath;
                        const normalizedPath = `/home/user/project/${cleanPath}`;
                        const depth = cleanPath.split('/').length;
                        return { normalizedPath, content, depth };
                    });

                    // Sort by depth (shallower files first)
                    fileEntries.sort((a, b) => a.depth - b.depth);

                    // Write files sequentially
                    for (const { normalizedPath, content } of fileEntries) {
                        await sandboxData!.sandbox.files.write(normalizedPath, content as string);
                    }

                    console.log(`✅ Files updated successfully`);

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
                                "cd /home/user/project && PATH=\"/home/user/.local/share/pnpm:$PATH\" pnpm run dev",
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
        console.log(`🔍 NODE_ENV: ${process.env.NODE_ENV}`);

        const sandboxOpts = {
            metadata: { projectId, userId: session.user.id },
            timeoutMs: 15 * 60 * 1000, // 15 minutes for better UX (can extend if needed)
        };

        console.log(`🔍 Creating sandbox with template: ${templateAlias}`);
        console.log(`🔍 Sandbox options:`, JSON.stringify(sandboxOpts, null, 2));

        // Create sandbox from template - dev server is ALREADY RUNNING!
        // Note: Template must be passed as FIRST argument, not in opts
        const sandbox = await Sandbox.create(templateAlias, sandboxOpts);

        console.log(`🔍 Sandbox created - ID: ${sandbox.sandboxId}`);

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
        // Note: Group by directory depth to avoid race conditions when creating nested directories
        const fileEntries = Object.entries(projectFiles).map(([filePath, content]) => {
            const cleanPath = filePath.startsWith("/") ? filePath.slice(1) : filePath;
            const normalizedPath = `/home/user/project/${cleanPath}`;
            const depth = cleanPath.split('/').length;
            return { normalizedPath, content, depth };
        });

        // Sort by depth (shallower files first) to ensure parent directories exist
        fileEntries.sort((a, b) => a.depth - b.depth);

        // Write files sequentially to avoid race conditions with directory creation
        for (const { normalizedPath, content } of fileEntries) {
            try {
                await sandbox.files.write(normalizedPath, content as string);
            } catch (error: unknown) {
                const err = error as Error;
                console.error(`Failed to write file ${normalizedPath}:`, err.message);
                throw error;
            }
        }

        console.log(`✅ All files written in parallel`);

        // Check if new dependencies were added to package.json
        if (projectFiles["package.json"]) {
            const deps = extractDependencies(projectFiles["package.json"] as string);

            // Validate Tailwind CSS version (must be v4 for E2B template compatibility)
            try {
                const pkg = JSON.parse(projectFiles["package.json"] as string);
                const tailwindVersion = pkg.devDependencies?.tailwindcss || pkg.dependencies?.tailwindcss;

                if (tailwindVersion && !tailwindVersion.includes("^4") && !tailwindVersion.includes("4.")) {
                    console.warn(`⚠️ WARNING: package.json specifies Tailwind CSS ${tailwindVersion}, but E2B template has v4 pre-installed.`);
                    console.warn(`   This may cause build errors. The AI should use "tailwindcss": "^4" and "@tailwindcss/postcss": "^4"`);
                }

                // Check for @tailwindcss/postcss (required for v4)
                const hasPostcssPlugin = pkg.devDependencies?.["@tailwindcss/postcss"] || pkg.dependencies?.["@tailwindcss/postcss"];
                if (!hasPostcssPlugin && tailwindVersion) {
                    console.warn(`⚠️ WARNING: package.json missing "@tailwindcss/postcss" which is required for Tailwind CSS v4`);
                }
            } catch (error) {
                console.error("Failed to validate Tailwind CSS version:", error);
            }

            // E2B template pre-installed dependencies (from src/lib/e2b/template.ts)
            // These are already installed in the sandbox and don't need reinstallation
            const templateDeps = [
                // Dependencies
                "react",
                "react-dom",
                "next",
                // DevDependencies
                "typescript",
                "@types/node",
                "@types/react",
                "@types/react-dom",
                "@tailwindcss/postcss", // Tailwind CSS v4
                "tailwindcss",          // Tailwind CSS v4
                "autoprefixer",
                "postcss"
            ];

            // Filter out template dependencies to find new packages
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
            // The template's setStartCmd already started the dev server with waitForPort(3000)
            // However, we need to verify it's running and restart if needed
            console.log("🔍 Checking if dev server is running...");

            // First, check if the dev server process is actually running
            let processCheck;
            try {
                processCheck = await sandbox.commands.run(
                    "pgrep -f 'next dev' || echo 'not_running'",
                    { timeoutMs: 2000 }
                );
            } catch (error) {
                console.warn("⚠️ Process check failed:", error);
                processCheck = { stdout: 'not_running' };
            }

            const isProcessRunning = processCheck.stdout?.trim() &&
                processCheck.stdout.trim() !== 'not_running' &&
                /^\d+$/.test(processCheck.stdout.trim());

            if (isProcessRunning) {
                console.log(`✅ Dev server process found (PID: ${processCheck.stdout.trim()})`);

                // Verify it's actually responsive on port 3000
                console.log("🔍 Verifying port 3000 is accessible...");
                let portReady = false;
                const quickCheck = await sandbox.commands.run(
                    "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000 || echo 'failed'",
                    { timeoutMs: 3000 }
                ).catch(() => ({ stdout: 'failed' }));

                const httpCode = quickCheck.stdout?.trim() || '';
                portReady = httpCode !== 'failed' && /^[2-5]\d\d$/.test(httpCode);

                if (portReady) {
                    console.log(`✅ Dev server is ready and responsive! (HTTP ${httpCode})`);
                } else {
                    console.log(`⏳ Dev server process exists but not ready yet, waiting...`);
                    // Wait up to 10 seconds for the existing process to become ready
                    const startTime = Date.now();
                    while (Date.now() - startTime < 10000 && !portReady) {
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        const check = await sandbox.commands.run(
                            "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000 || echo 'failed'",
                            { timeoutMs: 2000 }
                        ).catch(() => ({ stdout: 'failed' }));
                        const code = check.stdout?.trim() || '';
                        if (code !== 'failed' && /^[2-5]\d\d$/.test(code)) {
                            portReady = true;
                            console.log(`✅ Dev server became ready! (HTTP ${code})`);
                        }
                    }
                }
            } else {
                console.log("⚠️ Dev server process not found - starting manually...");

                // Start the dev server
                try {
                    const devProcess = await sandbox.commands.run(
                        "cd /home/user/project && PATH=\"/home/user/.local/share/pnpm:$PATH\" pnpm run dev",
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
                    console.log(`🚀 Started dev server (PID: ${devProcess.pid || 'unknown'})`);

                    // Wait for the server to become ready (up to 20 seconds)
                    console.log("⏳ Waiting for Next.js to compile and start...");
                    const startTime = Date.now();
                    let isReady = false;

                    while (Date.now() - startTime < 20000 && !isReady) {
                        await new Promise(resolve => setTimeout(resolve, 1500));

                        const check = await sandbox.commands.run(
                            "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000 || echo 'failed'",
                            { timeoutMs: 2000 }
                        ).catch(() => ({ stdout: 'failed' }));

                        const code = check.stdout?.trim() || '';
                        if (code !== 'failed' && /^[2-5]\d\d$/.test(code)) {
                            isReady = true;
                            console.log(`✅ Dev server is ready! (HTTP ${code}) - took ${Math.floor((Date.now() - startTime) / 1000)}s`);
                        } else {
                            const elapsed = Math.floor((Date.now() - startTime) / 1000);
                            console.log(`⏳ Still waiting for dev server... (${elapsed}s)`);
                        }
                    }

                    if (!isReady) {
                        console.warn(`⚠️ Dev server may not be fully ready yet, but continuing...`);

                        // Log diagnostics to help debug
                        try {
                            const psResult = await sandbox.commands.run("ps aux | grep -E 'node|npm|next'", { timeoutMs: 2000 });
                            console.log("📊 Running processes:", psResult.stdout);

                            const portResult = await sandbox.commands.run("netstat -tuln | grep 3000", { timeoutMs: 2000 });
                            console.log("🔌 Port 3000 status:", portResult.stdout || "Not listening");
                        } catch (diagError) {
                            console.warn("⚠️ Could not get diagnostics:", diagError);
                        }
                    }
                } catch (startError) {
                    console.error(`❌ Failed to start dev server:`, startError);
                    throw startError;
                }
            }

            // Store sandbox reference
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
        const session = await getSession();

        if (!session?.user?.id) {
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
