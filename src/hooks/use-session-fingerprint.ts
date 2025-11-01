/**
 * Session Fingerprint Hook for Better Auth
 * 
 * Better Auth automatically tracks session fingerprints (IP address and user-agent)
 * in the Session table. This hook provides a simplified interface to access that data.
 * 
 * Features:
 * - Automatic fingerprint tracking via Better Auth
 * - IP address and user-agent available in session data
 * - No additional API calls needed
 */

"use client";

import { useSession } from "@/lib/auth-client";

/**
 * Hook to access session fingerprint data from Better Auth
 * Better Auth automatically stores ipAddress and userAgent in the session
 */
export function useSessionFingerprint() {
    const { data: session } = useSession();

    // Better Auth sessions include ipAddress and userAgent automatically
    const fingerprint = session
        ? {
            ipAddress: (session as any).session?.ipAddress || "unknown",
            userAgent: (session as any).session?.userAgent || "unknown",
        }
        : null;

    return {
        fingerprint,
        // Deprecated: Better Auth handles this automatically
        updateFingerprint: () => {
            console.warn(
                "updateFingerprint is deprecated. Better Auth tracks fingerprints automatically."
            );
        },
    };
}

/**
 * Hook to check session fingerprint
 * Returns the current fingerprint from Better Auth session data
 */
export function useCheckFingerprint() {
    const { data: session } = useSession();

    const checkFingerprint = () => {
        if (!session) {
            return null;
        }

        return {
            success: true,
            fingerprint: {
                ipAddress: (session as any).session?.ipAddress || "unknown",
                userAgent: (session as any).session?.userAgent || "unknown",
            },
        };
    };

    return { checkFingerprint };
}

/**
 * Deprecated: Better Auth handles fingerprint verification automatically
 * This hook is kept for backward compatibility but does nothing
 */
export function useVerifyFingerprint() {
    return {
        verifyFingerprint: () => {
            console.warn(
                "verifyFingerprint is deprecated. Better Auth handles session verification automatically."
            );
            return Promise.resolve(true);
        },
    };
}
