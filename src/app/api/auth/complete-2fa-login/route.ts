/**
 * API Route: Complete 2FA Login
 * POST /api/auth/complete-2fa-login
 * 
 * Completes the login process after 2FA verification
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-config";
import {
    getPendingTwoFactorAuth,
    isTwoFactorAuthVerified,
    deletePendingTwoFactorAuth
} from "@/lib/two-factor-session";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { pendingToken, password } = body;

        if (!pendingToken || typeof pendingToken !== "string") {
            return NextResponse.json(
                { error: "Pending token is required" },
                { status: 400 }
            );
        }

        // Check if 2FA was verified
        if (!(await isTwoFactorAuthVerified(pendingToken))) {
            return NextResponse.json(
                { error: "2FA verification not completed or expired" },
                { status: 400 }
            );
        }

        // Get the pending auth info
        const pendingAuth = await getPendingTwoFactorAuth(pendingToken);
        if (!pendingAuth) {
            return NextResponse.json(
                { error: "Invalid or expired pending token" },
                { status: 400 }
            );
        }

        // Clean up pending token
        await deletePendingTwoFactorAuth(pendingToken);

        // Create session using Better Auth
        const response = await auth.api.signInEmail({
            body: {
                email: pendingAuth.email,
                password: password,
            },
            // Pass through headers and other request context
            headers: request.headers,
        });

        return response;
    } catch (error) {
        console.error("Complete 2FA login error:", error);
        return NextResponse.json(
            { error: "Failed to complete login" },
            { status: 500 }
        );
    }
}
