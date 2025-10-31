import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { validatePassword } from "@/lib/password-validation";
import { withCsrfProtection } from "@/lib/csrf";
import { logPasswordSet } from "@/lib/security-logger";
import { buildErrorResponse, GENERIC_ERRORS } from "@/lib/error-handler";

/**
 * POST /api/auth/set-password
 * Allows OAuth users to add email+password authentication to their account
 * Note: Rate limiting is handled by Better Auth at the infrastructure level
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
                { error: passwordValidation.errors[0] }, // Return first error
                { status: 400 }
            );
        }

        const userId = session.user.id;

        // Check if user exists
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { email: true },
        });

        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        // Check if user already has password via Account table
        const existingPasswordAccount = await prisma.account.findFirst({
            where: {
                userId,
                providerId: "credential",
            },
        });

        if (existingPasswordAccount) {
            return NextResponse.json(
                { error: "Password already set. Use change password instead." },
                { status: 400 }
            );
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create credential account for password auth
        await prisma.account.create({
            data: {
                userId,
                providerId: "credential",
                accountId: user.email,
                password: hashedPassword,
            },
        });

        // Mark email as verified for OAuth users
        await prisma.user.update({
            where: { id: userId },
            data: {
                emailVerified: true,
            },
        });

        // Log password set
        await logPasswordSet(userId, user.email, req);

        return NextResponse.json({
            success: true,
            message: "Password set successfully. You can now sign in with email and password.",
        });
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
