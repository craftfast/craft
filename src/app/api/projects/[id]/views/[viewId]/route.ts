import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string; viewId: string }> }
) {
    const resolvedParams = await params;
    const projectId = resolvedParams.id;
    const viewId = resolvedParams.viewId;

    try {
        const session = await auth.api.getSession({
            headers: req.headers,
        });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { enabled } = body;

        // Verify project ownership
        const project = await prisma.project.findUnique({
            where: { id: projectId, userId: session.user.id },
        });

        if (!project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        // Get existing custom views
        const existingViews = Array.isArray(project.customViews)
            ? project.customViews
            : [];

        // Find or create the view
        const viewIndex = existingViews.findIndex((v: any) => v.id === viewId);

        let updatedViews;
        if (viewIndex >= 0) {
            // Update existing view
            updatedViews = [...existingViews];
            (updatedViews[viewIndex] as any).enabled = enabled;
        } else {
            // Create new view
            // Only include functional views
            const viewLabels: Record<string, string> = {
                git: "Git Version History",
            };

            const newView = {
                id: viewId,
                label: viewLabels[viewId] || viewId,
                type: viewId,
                enabled,
                order: existingViews.length,
            };

            updatedViews = [...existingViews, newView];
        }

        // Update project
        await prisma.project.update({
            where: { id: projectId },
            data: {
                customViews: updatedViews as any,
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error updating custom view:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
