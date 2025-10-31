/**
 * API Route: Disable 2FA
 * POST /api/2fa/disable
 * 
 * Disables 2FA for the authenticated user (requires password confirmation)
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-config";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { log2FADisable } from "@/lib/two-factor-audit";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { password } = body;

        if (!password || typeof password !== "string") {
            return NextResponse.json(
                { error: "Password is required to disable 2FA" },
                { status: 400 }
            );
        }

        // Get the authenticated session
        const session = await auth.api.getSession({
            headers: request.headers,
        });

        if (!session?.user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Get the user's password
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
                password: true,
                twoFactorEnabled: true,
            },
        });

        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        if (!user.twoFactorEnabled) {
            return NextResponse.json(
                { error: "2FA is not enabled" },
                { status: 400 }
            );
        }

        // Verify password
        if (!user.password) {
            return NextResponse.json(
                { error: "Cannot disable 2FA: No password set. Please use social login to manage 2FA." },
                { status: 400 }
            );
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            await log2FADisable(
                { email: session.user.email, success: false, details: "Invalid password" },
                request
            );
            return NextResponse.json(
                { error: "Invalid password" },
                { status: 400 }
            );
        }

        // Disable 2FA and clear secret and backup codes
        await prisma.user.update({
            where: { id: session.user.id },
            data: {
                twoFactorEnabled: false,
                twoFactorSecret: null,
                backupCodes: [],
            },
        });

        // Log successful 2FA disable
        await log2FADisable(
            { userId: session.user.id, email: session.user.email, success: true },
            request
        );

        return NextResponse.json({
            success: true,
            message: "2FA has been disabled",
        });
    } catch (error) {
        console.error("2FA disable error:", error);
        return NextResponse.json(
            { error: "Failed to disable 2FA" },
            { status: 500 }
        );
    }
}
