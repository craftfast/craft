/**
 * API Route: Verify and Enable 2FA
 * POST /api/2fa/verify
 * 
 * Verifies a TOTP code and enables 2FA for the user, returning backup codes
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-config";
import { prisma } from "@/lib/db";
import { verifyTOTP, generateBackupCodes, hashBackupCodes } from "@/lib/two-factor";
import { log2FASetup } from "@/lib/two-factor-audit";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { token } = body;

        if (!token || typeof token !== "string") {
            return NextResponse.json(
                { error: "TOTP token is required" },
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

        // Get the user's TOTP secret
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
                twoFactorSecret: true,
                twoFactorEnabled: true,
                email: true,
            },
        });

        if (!user?.twoFactorSecret) {
            return NextResponse.json(
                { error: "2FA setup not initiated. Please start setup first." },
                { status: 400 }
            );
        }

        // Verify the TOTP token
        const isValid = verifyTOTP(user.twoFactorSecret, token, user.email);

        if (!isValid) {
            await log2FASetup(
                { email: user.email, success: false, details: "Invalid TOTP code during setup" },
                request
            );
            return NextResponse.json(
                { error: "Invalid verification code" },
                { status: 400 }
            );
        }

        // Generate backup codes
        const backupCodes = generateBackupCodes(10);
        const hashedCodes = await hashBackupCodes(backupCodes);

        // Enable 2FA and store backup codes
        await prisma.user.update({
            where: { id: session.user.id },
            data: {
                twoFactorEnabled: true,
                backupCodes: hashedCodes,
            },
        });

        // Log successful 2FA setup
        await log2FASetup(
            { userId: session.user.id, email: user.email, success: true },
            request
        );

        return NextResponse.json({
            success: true,
            backupCodes, // Return plaintext codes ONCE for user to save
        });
    } catch (error) {
        console.error("2FA verification error:", error);
        return NextResponse.json(
            { error: "Failed to verify 2FA code" },
            { status: 500 }
        );
    }
}
