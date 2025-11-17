import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { withCsrfProtection } from "@/lib/csrf";

// PATCH /api/projects/[id]/collaborators/[collaboratorId] - Update collaborator role
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string; collaboratorId: string }> }
) {
    try {
        // CSRF Protection
        const csrfCheck = await withCsrfProtection(req);
        if (csrfCheck) return csrfCheck;

        const session = await auth.api.getSession({
            headers: req.headers,
        });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id: projectId, collaboratorId } = await params;

        // Verify project ownership
        const project = await prisma.project.findUnique({
            where: { id: projectId, userId: session.user.id },
        });

        if (!project) {
            return NextResponse.json(
                { error: "Project not found or access denied" },
                { status: 404 }
            );
        }

        const body = await req.json();
        const { role } = body;

        if (!role || !["editor", "viewer"].includes(role)) {
            return NextResponse.json({ error: "Invalid role" }, { status: 400 });
        }

        // Update collaborator role
        const updatedCollaborator = await prisma.projectCollaborator.update({
            where: { id: collaboratorId },
            data: { role },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        image: true,
                    },
                },
            },
        });

        return NextResponse.json({
            id: updatedCollaborator.id,
            email: updatedCollaborator.user.email,
            name: updatedCollaborator.user.name,
            image: updatedCollaborator.user.image,
            role: updatedCollaborator.role,
            addedAt: updatedCollaborator.addedAt.toISOString(),
        });
    } catch (error) {
        console.error("Error updating collaborator:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// DELETE /api/projects/[id]/collaborators/[collaboratorId] - Remove collaborator
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string; collaboratorId: string }> }
) {
    try {
        // CSRF Protection
        const csrfCheck = await withCsrfProtection(req);
        if (csrfCheck) return csrfCheck;

        const session = await auth.api.getSession({
            headers: req.headers,
        });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id: projectId, collaboratorId } = await params;

        // Verify project ownership
        const project = await prisma.project.findUnique({
            where: { id: projectId, userId: session.user.id },
        });

        if (!project) {
            return NextResponse.json(
                { error: "Project not found or access denied" },
                { status: 404 }
            );
        }

        // Delete collaborator
        await prisma.projectCollaborator.delete({
            where: { id: collaboratorId },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error removing collaborator:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
