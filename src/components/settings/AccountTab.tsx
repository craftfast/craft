"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
import OTPInput from "@/components/auth/OTPInput";
import { TwoFactorSettings } from "@/components/auth/two-factor-settings";

interface LinkedAccount {
  connected: boolean;
  email?: string;
}

interface LinkedAccounts {
  google?: LinkedAccount;
  github?: LinkedAccount;
  credentials?: LinkedAccount;
}

interface DeletionStatus {
  isScheduledForDeletion: boolean;
  daysRemaining?: number;
  deletionScheduledAt?: string;
}

interface ExtendedUser {
  id?: string;
  name?: string;
  email?: string;
  image?: string;
}

interface Session {
  user?: ExtendedUser;
}

interface AccountTabProps {
  session: Session | null;
  profileImage: string;
  userName: string;
  setUserName: (value: string) => void;
  userEmail: string;
  isLoadingProfile: boolean;
  isSavingProfile: boolean;
  isUploadingImage: boolean;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleRemoveImage: () => void;
  handleSaveProfile: () => void;
  showEmailChangeForm: boolean;
  setShowEmailChangeForm: (value: boolean) => void;
  newEmail: string;
  setNewEmail: (value: string) => void;
  isEmailOTPSent: boolean;
  setIsEmailOTPSent: (value: boolean) => void;
  emailChangeOTP: string;
  setEmailChangeOTP: (value: string) => void;
  isSendingEmailOTP: boolean;
  isChangingEmail: boolean;
  emailResendCooldown: number;
  handleSendEmailChangeOTP: () => void;
  handleVerifyEmailChange: () => void;
  linkedAccounts: LinkedAccounts | null;
  isLoadingLinkedAccounts: boolean;
  isLinkingProvider: boolean;
  handleLinkProvider: (provider: string) => void;
  handleUnlinkProvider: (provider: string) => void;
  setShowPasswordSetupModal: (value: boolean) => void;
  showPasswordChangeForm: boolean;
  setShowPasswordChangeForm: (value: boolean) => void;
  currentPassword: string;
  setCurrentPassword: (value: string) => void;
  newPasswordForChange: string;
  setNewPasswordForChange: (value: string) => void;
  confirmNewPassword: string;
  setConfirmNewPassword: (value: string) => void;
  showCurrentPassword: boolean;
  setShowCurrentPassword: (value: boolean) => void;
  showNewPassword: boolean;
  setShowNewPassword: (value: boolean) => void;
  showConfirmPassword: boolean;
  setShowConfirmPassword: (value: boolean) => void;
  isChangingPassword: boolean;
  handleChangePassword: () => void;
  deletionStatus: DeletionStatus | null;
  isLoadingDeletionStatus: boolean;
  handleRestoreAccount: () => void;
  setShowDeleteModal: (value: boolean) => void;
}

