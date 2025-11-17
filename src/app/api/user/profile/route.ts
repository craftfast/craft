import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import { prisma } from "@/lib/db";
import { deleteFile } from "@/lib/r2-storage";
import { withCsrfProtection } from "@/lib/csrf";

/**
 * GET /api/user/profile
 * Get user profile information
 */
export async function GET(req: NextRequest) {
    try {
        const session = await getSession();

        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: {
                id: true,
                name: true,
                email: true,
                image: true,
                emailVerified: true,
                accounts: {
                    select: {
                        providerId: true,
                    },
                },
            },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Determine if user has OAuth accounts
        const hasOAuthAccount = user.accounts.some(
            (account: { providerId: string }) => account.providerId === "google" || account.providerId === "github"
        );

        return NextResponse.json({
            name: user.name,
            email: user.email,
            image: user.image,
            emailVerified: user.emailVerified,
            hasOAuthAccount,
        });
    } catch (error) {
        console.error("Error fetching user profile:", error);
        return NextResponse.json(
            { error: "Failed to fetch user profile" },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/user/profile
 * Update user profile (name, email, image)
 * Body: { name?: string, email?: string }
 */
export async function PATCH(req: NextRequest) {
    try {
        // CSRF Protection
        const csrfCheck = await withCsrfProtection(req);
        if (csrfCheck) return csrfCheck;

        const session = await getSession();

        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { name } = body;

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: {
                accounts: {
                    select: {
                        providerId: true,
                    },
                },
            },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const updateData: {
            name?: string;
        } = {};

        // Update name (allowed for all users)
        if (name !== undefined) {
            if (typeof name !== "string" || name.length > 100) {
                return NextResponse.json(
                    { error: "Invalid name. Must be a string with max 100 characters" },
                    { status: 400 }
                );
            }
            const trimmedName = name.trim();
            updateData.name = trimmedName || undefined;
        }

        // Update user
        const updatedUser = await prisma.user.update({
            where: { email: session.user.email },
            data: updateData,
            select: {
                name: true,
                email: true,
                image: true,
            },
        });

        return NextResponse.json({
            success: true,
            user: updatedUser,
            message: "Profile updated successfully",
        });
    } catch (error) {
        console.error("Error updating user profile:", error);
        return NextResponse.json(
            { error: "Failed to update user profile" },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/user/profile/image
 * Remove user profile image
 */
export async function DELETE(req: NextRequest) {
    try {
        // CSRF Protection
        const csrfCheck = await withCsrfProtection(req);
        if (csrfCheck) return csrfCheck;

        const session = await getSession();

        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get user with their current image
        const currentUser = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true, image: true },
        });

        if (!currentUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Delete from R2 if the image is stored there
        if (currentUser.image && currentUser.image.includes("/uploads/")) {
            try {
                const fileRecord = await prisma.file.findFirst({
                    where: {
                        userId: currentUser.id,
                        r2Url: currentUser.image,
                        purpose: "image",
                        isDeleted: false,
                    },
                    select: { id: true, r2Key: true },
                });

                if (fileRecord) {
                    await deleteFile(fileRecord.r2Key);
                    await prisma.file.update({
                        where: { id: fileRecord.id },
                        data: { isDeleted: true },
                    });
                }
            } catch (error) {
                console.error("Failed to delete image from R2:", error);
                // Continue anyway - we'll still remove from user profile
            }
        }

        // Update user to remove image
        const user = await prisma.user.update({
            where: { email: session.user.email },
            data: { image: null },
            select: {
                name: true,
                email: true,
                image: true,
            },
        });

        return NextResponse.json({
            success: true,
            user,
            message: "Profile image removed successfully",
        });
    } catch (error) {
        console.error("Error removing profile image:", error);
        return NextResponse.json(
            { error: "Failed to remove profile image" },
            { status: 500 }
        );
    }
}
