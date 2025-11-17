import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string; varId: string } }
) {
    try {
        const session = await auth.api.getSession({
            headers: req.headers,
        });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const projectId = params.id;
        const varId = params.varId;

        // Verify project ownership
        const project = await prisma.project.findUnique({
            where: { id: projectId, userId: session.user.id },
        });

        if (!project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        // Get existing environment variables
        const existingVars = Array.isArray(project.environmentVariables)
            ? project.environmentVariables
            : [];

        // Remove variable
        const updatedVars = existingVars.filter((v: any) => v.id !== varId);

        // Update project
        await prisma.project.update({
            where: { id: projectId },
            data: {
                environmentVariables: updatedVars as any,
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error removing environment variable:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
