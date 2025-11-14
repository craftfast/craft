"use client";

import { useEffect, useRef } from "react";

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
 * 
 * @param projectId - The project ID to keep alive
 * @param enabled - Whether heartbeat is enabled (default: true)
 */
export function useSandboxHeartbeat(projectId: string, enabled = true) {
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const isHeartbeatingRef = useRef(false);

    // Send heartbeat request
    const sendHeartbeat = async () => {
        // Prevent concurrent heartbeats
        if (isHeartbeatingRef.current) {
            return;
        }

        try {
            isHeartbeatingRef.current = true;

            const response = await fetch(`/api/sandbox/${projectId}/heartbeat`, {
                method: "POST",
            });

            if (response.ok) {
                const data = await response.json();
                console.log(`💓 Sandbox heartbeat sent - next in ${data.nextHeartbeatIn / 1000}s`);
            } else {
                console.warn("⚠️ Sandbox heartbeat failed:", response.statusText);
            }
        } catch (error) {
            console.error("❌ Failed to send sandbox heartbeat:", error);
        } finally {
            isHeartbeatingRef.current = false;
        }
    };

    // Start heartbeat interval
    const startHeartbeat = () => {
        // Clear any existing interval
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }

        // Send initial heartbeat immediately
        sendHeartbeat();

        // Then send every 5 minutes
        intervalRef.current = setInterval(sendHeartbeat, 5 * 60 * 1000);
        console.log("💓 Sandbox heartbeat started (every 5 minutes)");
    };

    // Stop heartbeat interval
    const stopHeartbeat = () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
            console.log("💤 Sandbox heartbeat paused");
        }
    };

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

        // Cleanup on unmount
        return () => {
            stopHeartbeat();
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            console.log("🛑 Sandbox heartbeat stopped (component unmounted)");
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Empty deps - only run once on mount

    return {
        sendHeartbeat, // Expose for manual triggering if needed
    };
}
