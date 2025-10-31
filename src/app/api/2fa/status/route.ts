/**
 * API Route: Get 2FA Status
 * GET /api/2fa/status
 * 
 * Returns the 2FA status for the authenticated user
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-config";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
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

        // Get the user's 2FA status
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
                twoFactorEnabled: true,
                backupCodes: true,
            },
        });

        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            enabled: user.twoFactorEnabled,
            backupCodesCount: user.backupCodes.length,
        });
    } catch (error) {
        console.error("2FA status error:", error);
        return NextResponse.json(
            { error: "Failed to get 2FA status" },
            { status: 500 }
        );
    }
}
