import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import validator from "validator";

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

        // Find user with this token
        const user = await prisma.user.findFirst({
            where: {
                verificationToken: token,
                verificationTokenExpiry: {
                    gt: new Date(), // Token not expired
                },
            },
        });

        if (!user) {
            return NextResponse.json(
                { error: "Invalid or expired verification token" },
                { status: 400 }
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

        // Update user's email
        await prisma.user.update({
            where: { id: user.id },
            data: {
                email: newEmail,
                emailVerified: new Date(), // Mark as verified
                verificationToken: null,
                verificationTokenExpiry: null,
            },
        });

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
