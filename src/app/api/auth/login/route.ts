/**
 * API Route: Custom Login with 2FA Support
 * POST /api/auth/login
 * 
 * Custom login endpoint that checks for 2FA and returns a pending token if needed
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { checkAccountLockout } from "@/lib/auth-lockout";
import { createPendingTwoFactorAuth } from "@/lib/two-factor-session";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, password } = body;

        if (!email || !password) {
            return NextResponse.json(
                { error: "Email and password are required" },
                { status: 400 }
            );
        }

        // Check account lockout
        const lockoutStatus = await checkAccountLockout(email);
        if (lockoutStatus.locked) {
            return NextResponse.json(
                {
                    error: lockoutStatus.message ||
                        `Account locked. Try again in ${lockoutStatus.remainingMinutes} minutes.`
                },
                { status: 429 }
            );
        }

        // Get user with password and 2FA settings
        const user = await prisma.user.findUnique({
            where: { email },
            select: {
                id: true,
                email: true,
                password: true,
                twoFactorEnabled: true,
                emailVerified: true,
            },
        });

        if (!user || !user.password) {
            return NextResponse.json(
                { error: "Invalid email or password" },
                { status: 401 }
            );
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return NextResponse.json(
                { error: "Invalid email or password" },
                { status: 401 }
            );
        }

        // Check email verification
        if (!user.emailVerified) {
            return NextResponse.json(
                { error: "Please verify your email before logging in" },
                { status: 403 }
            );
        }

        // If 2FA is enabled, return a pending token
        if (user.twoFactorEnabled) {
            const pendingToken = await createPendingTwoFactorAuth(email);

            return NextResponse.json({
                requiresTwoFactor: true,
                pendingToken,
            });
        }

        // If no 2FA, proceed with normal Better Auth login
        // Return success and let client call Better Auth endpoint
        return NextResponse.json({
            requiresTwoFactor: false,
            canProceed: true,
        });
    } catch (error) {
        console.error("Login error:", error);
        return NextResponse.json(
            { error: "Login failed" },
            { status: 500 }
        );
    }
}
