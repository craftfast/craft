import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import { prisma } from "@/lib/db";
import { uploadFile, deleteFile } from "@/lib/r2-storage";

/**
 * POST /api/user/upload-avatar
 * Upload user profile avatar to R2 storage
 * Body: FormData with 'file' field
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
            select: { id: true, image: true },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Parse FormData
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json(
                { error: "No file provided" },
                { status: 400 }
            );
        }

        // Validate file type
        const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
        if (!validTypes.includes(file.type)) {
            return NextResponse.json(
                { error: "Invalid file type. Supported types: JPEG, PNG, GIF, WebP" },
                { status: 400 }
            );
        }

        // Validate file size (max 5MB)
        const maxSizeInBytes = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSizeInBytes) {
            return NextResponse.json(
                { error: "File size exceeds 5MB limit" },
                { status: 400 }
            );
        }

        // Delete old avatar from R2 if it exists and is an R2 URL
        if (user.image && user.image.includes("/uploads/")) {
            try {
                // Extract file ID from old image URL
                const oldFileId = await prisma.file.findFirst({
                    where: {
                        userId: user.id,
                        r2Url: user.image,
                        purpose: "image", // Using "image" purpose for avatars
                        isDeleted: false,
                    },
                    select: { id: true, r2Key: true },
                });

                if (oldFileId) {
                    await deleteFile(oldFileId.r2Key);
                    await prisma.file.update({
                        where: { id: oldFileId.id },
                        data: { isDeleted: true },
                    });
                }
            } catch (error) {
                console.error("Failed to delete old avatar:", error);
                // Continue anyway - not critical
            }
        }

        // Upload to R2
        const fileBuffer = Buffer.from(await file.arrayBuffer());
        const uploadResult = await uploadFile({
            userId: user.id,
            fileName: file.name,
            fileContent: fileBuffer,
            mimeType: file.type,
            purpose: "image", // Using "image" purpose for avatars
        });

        // Save file record to database
        await prisma.file.create({
            data: {
                userId: user.id,
                r2Key: uploadResult.r2Key,
                r2Url: uploadResult.r2Url,
                fileName: uploadResult.fileName,
                mimeType: uploadResult.mimeType,
                size: uploadResult.size,
                purpose: "image",
            },
        });

        // Update user with R2 URL
        const updatedUser = await prisma.user.update({
            where: { email: session.user.email },
            data: { image: uploadResult.r2Url },
            select: {
                name: true,
                email: true,
                image: true,
            },
        });

        return NextResponse.json({
            success: true,
            user: updatedUser,
            message: "Profile picture uploaded successfully",
        });
    } catch (error) {
        console.error("Error uploading avatar:", error);
        return NextResponse.json(
            { error: "Failed to upload profile picture" },
            { status: 500 }
        );
    }
}
