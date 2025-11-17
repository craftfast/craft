import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import validator from "validator";
import { logEmailChanged } from "@/lib/security-logger";
import { getSession } from "@/lib/get-session";
import { withCsrfProtection } from "@/lib/csrf";

/**
 * Verify and complete email change using OTP
 */
export async function POST(request: NextRequest) {
    try {
        // CSRF Protection
        const csrfCheck = await withCsrfProtection(request);
        if (csrfCheck) return csrfCheck;

        const session = await getSession();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { otp, newEmail } = body;

        if (!otp || !newEmail) {
            return NextResponse.json(
                { error: "OTP and email are required" },
                { status: 400 }
            );
        }

        // Validate OTP format (6 digits)
        if (!/^\d{6}$/.test(otp)) {
            return NextResponse.json(
                { error: "Invalid OTP format" },
                { status: 400 }
            );
        }

        // Validate email format using validator.js
        if (!validator.isEmail(newEmail)) {
            return NextResponse.json(
                { error: "Invalid email format" },
                { status: 400 }
            );
        }

        // Find verification record
        // The identifier format is: "email-change:{userId}:{newEmail}"
        const identifier = `email-change:${session.user.id}:${newEmail}`;

        const verification = await prisma.verification.findFirst({
            where: {
                identifier,
                value: otp,
                expiresAt: {
                    gt: new Date(), // OTP not expired
                },
            },
        });

        if (!verification) {
            return NextResponse.json(
                { error: "Invalid or expired verification code" },
                { status: 400 }
            );
        }

        // Find the user
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
        });

        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        // Double-check that the new email is not taken by another user
        const existingUser = await prisma.user.findUnique({
            where: { email: newEmail },
        });

        if (existingUser && existingUser.id !== user.id) {
            return NextResponse.json(
                { error: "Email already in use" },
                { status: 400 }
            );
        }

        // Update user's email and mark as verified
        const oldEmail = user.email;
        await prisma.user.update({
            where: { id: user.id },
            data: {
                email: newEmail,
                emailVerified: true, // Mark as verified (boolean field)
            },
        });

        // Automatically unlink OAuth accounts that have different emails
        // This prevents "unable_to_link_account" error when user changes email
        // and tries to re-link their OAuth provider with updated email
        const linkedAccounts = await prisma.account.findMany({
            where: {
                userId: user.id,
                providerId: {
                    in: ["google", "github"],
                },
            },
        });

        // Unlink OAuth accounts if their email doesn't match the new email
        for (const account of linkedAccounts) {
            // The account might not have an email field, so we unlink all OAuth accounts
            // to allow the user to re-link with their updated OAuth email
            await prisma.account.delete({
                where: {
                    userId_providerId: {
                        userId: user.id,
                        providerId: account.providerId,
                    },
                },
            });
            console.log(`🔗 Auto-unlinked ${account.providerId} account for user ${user.id} due to email change`);
        }

        // Delete the verification record after successful use
        await prisma.verification.delete({
            where: {
                id: verification.id,
            },
        });

        // Log email change
        await logEmailChanged(user.id, oldEmail, newEmail, request);

        return NextResponse.json({
            success: true,
            message: "Email changed successfully",
            oauthUnlinked: linkedAccounts.length > 0,
            unlinkedProviders: linkedAccounts.map(acc => acc.providerId),
        });
    } catch (error) {
        console.error("Email change verification error:", error);
        return NextResponse.json(
            { error: "Failed to verify email change" },
            { status: 500 }
        );
    }
}
