"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/lib/auth-client";
import { useRefreshSession } from "@/hooks/use-refresh-session";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import {
  AccountTab,
  PasswordSetupModal,
  DeleteAccountModal,
} from "@/components/settings";
import {
  updateUser,
  unlinkAccount,
  linkSocial,
  changePassword,
} from "@/lib/auth-client";
import { validatePassword } from "@/lib/password-validation";
import validator from "validator";
import { toast } from "sonner";

interface LinkedAccounts {
  google: { email: string | null; connected: boolean } | null;
  github: { email: string | null; connected: boolean } | null;
  credentials: { email: string | null; connected: boolean } | null;
}

export default function AccountSettingsPage() {
  const { data: session } = useSession();
  const refreshSession = useRefreshSession();

  // Profile management state
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Linked accounts state
  const [linkedAccounts, setLinkedAccounts] = useState<LinkedAccounts | null>(
    null
  );
  const [isLoadingLinkedAccounts, setIsLoadingLinkedAccounts] = useState(false);
  const [showPasswordSetupModal, setShowPasswordSetupModal] = useState(false);
  const [isLinkingProvider, setIsLinkingProvider] = useState(false);

  // Email change state
  const [newEmail, setNewEmail] = useState("");
  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [showEmailChangeForm, setShowEmailChangeForm] = useState(false);
  const [emailChangeOTP, setEmailChangeOTP] = useState("");
  const [isEmailOTPSent, setIsEmailOTPSent] = useState(false);
  const [isSendingEmailOTP, setIsSendingEmailOTP] = useState(false);
  const [emailResendCooldown, setEmailResendCooldown] = useState(0);

  // Password change state
  const [showPasswordChangeForm, setShowPasswordChangeForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPasswordForChange, setNewPasswordForChange] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Account deletion state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletionStatus, setDeletionStatus] = useState<{
    isScheduledForDeletion: boolean;
    deletionScheduledAt: string | null;
    daysRemaining: number | null;
  } | null>(null);
  const [isLoadingDeletionStatus, setIsLoadingDeletionStatus] = useState(false);

  // Confirmation dialog state
  const [showUnlinkConfirmation, setShowUnlinkConfirmation] = useState(false);
  const [pendingUnlinkProvider, setPendingUnlinkProvider] = useState<
    "google" | "github" | "credentials" | null
  >(null);

  // Cooldown timer for email change OTP resend
  useEffect(() => {
    if (emailResendCooldown > 0) {
      const timer = setTimeout(
        () => setEmailResendCooldown(emailResendCooldown - 1),
        1000
      );
      return () => clearTimeout(timer);
    }
  }, [emailResendCooldown]);

  // Fetch data on mount
  useEffect(() => {
    if (session?.user) {
      fetchUserProfile();
      fetchLinkedAccounts();
      fetchDeletionStatus();
    }
  }, [session]);

  const fetchUserProfile = async () => {
    setIsLoadingProfile(true);
    try {
      const res = await fetch("/api/user/profile");
      if (res.ok) {
        const data = await res.json();
        setUserName(data.name || "");
        setUserEmail(data.email || "");
        setProfileImage(data.image);
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!userName.trim()) {
      toast.error("Name cannot be empty");
      return;
    }

    setIsSavingProfile(true);
    toast.loading("Updating profile...", { id: "update-profile" });

    try {
      const result = await updateUser({
        name: userName.trim(),
      });

      if (result.error) {
        toast.error(result.error.message || "Failed to update profile", {
          id: "update-profile",
        });
      } else {
        await refreshSession();
        toast.success("Profile updated successfully", {
          id: "update-profile",
        });
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error("Failed to update profile", { id: "update-profile" });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    setIsUploadingImage(true);
    toast.loading("Uploading profile picture...", { id: "upload-avatar" });

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/user/upload-avatar", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setProfileImage(data.user.image);
        await refreshSession();
        toast.success("Profile picture updated successfully", {
          id: "upload-avatar",
        });
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to upload profile picture", {
          id: "upload-avatar",
        });
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload profile picture", {
        id: "upload-avatar",
      });
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleRemoveImage = async () => {
    setIsUploadingImage(true);
    toast.loading("Removing profile picture...", { id: "remove-avatar" });

    try {
      const res = await fetch("/api/user/profile/image", {
        method: "DELETE",
      });

      if (res.ok) {
        setProfileImage(null);
        await refreshSession();
        toast.success("Profile picture removed successfully", {
          id: "remove-avatar",
        });
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to remove profile picture", {
          id: "remove-avatar",
        });
      }
    } catch (error) {
      console.error("Error removing image:", error);
      toast.error("Failed to remove profile picture", { id: "remove-avatar" });
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSendEmailChangeOTP = async () => {
    if (!newEmail.trim()) {
      toast.error("Please enter a new email address");
      return;
    }

    if (!validator.isEmail(newEmail)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsSendingEmailOTP(true);
    toast.loading("Sending verification code...", { id: "email-change-otp" });

    try {
      const res = await fetch("/api/user/change-email/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newEmail }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(data.message || "Verification code sent", {
          id: "email-change-otp",
        });
        setIsEmailOTPSent(true);
        setEmailResendCooldown(60);
      } else {
        toast.error(data.error || "Failed to send verification code", {
          id: "email-change-otp",
        });
      }
    } catch (error) {
      console.error("Error sending email change OTP:", error);
      toast.error("Failed to send verification code", {
        id: "email-change-otp",
      });
    } finally {
      setIsSendingEmailOTP(false);
    }
  };

  const handleVerifyEmailChange = async () => {
    if (!emailChangeOTP) {
      toast.error("Please enter the verification code");
      return;
    }

    if (emailChangeOTP.length !== 6) {
      toast.error("Please enter the complete 6-digit code");
      return;
    }

    setIsChangingEmail(true);
    toast.loading("Verifying code...", { id: "verify-email-change" });

    try {
      const res = await fetch("/api/user/verify-email-change", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp: emailChangeOTP, newEmail }),
      });

      const data = await res.json();

      if (res.ok) {
        const message = data.oauthUnlinked
          ? `Email changed successfully. Your ${data.unlinkedProviders.join(
              " and "
            )} account(s) were automatically unlinked. Please sign in and re-link them with your updated email.`
          : "Email changed successfully. Please sign in again.";

        toast.success(message, {
          id: "verify-email-change",
          duration: 7000,
        });
        setShowEmailChangeForm(false);
        setNewEmail("");
        setEmailChangeOTP("");
        setIsEmailOTPSent(false);

        setTimeout(() => {
          window.location.href = "/auth/signin";
        }, 3000);
      } else {
        toast.error(data.error || "Failed to verify code", {
          id: "verify-email-change",
        });
      }
    } catch (error) {
      console.error("Error verifying email change:", error);
      toast.error("Failed to verify code", { id: "verify-email-change" });
    } finally {
      setIsChangingEmail(false);
    }
  };

  const fetchLinkedAccounts = async () => {
    setIsLoadingLinkedAccounts(true);
    try {
      const res = await fetch("/api/auth/linked-accounts");
      if (res.ok) {
        const data = await res.json();
        setLinkedAccounts(data.accounts);
      }
    } catch (error) {
      console.error("Error fetching linked accounts:", error);
    } finally {
      setIsLoadingLinkedAccounts(false);
    }
  };

  const handleLinkProvider = async (provider: "google" | "github") => {
    setIsLinkingProvider(true);
    toast.loading(`Linking ${provider}...`, { id: "link-provider" });

    try {
      const callbackURL = `${window.location.origin}/settings/account?linked=${provider}`;

      await linkSocial({
        provider,
        callbackURL,
      });
    } catch (error) {
      console.error("Error linking provider:", error);
      toast.error("Failed to link account", { id: "link-provider" });
      setIsLinkingProvider(false);
    }
  };

  const handleUnlinkProvider = async (
    provider: "google" | "github" | "credentials"
  ) => {
    setPendingUnlinkProvider(provider);
    setShowUnlinkConfirmation(true);
  };

  const confirmUnlinkProvider = async () => {
    if (!pendingUnlinkProvider) return;

    const provider = pendingUnlinkProvider;
    const providerName =
      provider === "credentials"
        ? "Email+Password"
        : provider.charAt(0).toUpperCase() + provider.slice(1);

    toast.loading(`Unlinking ${providerName}...`, { id: "unlink-provider" });

    try {
      const providerId = provider === "credentials" ? "credential" : provider;

      const result = await unlinkAccount({
        providerId,
      });

      if (result.error) {
        toast.error(result.error.message || "Failed to unlink provider", {
          id: "unlink-provider",
        });
      } else {
        toast.success(`${providerName} authentication removed successfully`, {
          id: "unlink-provider",
        });
        await fetchLinkedAccounts();
      }
    } catch (error) {
      console.error("Error unlinking provider:", error);
      toast.error("Failed to unlink provider", { id: "unlink-provider" });
    } finally {
      setPendingUnlinkProvider(null);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPasswordForChange || !confirmNewPassword) {
      toast.error("Please fill in all fields");
      return;
    }

    const passwordValidation = validatePassword(newPasswordForChange);
    if (!passwordValidation.isValid) {
      toast.error(passwordValidation.errors[0]);
      return;
    }

    if (newPasswordForChange !== confirmNewPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (currentPassword === newPasswordForChange) {
      toast.error("New password must be different from current password");
      return;
    }

    setIsChangingPassword(true);
    toast.loading("Changing password...", { id: "change-password" });

    try {
      const result = await changePassword({
        currentPassword,
        newPassword: newPasswordForChange,
        revokeOtherSessions: true,
      });

      if (result.error) {
        toast.error(result.error.message || "Failed to change password", {
          id: "change-password",
        });
      } else {
        toast.success(
          "Password changed successfully! Other sessions have been revoked.",
          { id: "change-password", duration: 5000 }
        );
        setShowPasswordChangeForm(false);
        setCurrentPassword("");
        setNewPasswordForChange("");
        setConfirmNewPassword("");
      }
    } catch (error) {
      console.error("Error changing password:", error);
      toast.error("Failed to change password", { id: "change-password" });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const fetchDeletionStatus = async () => {
    setIsLoadingDeletionStatus(true);
    try {
      const res = await fetch("/api/account/deletion-status");
      if (res.ok) {
        const data = await res.json();
        setDeletionStatus(data);
      }
    } catch (error) {
      console.error("Error fetching deletion status:", error);
    } finally {
      setIsLoadingDeletionStatus(false);
    }
  };

  const handleRestoreAccount = async () => {
    try {
      const res = await fetch("/api/account/restore", {
        method: "POST",
      });

      if (res.ok) {
        toast.success("Account deletion cancelled successfully");
        await fetchDeletionStatus();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to cancel account deletion");
      }
    } catch (error) {
      console.error("Error restoring account:", error);
      toast.error("Failed to cancel account deletion");
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="pb-4 border-b border-border">
          <h2 className="text-2xl font-semibold">Account</h2>
        </div>
        <AccountTab
          session={
            session
              ? {
                  user: {
                    ...session.user,
                    image: session.user.image ?? undefined,
                  },
                }
              : null
          }
          profileImage={profileImage ?? ""}
          userName={userName}
          setUserName={setUserName}
          userEmail={userEmail}
          isLoadingProfile={isLoadingProfile}
          isSavingProfile={isSavingProfile}
          isUploadingImage={isUploadingImage}
          handleImageUpload={handleImageUpload}
          handleRemoveImage={handleRemoveImage}
          handleSaveProfile={handleSaveProfile}
          showEmailChangeForm={showEmailChangeForm}
          setShowEmailChangeForm={setShowEmailChangeForm}
          newEmail={newEmail}
          setNewEmail={setNewEmail}
          isEmailOTPSent={isEmailOTPSent}
          setIsEmailOTPSent={setIsEmailOTPSent}
          emailChangeOTP={emailChangeOTP}
          setEmailChangeOTP={setEmailChangeOTP}
          isSendingEmailOTP={isSendingEmailOTP}
          isChangingEmail={isChangingEmail}
          emailResendCooldown={emailResendCooldown}
          handleSendEmailChangeOTP={handleSendEmailChangeOTP}
          handleVerifyEmailChange={handleVerifyEmailChange}
          linkedAccounts={
            linkedAccounts
              ? {
                  google: linkedAccounts.google
                    ? {
                        connected: linkedAccounts.google.connected,
                        email: linkedAccounts.google.email ?? undefined,
                      }
                    : undefined,
                  github: linkedAccounts.github
                    ? {
                        connected: linkedAccounts.github.connected,
                        email: linkedAccounts.github.email ?? undefined,
                      }
                    : undefined,
                  credentials: linkedAccounts.credentials
                    ? {
                        connected: linkedAccounts.credentials.connected,
                        email: linkedAccounts.credentials.email ?? undefined,
                      }
                    : undefined,
                }
              : null
          }
          isLoadingLinkedAccounts={isLoadingLinkedAccounts}
          isLinkingProvider={isLinkingProvider}
          handleLinkProvider={handleLinkProvider as (provider: string) => void}
          handleUnlinkProvider={
            handleUnlinkProvider as (provider: string) => void
          }
          setShowPasswordSetupModal={setShowPasswordSetupModal}
          showPasswordChangeForm={showPasswordChangeForm}
          setShowPasswordChangeForm={setShowPasswordChangeForm}
          currentPassword={currentPassword}
          setCurrentPassword={setCurrentPassword}
          newPasswordForChange={newPasswordForChange}
          setNewPasswordForChange={setNewPasswordForChange}
          confirmNewPassword={confirmNewPassword}
          setConfirmNewPassword={setConfirmNewPassword}
          showCurrentPassword={showCurrentPassword}
          setShowCurrentPassword={setShowCurrentPassword}
          showNewPassword={showNewPassword}
          setShowNewPassword={setShowNewPassword}
          showConfirmPassword={showConfirmPassword}
          setShowConfirmPassword={setShowConfirmPassword}
          isChangingPassword={isChangingPassword}
          handleChangePassword={handleChangePassword}
          deletionStatus={
            deletionStatus
              ? {
                  isScheduledForDeletion: deletionStatus.isScheduledForDeletion,
                  daysRemaining: deletionStatus.daysRemaining ?? undefined,
                  deletionScheduledAt:
                    deletionStatus.deletionScheduledAt ?? undefined,
                }
              : null
          }
          isLoadingDeletionStatus={isLoadingDeletionStatus}
          handleRestoreAccount={handleRestoreAccount}
          setShowDeleteModal={setShowDeleteModal}
        />
      </div>

      {/* Password Setup Modal */}
      <PasswordSetupModal
        isOpen={showPasswordSetupModal}
        onClose={() => setShowPasswordSetupModal(false)}
        onSuccess={() => fetchLinkedAccounts()}
      />

      {/* Delete Account Confirmation Modal */}
      <DeleteAccountModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onSuccess={() => fetchDeletionStatus()}
      />

      {/* Unlink Provider Confirmation Dialog */}
      <ConfirmationDialog
        open={showUnlinkConfirmation}
        onOpenChange={setShowUnlinkConfirmation}
        title={`Unlink ${
          pendingUnlinkProvider === "credentials"
            ? "Email+Password"
            : pendingUnlinkProvider === "google"
            ? "Google"
            : pendingUnlinkProvider === "github"
            ? "GitHub"
            : ""
        } Authentication?`}
        description={`Are you sure you want to remove ${
          pendingUnlinkProvider === "credentials"
            ? "email and password"
            : pendingUnlinkProvider === "google"
            ? "Google"
            : pendingUnlinkProvider === "github"
            ? "GitHub"
            : "this"
        } authentication from your account? Make sure you have another way to sign in before proceeding.`}
        confirmLabel="Unlink"
        cancelLabel="Cancel"
        variant="destructive"
        onConfirm={confirmUnlinkProvider}
        onCancel={() => setPendingUnlinkProvider(null)}
      />
    </>
  );
}
