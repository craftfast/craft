"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { twoFactor } from "@/lib/auth-client";
import Logo from "@/components/Logo";
import Link from "next/link";

export default function Verify2FAPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [code, setCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [useBackupCode, setUseBackupCode] = useState(false);
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const handleVerifyTotp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);

    try {
      const result = await twoFactor.verifyTotp({
        code,
      });

      if (result.error) {
        throw new Error(result.error.message || "Invalid verification code");
      }

      toast.success("2FA verification successful!");
      router.push(callbackUrl);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Verification failed"
      );
      setCode("");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleVerifyBackupCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);

    try {
      const result = await twoFactor.verifyBackupCode({
        code,
      });

      if (result.error) {
        throw new Error(result.error.message || "Invalid backup code");
      }

      toast.success("2FA verification successful!");
      router.push(callbackUrl);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Verification failed"
      );
      setCode("");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950 px-4">
      {/* Logo at top left */}
            <div className="absolute top-4 left-4">
              <Link href="/home">
                <Logo variant="extended" />
              </Link>
            </div>
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            Two-Factor Authentication
          </h1>
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
            {useBackupCode
              ? "Enter one of your backup codes"
              : "Enter the 6-digit code from your authenticator app"}
          </p>
        </div>

        <Card className="p-6">
          <form
            onSubmit={useBackupCode ? handleVerifyBackupCode : handleVerifyTotp}
            className="space-y-4"
          >
            <div>
              <Label htmlFor="code">
                {useBackupCode ? "Backup Code" : "Verification Code"}
              </Label>
              <Input
                id="code"
                type="text"
                placeholder={useBackupCode ? "Enter backup code" : "000000"}
                value={code}
                onChange={(e) =>
                  setCode(
                    useBackupCode
                      ? e.target.value
                      : e.target.value.replace(/\D/g, "").slice(0, 6)
                  )
                }
                required
                className={`mt-1.5 ${
                  useBackupCode ? "" : "text-center text-2xl tracking-widest"
                }`}
                maxLength={useBackupCode ? undefined : 6}
                autoFocus
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={
                isVerifying || (useBackupCode ? !code : code.length !== 6)
              }
            >
              {isVerifying ? "Verifying..." : "Verify"}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setUseBackupCode(!useBackupCode);
                  setCode("");
                }}
                className="text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100"
              >
                {useBackupCode
                  ? "Use authenticator code instead"
                  : "Use backup code instead"}
              </button>
            </div>
          </form>
        </Card>

        <p className="text-center text-sm text-neutral-600 dark:text-neutral-400">
          Lost access to your authenticator?{" "}
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
