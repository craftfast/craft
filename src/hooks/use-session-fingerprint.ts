/**
 * Session Fingerprint Hook for Better Auth
 * 
 * Automatically captures and updates session fingerprints for security monitoring.
 * Works with Better Auth's native session management.
 * 
 * Features:
 * - Automatic fingerprint capture on mount
 * - IP address and user-agent tracking
 * - Anomaly detection support
 * - Integration with session refresh mechanism
 */

"use client";

import { useEffect, useCallback } from "react";
import { useSession } from "@/lib/auth-client";
import { useRefreshSession } from "./use-refresh-session";

/**
 * Hook to automatically update session fingerprint on mount
 * Captures the user's IP address and user-agent for security monitoring
 */
export function useSessionFingerprint() {
    const { data: session } = useSession();
    const refreshSession = useRefreshSession();

    const updateFingerprint = useCallback(async () => {
        try {
            const response = await fetch("/api/auth/fingerprint", {
                method: "POST",
            });

            if (!response.ok) {
                console.error("Failed to update fingerprint");
                return;
            }

            const data = await response.json();

            if (data.success && data.fingerprint) {
                // Fingerprint is stored server-side in the database
                // Optionally refresh session if needed to sync client state
                console.log("✅ Fingerprint captured:", data.fingerprint);
            }
        } catch (error) {
            console.error("❌ Error updating session fingerprint:", error);
        }
    }, []);

    useEffect(() => {
        // Only update if user is authenticated and fingerprint is not set
        if (session?.user && !(session as any).ipAddress) {
            updateFingerprint();
        }
    }, [session, updateFingerprint]);

    return {
        updateFingerprint,
    };
}

/**
 * Hook to check if the current fingerprint matches the stored one
 * Useful for detecting session anomalies and suspicious activity
 */
export function useCheckFingerprint() {
    const checkFingerprint = useCallback(async (): Promise<{
        success: boolean;
        matches?: boolean;
        fingerprint?: {
            ipAddress: string;
            userAgent: string;
        };
        stored?: {
            ipAddress: string;
            userAgent: string;
        };
    } | null> => {
        try {
            const response = await fetch("/api/auth/fingerprint");

            if (!response.ok) {
                return null;
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error("❌ Error checking fingerprint:", error);
            return null;
        }
    }, []);

    return { checkFingerprint };
}

/**
 * Hook to verify fingerprint and take action on mismatch
 * Useful for implementing automatic logout on suspicious activity
 */
export function useSecureFingerprint(options?: {
    onMismatch?: () => void;
    autoCheck?: boolean;
}) {
    const { checkFingerprint } = useCheckFingerprint();

    const verifyFingerprint = useCallback(async () => {
        const result = await checkFingerprint();

        if (result && result.success && result.matches === false) {
            console.warn("⚠️ Fingerprint mismatch detected - possible session hijacking");
            options?.onMismatch?.();
        }

        return result;
    }, [checkFingerprint, options]);

    useEffect(() => {
        if (options?.autoCheck) {
            verifyFingerprint();
        }
    }, [options?.autoCheck, verifyFingerprint]);

    return { verifyFingerprint };
}
