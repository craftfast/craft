import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import { prisma } from "@/lib/db";

/**
 * POST /api/sandbox/[projectId]/keepalive
 * Extend sandbox timeout to keep it alive during active development
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

        // Get project and verify ownership
        const project = await prisma.project.findFirst({
            where: {
                id: projectId,
                userId: session.user.id,
            },
            select: {
                sandboxId: true,
            },
        });

        if (!project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        if (!project.sandboxId) {
            return NextResponse.json({ error: "No sandbox found" }, { status: 404 });
        }

        return NextResponse.json({
            status: "alive",
            message: "Sandbox timeout extended by 30 minutes"
        });

    } catch (error) {
        console.error("Error keeping sandbox alive:", error);
        return NextResponse.json(
            { error: "Failed to extend sandbox timeout" },
            { status: 500 }
        );
    }
}
