"use client";

import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Clock, X } from "lucide-react";
import {
  useSessionExpiry,
  extendSession,
} from "@/lib/hooks/use-session-expiry";

interface SessionExpiryWarningProps {
  sessionExpiresAt: Date | null | undefined;
  onExpiry?: () => void;
}

/**
 * Session expiry warning banner
 * Shows when session is about to expire with option to extend
 */
export function SessionExpiryWarning({
  sessionExpiresAt,
  onExpiry,
}: SessionExpiryWarningProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const [isExtending, setIsExtending] = useState(false);

  const { showWarning, minutesRemaining, isExpired } = useSessionExpiry(
    sessionExpiresAt,
    {
      warningMinutes: 5,
      onExpiry: () => {
        setIsDismissed(false); // Show expired state
        onExpiry?.();
      },
    }
  );

  const handleExtendSession = async () => {
    setIsExtending(true);
    const success = await extendSession();
    setIsExtending(false);

    if (success) {
      setIsDismissed(true);
      // Reload to get fresh session data
      window.location.reload();
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
  };

  // Session expired
  if (isExpired && !isDismissed) {
    return (
      <Alert className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg rounded-2xl border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/90 backdrop-blur-sm shadow-lg">
        <Clock className="h-5 w-5 text-red-600 dark:text-red-400" />
        <AlertDescription className="ml-2 text-red-900 dark:text-red-100">
          <div className="flex items-center justify-between gap-4">
            <div>
              <strong className="font-semibold">Session Expired</strong>
              <p className="text-sm mt-1">Please sign in again to continue.</p>
            </div>
            <Button
              onClick={() => (window.location.href = "/sign-in")}
              size="sm"
              className="rounded-full bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white shrink-0"
            >
              Sign In
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  // Show warning
  if (showWarning && !isDismissed) {
    return (
      <Alert className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg rounded-2xl border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-900/90 backdrop-blur-sm shadow-lg">
        <Clock className="h-5 w-5 text-neutral-700 dark:text-neutral-300" />
        <AlertDescription className="ml-2 text-neutral-900 dark:text-neutral-100">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <strong className="font-semibold">Session Expiring Soon</strong>
              <p className="text-sm mt-1 text-neutral-600 dark:text-neutral-400">
                Your session will expire in {minutesRemaining} minute
                {minutesRemaining !== 1 ? "s" : ""}.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                onClick={handleExtendSession}
                disabled={isExtending}
                size="sm"
                className="rounded-full bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:hover:bg-neutral-200 text-white dark:text-neutral-900"
              >
                {isExtending ? "Extending..." : "Extend Session"}
              </Button>
              <button
                onClick={handleDismiss}
                className="p-1 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
                aria-label="Dismiss"
              >
                <X className="h-4 w-4 text-neutral-600 dark:text-neutral-400" />
              </button>
            </div>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}
