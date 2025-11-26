"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<
    "loading" | "success" | "error" | "deprecated"
  >("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      // No token means this is likely an old link
      setStatus("deprecated");
      setMessage(
        "This verification method is no longer supported. Please use the OTP code sent to your email."
      );
      return;
    }

    // Try to verify with the token, but inform users about the new method
    const verifyEmail = async () => {
      try {
        // Better Auth provides /api/auth/verify-email natively
        const response = await fetch(
          `/api/auth/verify-email?token=${encodeURIComponent(token)}`,
          {
            method: "GET",
          }
        );
        const _data = await response.json();

        if (response.ok) {
          setStatus("success");
          setMessage("Your email has been verified successfully!");

          // Redirect to signin after 3 seconds
          setTimeout(() => {
            router.push("/auth/signin");
          }, 3000);
        } else {
          // If verification fails, suggest using OTP
          setStatus("deprecated");
          setMessage(
            "This verification link has expired or is invalid. We now use OTP codes for verification. Please sign in to receive a new verification code."
          );
        }
      } catch (error) {
        console.error("Verification error:", error);
        setStatus("deprecated");
        setMessage(
          "This verification link is no longer valid. We now use OTP codes for verification. Please sign in to receive a new verification code."
        );
      }
    };

    verifyEmail();
  }, [token, router]);

  return (
    <div className="min-h-screen bg-background flex flex-col p-8">
      {/* Logo at top left */}
      <div className="absolute top-4 left-4">
        <Link href="/home">
          <Logo variant="extended" />
        </Link>
      </div>

      {/* Main content centered */}
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-md text-center">
          {status === "loading" && (
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="w-16 h-16 border-4 border-neutral-200 dark:border-neutral-800 border-t-neutral-900 dark:border-t-neutral-100 rounded-full animate-spin"></div>
              </div>
              <h1 className="text-2xl font-medium text-neutral-900 dark:text-neutral-100">
                Verifying your email...
              </h1>
              <p className="text-neutral-600 dark:text-neutral-400">
                Please wait while we verify your email address.
              </p>
            </div>
          )}

          {status === "success" && (
            <div className="space-y-6">
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-neutral-900 dark:bg-neutral-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-white dark:text-neutral-900"
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
              </div>
              <div>
                <h1 className="text-2xl font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                  Email Verified!
                </h1>
                <p className="text-neutral-600 dark:text-neutral-400">
                  {message}
                </p>
              </div>
              <div className="pt-4">
                <p className="text-sm text-neutral-500 dark:text-neutral-500 mb-4">
                  Redirecting to sign in page...
                </p>
                <Link
                  href="/auth/signin"
                  className="inline-block px-6 py-3 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-full font-medium hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-all"
                >
                  Continue to Sign In
                </Link>
              </div>
            </div>
          )}

          {status === "error" && (
            <div className="space-y-6">
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-900 rounded-full flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-neutral-600 dark:text-neutral-400"
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
              </div>
              <div>
                <h1 className="text-2xl font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                  Verification Failed
                </h1>
                <p className="text-neutral-600 dark:text-neutral-400">
                  {message}
                </p>
              </div>
              <div className="pt-4 space-y-3">
                <p className="text-sm text-neutral-500 dark:text-neutral-500">
                  The verification link may have expired or is invalid.
                </p>
                <div className="flex gap-3 justify-center">
                  <Link
                    href="/auth/signin"
                    className="inline-block px-6 py-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-full font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="inline-block px-6 py-3 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-full font-medium hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-all"
                  >
                    Sign Up Again
                  </Link>
                </div>
              </div>
            </div>
          )}

          {status === "deprecated" && (
            <div className="space-y-6">
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-900 rounded-full flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-neutral-600 dark:text-neutral-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                  We&apos;ve Updated Our Verification Process
                </h1>
                <p className="text-neutral-600 dark:text-neutral-400 mb-4">
                  {message}
                </p>
                <div className="bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4">
                  <p className="text-sm text-neutral-700 dark:text-neutral-300 text-left">
                    We now use secure 6-digit OTP codes for faster and more
                    secure email verification. Simply sign in, and we&apos;ll
                    send you a new code instantly.
                  </p>
                </div>
              </div>
              <div className="pt-4">
                <Button asChild className="h-12 rounded-full px-8">
                  <Link href="/auth/signin">Go to Sign In</Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
