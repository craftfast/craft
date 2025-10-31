/**
 * API Route: Verify 2FA During Login
 * POST /api/2fa/verify-login
 * 
 * Verifies a TOTP code or backup code during the login process
 * This is called after initial email/password verification
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyTOTP, verifyBackupCode } from "@/lib/two-factor";
import { getPendingTwoFactorAuth, markTwoFactorAuthVerified } from "@/lib/two-factor-session";
import { log2FAVerification } from "@/lib/two-factor-audit";
import { checkTwoFactorRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { pendingToken, token, isBackupCode } = body;

        // Rate limiting - 5 attempts per 15 minutes per IP
        const clientIp = getClientIp(request);
        const identifier = `2fa-verify:${clientIp}`;
        const { success, reset } = await checkTwoFactorRateLimit(identifier);

        if (!success) {
            const minutesUntilReset = Math.ceil((reset - Date.now()) / 60000);
            return NextResponse.json(
                { error: `Too many verification attempts. Please try again in ${minutesUntilReset} minutes.` },
                { status: 429 }
            );
        }

        if (!pendingToken || typeof pendingToken !== "string") {
            return NextResponse.json(
                { error: "Pending token is required" },
                { status: 400 }
            );
        }

        if (!token || typeof token !== "string") {
            return NextResponse.json(
                { error: "Verification code is required" },
                { status: 400 }
            );
        }

        // Get the pending auth session
        const pendingAuth = await getPendingTwoFactorAuth(pendingToken);
        if (!pendingAuth) {
            return NextResponse.json(
                { error: "Invalid or expired pending token" },
                { status: 400 }
            );
        }

        const { email } = pendingAuth;

        // Get the user's 2FA settings
        const user = await prisma.user.findUnique({
            where: { email },
            select: {
                id: true,
                twoFactorEnabled: true,
                twoFactorSecret: true,
                backupCodes: true,
                email: true,
            },
        });

        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        if (!user.twoFactorEnabled || !user.twoFactorSecret) {
            return NextResponse.json(
                { error: "2FA is not enabled for this account" },
                { status: 400 }
            );
        }

        let isValid = false;

        // Verify backup code
        if (isBackupCode) {
            const backupCodeIndex = await verifyBackupCode(token, user.backupCodes);

            if (backupCodeIndex !== -1) {
                isValid = true;

                // Remove the used backup code
                const updatedBackupCodes = user.backupCodes.filter(
                    (_, index) => index !== backupCodeIndex
                );

                await prisma.user.update({
                    where: { id: user.id },
                    data: { backupCodes: updatedBackupCodes },
                });
            }
        } else {
            // Verify TOTP
            isValid = verifyTOTP(user.twoFactorSecret, token, user.email);
        }

        if (!isValid) {
            await log2FAVerification(
                { email: user.email, success: false, details: "Invalid code" },
                isBackupCode ? "backup" : "totp",
                request
            );
            return NextResponse.json(
                { error: "Invalid verification code" },
                { status: 400 }
            );
        }

        // Mark the pending auth as verified
        await markTwoFactorAuthVerified(pendingToken);

        // Log successful verification
        await log2FAVerification(
            { userId: user.id, email: user.email, success: true },
            isBackupCode ? "backup" : "totp",
            request
        );

        return NextResponse.json({
            success: true,
            userId: user.id,
        });
    } catch (error) {
        console.error("2FA login verification error:", error);
        return NextResponse.json(
            { error: "Failed to verify 2FA code" },
            { status: 500 }
        );
    }
}
