/**
 * Security Event Logging Service (Issue 16)
 * 
 * Comprehensive security event logging for authentication and account changes.
 * Logs all security-relevant events to the database for monitoring and audit trails.
 * 
 * Events Tracked:
 * - Login attempts (success & failure)
 * - Account creation
 * - Password changes/sets
 * - Email changes
 * - Account linking/unlinking (OAuth)
 * - Email verification
 * - Account lockouts
 */

import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";

export type SecurityEventType =
    | "LOGIN_SUCCESS"
    | "LOGIN_FAILED"
    | "ACCOUNT_CREATED"
    | "PASSWORD_CHANGED"
    | "PASSWORD_SET"
    | "EMAIL_CHANGED"
    | "EMAIL_CHANGE_REQUESTED"
    | "ACCOUNT_LINKED"
    | "ACCOUNT_UNLINKED"
    | "EMAIL_VERIFIED"
    | "ACCOUNT_LOCKED"
    | "LOCKOUT_CLEARED"
    | "VERIFICATION_EMAIL_SENT"
    | "PASSWORD_RESET_REQUESTED";

export type SecurityEventSeverity = "info" | "warning" | "critical";

export interface SecurityEventData {
    userId?: string;
    eventType: SecurityEventType;
    severity?: SecurityEventSeverity;
    ipAddress?: string;
    userAgent?: string;
    email?: string;
    provider?: string;
    success?: boolean;
    errorReason?: string;
    metadata?: Record<string, any>;
}

/**
 * Extract client IP address from NextRequest
 */
export function getClientIP(request: NextRequest): string | undefined {
    // Check Vercel-specific headers first
    const forwardedFor = request.headers.get("x-forwarded-for");
    if (forwardedFor) {
        return forwardedFor.split(",")[0].trim();
    }

    // Check other common headers
    const realIP = request.headers.get("x-real-ip");
    if (realIP) {
        return realIP;
    }

    // Fallback to undefined if no IP found
    return undefined;
}

/**
 * Extract user agent from NextRequest
 */
export function getUserAgent(request: NextRequest): string | undefined {
    return request.headers.get("user-agent") || undefined;
}

/**
 * Main security logging function
 * Logs security events to the database asynchronously
 */
export async function logSecurityEvent(data: SecurityEventData): Promise<void> {
    try {
        // Determine severity if not provided
        const severity = data.severity || getSeverityForEventType(data.eventType);

        await prisma.securityEvent.create({
            data: {
                userId: data.userId,
                eventType: data.eventType,
                severity,
                ipAddress: data.ipAddress,
                userAgent: data.userAgent,
                email: data.email,
                provider: data.provider,
                success: data.success ?? true,
                errorReason: data.errorReason,
                metadata: data.metadata ? JSON.parse(JSON.stringify(data.metadata)) : null,
            },
        });

        // Log to console for development/debugging
        const emoji = getEmojiForEventType(data.eventType, data.success);
        console.log(
            `${emoji} Security Event: ${data.eventType} | User: ${data.userId || data.email || "unknown"} | IP: ${data.ipAddress || "unknown"} | Success: ${data.success ?? true}`
        );
    } catch (error) {
        // Never throw errors from logging - just log to console
        console.error("Failed to log security event:", error);
    }
}

/**
 * Helper function to determine severity based on event type
 */
function getSeverityForEventType(eventType: SecurityEventType): SecurityEventSeverity {
    switch (eventType) {
        case "LOGIN_FAILED":
        case "ACCOUNT_LOCKED":
            return "warning";
        case "PASSWORD_CHANGED":
        case "EMAIL_CHANGED":
        case "ACCOUNT_LINKED":
        case "ACCOUNT_UNLINKED":
            return "warning";
        default:
            return "info";
    }
}

/**
 * Helper function to get emoji for console logs
 */
function getEmojiForEventType(eventType: SecurityEventType, success?: boolean): string {
    if (success === false) {
        return "❌";
    }

    switch (eventType) {
        case "LOGIN_SUCCESS":
            return "✅";
        case "LOGIN_FAILED":
            return "🚫";
        case "ACCOUNT_CREATED":
            return "🎉";
        case "PASSWORD_CHANGED":
        case "PASSWORD_SET":
            return "🔑";
        case "EMAIL_CHANGED":
        case "EMAIL_CHANGE_REQUESTED":
            return "📧";
        case "ACCOUNT_LINKED":
            return "🔗";
        case "ACCOUNT_UNLINKED":
            return "🔓";
        case "EMAIL_VERIFIED":
            return "✅";
        case "ACCOUNT_LOCKED":
            return "🔒";
        case "LOCKOUT_CLEARED":
            return "🔓";
        case "VERIFICATION_EMAIL_SENT":
            return "📨";
        case "PASSWORD_RESET_REQUESTED":
            return "🔄";
        default:
            return "📝";
    }
}

