/**
 * Password History Prevention Service
 * 
 * Prevents users from reusing recent passwords to enhance security.
 * Stores hashed versions of the last 5 passwords.
 * 
 * Features:
 * - Store last 5 password hashes
 * - Prevent password reuse
 * - Automatic cleanup of old history entries
 * - Integration with Better Auth
 */

import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

const PASSWORD_HISTORY_LIMIT = 5;

/**
 * Check if a password was recently used
 * @param userId - User's ID
 * @param newPassword - Plain text password to check
 * @returns true if password was recently used, false otherwise
 */
export async function isPasswordRecentlyUsed(
    userId: string,
    newPassword: string
): Promise<boolean> {
    // Get last N password hashes
    const passwordHistory = await prisma.passwordHistory.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: PASSWORD_HISTORY_LIMIT,
        select: { password: true },
    });

    // Check if new password matches any recent password
    for (const entry of passwordHistory) {
        const matches = await bcrypt.compare(newPassword, entry.password);
        if (matches) {
            return true;
        }
    }

    return false;
}

/**
 * Add a password to user's history
 * @param userId - User's ID
 * @param passwordHash - Hashed password to store
 */
export async function addPasswordToHistory(
    userId: string,
    passwordHash: string
): Promise<void> {
    // Add new password to history
    await prisma.passwordHistory.create({
        data: {
            userId,
            password: passwordHash,
        },
    });

    // Clean up old password history entries (keep only last N)
    const allHistory = await prisma.passwordHistory.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        select: { id: true },
    });

    // Delete oldest entries if we exceed the limit
    if (allHistory.length > PASSWORD_HISTORY_LIMIT) {
        const toDelete = allHistory.slice(PASSWORD_HISTORY_LIMIT);
        await prisma.passwordHistory.deleteMany({
            where: {
                id: {
                    in: toDelete.map((entry: { id: string }) => entry.id),
                },
            },
        });
    }
}

/**
 * Validate new password against history and current password
 * @param userId - User's ID
 * @param newPassword - Plain text new password
 * @param currentPasswordHash - Current password hash (optional, for password changes)
 * @returns Validation result
 */
export async function validatePasswordHistory(
    userId: string,
    newPassword: string,
    currentPasswordHash?: string
): Promise<{ isValid: boolean; error?: string }> {
    // Check if new password matches current password
    if (currentPasswordHash) {
        const matchesCurrent = await bcrypt.compare(newPassword, currentPasswordHash);
        if (matchesCurrent) {
            return {
                isValid: false,
                error: "New password must be different from your current password",
            };
        }
    }

    // Check if password was recently used
    const recentlyUsed = await isPasswordRecentlyUsed(userId, newPassword);
    if (recentlyUsed) {
        return {
            isValid: false,
            error: `You cannot reuse any of your last ${PASSWORD_HISTORY_LIMIT} passwords. Please choose a different password.`,
        };
    }

    return { isValid: true };
}

/**
 * Get password history count for a user (for debugging/admin)
 * @param userId - User's ID
 * @returns Number of stored password hashes
 */
export async function getPasswordHistoryCount(userId: string): Promise<number> {
    return await prisma.passwordHistory.count({
        where: { userId },
    });
}

/**
 * Clear password history for a user (admin function)
 * @param userId - User's ID
 */
export async function clearPasswordHistory(userId: string): Promise<void> {
    await prisma.passwordHistory.deleteMany({
        where: { userId },
    });
}
