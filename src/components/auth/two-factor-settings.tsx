"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { TwoFactorSetupModal } from "@/components/auth/two-factor-setup-modal";
import { toast } from "sonner";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// Props reserved for future extension
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface TwoFactorSettingsProps {}

export function TwoFactorSettings({}: TwoFactorSettingsProps) {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [password, setPassword] = useState("");
  const [isDisabling, setIsDisabling] = useState(false);

  // Load 2FA status
  useEffect(() => {
    loadTwoFactorStatus();
  }, []);

  const loadTwoFactorStatus = async () => {
    try {
      const response = await fetch("/api/2fa/status");
      if (response.ok) {
        const data = await response.json();
        setTwoFactorEnabled(data.enabled || false);
      }
    } catch (error) {
      console.error("Failed to load 2FA status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle2FA = (checked: boolean) => {
    if (checked) {
      setShowSetupModal(true);
    } else {
      setShowDisableModal(true);
    }
  };

  const handleDisable2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsDisabling(true);
    try {
      const response = await fetch("/api/2fa/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to disable 2FA");
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
      setIsDisabling(false);
    }
  };

  const handleSetupSuccess = () => {
    setTwoFactorEnabled(true);
    toast.success("2FA has been enabled successfully!");
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
              Add an extra layer of security to your account by requiring a code
              from your phone in addition to your password.
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
              <Button
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => {
                  /* TODO: Implement regenerate backup codes */
                }}
              >
                Regenerate Backup Codes
              </Button>
            </div>
          )}
        </div>
      </Card>

      <TwoFactorSetupModal
        open={showSetupModal}
        onOpenChange={setShowSetupModal}
        onSuccess={handleSetupSuccess}
      />

      <DialogPrimitive.Root
        open={showDisableModal}
        onOpenChange={setShowDisableModal}
      >
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-[100000] bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <DialogPrimitive.Content
            className={cn(
              "fixed left-[50%] top-[50%] z-[100001] grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 rounded-2xl"
            )}
          >
            <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </DialogPrimitive.Close>

            <div className="flex flex-col space-y-1.5 text-center sm:text-left">
              <DialogPrimitive.Title className="text-lg font-semibold leading-none tracking-tight">
                Disable Two-Factor Authentication
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="text-sm text-muted-foreground">
                Enter your password to disable 2FA. This will make your account
                less secure.
              </DialogPrimitive.Description>
            </div>

            <form onSubmit={handleDisable2FA} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowDisableModal(false);
                    setPassword("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="destructive"
                  disabled={isDisabling}
                >
                  {isDisabling ? "Disabling..." : "Disable 2FA"}
                </Button>
              </div>
            </form>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </>
  );
}
