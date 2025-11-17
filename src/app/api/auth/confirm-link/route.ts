import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import { prisma } from "@/lib/db";
import { logAccountLinked } from "@/lib/security-logger";
import { buildErrorResponse, GENERIC_ERRORS } from "@/lib/error-handler";

/**
 * POST /api/auth/confirm-link
 * Confirms and executes account linking after user approval
 * Issue #15: Verifies that OAuth email matches user's primary email
 */
export async function POST(req: NextRequest) {
    try {
        const session = await getSession();
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

        const userId = session.user.id;

        if (userId !== pendingLink.userId) {
            return NextResponse.json(
                { error: "You can only confirm account linking for your own account" },
                { status: 403 }
            );
        }

        // Issue #15: Verify that OAuth email matches user's primary email
        const user = await prisma.user.findUnique({
            where: { id: pendingLink.userId },
            select: { email: true },
        });

        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        // Email must match exactly (case-insensitive)
        if (user.email.toLowerCase() !== pendingLink.email.toLowerCase()) {
            // Clean up pending link
            await prisma.pendingAccountLink.delete({
                where: { id: pendingLink.id },
            });

            return NextResponse.json(
                {
                    error: `Cannot link ${pendingLink.provider} account. The ${pendingLink.provider} email (${pendingLink.email}) does not match your account email (${user.email}). Please update your ${pendingLink.provider} email to match your account email, or change your account email first.`
                },
                { status: 400 }
            );
        }

        // Check if account is already linked
        const existingAccount = await prisma.account.findFirst({
            where: {
                userId: pendingLink.userId,
                providerId: pendingLink.provider,
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
                providerId: pendingLink.provider,
                accountId: pendingLink.providerAccountId,
            },
        });

        // Delete pending link request
        await prisma.pendingAccountLink.delete({
            where: { id: pendingLink.id },
        });

        console.log(`✅ Account linked successfully: ${pendingLink.provider} → ${pendingLink.email} (email verified to match user's primary email)`);

        // Log account linking (Issue 16)
        await logAccountLinked(
            pendingLink.userId,
            pendingLink.email,
            pendingLink.provider,
            req
        );

        return NextResponse.json({
            success: true,
            message: "Account linked successfully",
        });
    } catch (error) {
        const errorResponse = buildErrorResponse(
            error,
            "Confirm account link",
            500,
            GENERIC_ERRORS.INTERNAL_SERVER_ERROR
        );

        return NextResponse.json(
            { error: errorResponse.error },
            { status: errorResponse.statusCode }
        );
    }
}
