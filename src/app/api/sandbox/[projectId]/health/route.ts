import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import { prisma } from "@/lib/db";
import { checkSandboxHealth, getQuickHealthStatus } from "@/lib/e2b/sandbox-health";

/**
 * GET /api/sandbox/[projectId]/health
 * Check sandbox health status
 * 
 * Query params:
 * - quick: true/false (default: false) - Use quick status check
 * - autoRestore: true/false (default: false) - Auto-restore if expired
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
        const quick = searchParams.get("quick") === "true";
        const autoRestore = searchParams.get("autoRestore") === "true";

        // Verify project ownership
        const project = await prisma.project.findFirst({
            where: {
                id: projectId,
                userId: session.user.id,
            },
            select: { id: true },
        });

        if (!project) {
            return NextResponse.json(
                { error: "Project not found or access denied" },
                { status: 404 }
            );
        }

        // Quick status check (fast, database only)
        if (quick) {
            const status = await getQuickHealthStatus(projectId);
            return NextResponse.json({
                quick: true,
                ...status,
            });
        }

        // Full health check (includes sandbox connectivity test)
        const health = await checkSandboxHealth(projectId, autoRestore);

        return NextResponse.json({
            healthy: health.healthy,
            needsRestoration: health.needsRestoration,
            canRestore: health.canRestore,
            restoredSandboxId: health.restoredSandboxId,
            status: health.status,
        });
    } catch (error) {
        console.error("❌ Health check failed:", error);
        return NextResponse.json(
            {
                error: "Health check failed",
                message: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}

/**
 * POST /api/sandbox/[projectId]/health/restore
 * Force restore sandbox from R2 backup
 */
export async function POST(
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

        // Verify project ownership
        const project = await prisma.project.findFirst({
            where: {
                id: projectId,
                userId: session.user.id,
            },
            select: { id: true, sandboxId: true },
        });

        if (!project) {
            return NextResponse.json(
                { error: "Project not found or access denied" },
                { status: 404 }
            );
        }

        // Force restore
        console.log(`🔧 [Project ${projectId}] Manual restore requested by user ${session.user.id}`);

        const { forceHealthCheckAndRestore } = await import("@/lib/e2b/sandbox-health");
        const health = await forceHealthCheckAndRestore(projectId);

        if (health.healthy) {
            return NextResponse.json({
                success: true,
                restored: !!health.restoredSandboxId,
                sandboxId: health.status.sandboxId,
                restoredSandboxId: health.restoredSandboxId,
                message: health.restoredSandboxId
                    ? `Successfully restored from backup (old: ${project.sandboxId}, new: ${health.restoredSandboxId})`
                    : "Sandbox is already healthy",
            });
        } else {
            return NextResponse.json({
                success: false,
                canRestore: health.canRestore,
                needsRestoration: health.needsRestoration,
                message: health.status.message,
            });
        }
    } catch (error) {
        console.error("❌ Manual restore failed:", error);
        return NextResponse.json(
            {
                success: false,
                error: "Restore failed",
                message: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}
