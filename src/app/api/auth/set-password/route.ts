import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import { auth } from "@/lib/auth";
import { validatePassword } from "@/lib/password-validation";
import { withCsrfProtection } from "@/lib/csrf";
import { logPasswordSet } from "@/lib/security-logger";
import { buildErrorResponse, GENERIC_ERRORS } from "@/lib/error-handler";

/**
 * POST /api/auth/set-password
 * Allows OAuth users to add email+password authentication to their account
 * Uses Better Auth's native setPassword API
 * 
 * Note: This is a custom endpoint that wraps Better Auth functionality
 * to provide additional validation and logging for the specific use case
 * of OAuth users adding password authentication.
 */
export async function POST(req: NextRequest) {
    try {
        // CSRF Protection
        const csrfCheck = await withCsrfProtection(req);
        if (csrfCheck) return csrfCheck;

        const session = await getSession();

        if (!session?.user?.email) {
            return NextResponse.json(
                { error: "Not authenticated" },
                { status: 401 }
            );
        }

        const { password } = await req.json();

        // Validate password strength
        const passwordValidation = validatePassword(password);
        if (!passwordValidation.isValid) {
            return NextResponse.json(
                { error: passwordValidation.errors[0] },
                { status: 400 }
            );
        }

        const userId = session.user.id;
        const userEmail = session.user.email;

        try {
            // Use Better Auth's native setPassword API
            // It uses the current session to identify the user
            await auth.api.setPassword({
                body: {
                    newPassword: password,
                },
                headers: req.headers,
            });

            // Log password set
            await logPasswordSet(userId, userEmail, req);

            return NextResponse.json({
                success: true,
                message: "Password set successfully. You can now sign in with email and password.",
            });
        } catch (authError: unknown) {
            // Handle Better Auth specific errors
            const error = authError as Error & { message?: string };
            if (error.message?.includes("already has a password")) {
                return NextResponse.json(
                    { error: "Password already set. Use change password instead." },
                    { status: 400 }
                );
            }

            throw authError;
        }
    } catch (error) {
        const errorResponse = buildErrorResponse(
            error,
            "Set password",
            500,
            GENERIC_ERRORS.INTERNAL_SERVER_ERROR
        );

        return NextResponse.json(
            { error: errorResponse.error },
            { status: errorResponse.statusCode }
        );
    }
}
