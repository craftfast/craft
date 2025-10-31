/**
 * API Route: Setup 2FA
 * POST /api/2fa/setup
 * 
 * Generates a new TOTP secret and QR code for the authenticated user
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-config";
import { prisma } from "@/lib/db";
import { generateTOTPSecret, generateQRCode } from "@/lib/two-factor";

export async function POST(request: NextRequest) {
    try {
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

        // Check if 2FA is already enabled
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { twoFactorEnabled: true },
        });

        if (user?.twoFactorEnabled) {
            return NextResponse.json(
                { error: "2FA is already enabled. Disable it first to set up a new secret." },
                { status: 400 }
            );
        }

        // Generate a new TOTP secret
        const secret = generateTOTPSecret();

        // Generate QR code
        const qrCode = await generateQRCode(secret, session.user.email);

        // Store the secret temporarily (not enabled yet - needs verification)
        await prisma.user.update({
            where: { id: session.user.id },
            data: {
                twoFactorSecret: secret,
                twoFactorEnabled: false, // Not enabled until verified
            },
        });

        return NextResponse.json({
            secret,
            qrCode,
        });
    } catch (error) {
        console.error("2FA setup error:", error);
        return NextResponse.json(
            { error: "Failed to set up 2FA" },
            { status: 500 }
        );
    }
}
