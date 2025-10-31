/**
 * 2FA Session Store
 * 
 * Database-backed store for pending 2FA verifications during login.
 * Production-ready with Prisma and automatic expiry cleanup.
 */

import { prisma } from "@/lib/db";
import { randomBytes } from "crypto";

const EXPIRY_TIME = 5 * 60 * 1000; // 5 minutes

interface PendingTwoFactorAuth {
    email: string;
    timestamp: number;
    verified: boolean;
}

/**
 * Clean up expired pending sessions
 * This runs automatically, but can also be called manually
 */
export async function cleanupExpiredSessions(): Promise<void> {
    try {
        await prisma.twoFactorPendingSession.deleteMany({
            where: {
                expiresAt: {
                    lt: new Date(),
                },
            },
        });
    } catch (error) {
        console.error("Failed to cleanup expired 2FA sessions:", error);
    }
}

// Run cleanup every 5 minutes
if (typeof setInterval !== "undefined") {
    setInterval(() => {
        cleanupExpiredSessions().catch(console.error);
    }, 5 * 60 * 1000);
}

/**
 * Create a pending 2FA verification session
 */
export async function createPendingTwoFactorAuth(
    email: string
): Promise<string> {
    // Generate a secure random token
    const token = randomBytes(32).toString("hex");

    const expiresAt = new Date(Date.now() + EXPIRY_TIME);

    await prisma.twoFactorPendingSession.create({
        data: {
            token,
            email,
            verified: false,
            expiresAt,
        },
    });

    return token;
}

/**
 * Get a pending 2FA verification session
 */
export async function getPendingTwoFactorAuth(
    token: string
): Promise<PendingTwoFactorAuth | null> {
    const session = await prisma.twoFactorPendingSession.findUnique({
        where: { token },
    });

    if (!session) {
        return null;
    }

    // Check if expired
    if (session.expiresAt < new Date()) {
        await prisma.twoFactorPendingSession.delete({
            where: { token },
        });
        return null;
    }

    return {
        email: session.email,
        timestamp: session.createdAt.getTime(),
        verified: session.verified,
    };
}

/**
 * Mark a 2FA verification as complete
 */
export async function markTwoFactorAuthVerified(
    token: string
): Promise<boolean> {
    try {
        const session = await prisma.twoFactorPendingSession.findUnique({
            where: { token },
        });

        if (!session || session.expiresAt < new Date()) {
            return false;
        }

        await prisma.twoFactorPendingSession.update({
            where: { token },
            data: { verified: true },
        });

        return true;
    } catch (error) {
        console.error("Failed to mark 2FA as verified:", error);
        return false;
    }
}

/**
 * Delete a pending 2FA verification session
 */
export async function deletePendingTwoFactorAuth(
    token: string
): Promise<void> {
    try {
        await prisma.twoFactorPendingSession.delete({
            where: { token },
        });
    } catch (error) {
        // Ignore if already deleted
        if (error instanceof Error && !error.message.includes("Record to delete does not exist")) {
            console.error("Failed to delete pending 2FA session:", error);
        }
    }
}

/**
 * Check if a 2FA token is valid and verified
 */
export async function isTwoFactorAuthVerified(
    token: string
): Promise<boolean> {
    const session = await prisma.twoFactorPendingSession.findUnique({
        where: { token },
    });

    if (!session || session.expiresAt < new Date()) {
        return false;
    }

    return session.verified;
}
