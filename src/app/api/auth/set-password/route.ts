import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { validatePassword } from "@/lib/password-validation";
import { withCsrfProtection } from "@/lib/csrf";

/**
 * POST /api/auth/set-password
 * Allows OAuth users to add email+password authentication to their account
 */
export async function POST(req: NextRequest) {
    try {
        // CSRF Protection
        const csrfCheck = await withCsrfProtection(req);
        if (csrfCheck) return csrfCheck;

        // Rate limiting check
        const ip = getClientIp(req);
        const { success, limit, remaining, reset } = await checkRateLimit(ip);

        if (!success) {
            return NextResponse.json(
                {
                    error: "Too many password set attempts. Please try again later.",
                    limit,
                    remaining,
                    reset: new Date(reset).toISOString(),
                },
                {
                    status: 429,
                    headers: {
                        'X-RateLimit-Limit': limit.toString(),
                        'X-RateLimit-Remaining': remaining.toString(),
                        'X-RateLimit-Reset': reset.toString(),
                    }
                }
            );
        }

        const session = await getServerSession(authOptions);

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

        const userId = (session.user as { id: string }).id;

        // Check if user already has a password
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { password: true, email: true },
        });

        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        if (user.password) {
            return NextResponse.json(
                { error: "Password already set. Use change password instead." },
                { status: 400 }
            );
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 14);

        // Update user with password and mark email as verified
        await prisma.user.update({
            where: { id: userId },
            data: {
                password: hashedPassword,
                emailVerified: new Date(), // Email is pre-verified for OAuth users
            },
        });

        return NextResponse.json({
            success: true,
            message: "Password set successfully. You can now sign in with email and password.",
        });
    } catch (error) {
        console.error("Error setting password:", error);
        return NextResponse.json(
            { error: "Failed to set password" },
            { status: 500 }
        );
    }
}
