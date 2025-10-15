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

// Cleanup inactive sandboxes after 15 minutes
const SANDBOX_TIMEOUT = 15 * 60 * 1000;

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
            console.log(`🧹 Closed inactive sandbox: ${projectId} (idle: ${Math.round(idleTime / 60000)}m)`);
        }
    }

    if (cleanedCount > 0) {
        console.log(`✨ Cleanup complete: ${cleanedCount} sandbox(es) closed, ${activeSandboxes.size} active`);
    }
}, 5 * 60 * 1000); // Check every 5 minutes

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
        const sandboxData = activeSandboxes.get(projectId);

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

                            // Start new dev server
                            const devCmd = await sandboxData.sandbox.commands.run(
                                'cd /home/user && npm run dev > /tmp/nextjs.log 2>&1 &',
                                { background: true }
                            );

                            sandboxData.devServerPid = devCmd.pid;
                            console.log(`🚀 Dev server restarted (PID: ${devCmd.pid})`);
                        }
                    }

                    console.log(`✨ Next.js will hot-reload automatically`);

                } catch (error) {
                    console.error("Error updating files:", error);
                }
            }

            return NextResponse.json({
                sandboxId: projectId,
                url: `https://${sandboxData.sandbox.getHost(3000)}`,
                status: "running",
                filesUpdated: files && Object.keys(files).length > 0,
            });
        }

        // Create new sandbox
        console.log(`🚀 Creating NEW sandbox for project: ${projectId}`);

        const sandbox = await Sandbox.create({
            metadata: { projectId, userId: session.user.email },
            timeoutMs: 10 * 60 * 1000, // 10 minutes (can be extended with setTimeout())
        });

        console.log(`✅ Sandbox created: ${sandbox.sandboxId}`);

        // Prepare project files
        const projectFiles = files && Object.keys(files).length > 0 ? files : getDefaultNextJsFiles();

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
            console.log("🚀 Starting Next.js dev server...");

            const devServerCmd = await sandbox.commands.run(
                'cd /home/user && npm run dev > /tmp/nextjs.log 2>&1 &',
                { background: true }
            );

            const devServerPid = devServerCmd.pid;
            console.log(`📝 Dev server starting (PID: ${devServerPid})`);

            // Wait for Next.js to compile
            console.log("⏳ Waiting for compilation (15-20s)...");
            await new Promise(resolve => setTimeout(resolve, 20000));

            // Verify server is running
            console.log("🔍 Verifying server...");
            const verifyCmd = await sandbox.commands.run(
                'lsof -i :3000 2>/dev/null || echo "Not ready"',
                { timeoutMs: 5000 }
            );

            if (verifyCmd.stdout.includes(':3000') || verifyCmd.stdout.includes('LISTEN')) {
                console.log("✅ Server is running on port 3000");
            } else {
                console.warn("⚠️  Could not confirm server status");

                // Check logs
                const logsCmd = await sandbox.commands.run('tail -20 /tmp/nextjs.log');
                console.log("Recent logs:", logsCmd.stdout);
            }

            // Store sandbox reference with dev server PID
            activeSandboxes.set(projectId, {
                sandbox,
                lastAccessed: new Date(),
                devServerPid,
            });

            console.log(`💾 Sandbox stored. Active: ${activeSandboxes.size}`);

            return NextResponse.json({
                sandboxId: projectId,
                url: `https://${sandbox.getHost(3000)}`,
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

/**
 * Get default Next.js project files
 */
function getDefaultNextJsFiles(): Record<string, string> {
    return {
        "package.json": JSON.stringify({
            "name": "craft-project",
            "version": "0.1.0",
            "private": true,
            "scripts": {
                "dev": "next dev",
                "build": "next build",
                "start": "next start",
                "lint": "next lint"
            },
            "dependencies": {
                "react": "^18.3.1",
                "react-dom": "^18.3.1",
                "next": "14.2.5"
            },
            "devDependencies": {
                "typescript": "^5",
                "@types/node": "^20",
                "@types/react": "^18",
                "@types/react-dom": "^18",
                "postcss": "^8",
                "tailwindcss": "^3.4.1",
                "eslint": "^8",
                "eslint-config-next": "14.2.5"
            }
        }, null, 2),
        "tsconfig.json": JSON.stringify({
            "compilerOptions": {
                "lib": ["dom", "dom.iterable", "esnext"],
                "allowJs": true,
                "skipLibCheck": true,
                "strict": true,
                "noEmit": true,
                "esModuleInterop": true,
                "module": "esnext",
                "moduleResolution": "bundler",
                "resolveJsonModule": true,
                "isolatedModules": true,
                "jsx": "preserve",
                "incremental": true,
                "plugins": [{ "name": "next" }],
                "paths": { "@/*": ["./src/*"] }
            },
            "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
            "exclude": ["node_modules"]
        }, null, 2),
        "next.config.js": `/** @type {import('next').NextConfig} */
const nextConfig = {};
export default nextConfig;`,
        "tailwind.config.ts": `import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
export default config;`,
        "postcss.config.mjs": `/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    tailwindcss: {},
  },
};

export default config;`,
        "src/app/layout.tsx": `import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Craft Project",
  description: "Built with Craft",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}`,
        "src/app/page.tsx": `export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500">
      <div className="text-center text-white">
        <h1 className="text-6xl font-bold mb-4">🚀</h1>
        <h2 className="text-4xl font-bold mb-2">Welcome to Craft</h2>
        <p className="text-xl opacity-90">Start building by chatting with AI</p>
      </div>
    </div>
  );
}`,
        "src/app/globals.css": `@tailwind base;
@tailwind components;
@tailwind utilities;`
    };
}
