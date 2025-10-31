/**
 * Session Expiry Warning Hook
 * 
 * Monitors session expiry and shows warning when session is about to expire.
 * Provides option to extend session before it expires.
 * 
 * Features:
 * - Warning 5 minutes before expiry
 * - Auto-refresh session
 * - Countdown timer
 */

"use client";

import { useEffect, useState } from "react";

interface SessionExpiryState {
    showWarning: boolean;
    minutesRemaining: number;
    isExpired: boolean;
}

interface UseSessionExpiryOptions {
    warningMinutes?: number; // Show warning N minutes before expiry (default: 5)
    onExpiry?: () => void; // Callback when session expires
    onWarning?: () => void; // Callback when warning is shown
}

/**
 * Hook to monitor session expiry and show warnings
 */
export function useSessionExpiry(
    sessionExpiresAt: Date | null | undefined,
    options: UseSessionExpiryOptions = {}
) {
    const {
        warningMinutes = 5,
        onExpiry,
        onWarning,
    } = options;

    const [state, setState] = useState<SessionExpiryState>({
        showWarning: false,
        minutesRemaining: 0,
        isExpired: false,
    });

    useEffect(() => {
        if (!sessionExpiresAt) {
            return;
        }

        const checkExpiry = () => {
            const now = Date.now();
            const expiresAt = new Date(sessionExpiresAt).getTime();
            const timeRemaining = expiresAt - now;
            const minutesRemaining = Math.floor(timeRemaining / 60000);

            // Session expired
            if (timeRemaining <= 0) {
                setState({
                    showWarning: false,
                    minutesRemaining: 0,
                    isExpired: true,
                });
                if (onExpiry && !state.isExpired) {
                    onExpiry();
                }
                return;
            }

            // Show warning if within warning period
            if (minutesRemaining <= warningMinutes) {
                const shouldShowWarning = minutesRemaining > 0;
                setState((prev) => {
                    if (!prev.showWarning && shouldShowWarning && onWarning) {
                        onWarning();
                    }
                    return {
                        showWarning: shouldShowWarning,
                        minutesRemaining,
                        isExpired: false,
                    };
                });
            } else {
                setState({
                    showWarning: false,
                    minutesRemaining,
                    isExpired: false,
                });
            }
        };

        // Check immediately
        checkExpiry();

        // Check every 30 seconds
        const interval = setInterval(checkExpiry, 30000);

        return () => clearInterval(interval);
    }, [sessionExpiresAt, warningMinutes, onExpiry, onWarning, state.isExpired]);

    return state;
}

/**
 * Extend the current session
 */
export async function extendSession(): Promise<boolean> {
    try {
        // Call Better Auth session refresh endpoint
        const response = await fetch("/api/auth/session", {
            method: "GET",
            headers: {
                "Cache-Control": "no-cache",
            },
        });

        return response.ok;
    } catch (error) {
        console.error("Failed to extend session:", error);
        return false;
    }
}
