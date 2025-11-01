"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/Logo";
import { Suspense } from "react";

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const errorMessages: Record<string, string> = {
    Configuration: "There is a problem with the server configuration.",
    AccessDenied: "You do not have permission to sign in.",
    Verification:
      "The verification token has expired or has already been used.",
    OAuthSignin: "Error in constructing an authorization URL.",
    OAuthCallback: "Error in handling the response from OAuth provider.",
    OAuthCreateAccount: "Could not create OAuth provider user in the database.",
    EmailCreateAccount: "Could not create email provider user in the database.",
    Callback: "Error in the OAuth callback handler route.",
    OAuthAccountNotLinked:
      "Email already exists with a different provider. Please sign in with the original provider.",
    EmailSignin: "Email could not be sent.",
    CredentialsSignin:
      "Sign in failed. Check the details you provided are correct.",
    SessionRequired: "Please sign in to access this page.",
    email_doesnt_match:
      "The OAuth account email doesn't match your current account email. To link this account, please either: (1) Update your OAuth provider's email to match your Craft account email, or (2) Change your Craft account email to match your OAuth provider's email first.",
    email_already_in_use:
      "This email address is already in use by another account.",
    invalid_token:
      "The verification link is invalid or has expired. Please request a new one.",
    account_already_linked_to_different_user:
      "This OAuth account is already linked to a different user.",
    unable_to_link_account:
      "Unable to link this account. Please ensure the provider account is verified.",
    Default: "An error occurred while trying to authenticate.",
  };

  const errorMessage = error
    ? errorMessages[error] || errorMessages.Default
    : errorMessages.Default;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Logo variant="extended" />
        </div>

        {/* Error Card */}
        <div className="bg-neutral-50 dark:bg-neutral-900 rounded-2xl p-8 border border-neutral-200 dark:border-neutral-800 text-center">
          {/* Error Icon */}
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-red-600 dark:text-red-400"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>

          {/* Error Message */}
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
            Authentication Error
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 mb-6">
            {errorMessage}
          </p>

          {/* Actions */}
          <div className="space-y-3">
            <Link
              href="/auth/signin"
              className="block w-full bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 py-3 rounded-full font-medium hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
            >
              Try again
            </Link>
            <Link
              href="/home"
              className="block w-full bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 py-3 rounded-full font-medium hover:bg-neutral-300 dark:hover:bg-neutral-700 transition-colors"
            >
              Back to home
            </Link>
          </div>
        </div>

        {/* Support */}
        <p className="text-center mt-6 text-sm text-neutral-500 dark:text-neutral-400">
          Need help?{" "}
          <Link
            href="/help"
            className="text-neutral-900 dark:text-neutral-100 hover:underline"
          >
            Contact support
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      }
    >
      <AuthErrorContent />
    </Suspense>
  );
}