/**
 * Convenience functions for common security events
 */

export async function logLoginSuccess(
    userId: string,
    email: string,
    request: NextRequest,
    provider?: string
): Promise<void> {
    await logSecurityEvent({
        userId,
        eventType: "LOGIN_SUCCESS",
        email,
        provider,
        ipAddress: getClientIP(request),
        userAgent: getUserAgent(request),
        success: true,
    });
}

export async function logLoginFailure(
    email: string,
    request: NextRequest,
    errorReason: string
): Promise<void> {
    await logSecurityEvent({
        eventType: "LOGIN_FAILED",
        email,
        ipAddress: getClientIP(request),
        userAgent: getUserAgent(request),
        success: false,
        errorReason,
        severity: "warning",
    });
}

export async function logAccountCreated(
    userId: string,
    email: string,
    request: NextRequest
): Promise<void> {
    await logSecurityEvent({
        userId,
        eventType: "ACCOUNT_CREATED",
        email,
        ipAddress: getClientIP(request),
        userAgent: getUserAgent(request),
        success: true,
    });
}

export async function logPasswordChanged(
    userId: string,
    email: string,
    request: NextRequest
): Promise<void> {
    await logSecurityEvent({
        userId,
        eventType: "PASSWORD_CHANGED",
        email,
        ipAddress: getClientIP(request),
        userAgent: getUserAgent(request),
        success: true,
        severity: "warning",
    });
}

export async function logPasswordSet(
    userId: string,
    email: string,
    request: NextRequest
): Promise<void> {
    await logSecurityEvent({
        userId,
        eventType: "PASSWORD_SET",
        email,
        ipAddress: getClientIP(request),
        userAgent: getUserAgent(request),
        success: true,
        severity: "warning",
    });
}

export async function logEmailChangeRequested(
    userId: string,
    oldEmail: string,
    newEmail: string,
    request: NextRequest
): Promise<void> {
    await logSecurityEvent({
        userId,
        eventType: "EMAIL_CHANGE_REQUESTED",
        email: newEmail,
        ipAddress: getClientIP(request),
        userAgent: getUserAgent(request),
        success: true,
        metadata: {
            oldEmail,
            newEmail,
        },
        severity: "warning",
    });
}

export async function logEmailChanged(
    userId: string,
    oldEmail: string,
    newEmail: string,
    request: NextRequest
): Promise<void> {
    await logSecurityEvent({
        userId,
        eventType: "EMAIL_CHANGED",
        email: newEmail,
        ipAddress: getClientIP(request),
        userAgent: getUserAgent(request),
        success: true,
        metadata: {
            oldEmail,
            newEmail,
        },
        severity: "warning",
    });
}

export async function logAccountLinked(
    userId: string,
    email: string,
    provider: string,
    request: NextRequest
): Promise<void> {
    await logSecurityEvent({
        userId,
        eventType: "ACCOUNT_LINKED",
        email,
        provider,
        ipAddress: getClientIP(request),
        userAgent: getUserAgent(request),
        success: true,
        severity: "warning",
    });
}

export async function logAccountUnlinked(
    userId: string,
    email: string,
    provider: string,
    request: NextRequest
): Promise<void> {
    await logSecurityEvent({
        userId,
        eventType: "ACCOUNT_UNLINKED",
        email,
        provider,
        ipAddress: getClientIP(request),
        userAgent: getUserAgent(request),
        success: true,
        severity: "warning",
    });
}

export async function logEmailVerified(
    userId: string,
    email: string,
    request: NextRequest
): Promise<void> {
    await logSecurityEvent({
        userId,
        eventType: "EMAIL_VERIFIED",
        email,
        ipAddress: getClientIP(request),
        userAgent: getUserAgent(request),
        success: true,
    });
}

export async function logAccountLocked(
    userId: string,
    email: string,
    request: NextRequest,
    metadata?: { failedAttempts: number; lockoutDurationMinutes: number }
): Promise<void> {
    await logSecurityEvent({
        userId,
        eventType: "ACCOUNT_LOCKED",
        email,
        ipAddress: getClientIP(request),
        userAgent: getUserAgent(request),
        success: true,
        severity: "critical",
        metadata,
    });
}

export async function logLockoutCleared(
    userId: string,
    email: string
): Promise<void> {
    await logSecurityEvent({
        userId,
        eventType: "LOCKOUT_CLEARED",
        email,
        success: true,
    });
}

export async function logVerificationEmailSent(
    userId: string,
    email: string,
    request: NextRequest
): Promise<void> {
    await logSecurityEvent({
        userId,
        eventType: "VERIFICATION_EMAIL_SENT",
        email,
        ipAddress: getClientIP(request),
        userAgent: getUserAgent(request),
        success: true,
    });
}
