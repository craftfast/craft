import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendVerificationEmailLegacy } from "@/lib/email";
import { randomUUID } from "crypto";
import { buildErrorResponse, GENERIC_ERRORS } from "@/lib/error-handler";

/**
 * Legacy resend verification endpoint
 * Note: Better Auth handles email verification resending natively.
 * This route is kept for backward compatibility.
 * Rate limiting is handled by Better Auth.
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email } = body;

        if (!email) {
            return NextResponse.json(
                { error: "Email is required" },
                { status: 400 }
            );
        }

        // Find user
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            // Don't reveal if user exists or not
            return NextResponse.json(
                { message: "If the email exists, a verification link has been sent" },
                { status: 200 }
            );
        }

        // Check if already verified
        if (user.emailVerified) {
            return NextResponse.json(
                { error: "Email is already verified" },
                { status: 400 }
            );
        }

        // Generate new verification token
        const verificationToken = randomUUID();
        const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        // Create verification record
        await prisma.verification.create({
            data: {
                identifier: email,
                value: verificationToken,
                expiresAt: verificationTokenExpiry,
            },
        });

        // Send verification email
        await sendVerificationEmailLegacy(user.email, verificationToken);

        return NextResponse.json(
            { message: "Verification email sent successfully" },
            { status: 200 }
        );
    } catch (error) {
        const errorResponse = buildErrorResponse(
            error,
            "Resend verification email",
            500,
            GENERIC_ERRORS.INTERNAL_SERVER_ERROR
        );

        return NextResponse.json(
            { error: errorResponse.error },
            { status: errorResponse.statusCode }
        );
    }
}
