import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import { prisma } from "@/lib/db";
import { keepSandboxAlive } from "@/lib/e2b/sandbox-manager";

/**
 * POST /api/sandbox/[projectId]/heartbeat
 * 
 * Extends the sandbox timeout to prevent auto-pause while user is actively viewing the project.
 * This endpoint should be called periodically (every 5 minutes) by the client while the project page is open.
 * 
 * Benefits:
 * - Seamless experience - no sandbox pauses while user is working
 * - Only extends timeout when user is actually active
 * - Automatic cleanup when user leaves (sandbox auto-pauses after 10 minutes of no heartbeat)
 */
export async function POST(
    request: NextRequest,
    { params }: { params: { projectId: string } }
) {
    try {
        // Verify user is authenticated
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const resolvedParams = await params;
        const projectId = resolvedParams.projectId;

        // Verify project exists and user owns it
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            select: { userId: true, sandboxId: true },
        });

        if (!project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        if (project.userId !== session.user.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        if (!project.sandboxId) {
            return NextResponse.json(
                { error: "No sandbox associated with this project" },
                { status: 404 }
            );
        }

        // Extend the sandbox timeout by 10 minutes (600,000ms)
        // This is called every 5 minutes, so sandbox will always have 10 minutes remaining
        await keepSandboxAlive(project.sandboxId, 10 * 60 * 1000);

        console.log(`💓 Heartbeat received for project ${projectId}, sandbox ${project.sandboxId} - timeout extended`);

        return NextResponse.json({
            success: true,
            message: "Sandbox timeout extended",
            sandboxId: project.sandboxId,
            nextHeartbeatIn: 5 * 60 * 1000, // 5 minutes in ms
        });
    } catch (error) {
        console.error("❌ Heartbeat error:", error);
        return NextResponse.json(
            {
                error: "Failed to extend sandbox timeout",
                details: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}
