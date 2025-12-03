"use client";

import { useEffect, useRef, useCallback } from "react";

/**
 * Hook to keep sandbox alive while user has project page open
 * 
 * Sends periodic heartbeat requests to extend sandbox timeout.
 * This prevents the sandbox from auto-pausing while the user is actively working.
 * 
 * Features:
 * - Only runs when page is visible (uses Page Visibility API)
 * - Pauses heartbeat when user switches tabs
 * - Automatically cleans up on unmount
 * - 5 minute interval (sandbox timeout is 10 minutes, so always stays alive)
 * - Properly handles projectId changes
 * 
 * @param projectId - The project ID to keep alive
 * @param enabled - Whether heartbeat is enabled (default: true)
 */
export function useSandboxHeartbeat(projectId: string, enabled = true) {
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const isHeartbeatingRef = useRef(false);
    const currentProjectIdRef = useRef(projectId);

    // Update ref when projectId changes
    currentProjectIdRef.current = projectId;

    // Send heartbeat request - use ref to always get current projectId
    const sendHeartbeat = useCallback(async () => {
        // Prevent concurrent heartbeats
        if (isHeartbeatingRef.current) {
            return;
        }

        const currentProjectId = currentProjectIdRef.current;

        try {
            isHeartbeatingRef.current = true;

            const response = await fetch(`/api/sandbox/${currentProjectId}/heartbeat`, {
                method: "POST",
            });

            if (response.ok) {
                const data = await response.json();
                // Only log success, not the full data - reduces console noise
                if (data.extended === false) {
                    console.log(`💓 Sandbox heartbeat sent (extension will retry)`);
                }
            } else {
                console.warn("⚠️ Sandbox heartbeat failed:", response.statusText);
            }
        } catch (error) {
            // Network errors during heartbeat are expected when user loses connectivity
            // Don't spam console - sandbox has 10 min timeout anyway
            console.debug("❌ Heartbeat network error (will retry):", error);
        } finally {
            isHeartbeatingRef.current = false;
        }
    }, []);

    // Start heartbeat interval
    const startHeartbeat = useCallback(() => {
        // Clear any existing interval
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }

        // Send initial heartbeat immediately
        sendHeartbeat();

        // Then send every 5 minutes
        intervalRef.current = setInterval(sendHeartbeat, 5 * 60 * 1000);
        console.log("💓 Sandbox heartbeat started (every 5 minutes)");
    }, [sendHeartbeat]);

    // Stop heartbeat interval
    const stopHeartbeat = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
            console.log("💤 Sandbox heartbeat paused");
        }
    }, []);

    useEffect(() => {
        if (!enabled) {
            return;
        }

        // Handle page visibility changes
        const handleVisibilityChange = () => {
            if (document.hidden) {
                // User switched tabs - pause heartbeat
                stopHeartbeat();
            } else {
                // User returned to tab - resume heartbeat
                startHeartbeat();
            }
        };

        // Start heartbeat when component mounts (if page is visible)
        if (!document.hidden) {
            startHeartbeat();
        }

        // Listen for visibility changes
        document.addEventListener("visibilitychange", handleVisibilityChange);

        // Cleanup on unmount or when projectId/enabled changes
        return () => {
            stopHeartbeat();
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            console.log("🛑 Sandbox heartbeat stopped");
        };
    }, [enabled, projectId, startHeartbeat, stopHeartbeat]);

    return {
        sendHeartbeat, // Expose for manual triggering if needed
    };
}
