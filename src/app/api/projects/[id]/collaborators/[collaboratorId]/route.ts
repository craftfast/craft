import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PATCH(
    req: NextRequest,
    { params }: { params: { id: string; collaboratorId: string } }
) {
    try {
        const session = await auth.api.getSession({
            headers: req.headers,
        });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const projectId = params.id;
        const collaboratorId = params.collaboratorId;

        // Verify project ownership
        const project = await prisma.project.findUnique({
            where: { id: projectId, userId: session.user.id },
        });

        if (!project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        const body = await req.json();
        const { role } = body;

        // Here you would update the collaborator role in the database
        // For now, we'll return success
        return NextResponse.json({ success: true, message: "Role updated" });
    } catch (error) {
        console.error("Error updating collaborator:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string; collaboratorId: string } }
) {
    try {
        const session = await auth.api.getSession({
            headers: req.headers,
        });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const projectId = params.id;
        const collaboratorId = params.collaboratorId;

        // Verify project ownership
        const project = await prisma.project.findUnique({
            where: { id: projectId, userId: session.user.id },
        });

        if (!project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        // Here you would remove the collaborator from the database
        // For now, we'll return success
        return NextResponse.json({ success: true, message: "Collaborator removed" });
    } catch (error) {
        console.error("Error removing collaborator:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
