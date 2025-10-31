"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

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
  const handleSetup = async () => {
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
  };

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
  if (open && step === "qr" && !qrCode && !isLoading) {
    handleSetup();
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Enable Two-Factor Authentication</DialogTitle>
          <DialogDescription>
            {step === "qr" && "Setting up 2FA..."}
            {step === "verify" &&
              "Scan the QR code with your authenticator app"}
            {step === "backup" && "Save your backup codes"}
          </DialogDescription>
        </DialogHeader>

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

            <DialogFooter>
              <Button
                type="submit"
                disabled={isLoading || token.length !== 6}
                className="w-full"
              >
                {isLoading ? "Verifying..." : "Verify and Enable"}
              </Button>
            </DialogFooter>
          </form>
        )}

        {step === "backup" && (
          <div className="space-y-4">
            <div className="rounded-lg bg-neutral-100 dark:bg-neutral-900 p-4">
              <p className="text-sm font-medium mb-2">Backup Codes</p>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-3">
                Save these codes in a secure place. Each can only be used once.
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

            <DialogFooter className="flex-col sm:flex-col gap-2">
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
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