export default function AccountTab({
  session,
  profileImage,
  userName,
  setUserName,
  userEmail,
  isLoadingProfile,
  isSavingProfile,
  isUploadingImage,
  handleImageUpload,
  handleRemoveImage,
  handleSaveProfile,
  showEmailChangeForm,
  setShowEmailChangeForm,
  newEmail,
  setNewEmail,
  isEmailOTPSent,
  setIsEmailOTPSent,
  emailChangeOTP,
  setEmailChangeOTP,
  isSendingEmailOTP,
  isChangingEmail,
  emailResendCooldown,
  handleSendEmailChangeOTP,
  handleVerifyEmailChange,
  linkedAccounts,
  isLoadingLinkedAccounts,
  isLinkingProvider,
  handleLinkProvider,
  handleUnlinkProvider,
  setShowPasswordSetupModal,
  showPasswordChangeForm,
  setShowPasswordChangeForm,
  currentPassword,
  setCurrentPassword,
  newPasswordForChange,
  setNewPasswordForChange,
  confirmNewPassword,
  setConfirmNewPassword,
  showCurrentPassword,
  setShowCurrentPassword,
  showNewPassword,
  setShowNewPassword,
  showConfirmPassword,
  setShowConfirmPassword,
  isChangingPassword,
  handleChangePassword,
  deletionStatus,
  isLoadingDeletionStatus,
  handleRestoreAccount,
  setShowDeleteModal,
}: AccountTabProps) {
  return (
    <div className="space-y-6">
      {/* Profile Section */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">Profile</h3>
        <div className="space-y-4">
          {/* Profile Picture */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Profile Picture
            </label>
            <div className="flex items-center gap-4">
              {profileImage || session?.user?.image ? (
                <img
                  src={profileImage || session?.user?.image || ""}
                  alt={userName || session?.user?.name || "User"}
                  className="w-20 h-20 rounded-full object-cover ring-2 ring-ring"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center text-2xl font-semibold ring-2 ring-ring">
                  {userName?.[0]?.toUpperCase() ||
                    session?.user?.name?.[0]?.toUpperCase() ||
                    userEmail?.[0]?.toUpperCase() ||
                    session?.user?.email?.[0]?.toUpperCase() ||
                    "U"}
                </div>
              )}
              <div className="flex flex-col gap-2">
                {/* Show "Upload Image" if no profile picture */}
                {!(profileImage || session?.user?.image) && (
                  <label htmlFor="avatar-upload">
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer text-sm font-medium transition-colors">
                      {isUploadingImage ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Uploading...
                        </>
                      ) : (
                        <>
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                          Upload Image
                        </>
                      )}
                    </span>
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={isUploadingImage}
                    />
                  </label>
                )}

                {/* Show "Update" and "Remove" options if profile picture exists */}
                {(profileImage || session?.user?.image) && (
                  <>
                    <label htmlFor="avatar-upload-update">
                      <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer text-sm font-medium transition-colors">
                        {isUploadingImage ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Uploading...
                          </>
                        ) : (
                          <>
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                            Update Image
                          </>
                        )}
                      </span>
                      <input
                        id="avatar-upload-update"
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        disabled={isUploadingImage}
                      />
                    </label>
                    <button
                      onClick={handleRemoveImage}
                      disabled={isUploadingImage}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors disabled:opacity-50"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                      Remove Image
                    </button>
                  </>
                )}

                <p className="text-xs text-muted-foreground">
                  JPG, PNG, GIF or WebP. Max 5MB.
                </p>
              </div>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Name
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Your name"
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={isLoadingProfile}
              />
              <Button
                onClick={handleSaveProfile}
                disabled={
                  isSavingProfile || isLoadingProfile || !userName.trim()
                }
                className="rounded-full"
              >
                {isSavingProfile ? "Saving..." : "Save"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">
              Your display name visible to others
            </p>
          </div>
        </div>
      </div>

      {/* Email Management Section */}
      <div className="border-t border-border pt-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Email Address
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Manage your primary email address for signing in and receiving
          notifications.
        </p>

        <div className="space-y-4">
          {/* Current Email */}
          <div className="p-4 bg-muted/50 rounded-xl border border-input">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Current Email
                </p>
                <p className="text-sm text-foreground font-medium">
                  {userEmail || session?.user?.email || "No email"}
                </p>
              </div>
              {!showEmailChangeForm && (
                <Button
                  onClick={() => setShowEmailChangeForm(true)}
                  variant="outline"
                  className="rounded-full"
                  size="sm"
                >
                  Change Email
                </Button>
              )}
            </div>
          </div>

          {/* Email Change Form */}
          {showEmailChangeForm && (
            <div className="p-4 bg-muted/30 rounded-xl border border-input space-y-4">
              {!isEmailOTPSent ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">
                      New Email Address
                    </label>
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="Enter new email address"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      disabled={isSendingEmailOTP}
                    />
                    <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg">
                      <p className="text-xs text-blue-800 dark:text-blue-300">
                        ℹ️ <strong>Note:</strong> Changing your email will
                        automatically unlink any connected OAuth accounts
                        (Google, GitHub). You can re-link them after the change
                        by signing in with your new email address through those
                        providers.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSendEmailChangeOTP}
                      disabled={isSendingEmailOTP || !newEmail.trim()}
                      className="rounded-full"
                    >
                      {isSendingEmailOTP
                        ? "Sending..."
                        : "Send Verification Code"}
                    </Button>
                    <Button
                      onClick={() => {
                        setShowEmailChangeForm(false);
                        setNewEmail("");
                      }}
                      variant="outline"
                      className="rounded-full"
                      disabled={isSendingEmailOTP}
                    >
                      Cancel
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <Label
                      htmlFor="email-change-otp"
                      className="text-sm font-medium text-muted-foreground"
                    >
                      Enter Verification Code
                    </Label>
                    <p className="text-xs text-muted-foreground mb-3">
                      We sent a 6-digit code to{" "}
                      <span className="font-semibold text-foreground">
                        {newEmail}
                      </span>
                    </p>
                    <OTPInput
                      value={emailChangeOTP}
                      onChange={setEmailChangeOTP}
                      length={6}
                      disabled={isChangingEmail}
                    />
                  </div>

                  <Button
                    onClick={handleVerifyEmailChange}
                    className="w-full rounded-full"
                    disabled={isChangingEmail || emailChangeOTP.length !== 6}
                  >
                    {isChangingEmail ? "Verifying..." : "Verify & Change Email"}
                  </Button>

                  <div className="flex gap-2">
                    <Button
                      onClick={handleSendEmailChangeOTP}
                      variant="outline"
                      className="flex-1 rounded-full"
                      disabled={isSendingEmailOTP || emailResendCooldown > 0}
                    >
                      {emailResendCooldown > 0
                        ? `Resend (${emailResendCooldown}s)`
                        : "Resend Code"}
                    </Button>
                    <Button
                      onClick={() => {
                        setShowEmailChangeForm(false);
                        setNewEmail("");
                        setEmailChangeOTP("");
                        setIsEmailOTPSent(false);
                      }}
                      variant="ghost"
                      className="flex-1 rounded-full"
                      disabled={isChangingEmail}
                    >
                      Cancel
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Account Information */}
      <div className="border-t border-border pt-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Account Information
        </h3>
        <div className="space-y-2">
          <div className="flex justify-between items-center p-3 bg-muted/50 rounded-xl border border-input">
            <span className="text-sm font-medium text-muted-foreground">
              User ID
            </span>
            <span className="text-sm text-muted-foreground font-mono">
              {(session?.user as ExtendedUser)?.id || "N/A"}
            </span>
          </div>
          <div className="flex justify-between items-center p-3 bg-muted/50 rounded-xl border border-input">
            <span className="text-sm font-medium text-muted-foreground">
              Account Status
            </span>
            <span className="text-sm text-neutral-600 dark:text-neutral-300 font-medium">
              Active
            </span>
          </div>
          <div className="flex justify-between items-center p-3 bg-muted/50 rounded-xl border border-input">
            <span className="text-sm font-medium text-muted-foreground">
              Member Since
            </span>
            <span className="text-sm text-muted-foreground">
              {new Date().toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      {/* Linked sign-in providers */}
      <div className="border-t border-border pt-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Linked sign-in providers
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Manage authentication providers linked to your account.
        </p>

        {isLoadingLinkedAccounts ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : linkedAccounts ? (
          <div className="space-y-3">
            {/* Google */}
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl border border-input">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white dark:bg-neutral-900 border border-input flex items-center justify-center">
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
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground">
                      Google
                    </p>
                    {linkedAccounts.google?.connected && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-secondary text-muted-foreground rounded-full">
                        Connected
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {linkedAccounts.google?.connected
                      ? linkedAccounts.google.email || session?.user?.email
                      : "Not connected"}
                  </p>
                </div>
              </div>
              {linkedAccounts.google?.connected ? (
                <button
                  onClick={() => handleUnlinkProvider("google")}
                  className="px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 border border-red-600 dark:border-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                >
                  Unlink
                </button>
              ) : (
                <button
                  onClick={() => handleLinkProvider("google")}
                  disabled={isLinkingProvider}
                  className="px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {isLinkingProvider ? "Connecting..." : "Connect"}
                </button>
              )}
            </div>

            {/* GitHub */}
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl border border-input">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white dark:bg-neutral-900 border border-input flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-muted-foreground"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground">
                      GitHub
                    </p>
                    {linkedAccounts.github?.connected && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-secondary text-muted-foreground rounded-full">
                        Connected
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {linkedAccounts.github?.connected
                      ? linkedAccounts.github.email || session?.user?.email
                      : "Not connected"}
                  </p>
                </div>
              </div>
              {linkedAccounts.github?.connected ? (
                <button
                  onClick={() => handleUnlinkProvider("github")}
                  className="px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 border border-red-600 dark:border-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                >
                  Unlink
                </button>
              ) : (
                <button
                  onClick={() => handleLinkProvider("github")}
                  disabled={isLinkingProvider}
                  className="px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {isLinkingProvider ? "Connecting..." : "Connect"}
                </button>
              )}
            </div>

            {/* Email + Password */}
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl border border-input">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white dark:bg-neutral-900 border border-input flex items-center justify-center">
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
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground">
                      Email + Password
                    </p>
                    {linkedAccounts.credentials?.connected && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-secondary text-muted-foreground rounded-full">
                        Connected
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {linkedAccounts.credentials?.connected
                      ? linkedAccounts.credentials.email || session?.user?.email
                      : "Not connected"}
                  </p>
                </div>
              </div>
              {linkedAccounts.credentials?.connected ? (
                <button
                  onClick={() => handleUnlinkProvider("credentials")}
                  className="px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 border border-red-600 dark:border-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                >
                  Remove
                </button>
              ) : (
                <button
                  onClick={() => setShowPasswordSetupModal(true)}
                  className="px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Set up
                </button>
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            Failed to load linked accounts
          </p>
        )}
      </div>

      {/* Security */}
      <div className="border-t border-border pt-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Security</h3>
        <div className="space-y-4">
          {/* Password Section */}
          {linkedAccounts?.credentials?.connected ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Change your password to keep your account secure.
              </p>

              {!showPasswordChangeForm ? (
                <button
                  onClick={() => setShowPasswordChangeForm(true)}
                  className="w-full px-4 py-3 text-sm font-medium bg-primary text-primary-foreground border border-neutral-300 dark:border-neutral-700 rounded-xl hover:bg-primary/90 transition-colors"
                >
                  Change Password
                </button>
              ) : (
                <div className="p-4 bg-muted/30 rounded-xl border border-input space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter current password"
                        className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        disabled={isChangingPassword}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowCurrentPassword(!showCurrentPassword)
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        tabIndex={-1}
                      >
                        {showCurrentPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        value={newPasswordForChange}
                        onChange={(e) =>
                          setNewPasswordForChange(e.target.value)
                        }
                        placeholder="Enter new password"
                        className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        disabled={isChangingPassword}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        tabIndex={-1}
                      >
                        {showNewPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1.5">
                      Must be at least 12 characters with uppercase, lowercase,
                      number and special character
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        placeholder="Confirm new password"
                        className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        disabled={isChangingPassword}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        tabIndex={-1}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleChangePassword}
                      disabled={
                        isChangingPassword ||
                        !currentPassword.trim() ||
                        !newPasswordForChange.trim() ||
                        !confirmNewPassword.trim()
                      }
                      className="rounded-full"
                    >
                      {isChangingPassword ? "Changing..." : "Change Password"}
                    </Button>
                    <Button
                      onClick={() => {
                        setShowPasswordChangeForm(false);
                        setCurrentPassword("");
                        setNewPasswordForChange("");
                        setConfirmNewPassword("");
                      }}
                      variant="outline"
                      className="rounded-full"
                      disabled={isChangingPassword}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 bg-muted/50 rounded-xl border border-input">
              <div className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <p className="text-sm font-medium text-foreground mb-1">
                    Password Not Available
                  </p>
                  <p className="text-sm text-muted-foreground">
                    You&apos;re signed in with{" "}
                    {linkedAccounts?.google?.connected ? "Google" : "GitHub"}.
                    To use a password, set up Email + Password authentication in
                    the Linked sign-in providers section above.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Two-Factor Authentication Section */}
          <div className="pt-4 border-t border-border">
            <TwoFactorSettings />
          </div>
        </div>
      </div>

      {/* API Keys Section */}
      <div className="border-t border-border pt-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">API Keys</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Generate API keys for programmatic access to your account
        </p>
        <button
          disabled
          className="px-4 py-2.5 text-sm font-medium text-muted-foreground border border-neutral-300 dark:border-neutral-700 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Generate API Key (Coming Soon)
        </button>
      </div>

      {/* Danger Zone */}
      <div className="border-t border-border pt-6">
        <h3 className="text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
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
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          Danger Zone
        </h3>

        {isLoadingDeletionStatus ? (
          <div className="flex items-center justify-center py-4">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : deletionStatus?.isScheduledForDeletion ? (
          <div className="space-y-3">
            <div className="p-4 bg-red-50 dark:bg-red-950/30 border-2 border-red-200 dark:border-red-900 rounded-xl">
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
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-red-900 dark:text-red-100 mb-1">
                    Account Scheduled for Deletion
                  </p>
                  <p className="text-sm text-red-800 dark:text-red-200">
                    Your account will be permanently deleted in{" "}
                    <span className="font-bold">
                      {deletionStatus.daysRemaining} day
                      {deletionStatus.daysRemaining !== 1 ? "s" : ""}
                    </span>
                    . You can cancel this at any time within the grace period.
                  </p>
                  <p className="text-xs text-red-700 dark:text-red-300 mt-2">
                    Deletion date:{" "}
                    {deletionStatus.deletionScheduledAt
                      ? new Date(
                          deletionStatus.deletionScheduledAt
                        ).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                      : "N/A"}
                  </p>
                </div>
              </div>
            </div>
            <Button
              onClick={handleRestoreAccount}
              className="w-full rounded-full bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200"
            >
              Cancel Deletion & Restore Account
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Once you delete your account, there is no going back. Your account
              will be scheduled for deletion with a 30-day grace period for
              recovery.
            </p>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="px-4 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 border-2 border-red-600 dark:border-red-400 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
            >
              Delete Account
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
