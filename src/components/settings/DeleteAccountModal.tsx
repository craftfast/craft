"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import OTPInput from "@/components/auth/OTPInput";

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function DeleteAccountModal({
  isOpen,
  onClose,
  onSuccess,
}: DeleteAccountModalProps) {
  const [deleteOTP, setDeleteOTP] = useState("");
  const [isOTPSent, setIsOTPSent] = useState(false);
  const [isSendingOTP, setIsSendingOTP] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Countdown timer for resend cooldown
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleClose = () => {
    setDeleteOTP("");
    setIsOTPSent(false);
    setResendCooldown(0);
    onClose();
  };

  const handleSendDeletionOTP = async () => {
    setIsSendingOTP(true);
    try {
      const res = await fetch("/api/account/delete/request-otp", {
        method: "POST",
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Verification code sent to your email");
        setIsOTPSent(true);
        setResendCooldown(60);
      } else {
        toast.error(data.error || "Failed to send verification code");
      }
    } catch (error) {
      console.error("Error sending OTP:", error);
      toast.error("Failed to send verification code");
    } finally {
      setIsSendingOTP(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deleteOTP) {
      toast.error("Please enter the verification code");
      return;
    }

    if (deleteOTP.length !== 6) {
      toast.error("Please enter the complete 6-digit code");
      return;
    }

    setIsDeletingAccount(true);
    try {
      const res = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp: deleteOTP }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(
          "Account scheduled for deletion. You have 30 days to cancel.",
          { duration: 5000 }
        );
        handleClose();
        onSuccess?.();
      } else {
        toast.error(data.error || "Failed to schedule account deletion");
      }
    } catch (error) {
      console.error("Error deleting account:", error);
      toast.error("Failed to schedule account deletion");
    } finally {
      setIsDeletingAccount(false);
    }
  };

  if (!isOpen || typeof window === "undefined") return null;

  const modalContent = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-background border border-border rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-red-600 dark:text-red-400">
            Delete Account
          </h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <svg
              className="w-5 h-5 text-muted-foreground"
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
          </button>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-xl">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <div>
                <p className="text-sm font-semibold text-red-900 dark:text-red-100 mb-1">
                  Warning: This action is serious
                </p>
                <p className="text-sm text-red-800 dark:text-red-200">
                  Your account will be scheduled for deletion with a 30-day
                  grace period. During this time, you can cancel the deletion
                  and restore your account. After 30 days, all your data will be
                  permanently deleted.
                </p>
              </div>
            </div>
          </div>

          {!isOTPSent ? (
            <div>
              <p className="text-sm text-muted-foreground mb-4">
                We&apos;ll send a verification code to your email to confirm
                this action.
              </p>
              <Button
                onClick={handleSendDeletionOTP}
                className="w-full rounded-full"
                disabled={isSendingOTP}
              >
                {isSendingOTP ? "Sending Code..." : "Send Verification Code"}
              </Button>
            </div>
          ) : (
            <div>
              <Label
                htmlFor="delete-otp"
                className="text-sm font-medium text-muted-foreground mb-3 block text-center"
              >
                Enter the 6-digit code sent to your email
              </Label>
              <OTPInput
                value={deleteOTP}
                onChange={setDeleteOTP}
                disabled={isDeletingAccount}
                className="mb-4"
              />

              <div className="text-center mb-4">
                <p className="text-xs text-muted-foreground mb-2">
                  Didn&apos;t receive the code?
                </p>
                <Button
                  onClick={handleSendDeletionOTP}
                  disabled={isSendingOTP || resendCooldown > 0}
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                >
                  {isSendingOTP
                    ? "Sending..."
                    : resendCooldown > 0
                    ? `Resend in ${resendCooldown}s`
                    : "Resend Code"}
                </Button>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              onClick={handleClose}
              variant="outline"
              className="flex-1 rounded-full"
              disabled={isDeletingAccount}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteAccount}
              className="flex-1 rounded-full bg-red-600 hover:bg-red-700 text-white"
              disabled={
                isDeletingAccount || !isOTPSent || deleteOTP.length !== 6
              }
            >
              {isDeletingAccount ? "Scheduling..." : "Delete My Account"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
