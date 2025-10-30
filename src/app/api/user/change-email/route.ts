import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { randomUUID } from "crypto";
import { sendEmail } from "@/lib/email";

/**
 * Request email change - sends verification email to new address
 */
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { newEmail } = body;

        if (!newEmail) {
            return NextResponse.json(
                { error: "New email is required" },
                { status: 400 }
            );
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(newEmail)) {
            return NextResponse.json(
                { error: "Invalid email format" },
                { status: 400 }
            );
        }

        // Check if new email is the same as current email
        const currentUser = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { email: true },
        });

        if (currentUser?.email === newEmail) {
            return NextResponse.json(
                { error: "This is already your current email" },
                { status: 400 }
            );
        }

        // Check if email is already in use by another user
        const existingUser = await prisma.user.findUnique({
            where: { email: newEmail },
        });

        if (existingUser) {
            return NextResponse.json(
                { error: "This email is already in use" },
                { status: 400 }
            );
        }

        // Generate verification token
        const verificationToken = randomUUID();
        const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        // Store the new email change request
        await prisma.user.update({
            where: { id: session.user.id },
            data: {
                verificationToken,
                verificationTokenExpiry,
            },
        });

        // Send verification email to NEW email address
        const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/user/verify-email-change?token=${verificationToken}&email=${encodeURIComponent(newEmail)}`;

        await sendEmail({
            to: newEmail,
            subject: "Verify Your Email Change",
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Verify Your Email Change</h2>
          <p>You requested to change your email address. Please click the button below to confirm this change:</p>
          <a href="${verificationUrl}" 
             style="display: inline-block; background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
            Verify Email Change
          </a>
          <p>Or copy and paste this link into your browser:</p>
          <p style="color: #666; word-break: break-all;">${verificationUrl}</p>
          <p style="color: #999; font-size: 12px; margin-top: 40px;">
            This link will expire in 24 hours. If you didn't request this change, you can safely ignore this email.
          </p>
        </div>
      `,
        });

        return NextResponse.json({
            success: true,
            message: `Verification email sent to ${newEmail}. Please check your inbox to confirm the change.`,
        });
    } catch (error) {
        console.error("Email change request error:", error);
        return NextResponse.json(
            { error: "Failed to process email change request" },
            { status: 500 }
        );
    }
}
