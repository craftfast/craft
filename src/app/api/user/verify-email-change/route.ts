import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import validator from "validator";
import { logEmailChanged } from "@/lib/security-logger";

/**
 * Verify and complete email change using POST request
 * Tokens are sent in the request body instead of URL parameters
 * to prevent token leakage in browser history and server logs
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { token, email: newEmail } = body;

        if (!token || !newEmail) {
            return NextResponse.json(
                { error: "Invalid verification link. Missing required parameters." },
                { status: 400 }
            );
        }

        // Validate token format (should be UUID)
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(token)) {
            return NextResponse.json(
                { error: "Invalid token format" },
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
        // The identifier format is: "email_change:{userId}:{newEmail}"
        // We need to find all email_change verifications and match the token
        const verifications = await prisma.verification.findMany({
            where: {
                identifier: {
                    startsWith: "email_change:"
                },
                value: token,
                expiresAt: {
                    gt: new Date(), // Token not expired
                },
            },
        });

        if (verifications.length === 0) {
            return NextResponse.json(
                { error: "Invalid or expired verification token" },
                { status: 400 }
            );
        }

        // Parse the verification identifier to get userId and expected email
        const verification = verifications[0];
        const parts = verification.identifier.split(":");

        if (parts.length !== 3 || parts[0] !== "email_change") {
            return NextResponse.json(
                { error: "Invalid verification format" },
                { status: 400 }
            );
        }

        const userId = parts[1];
        const expectedEmail = parts[2];

        // CRITICAL: Verify that the email in the link matches what we expected
        // This prevents attacks where someone tries to use a valid token for a different email
        if (expectedEmail !== newEmail) {
            return NextResponse.json(
                { error: "Email address doesn't match verification request" },
                { status: 400 }
            );
        }

        // Find the user
        const user = await prisma.user.findUnique({
            where: { id: userId },
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

        // Delete the verification record after successful use
        await prisma.verification.delete({
            where: {
                id: verification.id,
            },
        });

        // Log email change (Issue 16)
        await logEmailChanged(user.id, oldEmail, newEmail, request);

        return NextResponse.json({
            success: true,
            message: "Email changed successfully",
        });
    } catch (error) {
        console.error("Email change verification error:", error);
        return NextResponse.json(
            { error: "Failed to verify email change" },
            { status: 500 }
        );
    }
}
