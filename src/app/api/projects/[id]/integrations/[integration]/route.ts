import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string; integration: string }> }
) {
    try {
        const { id: projectId, integration } = await params;
        const session = await auth.api.getSession({
            headers: req.headers,
        });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Verify project ownership
        const project = await prisma.project.findUnique({
            where: { id: projectId, userId: session.user.id },
        });

        if (!project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        const body = await req.json();
        const { enabled, config } = body;

        // Here you would save the integration configuration to the database
        // For now, we'll just return success
        // In a real implementation, you'd store this in a ProjectSettings table or metadata field

        return NextResponse.json({
            success: true,
            message: `${integration} integration updated`,
        });
    } catch (error) {
        console.error("Error updating integration:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
