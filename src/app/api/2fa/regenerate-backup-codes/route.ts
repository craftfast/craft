/**
 * API Route: Regenerate Backup Codes
 * POST /api/2fa/regenerate-backup-codes
 * 
 * Generates new backup codes for a user with 2FA enabled
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-config";
import { prisma } from "@/lib/db";
import { generateBackupCodes, hashBackupCodes, verifyTOTP } from "@/lib/two-factor";
import { log2FABackupCodesRegenerated } from "@/lib/two-factor-audit";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { token } = body;

        if (!token || typeof token !== "string") {
            return NextResponse.json(
                { error: "TOTP token is required to regenerate backup codes" },
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

        // Get the user's 2FA settings
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
                twoFactorEnabled: true,
                twoFactorSecret: true,
                email: true,
            },
        });

        if (!user?.twoFactorEnabled || !user.twoFactorSecret) {
            return NextResponse.json(
                { error: "2FA is not enabled" },
                { status: 400 }
            );
        }

        // Verify the TOTP token for security
        const isValid = verifyTOTP(user.twoFactorSecret, token, user.email);

        if (!isValid) {
            return NextResponse.json(
                { error: "Invalid verification code" },
                { status: 400 }
            );
        }

        // Generate new backup codes
        const backupCodes = generateBackupCodes(10);
        const hashedCodes = await hashBackupCodes(backupCodes);

        // Update backup codes
        await prisma.user.update({
            where: { id: session.user.id },
            data: { backupCodes: hashedCodes },
        });

        // Log backup codes regeneration
        await log2FABackupCodesRegenerated(
            { userId: session.user.id, email: user.email, success: true },
            request
        );

        return NextResponse.json({
            success: true,
            backupCodes, // Return plaintext codes ONCE for user to save
        });
    } catch (error) {
        console.error("Backup codes regeneration error:", error);
        return NextResponse.json(
            { error: "Failed to regenerate backup codes" },
            { status: 500 }
        );
    }
}
