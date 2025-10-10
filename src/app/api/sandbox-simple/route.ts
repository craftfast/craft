import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { Sandbox } from "@e2b/code-interpreter";

/**
 * Simplified E2B Sandbox API - Based on e2b-dev/fragments approach
 * 
 * This is a much simpler implementation that:
 * 1. Creates a sandbox on demand
 * 2. Writes files directly to it
 * 3. Returns the URL
 * 4. Let E2B handle the rest
 */

const SANDBOX_TIMEOUT = 10 * 60 * 1000; // 10 minutes

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { code, projectId } = await request.json();

        if (!code) {
            return NextResponse.json(
                { error: "Missing required field: code" },
                { status: 400 }
            );
        }

        console.log(`🚀 Creating sandbox for project: ${projectId}`);

        // Create sandbox with E2B's code-interpreter template
        const sandbox = await Sandbox.create({
            metadata: {
                projectId: projectId || 'unknown',
                userId: session.user.email,
            },
            timeoutMs: SANDBOX_TIMEOUT,
        });

        console.log(`✅ Sandbox created: ${sandbox.sandboxId}`);

        // Write files to sandbox
        if (typeof code === 'string') {
            // Single file (simple case)
            await sandbox.files.write('/home/user/pages/index.tsx', code);
            console.log(`📝 Wrote single file to pages/index.tsx`);
        } else if (Array.isArray(code)) {
            // Multiple files
            for (const file of code) {
                const path = file.path || file.filePath;
                const content = file.content || file.fileContent;

                if (path && content) {
                    const normalizedPath = path.startsWith('/home/user')
                        ? path
                        : `/home/user/${path.replace(/^\//, '')}`;

                    await sandbox.files.write(normalizedPath, content);
                    console.log(`📝 Wrote file: ${normalizedPath}`);
                }
            }
        } else if (typeof code === 'object') {
            // Object mapping paths to content
            for (const [filePath, content] of Object.entries(code)) {
                const normalizedPath = filePath.startsWith('/home/user')
                    ? filePath
                    : `/home/user/${filePath.replace(/^\//, '')}`;

                await sandbox.files.write(normalizedPath, content as string);
                console.log(`📝 Wrote file: ${normalizedPath}`);
            }
        }

        // Setup Next.js if needed (minimal package.json)
        try {
            await sandbox.files.write('/home/user/package.json', JSON.stringify({
                "name": "craft-preview",
                "version": "0.1.0",
                "private": true,
                "scripts": {
                    "dev": "next dev",
                    "build": "next build",
                    "start": "next start"
                },
                "dependencies": {
                    "next": "14.2.3",
                    "react": "^18",
                    "react-dom": "^18"
                }
            }, null, 2));

            // Install dependencies
            console.log(`📦 Installing Next.js dependencies...`);
            await sandbox.runCode(`
import subprocess
import os

os.chdir('/home/user')
subprocess.run(['npm', 'install', '--legacy-peer-deps'], check=True, timeout=120)
print("✅ Dependencies installed")
`);

            // Start Next.js dev server
            console.log(`🚀 Starting Next.js dev server...`);
            await sandbox.runCode(`
import subprocess
import os

os.chdir('/home/user')
# Start Next.js in background
subprocess.Popen(['npm', 'run', 'dev'])
print("✅ Next.js dev server starting...")
`);

            // Wait for server to be ready
            await new Promise(resolve => setTimeout(resolve, 5000));

        } catch (error) {
            console.error("Error setting up Next.js:", error);
        }

        // Return sandbox URL
        const url = `https://${sandbox.getHost(3000)}`;

        console.log(`✨ Sandbox ready at: ${url}`);

        return NextResponse.json({
            url,
            sandboxId: sandbox.sandboxId,
            success: true,
        });

    } catch (error) {
        console.error("Sandbox creation error:", error);
        return NextResponse.json(
            {
                error: "Failed to create sandbox",
                details: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}
