import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// POST /api/files - Create or update files for a project
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { projectId, filePath, content, files: batchFiles, skipGenerationTracking, finalizeGeneration } = body;

        // Support both single file and batch file updates
        if (!projectId) {
            return NextResponse.json(
                { error: "Missing required field: projectId" },
                { status: 400 }
            );
        }

        // Verify project ownership
        const project = await prisma.project.findFirst({
            where: {
                id: projectId,
                user: { email: session.user.email },
            },
            select: {
                id: true,
                codeFiles: true,
            },
        });

        if (!project) {
            return NextResponse.json(
                { error: "Project not found or access denied" },
                { status: 404 }
            );
        }

        // Handle finalize generation - update status and increment version
        if (finalizeGeneration) {
            const updatedProject = await prisma.project.update({
                where: { id: projectId },
                data: {
                    generationStatus: "ready",
                    version: { increment: 1 },
                    lastCodeUpdateAt: new Date(),
                },
                select: {
                    version: true,
                    codeFiles: true,
                },
            });

            // Create a version snapshot
            await prisma.projectVersion.create({
                data: {
                    projectId,
                    version: updatedProject.version,
                    name: `Version ${updatedProject.version}`,
                    codeFiles: updatedProject.codeFiles as object,
                    isBookmarked: false,
                },
            });

            console.log(`✅ Finalized generation - incremented version to ${updatedProject.version} and created snapshot for project ${projectId}`);

            return NextResponse.json({
                success: true,
                message: "Generation finalized, version incremented",
                version: updatedProject.version,
            });
        }

        const currentFiles = (project.codeFiles as Record<string, string>) || {};

        // Batch update: { projectId, files: { "path1": "content1", "path2": "content2" } }
        if (batchFiles && typeof batchFiles === 'object') {
            const updatedFiles = { ...currentFiles, ...batchFiles };

            await prisma.project.update({
                where: { id: projectId },
                data: {
                    codeFiles: updatedFiles,
                    generationStatus: "ready",
                    version: { increment: 1 },
                    lastCodeUpdateAt: new Date(),
                },
            });

            console.log(`📁 Batch updated ${Object.keys(batchFiles).length} files for project ${projectId}`);

            return NextResponse.json({
                success: true,
                filesUpdated: Object.keys(batchFiles).length,
                message: "Files saved successfully",
            });
        }

        // Single file update: { projectId, filePath, content }
        if (filePath && content !== undefined) {
            currentFiles[filePath] = content;

            // Prepare update data - conditionally include generation status
            const updateData: {
                codeFiles: Record<string, string>;
                generationStatus?: string;
            } = { codeFiles: currentFiles };

            // Only update generation status if not skipped
            if (!skipGenerationTracking) {
                updateData.generationStatus = "ready";
            }

            await prisma.project.update({
                where: { id: projectId },
                data: updateData,
            });

            const trackingMsg = skipGenerationTracking ? " (status update skipped)" : "";
            console.log(`📄 Updated single file ${filePath} for project ${projectId}${trackingMsg}`);

            return NextResponse.json({
                success: true,
                filePath,
                message: "File saved successfully",
            });
        }

        return NextResponse.json(
            { error: "Must provide either 'files' object or 'filePath' and 'content'" },
            { status: 400 }
        );
    } catch (error) {
        console.error("File save error:", error);
        return NextResponse.json(
            {
                error: "Failed to save file(s)",
                details: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}

// GET /api/files?projectId=xxx - Get all files for a project
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const projectId = req.nextUrl.searchParams.get("projectId");
        if (!projectId) {
            return NextResponse.json(
                { error: "Missing projectId parameter" },
                { status: 400 }
            );
        }

        const project = await prisma.project.findFirst({
            where: {
                id: projectId,
                user: { email: session.user.email },
            },
            select: {
                id: true,
                codeFiles: true,
            },
        });

        if (!project) {
            return NextResponse.json(
                { error: "Project not found or access denied" },
                { status: 404 }
            );
        }

        const files = (project.codeFiles as Record<string, string>) || {};

        return NextResponse.json({ codeFiles: files, files }); // Return both for backward compatibility
    } catch (error) {
        console.error("Files fetch error:", error);
        return NextResponse.json(
            {
                error: "Failed to fetch files",
                details: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}
