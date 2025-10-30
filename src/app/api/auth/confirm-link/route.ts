import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * POST /api/auth/confirm-link
 * Confirms and executes account linking after user approval
 */
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        const { token } = await req.json();

        if (!token) {
            return NextResponse.json(
                { error: "Token is required" },
                { status: 400 }
            );
        }

        // Find pending link request
        const pendingLink = await prisma.pendingAccountLink.findUnique({
            where: { token },
        });

        if (!pendingLink) {
            return NextResponse.json(
                { error: "Invalid or expired link request" },
                { status: 404 }
            );
        }

        // Check if expired
        if (new Date() > pendingLink.expiresAt) {
            // Clean up expired link
            await prisma.pendingAccountLink.delete({
                where: { id: pendingLink.id },
            });

            return NextResponse.json(
                { error: "Link request has expired" },
                { status: 410 }
            );
        }

        // Verify the user is authenticated and matches the pending link
        if (!session?.user) {
            return NextResponse.json(
                { error: "You must be signed in to confirm account linking" },
                { status: 401 }
            );
        }

        const userId = (session.user as { id: string }).id;

        if (userId !== pendingLink.userId) {
            return NextResponse.json(
                { error: "You can only confirm account linking for your own account" },
                { status: 403 }
            );
        }

        // Check if account is already linked
        const existingAccount = await prisma.account.findFirst({
            where: {
                userId: pendingLink.userId,
                provider: pendingLink.provider,
            },
        });

        if (existingAccount) {
            // Already linked, clean up pending request
            await prisma.pendingAccountLink.delete({
                where: { id: pendingLink.id },
            });

            return NextResponse.json({
                success: true,
                message: "Account is already linked",
            });
        }

        // Link the account
        await prisma.account.create({
            data: {
                userId: pendingLink.userId,
                type: "oauth",
                provider: pendingLink.provider,
                providerAccountId: pendingLink.providerAccountId,
            },
        });

        // Add provider email to user emails if not already present
        const existingUserEmail = await prisma.userEmail.findUnique({
            where: { email: pendingLink.email },
        });

        if (!existingUserEmail) {
            await prisma.userEmail.create({
                data: {
                    userId: pendingLink.userId,
                    email: pendingLink.email,
                    provider: pendingLink.provider,
                    providerAccountId: pendingLink.providerAccountId,
                    isPrimary: false,
                    isVerified: true, // OAuth emails are pre-verified
                },
            });
        }

        // Delete pending link request
        await prisma.pendingAccountLink.delete({
            where: { id: pendingLink.id },
        });

        console.log(`✅ Account linked successfully: ${pendingLink.provider} → ${pendingLink.email}`);

        return NextResponse.json({
            success: true,
            message: "Account linked successfully",
        });
    } catch (error) {
        console.error("Error confirming account link:", error);
        return NextResponse.json(
            { error: "Failed to confirm account link" },
            { status: 500 }
        );
    }
}
