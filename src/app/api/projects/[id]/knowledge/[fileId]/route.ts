import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { withCsrfProtection } from "@/lib/csrf";

// DELETE /api/projects/[id]/knowledge/[fileId] - Delete a knowledge file
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string; fileId: string }> }
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

        const { id: projectId, fileId } = await params;

        // Get the file
        const file = await prisma.knowledgeFile.findUnique({
            where: { id: fileId },
            include: {
                project: {
                    include: {
                        collaborators: true,
                    },
                },
            },
        });

        if (!file || file.projectId !== projectId) {
            return NextResponse.json({ error: "File not found" }, { status: 404 });
        }

        // Check permissions
        const isOwner = file.project.userId === session.user.id;
        const isUploader = file.uploadedBy === session.user.id;
        const editorCollab = await prisma.projectCollaborator.findFirst({
            where: { projectId: file.projectId, userId: session.user.id, role: "editor" },
        });
        const isEditor = !!editorCollab;

        if (!isOwner && !isUploader && !isEditor) {
            return NextResponse.json(
                { error: "You don't have permission to delete this file" },
                { status: 403 }
            );
        }

        // TODO: Delete from R2/Blob storage
        // For now, just delete from database

        // Delete from database
        await prisma.knowledgeFile.delete({
            where: { id: fileId },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting knowledge file:", error);
        return NextResponse.json(
            { error: "Failed to delete file" },
            { status: 500 }
        );
    }
}
