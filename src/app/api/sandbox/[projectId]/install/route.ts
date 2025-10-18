import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Sandbox } from "@e2b/code-interpreter";

// Import the active sandboxes map
declare global {
    var activeSandboxes: Map<
        string,
        { sandbox: Sandbox; lastAccessed: Date; devServerPid?: number }
    >;
}

if (!global.activeSandboxes) {
    global.activeSandboxes = new Map();
}

/**
 * POST /api/sandbox/[projectId]/install
 * Install dependencies in the sandbox
 * Accepts packages as array of strings
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

        // Get packages from request body
        const { packages } = await request.json();

        if (!packages || !Array.isArray(packages) || packages.length === 0) {
            return NextResponse.json(
                { error: "Packages array is required" },
                { status: 400 }
            );
        }

        // Validate package names
        const validPackages = packages.filter((pkg) => {
            if (typeof pkg !== "string") return false;
            // Basic validation for npm package names
            const validPattern = /^(@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/i;
            return validPattern.test(pkg) && pkg.length <= 214;
        });

        if (validPackages.length === 0) {
            return NextResponse.json(
                { error: "No valid package names provided" },
                { status: 400 }
            );
        }

        // Get the sandbox
        const sandboxData = global.activeSandboxes.get(projectId);

        if (!sandboxData) {
            return NextResponse.json(
                { error: "Sandbox not found. Please start the sandbox first." },
                { status: 404 }
            );
        }

        // Update last accessed time
        sandboxData.lastAccessed = new Date();

        console.log(`📦 Installing packages for project ${projectId}: ${validPackages.join(", ")}`);

        try {
            // Change to project directory and install packages using pnpm
            const installCommand = `cd /home/user/project && pnpm add ${validPackages.join(" ")}`;

            const result = await sandboxData.sandbox.runCode(installCommand, {
                timeoutMs: 120000, // 2 minutes timeout for installations
            });

            // Check if installation was successful
            const success = !result.error;

            if (success) {
                console.log(`✅ Successfully installed: ${validPackages.join(", ")}`);

                return NextResponse.json({
                    success: true,
                    packages: validPackages,
                    output: result.text || "",
                    message: `Successfully installed ${validPackages.length} package(s)`,
                });
            } else {
                console.error(`❌ Installation failed:`, result.error || result.text);

                return NextResponse.json({
                    success: false,
                    packages: validPackages,
                    error: result.error || result.text || "Installation failed",
                    output: result.text || "",
                }, { status: 500 });
            }
        } catch (error) {
            console.error("Error installing packages:", error);

            return NextResponse.json(
                {
                    success: false,
                    packages: validPackages,
                    error: error instanceof Error ? error.message : "Failed to install packages",
                },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error("Error in install endpoint:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
