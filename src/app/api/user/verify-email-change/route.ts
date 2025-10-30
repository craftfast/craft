import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * Verify and complete email change
 */
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const token = searchParams.get("token");
        const newEmail = searchParams.get("email");

        if (!token || !newEmail) {
            return NextResponse.redirect(
                `${process.env.NEXT_PUBLIC_APP_URL}/settings?error=Invalid verification link`
            );
        }

        // Find user with this token
        const user = await prisma.user.findFirst({
            where: {
                verificationToken: token,
                verificationTokenExpiry: {
                    gt: new Date(), // Token not expired
                },
            },
        });

        if (!user) {
            return NextResponse.redirect(
                `${process.env.NEXT_PUBLIC_APP_URL}/settings?error=Invalid or expired verification token`
            );
        }

        // Double-check that the new email is not taken by another user
        const existingUser = await prisma.user.findUnique({
            where: { email: decodeURIComponent(newEmail) },
        });

        if (existingUser && existingUser.id !== user.id) {
            return NextResponse.redirect(
                `${process.env.NEXT_PUBLIC_APP_URL}/settings?error=Email already in use`
            );
        }

        // Update user's email
        await prisma.user.update({
            where: { id: user.id },
            data: {
                email: decodeURIComponent(newEmail),
                emailVerified: new Date(), // Mark as verified
                verificationToken: null,
                verificationTokenExpiry: null,
            },
        });

        return NextResponse.redirect(
            `${process.env.NEXT_PUBLIC_APP_URL}/settings?success=Email changed successfully`
        );
    } catch (error) {
        console.error("Email change verification error:", error);
        return NextResponse.redirect(
            `${process.env.NEXT_PUBLIC_APP_URL}/settings?error=Failed to verify email change`
        );
    }
}
