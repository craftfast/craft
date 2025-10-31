/**
 * Two-Factor Authentication Audit Logging
 * 
 * Logs all 2FA-related security events for audit trail and monitoring
 */

interface AuditEventData {
    userId?: string;
    email: string;
    ipAddress?: string;
    userAgent?: string;
    success: boolean;
    details?: string;
}/**
 * Log 2FA setup event
 */
export async function log2FASetup(data: AuditEventData, request?: Request): Promise<void> {
    try {
        const ipAddress = data.ipAddress || getIpFromRequest(request);

        console.log(
            `🔐 2FA SETUP | User: ${data.email} | Success: ${data.success} | IP: ${ipAddress}${data.details ? ` | ${data.details}` : ""
            }`
        );

        // You can also save to database if you have an audit log table
        // await prisma.auditLog.create({ ... });
    } catch (error) {
        console.error("Failed to log 2FA setup:", error);
    }
}

/**
 * Log 2FA disable event
 */
export async function log2FADisable(data: AuditEventData, request?: Request): Promise<void> {
    try {
        const ipAddress = data.ipAddress || getIpFromRequest(request);

        console.log(
            `🔐 2FA DISABLE | User: ${data.email} | Success: ${data.success} | IP: ${ipAddress}${data.details ? ` | ${data.details}` : ""
            }`
        );
    } catch (error) {
        console.error("Failed to log 2FA disable:", error);
    }
}

/**
 * Log 2FA verification attempt during login
 */
export async function log2FAVerification(
    data: AuditEventData,
    method: "totp" | "backup",
    request?: Request
): Promise<void> {
    try {
        const ipAddress = data.ipAddress || getIpFromRequest(request);

        const methodText = method === "totp" ? "TOTP" : "Backup Code";

        console.log(
            `🔐 2FA VERIFY (${methodText}) | User: ${data.email} | Success: ${data.success} | IP: ${ipAddress}${data.details ? ` | ${data.details}` : ""
            }`
        );

        // Alert on failed attempts
        if (!data.success) {
            console.warn(`⚠️  2FA verification failed for ${data.email}`);
        }
    } catch (error) {
        console.error("Failed to log 2FA verification:", error);
    }
}

/**
 * Log backup code regeneration
 */
export async function log2FABackupCodesRegenerated(
    data: AuditEventData,
    request?: Request
): Promise<void> {
    try {
        const ipAddress = data.ipAddress || getIpFromRequest(request);

        console.log(
            `🔐 2FA BACKUP CODES REGENERATED | User: ${data.email} | Success: ${data.success} | IP: ${ipAddress}`
        );
    } catch (error) {
        console.error("Failed to log backup codes regeneration:", error);
    }
}/**
 * Extract IP address from request
 */
function getIpFromRequest(request?: Request): string | undefined {
    if (!request) return undefined;

    // Check common headers for IP address
    const forwardedFor = request.headers.get("x-forwarded-for");
    if (forwardedFor) {
        return forwardedFor.split(",")[0].trim();
    }

    const realIp = request.headers.get("x-real-ip");
    if (realIp) {
        return realIp;
    }

    return undefined;
}
