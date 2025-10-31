/**
 * Security Event Logging Service for Better Auth
 * 
 * Native Better Auth integration - no legacy compatibility required.
 * Logs all security-relevant events to the database for audit trails.
 * 
 * Events Tracked:
 * - Authentication (login/logout/signup)
 * - Account management (password changes, email updates)
 * - OAuth provider linking/unlinking
 * - Email verification
 * - Account lockouts
 * - Profile updates
 * - Session management
 */

import { prisma } from "@/lib/db";

export type SecurityEventType =
    | "LOGIN_SUCCESS"
    | "LOGIN_FAILED"
    | "LOGOUT"
    | "ACCOUNT_CREATED"
    | "PASSWORD_CHANGED"
    | "PASSWORD_SET"
    | "PASSWORD_RESET_REQUESTED"
    | "PASSWORD_RESET_SUCCESS"
    | "PASSWORD_RESET_FAILED"
    | "EMAIL_CHANGED"
    | "EMAIL_CHANGE_REQUESTED"
    | "ACCOUNT_LINKED"
    | "ACCOUNT_UNLINKED"
    | "EMAIL_VERIFIED"
    | "VERIFICATION_EMAIL_SENT"
    | "PROFILE_UPDATED"
    | "AVATAR_UPDATED"
    | "AVATAR_REMOVED"
    | "SESSION_REFRESHED";

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
 * Extract client IP address from Request (Better Auth native support)
 * Works with Vercel, Cloudflare, and standard reverse proxies
 */
export function getClientIP(request: Request): string | undefined {
    // Priority order for IP detection
    const headers = [
        "x-forwarded-for",
        "x-real-ip",
        "cf-connecting-ip", // Cloudflare
        "x-vercel-forwarded-for", // Vercel
        "true-client-ip", // Cloudflare Enterprise
    ];

    for (const header of headers) {
        const value = request.headers.get(header);
        if (value) {
            // x-forwarded-for can contain multiple IPs, take the first one
            return value.split(",")[0].trim();
        }
    }

    return undefined;
}

/**
 * Extract user agent from Request
 */
export function getUserAgent(request: Request): string | undefined {
    return request.headers.get("user-agent") || undefined;
}

/**
 * Extract comprehensive request metadata for security logging
 * Better Auth optimized - extracts all relevant security context
 */
export function extractRequestMetadata(request: Request): {
    ipAddress: string | undefined;
    userAgent: string | undefined;
    referer?: string;
    origin?: string;
} {
    return {
        ipAddress: getClientIP(request),
        userAgent: getUserAgent(request),
        referer: request.headers.get("referer") || undefined,
        origin: request.headers.get("origin") || undefined,
    };
}

/**
 * Core security event logging function
 * Asynchronously logs events to the database without blocking the main flow
 * 
 * @param data - Security event data to log
 * @throws Never throws - all errors are silently logged to console
 */
export async function logSecurityEvent(data: SecurityEventData): Promise<void> {
    try {
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

        // Development logging with visual indicators
        if (process.env.NODE_ENV === "development") {
            const emoji = getEmojiForEventType(data.eventType, data.success);
            const timestamp = new Date().toISOString();
            console.log(
                `${emoji} [${timestamp}] ${data.eventType} | User: ${data.userId || data.email || "unknown"} | IP: ${data.ipAddress || "unknown"} | Success: ${data.success ?? true}`
            );
        }
    } catch (error) {
        // Never throw from logging - ensures security logging doesn't break app flow
        console.error("❌ Failed to log security event:", error);
        console.error("Event data:", data);
    }
}

/**
 * Determine event severity based on event type
 * Used for automatic severity assignment when not explicitly provided
 */
function getSeverityForEventType(eventType: SecurityEventType): SecurityEventSeverity {
    // Critical events - immediate security concerns
    const criticalEvents: SecurityEventType[] = [
        "LOGIN_FAILED",
        "PASSWORD_RESET_FAILED",
    ];

    // Warning events - important security changes
    const warningEvents: SecurityEventType[] = [
        "PASSWORD_CHANGED",
        "PASSWORD_SET",
        "PASSWORD_RESET_REQUESTED",
        "PASSWORD_RESET_SUCCESS",
        "EMAIL_CHANGED",
        "ACCOUNT_LINKED",
        "ACCOUNT_UNLINKED",
        "EMAIL_CHANGE_REQUESTED",
    ];

    if (criticalEvents.includes(eventType)) {
        return "critical";
    }

    if (warningEvents.includes(eventType)) {
        return "warning";
    }

    return "info";
}

/**
 * Visual indicators for console logging
 * Provides quick visual feedback during development
 */
