"use client";

import { useState, Suspense } from "react";
import { signIn, emailOtp } from "@/lib/auth-client";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function SignInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const planParam = searchParams.get("plan"); // Capture plan parameter

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Use Better Auth's built-in sign-in with 2FA support
      const result = await signIn.email(
        {
          email,
          password,
        },
        {
          onSuccess: (context) => {
            // Check if 2FA redirect is needed
            if (context.data.twoFactorRedirect) {
              // Better Auth will automatically redirect to /auth/verify-2fa
              return;
            }

            // Normal login success
            let finalRedirectUrl = callbackUrl;
            if (planParam) {
              const url = new URL(callbackUrl, window.location.origin);
              url.searchParams.set("plan", planParam);
              finalRedirectUrl = url.pathname + url.search;
            }

            router.push(finalRedirectUrl);
            router.refresh();
          },
          onError: async (ctx) => {
            const errorMessage =
              ctx.error.message || "Invalid email or password";

            // Check if error is about email verification
            if (
              errorMessage.includes("verify your email") ||
              errorMessage.includes("not verified") ||
              errorMessage.includes("email is not verified")
            ) {
              // Send OTP for verification
              try {
                await emailOtp.sendVerificationOtp({
                  email,
                  type: "email-verification",
                });

                // Redirect to OTP verification page
                const params = new URLSearchParams({ email });
                if (callbackUrl !== "/") params.set("callbackUrl", callbackUrl);
                if (planParam) params.set("plan", planParam);

                router.push(`/auth/verify-email-otp?${params.toString()}`);
                return;
              } catch (otpError) {
                console.error("Failed to send OTP:", otpError);
                setError(
                  "Your email is not verified. Failed to send verification code. Please contact support."
                );
                setLoading(false);
                return;
              }
            }

            setError(errorMessage);
            setLoading(false);
          },
        }
      );

      // If result has an error and wasn't handled by onError
      if (result && result.error && !result.error.message) {
        setError("Invalid email or password");
        setLoading(false);
      }
    } catch (err) {
      setError("Something went wrong");
      setLoading(false);
    }
  };

  const handleOAuthSignIn = async (provider: "google" | "github") => {
    setLoading(true);

    // Construct callback URL with plan parameter if present
    let finalCallbackUrl = callbackUrl;
    if (planParam) {
      const url = new URL(callbackUrl, window.location.origin);
      url.searchParams.set("plan", planParam);
      finalCallbackUrl = url.pathname + url.search;
    }

    await signIn.social({
      provider,
      callbackURL: finalCallbackUrl,
    });
  };

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
        <div className="w-full max-w-sm">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-medium text-neutral-900 dark:text-neutral-100 mb-1">
              Welcome back
            </h1>
          </div>

          {/* Auth Options */}
          <div className="space-y-3">
            {/* OAuth Buttons */}
            <Button
              onClick={() => handleOAuthSignIn("google")}
              disabled={loading}
              variant="outline"
              className="w-full h-12 rounded-full"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span className="text-[15px]">Continue with Google</span>
            </Button>

            <Button
              onClick={() => handleOAuthSignIn("github")}
              disabled={loading}
              variant="outline"
              className="w-full h-12 rounded-full"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              <span className="text-[15px]">Continue with GitHub</span>
            </Button>
          </div>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-200 dark:border-neutral-800"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-neutral-950 text-neutral-500 dark:text-neutral-500 text-xs uppercase tracking-wide">
                or
              </span>
            </div>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleEmailSignIn} className="space-y-3">
            {error && (
              <div className="p-3 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-700 dark:text-neutral-300 text-sm">
                {error}
              </div>
            )}

            <div>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 rounded-full px-5"
                placeholder="Email address"
              />
            </div>

            <div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12 rounded-full px-5 pr-12"
                  placeholder="Password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:text-neutral-600 dark:hover:text-neutral-400 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end">
              <Link
                href="/auth/forgot-password"
                className="text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-50 transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-full"
            >
              {loading ? "Continuing..." : "Continue"}
            </Button>
          </form>

          {/* Footer text */}
          <div className="text-center mt-8">
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Don&apos;t have an account?{" "}
              <Link
                href={`/auth/signup${
                  callbackUrl !== "/" || planParam
                    ? `?${new URLSearchParams({
                        ...(callbackUrl !== "/" && {
                          callbackUrl: callbackUrl,
                        }),
                        ...(planParam && { plan: planParam }),
                      }).toString()}`
                    : ""
                }`}
                className="text-neutral-900 dark:text-neutral-100 hover:underline font-medium"
              >
                Sign up
              </Link>
            </p>
          </div>

          {/* Terms and Privacy */}
          <div className="text-center mt-6">
            <div className="flex items-center justify-center gap-4 text-xs text-neutral-500 dark:text-neutral-500">
              <Link href="/terms" className="hover:underline">
                Terms of Use
              </Link>
              <span>|</span>
              <Link href="/privacy" className="hover:underline">
                Privacy Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      }
    >
      <SignInContent />
    </Suspense>
  );
}
