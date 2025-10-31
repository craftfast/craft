/**
 * Account Unlock Service
 * 
 * Provides self-service account unlock functionality via email verification.
 * Users can request an unlock link if their account is locked.
 * 
 * Features:
 * - Generate secure unlock tokens
 * - Send unlock emails
 * - Verify and unlock accounts
 * - Token expiration (1 hour)
 */

import { prisma } from "@/lib/db";
import crypto from "crypto";
import { sendEmail } from "@/lib/email";
import { logLockoutCleared } from "@/lib/security-logger";

const UNLOCK_TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

interface UnlockTokenData {
    token: string;
    expiresAt: Date;
}

/**
 * Generate a secure unlock token
 */
function generateUnlockToken(): UnlockTokenData {
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + UNLOCK_TOKEN_EXPIRY_MS);
    return { token, expiresAt };
}

/**
 * Request account unlock via email
 * @param email - User's email address
 * @returns Success status
 */
export async function requestAccountUnlock(
    email: string
): Promise<{ success: boolean; message: string }> {
    const user = await prisma.user.findUnique({
        where: { email },
        select: {
            id: true,
            email: true,
            name: true,
            lockedUntil: true,
        },
    });

    // Don't reveal if user exists or not
    if (!user) {
        return {
            success: true,
            message: "If your account is locked, an unlock link has been sent to your email.",
        };
    }

    // Check if account is actually locked
    if (!user.lockedUntil || user.lockedUntil <= new Date()) {
        return {
            success: true,
            message: "If your account is locked, an unlock link has been sent to your email.",
        };
    }

    // Generate unlock token
    const { token, expiresAt } = generateUnlockToken();

    // Store token in verification table
    await prisma.verification.create({
        data: {
            identifier: `unlock:${user.id}`,
            value: token,
            expiresAt,
        },
    });

    // Send unlock email
    const baseUrl = process.env.BETTER_AUTH_URL || "http://localhost:3000";
    const unlockUrl = `${baseUrl}/unlock-account?token=${token}`;

    await sendEmail({
        to: user.email,
        subject: "Unlock Your Account",
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #333;">Unlock Your Account</h1>
                <p>Hello${user.name ? ` ${user.name}` : ""},</p>
                <p>Your account has been temporarily locked due to multiple failed login attempts.</p>
                <p>To unlock your account, click the button below:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${unlockUrl}" 
                       style="background-color: #3b82f6; color: white; padding: 12px 24px; 
                              text-decoration: none; border-radius: 6px; display: inline-block;">
                        Unlock My Account
                    </a>
                </div>
                <p>Or copy and paste this link into your browser:</p>
                <p style="word-break: break-all; color: #666;">${unlockUrl}</p>
                <p style="color: #666; font-size: 14px; margin-top: 30px;">
                    This link will expire in 1 hour.<br>
                    If you didn't request this, please ignore this email or contact support.
                </p>
            </div>
        `,
    });

    console.log(`🔓 Unlock email sent to: ${user.email}`);

    return {
        success: true,
        message: "If your account is locked, an unlock link has been sent to your email.",
    };
}

/**
 * Verify unlock token and unlock account
 * @param token - Unlock token from email
 * @returns Success status with user email
 */
export async function verifyUnlockToken(
    token: string
): Promise<{ success: boolean; message: string; email?: string }> {
    // Find valid token
    const verification = await prisma.verification.findFirst({
        where: {
            value: token,
            expiresAt: { gt: new Date() },
            identifier: { startsWith: "unlock:" },
        },
    });

    if (!verification) {
        return {
            success: false,
            message: "Invalid or expired unlock link. Please request a new one.",
        };
    }

    // Extract user ID from identifier
    const userId = verification.identifier.replace("unlock:", "");

    // Get user
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            email: true,
            lockedUntil: true,
        },
    });

    if (!user) {
        return {
            success: false,
            message: "User not found.",
        };
    }

    // Unlock account
    await prisma.user.update({
        where: { id: userId },
        data: {
            failedLoginAttempts: 0,
            lockedUntil: null,
            lastFailedLoginAt: null,
        },
    });

    // Delete used token
    await prisma.verification.delete({
        where: { id: verification.id },
    });

    // Log unlock event
    await logLockoutCleared(userId, user.email);

    console.log(`🔓 Account unlocked via email: ${user.email}`);

    return {
        success: true,
        message: "Your account has been successfully unlocked. You can now sign in.",
        email: user.email,
    };
}

/**
 * Clean up expired unlock tokens (run periodically)
 */
export async function cleanupExpiredUnlockTokens(): Promise<number> {
    const result = await prisma.verification.deleteMany({
        where: {
            identifier: { startsWith: "unlock:" },
            expiresAt: { lt: new Date() },
        },
    });

    return result.count;
}
