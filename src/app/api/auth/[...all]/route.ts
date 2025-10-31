import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";
import { NextRequest, NextResponse } from "next/server";
import {
    checkAccountLockout,
    incrementFailedAttempts,
} from "@/lib/auth-lockout";
import { logLoginFailure } from "@/lib/security-logger";

const handlers = toNextJsHandler(auth);

export const GET = handlers.GET;

/**
 * Wrap POST to handle account lockout checks
 * 
 * Note: Rate limiting is handled in Better Auth hooks (auth-config.ts)
 * to avoid duplicate checks and maintain consistency.
 */
export async function POST(request: NextRequest) {
    const url = new URL(request.url);
    const pathname = url.pathname;
    const isEmailSignIn = pathname.endsWith("/sign-in/email");

    // Handle email sign-in with lockout check
    if (isEmailSignIn) {
        try {
            // Clone request to read body
            const body = await request.clone().json();
            const email = body?.email;

            if (email && typeof email === "string") {
                // Check if account is locked
                const lockoutStatus = await checkAccountLockout(email);

                if (lockoutStatus.locked) {
                    await logLoginFailure(
                        email,
                        request,
                        lockoutStatus.message || "Account locked"
                    );

                    return NextResponse.json(
                        {
                            error: lockoutStatus.message,
                            locked: true,
                            remainingMinutes: lockoutStatus.remainingMinutes,
                        },
                        { status: 403 }
                    );
                }
            }
        } catch (e) {
            // If body parsing fails, continue to Better Auth
            console.error("Error checking lockout:", e);
        }
    }

    // Call Better Auth handler
    const response = await handlers.POST(request);

    // Handle failed email sign-in
    if (isEmailSignIn && response.status >= 400) {
        try {
            const body = await request.clone().json();
            const email = body?.email;

            if (email && typeof email === "string") {
                // Increment failed attempts
                const lockoutResult = await incrementFailedAttempts(email, request);

                // If account was just locked, return updated error
                if (lockoutResult.locked) {
                    return NextResponse.json(
                        {
                            error: lockoutResult.message,
                            locked: true,
                            remainingMinutes: lockoutResult.remainingMinutes,
                        },
                        { status: 403 }
                    );
                }

                // Add attempts remaining to response
                const originalError = await response.clone().json();
                return NextResponse.json(
                    {
                        ...originalError,
                        attemptsRemaining: 5 - (lockoutResult.failedAttempts || 0),
                    },
                    { status: response.status }
                );
            }
        } catch (e) {
            // Silently fail - return original response
            console.error("Error handling failed login:", e);
        }
    }

    return response;
}
