"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface TwoFactorSetupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function TwoFactorSetupModal({
  open,
  onOpenChange,
  onSuccess,
}: TwoFactorSetupModalProps) {
  const [step, setStep] = useState<"qr" | "verify" | "backup">("qr");
  const [qrCode, setQrCode] = useState<string>("");
  const [secret, setSecret] = useState<string>("");
  const [token, setToken] = useState<string>("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasDownloadedCodes, setHasDownloadedCodes] = useState(false);

  // Reset state when modal opens
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setStep("qr");
      setQrCode("");
      setSecret("");
      setToken("");
      setBackupCodes([]);
      setHasDownloadedCodes(false);
    }
    onOpenChange(newOpen);
  };

  // Step 1: Generate QR code
  const handleSetup = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/2fa/setup", {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to set up 2FA");
      }

      const data = await response.json();
      setQrCode(data.qrCode);
      setSecret(data.secret);
      setStep("verify");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to set up 2FA"
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Step 2: Verify TOTP token
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch("/api/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to verify code");
      }

      const data = await response.json();
      setBackupCodes(data.backupCodes);
      setStep("backup");
      toast.success("2FA enabled successfully!");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Verification failed"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Download backup codes and finish
  const handleDownloadBackupCodes = () => {
    const content = backupCodes.join("\n");
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "craft-2fa-backup-codes.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setHasDownloadedCodes(true);
  };

  const handleFinish = () => {
    handleOpenChange(false);
    onSuccess?.();
  };

  // Trigger setup when modal opens
  useEffect(() => {
    if (open && step === "qr" && !qrCode && !isLoading) {
      handleSetup();
    }
  }, [open, step, qrCode, isLoading, handleSetup]);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={handleOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[100000] bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className={cn(
            "fixed left-[50%] top-[50%] z-[100001] grid w-full max-w-md translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 rounded-2xl"
          )}
        >
          <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>

          <div className="flex flex-col space-y-1.5 text-center sm:text-left">
            <DialogPrimitive.Title className="text-lg font-semibold leading-none tracking-tight">
              Enable Two-Factor Authentication
            </DialogPrimitive.Title>
            <DialogPrimitive.Description className="text-sm text-muted-foreground">
              {step === "qr" && "Setting up 2FA..."}
              {step === "verify" &&
                "Scan the QR code with your authenticator app"}
              {step === "backup" && "Save your backup codes"}
            </DialogPrimitive.Description>
          </div>

          {step === "qr" && (
            <div className="flex justify-center p-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-neutral-300 border-t-neutral-900 dark:border-neutral-700 dark:border-t-neutral-100" />
            </div>
          )}

          {step === "verify" && (
            <form onSubmit={handleVerify} className="space-y-4">
              {qrCode && (
                <div className="flex flex-col items-center space-y-4">
                  <img
                    src={qrCode}
                    alt="QR Code"
                    className="rounded-lg border-2 border-neutral-200 dark:border-neutral-800"
                  />
                  <div className="text-center">
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      Scan with Google Authenticator, Authy, or similar app
                    </p>
                    <p className="mt-2 text-xs font-mono text-neutral-500 dark:text-neutral-500 break-all">
                      {secret}
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="token">Enter 6-digit code</Label>
                <Input
                  id="token"
                  value={token}
                  onChange={(e) =>
                    setToken(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  placeholder="000000"
                  className="text-center text-2xl tracking-widest"
                  maxLength={6}
                  autoComplete="off"
                  required
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
                <Button
                  type="submit"
                  disabled={isLoading || token.length !== 6}
                  className="w-full"
                >
                  {isLoading ? "Verifying..." : "Verify and Enable"}
                </Button>
              </div>
            </form>
          )}

          {step === "backup" && (
            <div className="space-y-4">
              <div className="rounded-lg bg-neutral-100 dark:bg-neutral-900 p-4">
                <p className="text-sm font-medium mb-2">Backup Codes</p>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-3">
                  Save these codes in a secure place. Each can only be used
                  once.
                </p>
                <div className="font-mono text-sm bg-white dark:bg-neutral-950 rounded-lg p-3 space-y-1 max-h-48 overflow-y-auto">
                  {backupCodes.map((code, index) => (
                    <div
                      key={index}
                      className="text-neutral-900 dark:text-neutral-100"
                    >
                      {code}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col sm:flex-col gap-2">
                <Button
                  onClick={handleDownloadBackupCodes}
                  variant="outline"
                  className="w-full"
                >
                  Download Backup Codes
                </Button>
                <Button
                  onClick={handleFinish}
                  disabled={!hasDownloadedCodes}
                  className="w-full"
                >
                  {hasDownloadedCodes ? "Done" : "Download codes to continue"}
                </Button>
              </div>
            </div>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
