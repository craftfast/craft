/**
 * Session Refresh Hook for Better Auth
 * 
 * Provides a mechanism to manually refresh the session after profile updates
 * or other mutations that affect the user's session data.
 * 
 * Better Auth doesn't have a built-in session.update() method like NextAuth,
 * so we need to manually refetch the session and refresh the router.
 */

"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export interface RefreshOptions {
    /**
     * Whether to show a loading state during refresh
     * @default false
     */
    silent?: boolean;

    /**
     * Custom callback to execute after refresh
     */
    onSuccess?: () => void;

    /**
     * Custom callback to execute if refresh fails
     */
    onError?: (error: Error) => void;
}

/**
 * Hook to refresh the Better Auth session
 * 
 * Usage:
 * ```tsx
 * const refreshSession = useRefreshSession();
 * 
 * // After updating user profile
 * await updateProfile();
 * await refreshSession();
 * ```
 * 
 * @returns Async function to refresh the session
 */
export function useRefreshSession() {
    const router = useRouter();

    const refreshSession = useCallback(
        async (options?: RefreshOptions) => {
            try {
                // Fetch fresh session data from Better Auth
                await authClient.$fetch("/api/auth/get-session");

                // Force Next.js to revalidate server components and refresh the page data
                router.refresh();

                // Execute success callback if provided
                options?.onSuccess?.();
            } catch (error) {
                const refreshError = error instanceof Error
                    ? error
                    : new Error("Failed to refresh session");

                console.error("Error refreshing session:", refreshError);

                // Execute error callback if provided
                options?.onError?.(refreshError);
            }
        },
        [router]
    );

    return refreshSession;
}

/**
 * Hook to refresh session with optimistic updates
 * 
 * This variant updates the local state immediately (optimistically)
 * and then syncs with the server in the background.
 * 
 * Usage:
 * ```tsx
 * const { refreshWithOptimistic } = useOptimisticSession();
 * 
 * // Update UI immediately, sync in background
 * await refreshWithOptimistic({ name: "New Name" });
 * ```
 */
export function useOptimisticSession() {
    const router = useRouter();

    const refreshWithOptimistic = useCallback(
        async (optimisticData?: Record<string, any>) => {
            try {
                // Optimistic update is handled by the caller (update UI first)
                // Then we sync with the server
                await authClient.$fetch("/api/auth/get-session");
                router.refresh();
            } catch (error) {
                console.error("Error in optimistic session refresh:", error);
                // Revert optimistic update by refreshing again
                router.refresh();
                throw error;
            }
        },
        [router]
    );

    return { refreshWithOptimistic };
}
