/**
 * API Route: Request Account Deletion OTP
 * POST /api/account/delete/request-otp
 * 
 * Sends an OTP code to the user's email for account deletion verification.
 * Works for both email/password and OAuth users.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sendOTPEmail } from "@/lib/email";
import { prisma } from "@/lib/db";
import { randomInt } from "crypto";

export async function POST(request: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: request.headers,
        });

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
                id: true,
                email: true,
                deletionScheduledAt: true,
            },
        });

        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        // Check if account is already scheduled for deletion
        if (user.deletionScheduledAt) {
            return NextResponse.json(
                {
                    error: "Account is already scheduled for deletion",
                    scheduledAt: user.deletionScheduledAt,
                },
                { status: 400 }
            );
        }

        // Generate 6-digit OTP
        const otp = randomInt(100000, 999999).toString();

        // Store OTP in database with 5-minute expiration
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 5);

        // Delete any existing account deletion OTPs for this user
        await prisma.verification.deleteMany({
            where: {
                identifier: `account-deletion:${user.email}`,
            },
        });

        // Create new OTP record
        await prisma.verification.create({
            data: {
                identifier: `account-deletion:${user.email}`,
                value: otp, // In production, consider hashing this
                expiresAt,
            },
        });

        // Send OTP email
        await sendOTPEmail(user.email, otp, "account-deletion");

        console.log(`📧 Account deletion OTP sent to ${user.email}`);

        return NextResponse.json({
            success: true,
            message: "Verification code sent to your email",
        });

    } catch (error) {
        console.error("Error sending account deletion OTP:", error);
        return NextResponse.json(
            { error: "Failed to send verification code" },
            { status: 500 }
        );
    }
}
