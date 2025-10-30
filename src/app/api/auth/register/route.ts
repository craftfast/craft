import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { assignPlanToUser } from "@/lib/subscription";
import { sendVerificationEmail } from "@/lib/email";
import crypto from "crypto";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
    try {
        // Rate limiting check
        const ip = getClientIp(request);
        const { success, limit, remaining, reset } = await checkRateLimit(ip);

        if (!success) {
            return NextResponse.json(
                {
                    error: "Too many registration attempts. Please try again later.",
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

        const body = await request.json();
        const { email, password, name } = body;

        if (!email || !password) {
            return NextResponse.json(
                { error: "Email and password are required" },
                { status: 400 }
            );
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return NextResponse.json(
                { error: "User already exists" },
                { status: 400 }
            );
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Generate verification token
        const verificationToken = crypto.randomBytes(32).toString("hex");
        const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        // Create user (no team needed - direct user subscriptions)
        const user = await prisma.user.create({
            data: {
                email,
                name: name || null,
                password: hashedPassword,
                verificationToken,
                verificationTokenExpiry,
            },
        });

        console.log(`✅ User created: ${user.email}`);

        // Send verification email
        try {
            await sendVerificationEmail(user.email, verificationToken);
            console.log(`✅ Verification email sent to: ${user.email}`);
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
        console.error("Registration error:", error);
        return NextResponse.json(
            { error: "Something went wrong" },
            { status: 500 }
        );
    }
}
