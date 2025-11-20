import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import { prisma } from "@/lib/db";
import { uploadFile, deleteFile } from "@/lib/r2-storage";
import puppeteer from "puppeteer";

/**
 * POST /api/sandbox/[projectId]/screenshot
 * 
 * Captures a screenshot of the project preview and stores it as the project thumbnail.
 * Uses Puppeteer for server-side screenshot capture of E2B sandboxes.
 * 
 * Important: Only ONE screenshot per project is stored. When a new screenshot is uploaded,
 * the old one is automatically deleted from R2 storage to save space.
 * 
 * Flow:
 * 1. Client requests screenshot capture
 * 2. Server uses Puppeteer to load the E2B preview URL
 * 3. Server captures screenshot
 * 4. Server deletes old screenshot (if exists)
 * 5. Server uploads new screenshot to Cloudflare R2 storage
 * 6. Server updates project.previewImage
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ projectId: string }> }
) {
    const { projectId } = await params;
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
                version: true,
                previewImage: true, // Get old URL to delete the old screenshot
                previewImageCapturedAtVersion: true,
            },
        });

        if (!project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        if (project.userId !== session.user.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        // Parse request body
        const body = await request.json();
        const { screenshot, url, version } = body; // screenshot = base64 OR url = sandbox URL, version = project version

        // Backend validation: Reject if this version was already captured
        if (
            version !== undefined &&
            project.previewImageCapturedAtVersion !== null &&
            project.previewImageCapturedAtVersion === version
        ) {
            console.log(
                `⏭️ Screenshot already captured for version ${version}, skipping duplicate upload`
            );
            return NextResponse.json(
                {
                    success: false,
                    error: "Screenshot already captured for this version",
                    alreadyCaptured: true,
                },
                { status: 409 } // Conflict
            );
        }

        // Delete old screenshot if it exists
        if (project.previewImage) {
            try {
                // Extract R2 key from URL
                // Format: https://pub-xxx.r2.dev/images/projectId/screenshot-timestamp.png
                const oldUrl = new URL(project.previewImage);
                const r2Key = oldUrl.pathname.substring(1); // Remove leading /

                console.log(`🗑️ Deleting old screenshot: ${r2Key}`);
                await deleteFile(r2Key);
                console.log(`✅ Old screenshot deleted`);
            } catch (error) {
                console.warn(`⚠️ Failed to delete old screenshot:`, error);
                // Continue anyway - not critical if deletion fails
            }
        }

        let buffer: Buffer;
        let imageType = 'png';

        // Server-side capture using Puppeteer if URL is provided
        if (url && typeof url === 'string') {
            console.log(`📸 Server-side screenshot capture for ${url}`);

            try {
                const browser = await puppeteer.launch({
                    headless: true,
                    args: ['--no-sandbox', '--disable-setuid-sandbox'],
                });

                const page = await browser.newPage();
                await page.setViewport({ width: 1920, height: 1080 });

                // Navigate to the URL with a timeout
                await page.goto(url, {
                    waitUntil: 'networkidle2',
                    timeout: 15000,
                });

                // Wait a bit for any dynamic content to load
                await new Promise(resolve => setTimeout(resolve, 2000));

                // Capture screenshot
                const screenshotBuffer = await page.screenshot({
                    type: 'png',
                    fullPage: false, // Just capture viewport
                });

                await browser.close();

                buffer = Buffer.from(screenshotBuffer);
                imageType = 'png';

                console.log(`✅ Server-side screenshot captured (${(buffer.length / 1024).toFixed(2)} KB)`);
            } catch (error) {
                console.error('❌ Puppeteer screenshot failed:', error);
                return NextResponse.json(
                    { error: "Failed to capture screenshot from URL" },
                    { status: 500 }
                );
            }
        }
        // Client-side capture (legacy - base64 from client)
        else if (screenshot && typeof screenshot === 'string') {
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

            imageType = matches[1]; // png, jpeg, etc.
            const base64Data = matches[2];

            // Convert base64 to buffer
            buffer = Buffer.from(base64Data, 'base64');
        } else {
            return NextResponse.json(
                { error: "Either 'screenshot' (base64) or 'url' must be provided" },
                { status: 400 }
            );
        }

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

        // Update project with new preview image URL and capture version
        const updatedProject = await prisma.project.update({
            where: { id: projectId },
            data: {
                previewImage: uploadResult.r2Url,
                previewImageCapturedAtVersion: version ?? 0, // Store the version when screenshot was captured
            },
            select: {
                id: true,
                name: true,
                previewImage: true,
                version: true,
                previewImageCapturedAtVersion: true,
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
    { params }: { params: Promise<{ projectId: string }> }
) {
    try {
        // Verify user is authenticated
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { projectId } = await params;

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
