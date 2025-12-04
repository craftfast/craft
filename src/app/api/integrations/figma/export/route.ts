import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import { prisma } from "@/lib/db";
import {
    exportFigmaImages,
    downloadFigmaImage,
    refreshFigmaToken,
} from "@/lib/figma/service";
import { uploadFile } from "@/lib/r2-storage";

/**
 * POST /api/integrations/figma/export
 * Export Figma frames as images and save to project knowledge base
 */
export async function POST(request: NextRequest) {
    try {
        const session = await getSession();

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { projectId, fileKey, nodeIds, format = "png", scale = 2 } = body;

        if (!projectId || !fileKey || !nodeIds || !Array.isArray(nodeIds) || nodeIds.length === 0) {
            return NextResponse.json(
                { error: "Missing required fields: projectId, fileKey, nodeIds" },
                { status: 400 }
            );
        }

        // Verify project access
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: { collaborators: true },
        });

        if (!project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        const isOwner = project.userId === session.user.id;
        const isEditor = project.collaborators.some(
            (c) => c.userId === session.user.id && c.role === "editor"
        );

        if (!isOwner && !isEditor) {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        // Get Figma integration
        const integration = await prisma.figmaIntegration.findUnique({
            where: { userId: session.user.id },
        });

        if (!integration || !integration.isActive) {
            return NextResponse.json(
                { error: "Figma not connected" },
                { status: 400 }
            );
        }

        // Check/refresh token
        let accessToken = integration.accessToken;
        if (integration.tokenExpiresAt && new Date() > integration.tokenExpiresAt) {
            if (!integration.refreshToken) {
                return NextResponse.json(
                    { error: "Figma token expired, please reconnect" },
                    { status: 401 }
                );
            }

            const newTokens = await refreshFigmaToken(integration.refreshToken);
            accessToken = newTokens.access_token;

            await prisma.figmaIntegration.update({
                where: { userId: session.user.id },
                data: {
                    accessToken: newTokens.access_token,
                    refreshToken: newTokens.refresh_token,
                    tokenExpiresAt: new Date(Date.now() + newTokens.expires_in * 1000),
                },
            });
        }

        // Export images from Figma
        const exportedImages = await exportFigmaImages(accessToken, fileKey, nodeIds, {
            format,
            scale,
        });

        if (exportedImages.length === 0) {
            return NextResponse.json(
                { error: "No images exported from Figma" },
                { status: 400 }
            );
        }

        // Download and save each image to R2 and database
        const savedFiles: Array<{
            id: string;
            name: string;
            r2Url: string;
            nodeId: string;
        }> = [];

        for (const image of exportedImages) {
            try {
                // Download image from Figma's temporary URL
                const imageBuffer = await downloadFigmaImage(image.url);

                // Clean up node ID for filename (replace : and other chars)
                const cleanNodeId = image.nodeId.replace(/[^a-zA-Z0-9]/g, "-");
                const fileName = `figma-${cleanNodeId}.${format}`;

                // Upload to R2
                const uploadResult = await uploadFile({
                    userId: session.user.id,
                    fileName,
                    fileContent: imageBuffer,
                    mimeType: format === "png" ? "image/png" : format === "jpg" ? "image/jpeg" : `image/${format}`,
                    purpose: "upload",
                    projectId,
                });

                // Save to knowledge base
                const knowledgeFile = await prisma.knowledgeFile.create({
                    data: {
                        projectId,
                        name: fileName,
                        r2Key: uploadResult.r2Key,
                        r2Url: uploadResult.r2Url,
                        mimeType: uploadResult.mimeType,
                        size: uploadResult.size,
                        description: `Imported from Figma (${fileKey}, node: ${image.nodeId})`,
                        uploadedBy: session.user.id,
                    },
                });

                savedFiles.push({
                    id: knowledgeFile.id,
                    name: knowledgeFile.name,
                    r2Url: knowledgeFile.r2Url,
                    nodeId: image.nodeId,
                });
            } catch (err) {
                console.error(`Failed to save Figma image ${image.nodeId}:`, err);
                // Continue with other images
            }
        }

        return NextResponse.json({
            success: true,
            imported: savedFiles.length,
            files: savedFiles,
        });
    } catch (error) {
        console.error("Figma export error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to export from Figma" },
            { status: 500 }
        );
    }
}
