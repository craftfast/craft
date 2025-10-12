import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

interface RouteContext {
    params: Promise<{ id: string; versionId: string }>;
}

// POST /api/projects/[id]/versions/[versionId]/restore - Restore a specific version
export async function POST(
    request: NextRequest,
    context: RouteContext
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id: projectId, versionId } = await context.params;

        // Verify project ownership
        const project = await prisma.project.findFirst({
            where: {
                id: projectId,
                user: {
                    email: session.user.email,
                },
            },
        });

        if (!project) {
            return NextResponse.json(
                { error: "Project not found" },
                { status: 404 }
            );
        }

        // Fetch the version to restore
        const versionToRestore = await prisma.projectVersion.findUnique({
            where: {
                id: versionId,
            },
        });

        if (!versionToRestore || versionToRestore.projectId !== projectId) {
            return NextResponse.json(
                { error: "Version not found" },
                { status: 404 }
            );
        }

        // Before restoring, create a snapshot of the current state
        // (in case user wants to undo the restore)
        if (project.version > 0) {
            await prisma.projectVersion.create({
                data: {
                    projectId,
                    version: project.version,
                    name: `Auto-saved before restore to v${versionToRestore.version}`,
                    files: project.files as object,
                    isBookmarked: false,
                },
            });
        }

        // Restore the files from the selected version
        const updatedProject = await prisma.project.update({
            where: {
                id: projectId,
            },
            data: {
                files: versionToRestore.files as object,
                version: { increment: 1 }, // Increment version after restore
                generationStatus: "ready",
                lastCodeUpdateAt: new Date(),
            },
        });

        return NextResponse.json({
            success: true,
            project: updatedProject,
            restoredFrom: versionToRestore.version,
        });
    } catch (error) {
        console.error("Error restoring version:", error);
        return NextResponse.json(
            { error: "Failed to restore version" },
            { status: 500 }
        );
    }
}

// PATCH /api/projects/[id]/versions/[versionId] - Update version (e.g., bookmark, rename)
export async function PATCH(
    request: NextRequest,
    context: RouteContext
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id: projectId, versionId } = await context.params;
        const body = await request.json();
        const { isBookmarked, name, isPublished } = body;

        // Verify project ownership
        const project = await prisma.project.findFirst({
            where: {
                id: projectId,
                user: {
                    email: session.user.email,
                },
            },
        });

        if (!project) {
            return NextResponse.json(
                { error: "Project not found" },
                { status: 404 }
            );
        }

        // Update the version
        const updatedVersion = await prisma.projectVersion.update({
            where: {
                id: versionId,
                projectId, // Ensure version belongs to this project
            },
            data: {
                ...(isBookmarked !== undefined && { isBookmarked }),
                ...(name !== undefined && { name }),
                ...(isPublished !== undefined && { isPublished }),
            },
        });

        return NextResponse.json({ version: updatedVersion });
    } catch (error) {
        console.error("Error updating version:", error);
        return NextResponse.json(
            { error: "Failed to update version" },
            { status: 500 }
        );
    }
}
