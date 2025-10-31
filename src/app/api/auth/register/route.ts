import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { assignPlanToUser } from "@/lib/subscription";
import { sendVerificationEmailLegacy } from "@/lib/email";
import { randomUUID } from "crypto";
import { validatePassword } from "@/lib/password-validation";
import { logAccountCreated, logVerificationEmailSent } from "@/lib/security-logger";
import { buildErrorResponse, GENERIC_ERRORS } from "@/lib/error-handler";

/**
 * Legacy registration endpoint
 * Note: Better Auth handles registration natively via /api/auth/sign-up/email
 * This route is kept for backward compatibility.
 * Rate limiting is handled by Better Auth.
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, password, name } = body;

        if (!email || !password) {
            return NextResponse.json(
                { error: "Email and password are required" },
                { status: 400 }
            );
        }

        // Validate password strength
        const passwordValidation = validatePassword(password);
        if (!passwordValidation.isValid) {
            return NextResponse.json(
                { error: passwordValidation.errors[0] }, // Return first error
                { status: 400 }
            );
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            // Security: Return the same success message to prevent user enumeration
            // Don't reveal that the email is already registered
            console.log(`⚠️ Registration attempt for existing user: ${email}`);

            // Optionally, you could send an email to the existing user informing them
            // that someone tried to register with their email address

            return NextResponse.json(
                {
                    message: "Registration successful. Please check your email to verify your account.",
                },
                { status: 201 }
            );
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Generate verification token
        const verificationToken = randomUUID();
        const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        // Create user (Better Auth will handle password via Account table)
        const user = await prisma.user.create({
            data: {
                email,
                name: name || null,
                emailVerified: false,
            },
        });

        // Create credential account with password
        await prisma.account.create({
            data: {
                userId: user.id,
                providerId: "credential",
                accountId: email,
                password: hashedPassword,
            },
        });

        // Create verification record
        await prisma.verification.create({
            data: {
                identifier: email,
                value: verificationToken,
                expiresAt: verificationTokenExpiry,
            },
        });

        console.log(`✅ User created: ${user.email}`);

        // Log account creation
        await logAccountCreated(user.id, user.email, request);

        // Send verification email
        try {
            await sendVerificationEmailLegacy(user.email, verificationToken);
            console.log(`✅ Verification email sent to: ${user.email}`);

            // Log verification email sent
            await logVerificationEmailSent(user.id, user.email, request);
        } catch (emailError) {
            console.error("Error sending verification email:", emailError);
            // Don't fail registration if email fails
        }

        // Assign default Hobby plan to new user
        try {
            await assignPlanToUser(user.id, "HOBBY");
            console.log(`✅ Hobby plan assigned to user: ${user.email}`);
        } catch (planError) {
            console.error("Error assigning Hobby plan:", planError);
            // Don't fail the registration if plan assignment fails
            // The user can still use the app with default limits
        }

        return NextResponse.json(
            {
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                },
                message: "Registration successful. Please check your email to verify your account.",
            },
            { status: 201 }
        );
    } catch (error) {
        const errorResponse = buildErrorResponse(
            error,
            "User registration",
            500,
            GENERIC_ERRORS.INTERNAL_SERVER_ERROR
        );

        return NextResponse.json(
            { error: errorResponse.error },
            { status: errorResponse.statusCode }
        );
    }
}
