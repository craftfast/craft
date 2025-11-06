"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { signIn } from "@/lib/auth-client";

/**
 * OAuth Link Callback Page
 *
 * This page handles the OAuth callback when linking a new provider to an existing account.
 * After successful OAuth, this redirects back to settings with a success message.
 */
function LinkCallbackContent() {
  const searchParams = useSearchParams();
  const provider = searchParams.get("provider");

  useEffect(() => {
    if (provider) {
      // Show a brief message before redirecting
      setTimeout(() => {
        window.location.href = "/";
      }, 2000);
    }
  }, [provider]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full mx-4 text-center">
        <div className="mb-4">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-green-600 dark:text-green-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Account Linked Successfully!
          </h1>
          <p className="text-muted-foreground">
            {provider &&
              `${provider.charAt(0).toUpperCase() + provider.slice(1)}`}{" "}
            has been linked to your account.
          </p>
          <p className="text-sm text-muted-foreground mt-4">
            Redirecting you back...
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LinkCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          Loading...
        </div>
      }
    >
      <LinkCallbackContent />
    </Suspense>
  );
}
