import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import { prisma } from "@/lib/db";
import { uploadFile, deleteFile } from "@/lib/r2-storage";

/**
 * POST /api/sandbox/[projectId]/screenshot
 * 
 * Captures a screenshot of the project preview and stores it as the project thumbnail.
 * The screenshot is sent as base64 data from the client (captured via html2canvas or similar).
 * 
 * Important: Only ONE screenshot per project is stored. When a new screenshot is uploaded,
 * the old one is automatically deleted from R2 storage to save space.
 * 
 * Flow:
 * 1. Client loads preview iframe
 * 2. Client captures screenshot using html2canvas
 * 3. Client sends base64 image to this endpoint
 * 4. Server deletes old screenshot (if exists)
 * 5. Server uploads new screenshot to Cloudflare R2 storage
 * 6. Server updates project.thumbnailUrl
 */
export async function POST(
    request: NextRequest,
    { params }: { params: { projectId: string } }
) {
    try {
        // Verify user is authenticated
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const resolvedParams = await params;
        const projectId = resolvedParams.projectId;

        // Verify project exists and user owns it
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            select: {
                userId: true,
                name: true,
                previewImage: true, // Get old URL to delete the old screenshot
            },
        });

        if (!project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        if (project.userId !== session.user.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        // Delete old screenshot if it exists
        if (project.previewImage) {
            try {
                // Extract R2 key from URL
                // Format: https://pub-xxx.r2.dev/images/projectId/screenshot-timestamp.png
                const url = new URL(project.previewImage);
                const r2Key = url.pathname.substring(1); // Remove leading /

                console.log(`🗑️ Deleting old screenshot: ${r2Key}`);
                await deleteFile(r2Key);
                console.log(`✅ Old screenshot deleted`);
            } catch (error) {
                console.warn(`⚠️ Failed to delete old screenshot:`, error);
                // Continue anyway - not critical if deletion fails
            }
        }

        // Parse request body
        const body = await request.json();
        const { screenshot } = body; // Expected to be base64 string: "data:image/png;base64,..."

        if (!screenshot || typeof screenshot !== 'string') {
            return NextResponse.json(
                { error: "Screenshot data is required" },
                { status: 400 }
            );
        }

        // Validate base64 format
        if (!screenshot.startsWith('data:image/')) {
            return NextResponse.json(
                { error: "Invalid screenshot format. Expected base64 data URL" },
                { status: 400 }
            );
        }

        // Extract the base64 content (remove data:image/png;base64, prefix)
        const matches = screenshot.match(/^data:image\/(\w+);base64,(.+)$/);
        if (!matches) {
            return NextResponse.json(
                { error: "Invalid base64 format" },
                { status: 400 }
            );
        }

        const imageType = matches[1]; // png, jpeg, etc.
        const base64Data = matches[2];

        // Convert base64 to buffer
        const buffer = Buffer.from(base64Data, 'base64');

        // Check size (max 5MB)
        if (buffer.length > 5 * 1024 * 1024) {
            return NextResponse.json(
                { error: "Screenshot too large (max 5MB)" },
                { status: 400 }
            );
        }

        console.log(`📸 Uploading screenshot for project ${projectId} (${(buffer.length / 1024).toFixed(2)} KB)`);

        // Upload to Cloudflare R2 storage
        // Use consistent filename (no timestamp) so it always replaces the same file
        const uploadResult = await uploadFile({
            userId: session.user.id,
            fileName: `thumbnail.${imageType}`, // Fixed filename per project
            fileContent: buffer,
            mimeType: `image/${imageType}`,
            purpose: "image",
            projectId: projectId,
        });

        // Update project with new preview image URL
        const updatedProject = await prisma.project.update({
            where: { id: projectId },
            data: {
                previewImage: uploadResult.r2Url,
            },
            select: {
                id: true,
                name: true,
                previewImage: true,
            },
        });

        console.log(`✅ Screenshot saved for project ${projectId}: ${uploadResult.r2Url}`);

        return NextResponse.json({
            success: true,
            project: updatedProject,
            previewImage: uploadResult.r2Url,
        });

    } catch (error) {
        console.error("❌ Screenshot capture error:", error);
        return NextResponse.json(
            {
                error: "Failed to save screenshot",
                details: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/sandbox/[projectId]/screenshot
 * 
 * Deletes the project's thumbnail screenshot from R2 storage and removes the URL from the database.
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: { projectId: string } }
) {
    try {
        // Verify user is authenticated
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const resolvedParams = await params;
        const projectId = resolvedParams.projectId;

        // Verify project exists and user owns it
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            select: {
                userId: true,
                previewImage: true,
            },
        });

        if (!project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        if (project.userId !== session.user.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        if (!project.previewImage) {
            return NextResponse.json(
                { error: "No screenshot to delete" },
                { status: 404 }
            );
        }

        // Delete screenshot from R2
        try {
            const url = new URL(project.previewImage);
            const r2Key = url.pathname.substring(1);

            console.log(`🗑️ Deleting screenshot: ${r2Key}`);
            await deleteFile(r2Key);
        } catch (error) {
            console.error(`Failed to delete screenshot from R2:`, error);
            // Continue to update database even if R2 deletion fails
        }

        // Remove preview image URL from database
        await prisma.project.update({
            where: { id: projectId },
            data: { previewImage: null },
        });

        console.log(`✅ Screenshot deleted for project ${projectId}`);

        return NextResponse.json({
            success: true,
            message: "Screenshot deleted successfully",
        });

    } catch (error) {
        console.error("❌ Screenshot deletion error:", error);
        return NextResponse.json(
            {
                error: "Failed to delete screenshot",
                details: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}
