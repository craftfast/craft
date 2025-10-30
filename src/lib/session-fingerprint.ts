/**
 * Session Fingerprinting Utilities (Issue 14)
 * 
 * Utilities for capturing and validating session fingerprints
 * (IP address and user-agent) for security monitoring and anomaly detection.
 */

import { headers } from "next/headers";

/**
 * Extract the real IP address from request headers
 * Checks multiple header sources in order of priority
 */
export async function getClientIpAddress(): Promise<string> {
    const headersList = await headers();

    // Check common proxy headers first
    const xForwardedFor = headersList.get("x-forwarded-for");
    if (xForwardedFor) {
        // x-forwarded-for can contain multiple IPs, get the first one (client IP)
        return xForwardedFor.split(",")[0].trim();
    }

    const xRealIp = headersList.get("x-real-ip");
    if (xRealIp) {
        return xRealIp;
    }

    const cfConnectingIp = headersList.get("cf-connecting-ip"); // Cloudflare
    if (cfConnectingIp) {
        return cfConnectingIp;
    }

    const xClientIp = headersList.get("x-client-ip");
    if (xClientIp) {
        return xClientIp;
    }

    // Vercel-specific header
    const xVercelForwardedFor = headersList.get("x-vercel-forwarded-for");
    if (xVercelForwardedFor) {
        return xVercelForwardedFor.split(",")[0].trim();
    }

    return "unknown";
}

/**
 * Extract the user-agent from request headers
 */
export async function getClientUserAgent(): Promise<string> {
    const headersList = await headers();
    return headersList.get("user-agent") || "unknown";
}

/**
 * Get complete session fingerprint (IP + User-Agent)
 */
export async function getSessionFingerprint(): Promise<{
    ipAddress: string;
    userAgent: string;
}> {
    const [ipAddress, userAgent] = await Promise.all([
        getClientIpAddress(),
        getClientUserAgent(),
    ]);

    return {
        ipAddress,
        userAgent,
    };
}

/**
 * Check if a session fingerprint has changed significantly
 * This can be used for anomaly detection
 */
export function hasFingerprintChanged(
    current: { ipAddress?: string; userAgent?: string },
    previous: { ipAddress?: string; userAgent?: string }
): {
    changed: boolean;
    ipChanged: boolean;
    userAgentChanged: boolean;
} {
    const ipChanged = current.ipAddress !== previous.ipAddress;
    const userAgentChanged = current.userAgent !== previous.userAgent;

    return {
        changed: ipChanged || userAgentChanged,
        ipChanged,
        userAgentChanged,
    };
}

/**
 * Determine if a fingerprint change is suspicious
 * - IP change is normal (mobile users, VPN switches)
 * - User-agent change is more suspicious (indicates possible token theft)
 */
export function isSuspiciousChange(
    current: { ipAddress?: string; userAgent?: string },
    previous: { ipAddress?: string; userAgent?: string }
): boolean {
    const { ipChanged, userAgentChanged } = hasFingerprintChanged(current, previous);

    // User-agent changes are more suspicious than IP changes
    // because users don't typically switch browsers mid-session
    if (userAgentChanged) {
        return true;
    }

    // Simultaneous IP and user-agent change is very suspicious
    if (ipChanged && userAgentChanged) {
        return true;
    }

    return false;
}

/**
 * Format IP address for logging (mask last octet for privacy)
 */
export function maskIpAddress(ip: string): string {
    if (ip === "unknown" || !ip) {
        return "unknown";
    }

    // IPv4
    if (ip.includes(".")) {
        const parts = ip.split(".");
        if (parts.length === 4) {
            return `${parts[0]}.${parts[1]}.${parts[2]}.xxx`;
        }
    }

    // IPv6 - mask last 64 bits
    if (ip.includes(":")) {
        const parts = ip.split(":");
        if (parts.length >= 4) {
            return `${parts.slice(0, 4).join(":")}::xxx`;
        }
    }

    return "unknown";
}

/**
 * Format user-agent for logging (extract browser/version)
 */
export function formatUserAgent(ua: string): string {
    if (ua === "unknown" || !ua) {
        return "unknown";
    }

    // Extract browser name and version
    const chromeMatch = ua.match(/Chrome\/(\d+)/);
    if (chromeMatch) {
        return `Chrome ${chromeMatch[1]}`;
    }

    const firefoxMatch = ua.match(/Firefox\/(\d+)/);
    if (firefoxMatch) {
        return `Firefox ${firefoxMatch[1]}`;
    }

    const safariMatch = ua.match(/Safari\/(\d+)/);
    if (safariMatch && !ua.includes("Chrome")) {
        return `Safari ${safariMatch[1]}`;
    }

    const edgeMatch = ua.match(/Edg\/(\d+)/);
    if (edgeMatch) {
        return `Edge ${edgeMatch[1]}`;
    }

    // Return truncated version if no match
    return ua.substring(0, 50) + (ua.length > 50 ? "..." : "");
}
