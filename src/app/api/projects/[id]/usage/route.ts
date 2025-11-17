import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getProjectUsage, getServiceCosts } from "@/lib/services/usage-tracking";

// GET /api/projects/[id]/usage - Get project usage and costs
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth.api.getSession({
            headers: req.headers,
        });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id: projectId } = await params;

        // Verify project access
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: {
                collaborators: true,
            },
        });

        if (!project) {
            return NextResponse.json(
                { error: "Project not found" },
                { status: 404 }
            );
        }

        const hasAccess =
            project.userId === session.user.id ||
            project.collaborators?.some((c: any) => c.userId === session.user.id);

        if (!hasAccess) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Get usage data and costs
        const [usage, costs] = await Promise.all([
            getProjectUsage(projectId, session.user.id),
            getServiceCosts(projectId),
        ]);

        return NextResponse.json({
            usage,
            costs,
        });
    } catch (error) {
        console.error("Error fetching project usage:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
