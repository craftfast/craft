import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Sandbox } from "@e2b/code-interpreter";

// Import the active sandboxes map (would be better in a shared module)
// For now, we'll access it through a global
declare global {
    var activeSandboxes: Map<string, { sandbox: Sandbox; lastAccessed: Date; devServerPid?: number }>;
}

if (!global.activeSandboxes) {
    global.activeSandboxes = new Map();
}

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

        const { command } = await request.json();

        if (!command) {
            return NextResponse.json(
                { error: "Command is required" },
                { status: 400 }
            );
        }

        const sandboxData = global.activeSandboxes.get(projectId);

        if (!sandboxData) {
            return NextResponse.json(
                { error: "Sandbox not found. Please start the sandbox first." },
                { status: 404 }
            );
        }

        // Update last accessed time
        sandboxData.lastAccessed = new Date();

        // Execute command
        const result = await sandboxData.sandbox.runCode(command);

        return NextResponse.json({
            success: true,
            output: result.text || "",
            error: result.error || null,
        });
    } catch (error) {
        console.error("Error executing command:", error);
        return NextResponse.json(
            { error: "Failed to execute command" },
            { status: 500 }
        );
    }
}
