import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import { prisma } from "@/lib/db";
import { Sandbox } from "e2b";

/**
 * GET /api/sandbox/[projectId]/logs
 * 
 * Get dev server logs from the E2B sandbox
 * Used to monitor for compilation errors and runtime issues
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ projectId: string }> }
) {
    try {
        const session = await getSession();
        if (!session?.user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { projectId } = await params;
        const { searchParams } = new URL(request.url);
        const lines = parseInt(searchParams.get("lines") || "50");

        // Verify project ownership and get sandboxId
        const project = await prisma.project.findFirst({
            where: {
                id: projectId,
                userId: session.user.id,
            },
            select: {
                id: true,
                sandboxId: true,
            },
        });

        if (!project) {
            return NextResponse.json(
                { error: "Project not found or access denied" },
                { status: 404 }
            );
        }

        if (!project.sandboxId) {
            return NextResponse.json(
                { error: "No sandbox associated with this project" },
                { status: 404 }
            );
        }

        // Connect to the sandbox using the stored sandboxId
        let sandbox: Sandbox;
        try {
            sandbox = await Sandbox.connect(project.sandboxId);
        } catch (error) {
            console.error("Failed to connect to sandbox:", error);
            return NextResponse.json(
                { error: "Sandbox not found or has expired" },
                { status: 404 }
            );
        }

        // Read the dev server logs
        try {
            const result = await sandbox.commands.run(
                `cd /home/user/project && tail -n ${lines} nohup.out 2>/dev/null || echo "No logs available yet"`,
                { timeoutMs: 10000 }
            );

            const logs = result.stdout || result.stderr || "No logs available";

            // Detect common error patterns
            const hasCompilationError = logs.includes("Failed to compile") ||
                logs.includes("Module not found") ||
                logs.includes("SyntaxError") ||
                logs.includes("TypeError");

            const hasRuntimeError = logs.includes("Error:") ||
                logs.includes("Unhandled Runtime Error");

            return NextResponse.json({
                logs,
                hasError: hasCompilationError || hasRuntimeError,
                errorType: hasCompilationError ? "compilation" : hasRuntimeError ? "runtime" : null,
                linesReturned: lines,
            });
        } catch (error) {
            console.error("❌ Failed to read logs:", error);
            return NextResponse.json(
                {
                    error: "Failed to read logs",
                    message: error instanceof Error ? error.message : "Unknown error",
                },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error("❌ Logs endpoint error:", error);
        return NextResponse.json(
            {
                error: "Failed to fetch logs",
                message: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}
