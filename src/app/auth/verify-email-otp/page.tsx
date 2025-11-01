"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";
import OTPInput from "@/components/auth/OTPInput";
import { emailOtp } from "@/lib/auth-client";

function VerifyEmailOTPContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get("email");
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const planParam = searchParams.get("plan");

  const [email, setEmail] = useState(emailParam || "");
  const [otp, setOTP] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Cooldown timer for resend
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(
        () => setResendCooldown(resendCooldown - 1),
        1000
      );
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleVerify = async () => {
    if (otp.length !== 6) {
      setError("Please enter the complete 6-digit code");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const result = await emailOtp.verifyEmail({
        email,
        otp,
      });

      if (result.error) {
        setError(
          result.error.message ||
            "Invalid verification code. Please check and try again."
        );
        setLoading(false);
        return;
      }

      setSuccess(true);
      setLoading(false);

      // Redirect to callback URL or dashboard after 2 seconds
      setTimeout(() => {
        let finalRedirectUrl = callbackUrl;
        if (planParam) {
          const url = new URL(callbackUrl, window.location.origin);
          url.searchParams.set("plan", planParam);
          finalRedirectUrl = url.pathname + url.search;
        }
        router.push(finalRedirectUrl);
        router.refresh();
      }, 2000);
    } catch (err) {
      console.error("Verification error:", err);
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setError("");
    setResendLoading(true);

    try {
      const result = await emailOtp.sendVerificationOtp({
        email,
        type: "email-verification",
      });

      if (result.error) {
        setError(result.error.message || "Failed to resend code");
        setResendLoading(false);
        return;
      }

      setResendLoading(false);
      setResendCooldown(60); // 60 second cooldown
      setOTP(""); // Clear current OTP
    } catch (err) {
      console.error("Resend error:", err);
      setError("Failed to resend code");
      setResendLoading(false);
    }
  };

  // Auto-verify when OTP is complete
  const handleOTPComplete = (value: string) => {
    setOTP(value);
    // Auto-submit after a brief delay
    setTimeout(() => {
      handleVerify();
    }, 100);
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950 px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link href="/" className="inline-block mb-6">
              <Logo variant="full" />
            </Link>
          </div>

          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-8">
            <div className="text-center space-y-4">
              {/* Success Icon */}
              <div className="w-16 h-16 mx-auto bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-neutral-900 dark:text-neutral-50"
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

              <div>
                <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50 mb-2">
                  Email Verified!
                </h1>
                <p className="text-neutral-600 dark:text-neutral-400">
                  Your email has been successfully verified. Redirecting to
                  dashboard...
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-6">
            <Logo variant="full" />
          </Link>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50">
            Verify Your Email
          </h1>
          <p className="mt-3 text-neutral-600 dark:text-neutral-400">
            We&apos;ve sent a 6-digit code to{" "}
            <span className="font-medium text-neutral-900 dark:text-neutral-50">
              {email}
            </span>
          </p>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-8">
          <div className="space-y-6">
            {/* OTP Input */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3 text-center">
                Enter verification code
              </label>
              <OTPInput
                value={otp}
                onChange={setOTP}
                onComplete={handleOTPComplete}
                disabled={loading}
                error={!!error}
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-xl p-4">
                <p className="text-sm text-red-800 dark:text-red-200 text-center">
                  {error}
                </p>
              </div>
            )}

            {/* Verify Button */}
            <Button
              onClick={handleVerify}
              disabled={loading || otp.length !== 6}
              className="w-full h-12 rounded-full"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Verifying...
                </>
              ) : (
                "Verify Email"
              )}
            </Button>

            {/* Resend Code */}
            <div className="text-center space-y-3">
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Didn&apos;t receive the code?
              </p>
              <Button
                onClick={handleResendOTP}
                disabled={resendLoading || resendCooldown > 0}
                variant="outline"
                className="w-full h-11 rounded-full"
              >
                {resendLoading
                  ? "Sending..."
                  : resendCooldown > 0
                  ? `Resend in ${resendCooldown}s`
                  : "Resend Code"}
              </Button>
            </div>

            {/* Help Text */}
            <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800">
              <p className="text-xs text-neutral-500 dark:text-neutral-500 text-center">
                The code will expire in 5 minutes. Check your spam folder if you
                don&apos;t see it.
              </p>
            </div>
          </div>
        </div>

        {/* Back to Sign In */}
        <div className="mt-6 text-center">
          <Link
            href="/auth/signin"
            className="text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-50 transition-colors"
          >
            ← Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailOTPPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-900 dark:border-neutral-50" />
        </div>
      }
    >
      <VerifyEmailOTPContent />
    </Suspense>
  );
}
