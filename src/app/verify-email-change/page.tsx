"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function VerifyEmailChangePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"verifying" | "success" | "error">(
    "verifying"
  );
  const [message, setMessage] = useState("Verifying your email change...");

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get("token");
      const email = searchParams.get("email");

      if (!token || !email) {
        setStatus("error");
        setMessage("Invalid verification link. Missing required parameters.");
        setTimeout(() => router.push("/settings"), 3000);
        return;
      }

      try {
        // Use POST to submit the verification instead of GET with query params
        const response = await fetch("/api/user/verify-email-change", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token,
            email: decodeURIComponent(email),
          }),
        });

        const data = await response.json();

        if (response.ok) {
          setStatus("success");
          setMessage(
            data.message || "Email changed successfully! Redirecting..."
          );
          setTimeout(
            () => router.push("/settings?success=Email+changed+successfully"),
            2000
          );
        } else {
          setStatus("error");

          // Provide user-friendly error messages
          let errorMessage = data.error || "Failed to verify email change.";

          // Map common errors to user-friendly messages
          if (errorMessage.includes("doesn't match")) {
            errorMessage =
              "The verification link appears to be incorrect. Please request a new email change from your settings.";
          } else if (errorMessage.includes("expired")) {
            errorMessage =
              "This verification link has expired. Please request a new email change from your settings.";
          } else if (errorMessage.includes("already in use")) {
            errorMessage =
              "This email address is already in use. Please try a different email address.";
          } else if (errorMessage.includes("Invalid or expired")) {
            errorMessage =
              "This verification link is invalid or has expired. Please request a new email change from your settings.";
          }

          setMessage(errorMessage);
          setTimeout(
            () =>
              router.push(
                "/settings?error=" + encodeURIComponent(errorMessage)
              ),
            5000
          );
        }
      } catch (error) {
        console.error("Email verification error:", error);
        setStatus("error");
        setMessage("An error occurred while verifying your email.");
        setTimeout(
          () => router.push("/settings?error=Verification+failed"),
          3000
        );
      }
    };

    verifyEmail();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-lg p-8 border border-neutral-200 dark:border-neutral-800">
          <div className="text-center">
            {status === "verifying" && (
              <div className="space-y-4">
                <div className="w-16 h-16 mx-auto border-4 border-neutral-200 dark:border-neutral-700 border-t-neutral-900 dark:border-t-neutral-100 rounded-full animate-spin" />
                <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
                  Verifying Email
                </h1>
                <p className="text-neutral-600 dark:text-neutral-400">
                  {message}
                </p>
              </div>
            )}

            {status === "success" && (
              <div className="space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-neutral-900 dark:text-neutral-100"
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
                <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
                  Success!
                </h1>
                <p className="text-neutral-600 dark:text-neutral-400">
                  {message}
                </p>
              </div>
            )}

            {status === "error" && (
              <div className="space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-neutral-900 dark:text-neutral-100"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </div>
                <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
                  Verification Failed
                </h1>
                <p className="text-neutral-600 dark:text-neutral-400">
                  {message}
                </p>
                <button
                  onClick={() => router.push("/settings")}
                  className="mt-4 px-6 py-3 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-full font-medium hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
                >
                  Go to Settings
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
