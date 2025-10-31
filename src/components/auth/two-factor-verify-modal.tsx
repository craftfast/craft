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

interface TwoFactorVerifyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pendingToken: string;
  onSuccess: (password: string) => void;
}

export function TwoFactorVerifyModal({
  open,
  onOpenChange,
  pendingToken,
  onSuccess,
}: TwoFactorVerifyModalProps) {
  const [token, setToken] = useState<string>("");
  const [isBackupCode, setIsBackupCode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch("/api/2fa/verify-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pendingToken,
          token: token.replace(/\s|-/g, ""), // Remove spaces and dashes
          isBackupCode,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Verification failed");
      }

      toast.success("Verification successful!");
      onSuccess("");
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Verification failed"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Two-Factor Authentication</DialogTitle>
          <DialogDescription>
            Enter your authentication code to continue
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleVerify} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">
              {isBackupCode ? "Backup Code" : "Authentication Code"}
            </Label>
            <Input
              id="code"
              value={token}
              onChange={(e) =>
                setToken(
                  isBackupCode
                    ? e.target.value.toUpperCase()
                    : e.target.value.replace(/\D/g, "").slice(0, 6)
                )
              }
              placeholder={isBackupCode ? "XXXX-XXXX" : "000000"}
              className="text-center text-2xl tracking-widest font-mono"
              autoComplete="off"
              required
            />
          </div>

          <button
            type="button"
            onClick={() => {
              setIsBackupCode(!isBackupCode);
              setToken("");
            }}
            className="text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
          >
            {isBackupCode
              ? "Use authenticator app instead"
              : "Use backup code instead"}
          </button>

          <DialogFooter>
            <Button
              type="submit"
              disabled={isLoading || token.length < 6}
              className="w-full"
            >
              {isLoading ? "Verifying..." : "Verify"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
