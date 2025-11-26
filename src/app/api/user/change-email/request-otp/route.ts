/**
 * API Route: Request Email Change OTP
 * POST /api/user/change-email/request-otp
 * 
 * Sends an OTP code to the new email address for verification.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import { sendOTPEmail } from "@/lib/email";
import { prisma } from "@/lib/db";
import { randomInt } from "crypto";
import { withCsrfProtection } from "@/lib/csrf";
import validator from "validator";
import { logEmailChangeRequested } from "@/lib/security-logger";

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
        const { newEmail } = body;

        if (!newEmail) {
            return NextResponse.json(
                { error: "New email is required" },
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

        // Get current user
        const currentUser = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { email: true },
        });

        if (!currentUser) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        // Check if new email is the same as current email
        if (currentUser.email === newEmail) {
            return NextResponse.json(
                { error: "This is already your current email" },
                { status: 400 }
            );
        }

        // Check if email is already in use by another user
        const existingUser = await prisma.user.findUnique({
            where: { email: newEmail },
        });

        if (existingUser) {
            return NextResponse.json(
                { error: "This email is already in use" },
                { status: 400 }
            );
        }

        // Generate 6-digit OTP
        const otp = randomInt(100000, 999999).toString();

        // Store OTP in database with 5-minute expiration
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 5);

        // Delete any existing email change OTPs for this user
        await prisma.verification.deleteMany({
            where: {
                identifier: {
                    startsWith: `email-change:${session.user.id}:`
                }
            },
        });

        // Create new OTP record
        // Format: "email-change:{userId}:{newEmail}"
        const identifier = `email-change:${session.user.id}:${newEmail}`;

        await prisma.verification.create({
            data: {
                identifier,
                value: otp, // In production, consider hashing this
                expiresAt,
            },
        });

        // Send OTP email to NEW email address
        await sendOTPEmail(newEmail, otp, "email-change");

        // Log email change request
        await logEmailChangeRequested(
            session.user.id,
            currentUser.email,
            newEmail,
            request
        );

        console.log(`📧 Email change OTP sent to ${newEmail}`);

        return NextResponse.json({
            success: true,
            message: `Verification code sent to ${newEmail}`,
        });

    } catch (error) {
        console.error("Error sending email change OTP:", error);
        return NextResponse.json(
            { error: "Failed to send verification code" },
            { status: 500 }
        );
    }
}
