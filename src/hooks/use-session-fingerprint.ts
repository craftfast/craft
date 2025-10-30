/**
 * Session Fingerprint Hook (Issue 14)
 * 
 * Client-side hook to automatically capture and update session fingerprints
 * for security monitoring and anomaly detection.
 */

"use client";

import { useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";

/**
 * Hook to automatically update session fingerprint on mount
 * This captures the user's IP address and user-agent for security monitoring
 */
export function useSessionFingerprint() {
    const { data: session, update } = useSession();

    const updateFingerprint = useCallback(async () => {
        try {
            // Fetch current fingerprint from server
            const response = await fetch("/api/auth/fingerprint", {
                method: "POST",
            });

            if (!response.ok) {
                console.error("Failed to fetch fingerprint");
                return;
            }

            const data = await response.json();

            if (data.success && data.fingerprint) {
                // Update session with new fingerprint
                await update({
                    ipAddress: data.fingerprint.ipAddress,
                    userAgent: data.fingerprint.userAgent,
                });
            }
        } catch (error) {
            console.error("Error updating session fingerprint:", error);
        }
    }, [update]);

    useEffect(() => {
        // Only update if user is authenticated and fingerprint is not set
        if (session?.user && !(session as { ipAddress?: string }).ipAddress) {
            updateFingerprint();
        }
    }, [session, updateFingerprint]);

    return {
        updateFingerprint,
    };
}

/**
 * Hook to check if the current fingerprint matches the stored one
 * Useful for detecting session anomalies
 */
export function useCheckFingerprint() {
    const checkFingerprint = useCallback(async () => {
        try {
            const response = await fetch("/api/auth/fingerprint");

            if (!response.ok) {
                return null;
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error("Error checking fingerprint:", error);
            return null;
        }
    }, []);

    return { checkFingerprint };
}
