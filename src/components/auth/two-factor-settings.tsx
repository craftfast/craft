"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X, Download, Copy, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useSession, twoFactor } from "@/lib/auth-client";
import QRCode from "qrcode";

// Props reserved for future extension
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface TwoFactorSettingsProps {}

export function TwoFactorSettings({}: TwoFactorSettingsProps) {
  const { data: session } = useSession();
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [showBackupCodesModal, setShowBackupCodesModal] = useState(false);
  const [password, setPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [step, setStep] = useState<"password" | "qr" | "verify" | "backup">(
    "password"
  );

  // Load 2FA status from session
  useEffect(() => {
    if (session?.user) {
      setTwoFactorEnabled(session.user.twoFactorEnabled || false);
      setIsLoading(false);
    }
  }, [session]);

  // Step 1: Enable 2FA with password
  const handleEnableTwoFactor = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      const result = await twoFactor.enable({
        password,
      });

      if (result.error) {
        throw new Error(result.error.message || "Failed to enable 2FA");
      }

      if (result.data) {
        // Generate QR code
        const qrDataUrl = await QRCode.toDataURL(result.data.totpURI);
        setQrCodeDataUrl(qrDataUrl);
        setBackupCodes(result.data.backupCodes || []);
        setStep("qr");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to enable 2FA"
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // Step 2: Verify TOTP code
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      const result = await twoFactor.verifyTotp({
        code: verificationCode,
      });

      if (result.error) {
        throw new Error(result.error.message || "Invalid verification code");
      }

      setStep("backup");
      setTwoFactorEnabled(true);
      toast.success("2FA enabled successfully!");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to verify code"
      );
      setVerificationCode("");
    } finally {
      setIsProcessing(false);
    }
  };

  // Disable 2FA
  const handleDisable2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      const result = await twoFactor.disable({
        password,
      });

      if (result.error) {
        throw new Error(result.error.message || "Failed to disable 2FA");
      }

      setTwoFactorEnabled(false);
      setShowDisableModal(false);
      setPassword("");
      toast.success("2FA has been disabled");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to disable 2FA"
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // Regenerate backup codes
  const handleRegenerateBackupCodes = async () => {
    if (!password) {
      toast.error("Please enter your password");
      return;
    }

    setIsProcessing(true);
    try {
      const result = await twoFactor.generateBackupCodes({
        password,
      });

      if (result.error) {
        throw new Error(
          result.error.message || "Failed to generate backup codes"
        );
      }

      if (result.data?.backupCodes) {
        setBackupCodes(result.data.backupCodes);
        setShowBackupCodesModal(true);
        setPassword("");
        toast.success("New backup codes generated");
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to generate backup codes"
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadBackupCodes = () => {
    const text = `Craft - Two-Factor Authentication Backup Codes\n\n${backupCodes.join(
      "\n"
    )}\n\nKeep these codes safe. Each code can only be used once.`;
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "craft-2fa-backup-codes.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyCode = async (code: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleSetupComplete = () => {
    setShowSetupModal(false);
    setStep("password");
    setPassword("");
    setVerificationCode("");
    setQrCodeDataUrl("");
    setBackupCodes([]);
  };

  const handleToggle2FA = (checked: boolean) => {
    if (checked) {
      setShowSetupModal(true);
      setStep("password");
      setPassword("");
      setVerificationCode("");
      setQrCodeDataUrl("");
      setBackupCodes([]);
    } else {
      setShowDisableModal(true);
      setPassword("");
    }
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-1/3" />
          <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-2/3" />
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              Two-Factor Authentication
            </h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
              Add an extra layer of security to your account by requiring a
              code from your phone in addition to your password.
            </p>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-neutral-200 dark:border-neutral-800">
            <div className="space-y-0.5">
              <Label htmlFor="2fa-toggle" className="text-base">
                Enable 2FA
              </Label>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                {twoFactorEnabled
                  ? "Your account is protected with 2FA"
                  : "Not enabled"}
              </p>
            </div>
            <Switch
              id="2fa-toggle"
              checked={twoFactorEnabled}
              onCheckedChange={handleToggle2FA}
            />
          </div>

          {twoFactorEnabled && (
            <div className="pt-4 space-y-2">
              <div className="space-y-2">
                <Label htmlFor="password-backup">Password</Label>
                <Input
                  id="password-backup"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="max-w-sm"
                />
              </div>
              <Button
                variant="outline"
                className="w-full sm:w-auto"
                onClick={handleRegenerateBackupCodes}
                disabled={!password || isProcessing}
              >
                {isProcessing ? "Generating..." : "Regenerate Backup Codes"}
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Setup Modal */}
      <DialogPrimitive.Root
        open={showSetupModal}
        onOpenChange={setShowSetupModal}
      >
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <DialogPrimitive.Content className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-2xl">
            <div className="flex items-center justify-between">
              <DialogPrimitive.Title className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                {step === "password" && "Enable Two-Factor Authentication"}
                {step === "qr" && "Scan QR Code"}
                {step === "verify" && "Verify Code"}
                {step === "backup" && "Save Backup Codes"}
              </DialogPrimitive.Title>
              <DialogPrimitive.Close className="rounded-full p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                <X className="h-4 w-4" />
              </DialogPrimitive.Close>
            </div>

            {step === "password" && (
              <form onSubmit={handleEnableTwoFactor} className="space-y-4">
                <div>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                    Enter your password to continue with 2FA setup.
                  </p>
                  <Label htmlFor="setup-password">Password</Label>
                  <Input
                    id="setup-password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="mt-1.5"
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowSetupModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isProcessing || !password}>
                    {isProcessing ? "Processing..." : "Continue"}
                  </Button>
                </div>
              </form>
            )}

            {step === "qr" && (
              <div className="space-y-4">
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Scan this QR code with your authenticator app (Google
                  Authenticator, Authy, etc.)
                </p>
                <div className="flex justify-center p-4 bg-white rounded-lg">
                  {qrCodeDataUrl && (
                    <img
                      src={qrCodeDataUrl}
                      alt="QR Code"
                      className="w-48 h-48"
                    />
                  )}
                </div>
                <Button onClick={() => setStep("verify")} className="w-full">
                  Continue
                </Button>
              </div>
            )}

            {step === "verify" && (
              <form onSubmit={handleVerifyCode} className="space-y-4">
                <div>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                    Enter the 6-digit code from your authenticator app.
                  </p>
                  <Label htmlFor="verification-code">Verification Code</Label>
                  <Input
                    id="verification-code"
                    type="text"
                    placeholder="000000"
                    value={verificationCode}
                    onChange={(e) =>
                      setVerificationCode(
                        e.target.value.replace(/\D/g, "").slice(0, 6)
                      )
                    }
                    required
                    className="mt-1.5 text-center text-2xl tracking-widest"
                    maxLength={6}
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep("qr")}
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    disabled={isProcessing || verificationCode.length !== 6}
                  >
                    {isProcessing ? "Verifying..." : "Verify"}
                  </Button>
                </div>
              </form>
            )}

            {step === "backup" && (
              <div className="space-y-4">
                <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900 rounded-lg p-4">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium">
                     Save these backup codes in a safe place
                  </p>
                  <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                    You can use these codes to access your account if you lose
                    access to your authenticator app. Each code can only be
                    used once.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 p-4 bg-neutral-50 dark:bg-neutral-900 rounded-lg">
                  {backupCodes.map((code, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-white dark:bg-neutral-800 rounded-lg group"
                    >
                      <code className="text-sm font-mono">{code}</code>
                      <button
                        type="button"
                        onClick={() => copyCode(code)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        {copiedCode === code ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4 text-neutral-400" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={downloadBackupCodes}
                    variant="outline"
                    className="flex-1"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  <Button onClick={handleSetupComplete} className="flex-1">
                    Done
                  </Button>
                </div>
              </div>
            )}
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>

      {/* Disable Modal */}
      <DialogPrimitive.Root
        open={showDisableModal}
        onOpenChange={setShowDisableModal}
      >
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <DialogPrimitive.Content className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-2xl">
            <div className="flex items-center justify-between">
              <DialogPrimitive.Title className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                Disable Two-Factor Authentication
              </DialogPrimitive.Title>
              <DialogPrimitive.Close className="rounded-full p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                <X className="h-4 w-4" />
              </DialogPrimitive.Close>
            </div>

            <form onSubmit={handleDisable2FA} className="space-y-4">
              <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg p-4">
                <p className="text-sm text-red-800 dark:text-red-200">
                  This will remove two-factor authentication from your account
                  and make it less secure.
                </p>
              </div>
              <div>
                <Label htmlFor="disable-password">Password</Label>
                <Input
                  id="disable-password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="mt-1.5"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowDisableModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="destructive"
                  disabled={isProcessing || !password}
                >
                  {isProcessing ? "Disabling..." : "Disable 2FA"}
                </Button>
              </div>
            </form>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>

      {/* Backup Codes Modal */}
      <DialogPrimitive.Root
        open={showBackupCodesModal}
        onOpenChange={setShowBackupCodesModal}
      >
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <DialogPrimitive.Content className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-2xl">
            <div className="flex items-center justify-between">
              <DialogPrimitive.Title className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                New Backup Codes
              </DialogPrimitive.Title>
              <DialogPrimitive.Close className="rounded-full p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                <X className="h-4 w-4" />
              </DialogPrimitive.Close>
            </div>

            <div className="space-y-4">
              <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900 rounded-lg p-4">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  Your old backup codes have been replaced. Save these new
                  codes in a safe place.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 p-4 bg-neutral-50 dark:bg-neutral-900 rounded-lg">
                {backupCodes.map((code, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-white dark:bg-neutral-800 rounded-lg group"
                  >
                    <code className="text-sm font-mono">{code}</code>
                    <button
                      type="button"
                      onClick={() => copyCode(code)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      {copiedCode === code ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4 text-neutral-400" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={downloadBackupCodes}
                  variant="outline"
                  className="flex-1"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button
                  onClick={() => setShowBackupCodesModal(false)}
                  className="flex-1"
                >
                  Done
                </Button>
              </div>
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </>
  );
}
