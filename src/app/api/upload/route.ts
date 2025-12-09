/**
 * File Upload API
 * Handles file uploads to Cloudflare R2 (before or after project creation)
 * Supports images, source files, and general assets
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import { prisma } from "@/lib/db";
import { uploadFile, getFileSizeLimit } from "@/lib/r2-storage";

// Note: In Next.js App Router, body parsing is handled automatically by NextRequest
// No need for config.api.bodyParser = false like in Pages Router

/**
 * POST /api/upload - Upload files to R2 storage
 * Request body: FormData with files
 * Query params: ?projectId=xxx&purpose=image|source|asset|upload
 */
export async function POST(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get user from database
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Get query params
        const searchParams = req.nextUrl.searchParams;
        const projectId = searchParams.get("projectId") || undefined;
        const purpose = (searchParams.get("purpose") as "source" | "image" | "asset" | "upload") || "upload";

        // If projectId is provided, verify ownership
        if (projectId) {
            const project = await prisma.project.findFirst({
                where: {
                    id: projectId,
                    userId: user.id,
                },
            });

            if (!project) {
                return NextResponse.json({ error: "Project not found or access denied" }, { status: 404 });
            }
        }

        // Parse FormData
        const formData = await req.formData();
        const files = formData.getAll("files");

        if (files.length === 0) {
            return NextResponse.json({ error: "No files provided" }, { status: 400 });
        }

        const sizeLimit = getFileSizeLimit(purpose);
        const uploadedFiles = [];

        for (const file of files) {
            if (!(file instanceof File)) {
                continue;
            }

            // Validate file size
            if (file.size > sizeLimit) {
                return NextResponse.json(
                    { error: `File ${file.name} exceeds size limit of ${sizeLimit / (1024 * 1024)}MB` },
                    { status: 413 }
                );
            }

            // Read file content
            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            // Upload to R2
            const uploaded = await uploadFile({
                userId: user.id,
                fileName: file.name,
                fileContent: buffer,
                mimeType: file.type,
                purpose,
                projectId,
            });

            // Save to database
            const projectFile = await prisma.file.create({
                data: {
                    userId: user.id,
                    projectId: projectId || null,
                    path: projectId ? file.name : `uploads/${file.name}`, // Temporary path if no project
                    r2Key: uploaded.r2Key,
                    r2Url: uploaded.r2Url,
                    fileName: uploaded.fileName,
                    mimeType: uploaded.mimeType,
                    size: uploaded.size,
                    purpose,
                    version: 1,
                },
            });

            uploadedFiles.push({
                id: projectFile.id,
                fileName: projectFile.fileName,
                url: projectFile.r2Url,
                size: projectFile.size,
                mimeType: projectFile.mimeType,
                r2Key: projectFile.r2Key,
            });
        }

        console.log(`📤 Uploaded ${uploadedFiles.length} file(s) for user ${user.email}`);

        return NextResponse.json({
            success: true,
            files: uploadedFiles,
            message: `Successfully uploaded ${uploadedFiles.length} file(s)`,
        });
    } catch (error) {
        console.error("File upload error:", error);
        return NextResponse.json(
            { error: "Failed to upload files", details: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        );
    }
}

/**
 * GET /api/upload?projectId=xxx - Get uploaded files for a project or user
 */
export async function GET(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const searchParams = req.nextUrl.searchParams;
        const projectId = searchParams.get("projectId");
        const purpose = searchParams.get("purpose");

        // Build query
        const where: {
            userId: string;
            projectId?: string | null;
            purpose?: string;
            isDeleted: boolean;
        } = {
            userId: user.id,
            isDeleted: false,
        };

        if (projectId) {
            where.projectId = projectId;
        }

        if (purpose) {
            where.purpose = purpose;
        }

        const files = await prisma.file.findMany({
            where,
            orderBy: {
                createdAt: "desc",
            },
        });

        return NextResponse.json({
            success: true,
            files: files.map((f: typeof files[number]) => ({
                id: f.id,
                fileName: f.fileName,
                url: f.r2Url,
                size: f.size,
                mimeType: f.mimeType,
                purpose: f.purpose,
                path: f.path,
                createdAt: f.createdAt,
            })),
        });
    } catch (error) {
        console.error("Error fetching files:", error);
        return NextResponse.json(
            { error: "Failed to fetch files" },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/upload?fileId=xxx - Soft delete a file
 */
export async function DELETE(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const searchParams = req.nextUrl.searchParams;
        const fileId = searchParams.get("fileId");

        if (!fileId) {
            return NextResponse.json({ error: "Missing fileId" }, { status: 400 });
        }

        // Verify ownership
        const file = await prisma.file.findFirst({
            where: {
                id: fileId,
                userId: user.id,
            },
        });

        if (!file) {
            return NextResponse.json({ error: "File not found or access denied" }, { status: 404 });
        }

        // Soft delete
        await prisma.file.update({
            where: { id: fileId },
            data: { isDeleted: true },
        });

        console.log(`🗑️ Soft deleted file ${file.fileName} (${fileId})`);

        return NextResponse.json({
            success: true,
            message: "File deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting file:", error);
        return NextResponse.json(
            { error: "Failed to delete file" },
            { status: 500 }
        );
    }
}
