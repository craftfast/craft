/**
 * Account Lockout Mechanism for Better-Auth
 * 
 * Implements 5-attempts-in-30-minutes account lockout security feature.
 * Works with Better-Auth hooks to prevent brute-force attacks.
 * 
 * Features:
 * - 5 failed attempts trigger 30-minute lockout
 * - Automatic unlock after lockout period
 * - Clear attempts on successful login
 * - Integration with security logger
 * 
 * Usage:
 * - Call checkAccountLockout() before login attempt
 * - Call incrementFailedAttempts() on failed login
 * - Call clearFailedAttempts() on successful login
 */

import { prisma } from "@/lib/db";
import { logAccountLocked, logLockoutCleared } from "@/lib/security-logger";

const LOCKOUT_THRESHOLD = 5;
const LOCKOUT_DURATION_MS = 30 * 60 * 1000; // 30 minutes
const LOCKOUT_DURATION_MINUTES = 30;

export interface LockoutStatus {
    locked: boolean;
    remainingMinutes?: number;
    message?: string;
    failedAttempts?: number;
}

/**
 * Check if an account is currently locked out
 * @param email - User's email address
 * @returns Lockout status with remaining time if locked
 */
export async function checkAccountLockout(email: string): Promise<LockoutStatus> {
    const user = await prisma.user.findUnique({
        where: { email },
        select: {
            id: true,
            email: true,
            lockedUntil: true,
            failedLoginAttempts: true,
        },
    });

    if (!user) {
        return { locked: false };
    }

    // Check if account is currently locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
        const remainingMinutes = Math.ceil(
            (user.lockedUntil.getTime() - Date.now()) / (1000 * 60)
        );

        return {
            locked: true,
            remainingMinutes,
            message: `Account locked due to multiple failed login attempts. Try again in ${remainingMinutes} minute${remainingMinutes !== 1 ? "s" : ""}.`,
            failedAttempts: user.failedLoginAttempts,
        };
    }

    // Account not locked, but return current failed attempts
    return {
        locked: false,
        failedAttempts: user.failedLoginAttempts,
    };
}

/**
 * Increment failed login attempts and lock account if threshold reached
 * @param email - User's email address
 * @param request - Request object for logging
 * @returns Updated lockout status
 */
export async function incrementFailedAttempts(
    email: string,
    request?: Request
): Promise<LockoutStatus> {
    const user = await prisma.user.findUnique({
        where: { email },
        select: {
            id: true,
            email: true,
            failedLoginAttempts: true,
            lockedUntil: true,
        },
    });

    if (!user) {
        // Don't reveal if user exists or not
        return { locked: false };
    }

    const failedAttempts = (user.failedLoginAttempts || 0) + 1;
    const now = new Date();

    // Check if threshold reached
    if (failedAttempts >= LOCKOUT_THRESHOLD) {
        const lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);

        // Lock the account
        await prisma.user.update({
            where: { id: user.id },
            data: {
                failedLoginAttempts: failedAttempts,
                lockedUntil: lockedUntil,
                lastFailedLoginAt: now,
            },
        });

        // Log account lockout event
        if (request) {
            await logAccountLocked(user.id, user.email, request, {
                failedAttempts,
                lockoutDurationMinutes: LOCKOUT_DURATION_MINUTES,
            });
        }

        console.warn(
            `🔒 Account locked: ${user.email} | Failed attempts: ${failedAttempts} | Locked until: ${lockedUntil.toISOString()}`
        );

        return {
            locked: true,
            remainingMinutes: LOCKOUT_DURATION_MINUTES,
            message: `Account locked due to ${failedAttempts} failed login attempts. Try again in ${LOCKOUT_DURATION_MINUTES} minutes.`,
            failedAttempts,
        };
    }

    // Increment failed attempts but don't lock yet
    await prisma.user.update({
        where: { id: user.id },
        data: {
            failedLoginAttempts: failedAttempts,
            lastFailedLoginAt: now,
        },
    });

    console.warn(
        `⚠️  Failed login attempt ${failedAttempts}/${LOCKOUT_THRESHOLD}: ${user.email}`
    );

    return {
        locked: false,
        failedAttempts,
        message: `Invalid credentials. ${LOCKOUT_THRESHOLD - failedAttempts} attempt${LOCKOUT_THRESHOLD - failedAttempts !== 1 ? "s" : ""} remaining before lockout.`,
    };
}

/**
 * Clear failed login attempts after successful login
 * @param userId - User's ID
 */
export async function clearFailedAttempts(userId: string): Promise<void> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            email: true,
            failedLoginAttempts: true,
            lockedUntil: true,
        },
    });

    if (!user) {
        return;
    }

    // Only update if there were failed attempts or account was locked
    if (user.failedLoginAttempts > 0 || user.lockedUntil) {
        await prisma.user.update({
            where: { id: userId },
            data: {
                failedLoginAttempts: 0,
                lockedUntil: null,
                lastFailedLoginAt: null,
            },
        });

        // Log lockout cleared if account was locked
        if (user.lockedUntil) {
            await logLockoutCleared(user.id, user.email);
            console.log(`🔓 Account lockout cleared: ${user.email}`);
        }

        console.log(
            `✅ Failed login attempts cleared: ${user.email} (was ${user.failedLoginAttempts})`
        );
    }
}

/**
 * Manually unlock an account (admin function)
 * @param userId - User's ID
 */
export async function unlockAccount(userId: string): Promise<void> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            email: true,
            lockedUntil: true,
        },
    });

    if (!user) {
        throw new Error("User not found");
    }

    await prisma.user.update({
        where: { id: userId },
        data: {
            failedLoginAttempts: 0,
            lockedUntil: null,
            lastFailedLoginAt: null,
        },
    });

    await logLockoutCleared(user.id, user.email);
    console.log(`🔓 Account manually unlocked: ${user.email}`);
}

/**
 * Get lockout statistics for a user
 * @param email - User's email address
 */
export async function getLockoutStats(email: string) {
    const user = await prisma.user.findUnique({
        where: { email },
        select: {
            failedLoginAttempts: true,
            lockedUntil: true,
            lastFailedLoginAt: true,
        },
    });

    if (!user) {
        return null;
    }

    const isLocked = user.lockedUntil && user.lockedUntil > new Date();
    const remainingMinutes = isLocked
        ? Math.ceil((user.lockedUntil!.getTime() - Date.now()) / (1000 * 60))
        : 0;

    return {
        failedAttempts: user.failedLoginAttempts,
        isLocked,
        lockedUntil: user.lockedUntil,
        lastFailedLoginAt: user.lastFailedLoginAt,
        remainingMinutes,
        attemptsRemaining: Math.max(0, LOCKOUT_THRESHOLD - user.failedLoginAttempts),
    };
}
