import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Sandbox } from "@e2b/code-interpreter";

// Store active sandboxes in global state (in production, use Redis)
declare global {
    var activeSandboxes: Map<string, { sandbox: Sandbox; lastAccessed: Date }>;
}

if (!global.activeSandboxes) {
    global.activeSandboxes = new Map();
}

const activeSandboxes = global.activeSandboxes;

// Cleanup inactive sandboxes after 30 minutes
const SANDBOX_TIMEOUT = 30 * 60 * 1000;

setInterval(() => {
    const now = new Date();
    for (const [projectId, { sandbox, lastAccessed }] of activeSandboxes) {
        if (now.getTime() - lastAccessed.getTime() > SANDBOX_TIMEOUT) {
            sandbox.kill().catch(console.error);
            activeSandboxes.delete(projectId);
            console.log(`Closed inactive sandbox for project: ${projectId}`);
        }
    }
}, 5 * 60 * 1000); // Check every 5 minutes

export async function POST(
    request: NextRequest,
    { params }: { params: { projectId: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { projectId } = params;

        // Verify project ownership
        const project = await prisma.project.findFirst({
            where: {
                id: projectId,
                user: {
                    email: session.user.email,
                },
            },
        });

        if (!project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        const { files } = await request.json();

        // Check if sandbox already exists
        const sandboxData = activeSandboxes.get(projectId);

        if (sandboxData) {
            // Reuse existing sandbox
            sandboxData.lastAccessed = new Date();
            return NextResponse.json({
                sandboxId: projectId,
                url: `https://${sandboxData.sandbox.getHost(3000)}`,
                status: "running",
            });
        }

        // Create new sandbox
        console.log(`Creating sandbox for project: ${projectId}`);
        const sandbox = await Sandbox.create({
            metadata: { projectId, userId: session.user.email },
        });

        // Detect project type and prepare files
        const hasPackageJson = files && "package.json" in files;
        const hasIndexHtml = files && ("index.html" in files || "/index.html" in files);

        if (hasPackageJson) {
            // Node.js/React/Next.js project
            console.log("Setting up Node.js project...");

            // Write all files to /home/user directory
            for (const [filePath, content] of Object.entries(files || {})) {
                const normalizedPath = filePath.startsWith("/")
                    ? `/home/user${filePath}`
                    : `/home/user/${filePath}`;
                await sandbox.files.write(normalizedPath, content as string);
            }

            try {
                // Install dependencies and start dev server
                console.log("Installing dependencies...");
                const installResult = await sandbox.runCode(`
import subprocess
import os

os.chdir('/home/user')

# Install dependencies
subprocess.run(['npm', 'install'], check=True)

# Start dev server in background
subprocess.Popen(['npm', 'run', 'dev'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

print("Server starting...")
`);

                console.log("Install result:", installResult.text);

                // Wait for server to start
                await new Promise(resolve => setTimeout(resolve, 5000));
            } catch (error) {
                console.error("Error starting Node.js server:", error);
            }
        } else if (hasIndexHtml) {
            // Static HTML project
            console.log("Setting up static HTML project...");

            // Write all files
            for (const [filePath, content] of Object.entries(files || {})) {
                const normalizedPath = filePath.startsWith("/")
                    ? `/home/user${filePath}`
                    : `/home/user/${filePath}`;
                await sandbox.files.write(normalizedPath, content as string);
            }

            try {
                // Start simple HTTP server
                console.log("Starting HTTP server...");
                await sandbox.runCode(`
import subprocess
import os

os.chdir('/home/user')

# Install http-server if not available
subprocess.run(['npm', 'install', '-g', 'http-server'], check=True)

# Start server in background
subprocess.Popen(['http-server', '-p', '3000'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

print("HTTP server starting on port 3000...")
`);

                // Wait for server to start
                await new Promise(resolve => setTimeout(resolve, 3000));
            } catch (error) {
                console.error("Error starting HTTP server:", error);
            }
        } else {
            // Create a default preview page
            console.log("Creating default preview page...");
            const defaultHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Preview Ready</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            padding: 20px;
        }
        .container {
            text-align: center;
            max-width: 600px;
            animation: fadeIn 0.8s ease-in;
        }
        h1 {
            font-size: 3rem;
            margin-bottom: 1rem;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
        }
        p {
            font-size: 1.2rem;
            opacity: 0.9;
            line-height: 1.6;
        }
        .emoji { font-size: 4rem; margin-bottom: 1rem; }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="emoji">🚀</div>
        <h1>Preview Ready!</h1>
        <p>Start building your app by chatting with the AI.</p>
        <p style="margin-top: 2rem; font-size: 0.9rem;">
            This preview will update as you create files and code.
        </p>
    </div>
</body>
</html>`;

            await sandbox.files.write("/home/user/index.html", defaultHtml);

            try {
                // Start server for default page
                await sandbox.runCode(`
import subprocess
import os

os.chdir('/home/user')

# Install and start http-server
subprocess.run(['npm', 'install', '-g', 'http-server'], check=True)
subprocess.Popen(['http-server', '-p', '3000'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

print("Server started on port 3000")
`);

                await new Promise(resolve => setTimeout(resolve, 3000));
            } catch (error) {
                console.error("Error starting server:", error);
            }
        }

        // Store sandbox reference
        activeSandboxes.set(projectId, {
            sandbox,
            lastAccessed: new Date(),
        });

        return NextResponse.json({
            sandboxId: projectId,
            url: `https://${sandbox.getHost(3000)}`,
            status: "created",
        });
    } catch (error) {
        console.error("Error creating sandbox:", error);
        return NextResponse.json(
            { error: "Failed to create sandbox" },
            { status: 500 }
        );
    }
}

export async function GET(
    request: NextRequest,
    { params }: { params: { projectId: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { projectId } = params;

        // Verify project ownership
        const project = await prisma.project.findFirst({
            where: {
                id: projectId,
                user: {
                    email: session.user.email,
                },
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

export async function DELETE(
    request: NextRequest,
    { params }: { params: { projectId: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { projectId } = params;

        const sandboxData = activeSandboxes.get(projectId);

        if (sandboxData) {
            await sandboxData.sandbox.kill();
            activeSandboxes.delete(projectId);
            console.log(`Closed sandbox for project: ${projectId}`);
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