function getEmojiForEventType(eventType: SecurityEventType, success?: boolean): string {
    if (success === false) {
        return "❌";
    }

    const emojiMap: Record<SecurityEventType, string> = {
        LOGIN_SUCCESS: "✅",
        LOGIN_FAILED: "🚫",
        LOGOUT: "�",
        ACCOUNT_CREATED: "🎉",
        PASSWORD_CHANGED: "🔑",
        PASSWORD_SET: "🔑",
        PASSWORD_RESET_REQUESTED: "🔄",
        PASSWORD_RESET_SUCCESS: "✅",
        PASSWORD_RESET_FAILED: "❌",
        EMAIL_CHANGED: "📧",
        EMAIL_CHANGE_REQUESTED: "📧",
        ACCOUNT_LINKED: "🔗",
        ACCOUNT_UNLINKED: "🔓",
        EMAIL_VERIFIED: "✅",
        VERIFICATION_EMAIL_SENT: "📨",
        PROFILE_UPDATED: "👤",
        AVATAR_UPDATED: "🖼️",
        AVATAR_REMOVED: "🗑️",
        SESSION_REFRESHED: "🔄",
    };

    return emojiMap[eventType] || "📝";
}

/**
 * Convenience functions for common security events
 * Better Auth native - simplified API for common logging scenarios
 */

export async function logLoginSuccess(
    userId: string,
    email: string,
    request: Request,
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
    request: Request,
    errorReason: string
): Promise<void> {
    await logSecurityEvent({
        eventType: "LOGIN_FAILED",
        email,
        ipAddress: getClientIP(request),
        userAgent: getUserAgent(request),
        success: false,
        errorReason,
        severity: "critical",
    });
}

export async function logLogout(
    userId: string,
    email: string,
    request: Request
): Promise<void> {
    await logSecurityEvent({
        userId,
        eventType: "LOGOUT",
        email,
        ipAddress: getClientIP(request),
        userAgent: getUserAgent(request),
        success: true,
    });
}

export async function logAccountCreated(
    userId: string,
    email: string,
    request: Request
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
    request: Request
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
    request: Request
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
    request: Request
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
    request: Request
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
    request: Request
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
    request: Request
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
    request: Request
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

export async function logVerificationEmailSent(
    userId: string,
    email: string,
    request: Request
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

export async function logPasswordResetRequested(
    email: string,
    request: Request
): Promise<void> {
    await logSecurityEvent({
        eventType: "PASSWORD_RESET_REQUESTED",
        email,
        ipAddress: getClientIP(request),
        userAgent: getUserAgent(request),
        success: true,
    });
}

export async function logPasswordResetSuccess(
    userId: string,
    email: string,
    request: Request
): Promise<void> {
    await logSecurityEvent({
        userId,
        eventType: "PASSWORD_RESET_SUCCESS",
        email,
        ipAddress: getClientIP(request),
        userAgent: getUserAgent(request),
        success: true,
        severity: "warning",
    });
}

export async function logPasswordResetFailed(
    email: string,
    request: Request,
    errorReason: string
): Promise<void> {
    await logSecurityEvent({
        eventType: "PASSWORD_RESET_FAILED",
        email,
        ipAddress: getClientIP(request),
        userAgent: getUserAgent(request),
        success: false,
        errorReason,
        severity: "warning",
    });
}

export async function logProfileUpdated(
    userId: string,
    email: string,
    request: Request,
    metadata?: { changedFields: string[] }
): Promise<void> {
    await logSecurityEvent({
        userId,
        eventType: "PROFILE_UPDATED",
        email,
        ipAddress: getClientIP(request),
        userAgent: getUserAgent(request),
        success: true,
        metadata,
    });
}

export async function logAvatarUpdated(
    userId: string,
    email: string,
    request: Request
): Promise<void> {
    await logSecurityEvent({
        userId,
        eventType: "AVATAR_UPDATED",
        email,
        ipAddress: getClientIP(request),
        userAgent: getUserAgent(request),
        success: true,
    });
}

export async function logAvatarRemoved(
    userId: string,
    email: string,
    request: Request
): Promise<void> {
    await logSecurityEvent({
        userId,
        eventType: "AVATAR_REMOVED",
        email,
        ipAddress: getClientIP(request),
        userAgent: getUserAgent(request),
        success: true,
    });
}

export async function logSessionRefreshed(
    userId: string,
    email: string,
    metadata?: { trigger: string }
): Promise<void> {
    await logSecurityEvent({
        userId,
        eventType: "SESSION_REFRESHED",
        email,
        success: true,
        metadata,
    });
}
