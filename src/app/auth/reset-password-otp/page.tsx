"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import OTPInput from "@/components/auth/OTPInput";
import { emailOtp, forgetPassword } from "@/lib/auth-client";

function ResetPasswordOTPContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get("email");

  const [step, setStep] = useState<"email" | "otp" | "success">("email");
  const [email, setEmail] = useState(emailParam || "");
  const [otp, setOTP] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
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

  // If email is provided, skip to OTP step
  useEffect(() => {
    if (emailParam && step === "email") {
      setStep("otp");
    }
  }, [emailParam, step]);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await forgetPassword.emailOtp({
        email,
      });

      if (result.error) {
        setError(result.error.message || "Failed to send reset code");
        setLoading(false);
        return;
      }

      setStep("otp");
      setResendCooldown(60);
      setLoading(false);
    } catch (err) {
      console.error("Send OTP error:", err);
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (otp.length !== 6) {
      setError("Please enter the complete 6-digit code");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const result = await emailOtp.resetPassword({
        email,
        otp,
        password,
      });

      if (result.error) {
        setError(
          result.error.message ||
            "Invalid code or password. Please check and try again."
        );
        setLoading(false);
        return;
      }

      setStep("success");
      setLoading(false);

      // Redirect to sign in after 3 seconds
      setTimeout(() => {
        router.push("/auth/signin");
      }, 3000);
    } catch (err) {
      console.error("Reset password error:", err);
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setError("");
    setResendLoading(true);

    try {
      const result = await forgetPassword.emailOtp({
        email,
      });

      if (result.error) {
        setError(result.error.message || "Failed to resend code");
        setResendLoading(false);
        return;
      }

      setResendLoading(false);
      setResendCooldown(60);
      setOTP("");
    } catch (err) {
      console.error("Resend error:", err);
      setError("Failed to resend code");
      setResendLoading(false);
    }
  };

  if (step === "success") {
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
                  Password Reset!
                </h1>
                <p className="text-neutral-600 dark:text-neutral-400">
                  Your password has been successfully reset. Redirecting to sign
                  in...
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === "otp") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950 px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link href="/" className="inline-block mb-6">
              <Logo variant="full" />
            </Link>
            <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50">
              Reset Your Password
            </h1>
            <p className="mt-3 text-neutral-600 dark:text-neutral-400">
              Enter the 6-digit code sent to{" "}
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
                  Verification code
                </label>
                <OTPInput
                  value={otp}
                  onChange={setOTP}
                  disabled={loading}
                  error={!!error}
                />
              </div>

              {/* New Password */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  New Password
                </label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter new password"
                  disabled={loading}
                  className="h-12 rounded-full"
                />
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Confirm Password
                </label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  disabled={loading}
                  className="h-12 rounded-full"
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

              {/* Reset Button */}
              <Button
                onClick={handleResetPassword}
                disabled={
                  loading || otp.length !== 6 || !password || !confirmPassword
                }
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
                    Resetting Password...
                  </>
                ) : (
                  "Reset Password"
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
                  The code will expire in 5 minutes.
                </p>
              </div>
            </div>
          </div>

          {/* Back Link */}
          <div className="mt-6 text-center">
            <button
              onClick={() => setStep("email")}
              className="text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-50 transition-colors"
            >
              ← Use a different email
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Email step
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-6">
            <Logo variant="full" />
          </Link>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50">
            Reset Your Password
          </h1>
          <p className="mt-3 text-neutral-600 dark:text-neutral-400">
            Enter your email and we&apos;ll send you a verification code
          </p>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-8">
          <form onSubmit={handleSendOTP} className="space-y-6">
            {/* Email Input */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Email Address
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                disabled={loading}
                className="h-12 rounded-full"
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

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading || !email}
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
                  Sending Code...
                </>
              ) : (
                "Send Verification Code"
              )}
            </Button>
          </form>
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

export default function ResetPasswordOTPPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-900 dark:border-neutral-50" />
        </div>
      }
    >
      <ResetPasswordOTPContent />
    </Suspense>
  );
}
