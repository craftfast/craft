"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  useSession,
  changePassword,
  updateUser,
  unlinkAccount,
  linkSocial,
} from "@/lib/auth-client";
import { useTheme } from "@/contexts/ThemeContext";
import { useChatPosition } from "@/contexts/ChatPositionContext";
import { useRefreshSession } from "@/hooks/use-refresh-session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { TwoFactorSettings } from "@/components/auth/two-factor-settings";
import OTPInput from "@/components/auth/OTPInput";
import { PRO_TIERS } from "@/lib/pricing-constants";
import { AVAILABLE_MODELS, type ModelConfig } from "@/lib/models/config";
import { validatePassword } from "@/lib/password-validation";
import validator from "validator";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import EmbeddedCheckout from "@/components/EmbeddedCheckout";
import type { SettingsOption } from "@/lib/url-params";
import {
  GeneralTab,
  BillingTab,
  UsageTab,
  AccountTab,
  IntegrationsTab,
  PersonalizationTab,
  ReferralsTab,
  PasswordSetupModal,
  DeleteAccountModal,
} from "@/components/settings";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?:
    | "general"
    | "billing"
    | "usage"
    | "account"
    | "integrations"
    | "personalization"
    | "referrals";
  initialOption?: SettingsOption; // Specific section within the tab
  initialProTierIndex?: number;
  autoTriggerCheckout?: boolean; // Auto-trigger checkout when coming from pricing page
  initialProject?: string; // Pre-filter by project in usage
  initialEndpoint?: string; // Pre-filter by endpoint in usage
  initialPage?: number; // Pre-set page number in usage
}

interface ExtendedUser {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

interface CreditUsageRecord {
  id: string;
  projectId: string;
  projectName: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  costUsd: number;
  creditsUsed: number;
  callType: "agent" | "chat" | "edit";
  endpoint: string;
  createdAt: string;
}

interface CreditUsageData {
  records: CreditUsageRecord[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
  filters: {
    projects: Array<{ id: string; name: string }>;
    endpoints: string[];
  };
}

interface SubscriptionData {
  plan: {
    name: string;
    displayName: string;
    priceMonthlyUsd: number;
    maxProjects: number | null;
    monthlyCredits: number | null;
    features: Record<string, unknown>;
  };
  status: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  monthly?: {
    limit: number;
    used: number;
    remaining: number;
    periodEnd: Date;
    daysUntilReset: number;
  };
}

interface CreditBalanceData {
  monthly: {
    limit: number;
    used: number;
    remaining: number;
    periodEnd: Date;
    daysUntilReset: number;
  };
  plan: {
    name: string;
    displayName: string;
    monthlyCredits: number | null;
  };
}

interface SubscriptionHistoryData {
  currentSubscription: {
    id: string;
    planName: string;
    planDisplayName: string;
    status: string;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    cancelAtPeriodEnd: boolean;
    cancelledAt: Date | null;
    createdAt: Date;
    priceMonthlyUsd: number;
  } | null;
  usageRecords: Array<{
    id: string;
    billingPeriodStart: Date;
    billingPeriodEnd: Date;
    aiCreditsUsed: number;
    aiCostUsd: number;
    totalCostUsd: number;
    createdAt: Date;
  }>;
  invoices: Array<{
    id: string;
    invoiceNumber: string;
    status: string;
    billingPeriodStart: Date;
    billingPeriodEnd: Date;
    subscriptionFeeUsd: number;
    aiUsageCostUsd: number;
    totalUsd: number;
    paidAt: Date | null;
    createdAt: Date;
  }>;
}

type SettingsTab =
  | "general"
  | "billing"
  | "usage"
  | "account"
  | "integrations"
  | "personalization"
  | "referrals";

export default function SettingsModal({
  isOpen,
  onClose,
  initialTab = "general",
  initialOption,
  initialProTierIndex = 0,
  autoTriggerCheckout = false,
  initialProject,
  initialEndpoint,
  initialPage,
}: SettingsModalProps) {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const { chatPosition, setChatPosition } = useChatPosition();
  const refreshSession = useRefreshSession();
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);
  const [activeOption, setActiveOption] = useState<SettingsOption | undefined>(
    initialOption
  );

  // Update URL when tab changes
  const handleTabChange = (tab: SettingsTab) => {
    setActiveTab(tab);
    updateUrlParams({ tab });
  };

  // Helper function to clear all settings URL parameters
  const clearUrlParams = () => {
    if (typeof window === "undefined") return;

    const url = new URL(window.location.href);
    const paramsToRemove = [
      "settings",
      "option",
      "tier",
      "checkout",
      "model",
      "project",
      "endpoint",
      "startDate",
      "endDate",
      "page",
    ];

    let hasChanges = false;
    paramsToRemove.forEach((param) => {
      if (url.searchParams.has(param)) {
        url.searchParams.delete(param);
        hasChanges = true;
      }
    });

    if (hasChanges) {
      window.history.replaceState({}, "", url.toString());
    }
  };

  // Helper function to update URL parameters
  const updateUrlParams = (params: {
    tab?: SettingsTab;
    option?: SettingsOption;
    model?: string;
    project?: string;
    endpoint?: string;
    page?: number;
    tier?: number;
  }) => {
    if (typeof window === "undefined") return;

    const url = new URL(window.location.href);

    // Update tab
    if (params.tab !== undefined) {
      url.searchParams.set("settings", params.tab);
    }

    // Update option
    if (params.option !== undefined) {
      url.searchParams.set("option", params.option);
    } else if (params.tab !== undefined) {
      // Clear option when changing tabs unless explicitly set
      url.searchParams.delete("option");
    }

    // Update model
    if (params.model !== undefined) {
      url.searchParams.set("model", params.model);
    }

    // Update project filter
    if (params.project !== undefined) {
      if (params.project === "") {
        url.searchParams.delete("project");
      } else {
        url.searchParams.set("project", params.project);
      }
    }

    // Update endpoint filter
    if (params.endpoint !== undefined) {
      if (params.endpoint === "") {
        url.searchParams.delete("endpoint");
      } else {
        url.searchParams.set("endpoint", params.endpoint);
      }
    }

    // Update page
    if (params.page !== undefined) {
      if (params.page === 1) {
        url.searchParams.delete("page");
      } else {
        url.searchParams.set("page", params.page.toString());
      }
    }

    // Update tier
    if (params.tier !== undefined) {
      url.searchParams.set("tier", params.tier.toString());
    }

    window.history.replaceState({}, "", url.toString());
  };

  const [suggestionsEnabled, setSuggestionsEnabled] = useState(true);
  const [soundNotifications, setSoundNotifications] = useState(false);
  const [location, setLocation] = useState("");
  const [profileLink, setProfileLink] = useState("");
  const [creditUsageData, setCreditUsageData] =
    useState<CreditUsageData | null>(null);
  const [isLoadingUsage, setIsLoadingUsage] = useState(false);

  // Billing state
  const [subscriptionData, setSubscriptionData] =
    useState<SubscriptionData | null>(null);
  const [creditBalanceData, setCreditBalanceData] =
    useState<CreditBalanceData | null>(null);
  const [subscriptionHistory, setSubscriptionHistory] =
    useState<SubscriptionHistoryData | null>(null);
  const [isLoadingBilling, setIsLoadingBilling] = useState(false);
  const [selectedProTierIndex, setSelectedProTierIndex] = useState<number>(0); // Default to first Pro tier (100 credits/month)
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [tierSetFromPricingPage, setTierSetFromPricingPage] = useState(false); // Track if tier was set from pricing page
  const [isAutoTriggeringCheckout, setIsAutoTriggeringCheckout] =
    useState(false); // Track when auto-triggering checkout

  // Embedded checkout state
  const [showEmbeddedCheckout, setShowEmbeddedCheckout] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState<string>("");

  // Filters and pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Profile management state
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [hasOAuthAccount, setHasOAuthAccount] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Linked accounts state
  interface LinkedAccounts {
    google: { email: string | null; connected: boolean } | null;
    github: { email: string | null; connected: boolean } | null;
    credentials: { email: string | null; connected: boolean } | null;
  }
  const [linkedAccounts, setLinkedAccounts] = useState<LinkedAccounts | null>(
    null
  );
  const [isLoadingLinkedAccounts, setIsLoadingLinkedAccounts] = useState(false);
  const [showPasswordSetupModal, setShowPasswordSetupModal] = useState(false);
  const [isSettingPassword, setIsSettingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLinkingProvider, setIsLinkingProvider] = useState(false);
  const [showNewPasswordSetup, setShowNewPasswordSetup] = useState(false);
  const [showConfirmPasswordSetup, setShowConfirmPasswordSetup] =
    useState(false);

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
  const [deleteOTP, setDeleteOTP] = useState("");
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [isOTPSent, setIsOTPSent] = useState(false);
  const [isSendingOTP, setIsSendingOTP] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [deletionStatus, setDeletionStatus] = useState<{
    isScheduledForDeletion: boolean;
    deletionScheduledAt: string | null;
    daysRemaining: number | null;
  } | null>(null);
  const [isLoadingDeletionStatus, setIsLoadingDeletionStatus] = useState(false);

  // Confirmation dialog state
  const [showUnlinkConfirmation, setShowUnlinkConfirmation] = useState(false);

  // Referral state
  interface ReferralData {
    referralCode: string;
    referrals: Array<{
      id: string;
      email: string | null;
      name: string | null;
      createdAt: string;
    }>;
    totalReferrals: number;
    totalCreditsEarned: number;
    currentMonthlyCredits: number;
  }
  const [referralData, setReferralData] = useState<ReferralData | null>(null);
  const [isLoadingReferralData, setIsLoadingReferralData] = useState(false);
  const [copiedReferralCode, setCopiedReferralCode] = useState(false);
  const [copiedReferralLink, setCopiedReferralLink] = useState(false);
  const [isGeneratingReferralCode, setIsGeneratingReferralCode] =
    useState(false);
  const [pendingUnlinkProvider, setPendingUnlinkProvider] = useState<
    "google" | "github" | "credentials" | null
  >(null);

  // Cooldown timer for OTP resend
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(
        () => setResendCooldown(resendCooldown - 1),
        1000
      );
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

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

  // Reset to initial tab when modal opens, and reset tier flag when modal closes
  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    } else if (!isOpen) {
      // Reset the tier flag when modal closes
      setTierSetFromPricingPage(false);
    }
  }, [isOpen, initialTab]);

  // Set initial Pro tier index when modal opens with billing tab
  useEffect(() => {
    if (
      isOpen &&
      initialTab === "billing" &&
      initialProTierIndex !== undefined
    ) {
      console.log(
        "Setting Pro tier index from pricing page to:",
        initialProTierIndex
      );
      setSelectedProTierIndex(initialProTierIndex);
      setTierSetFromPricingPage(true); // Mark that tier was explicitly set
    }
  }, [isOpen, initialTab, initialProTierIndex]);

  // Fetch billing data when billing tab is active
  useEffect(() => {
    // Only fetch if modal is open and user is authenticated
    if (!isOpen || !session?.user) return;

    if (activeTab === "billing") {
      fetchBillingData();
    }
  }, [activeTab, isOpen, session]);

  // Auto-trigger checkout when coming from pricing page with tier change action
  useEffect(() => {
    if (
      isOpen &&
      autoTriggerCheckout &&
      initialTab === "billing" &&
      tierSetFromPricingPage &&
      subscriptionData &&
      !isPurchasing &&
      !showEmbeddedCheckout &&
      !isAutoTriggeringCheckout
    ) {
      // Wait for billing data to load, then auto-trigger checkout
      const selectedTier = PRO_TIERS[selectedProTierIndex];
      const currentTierCredits = subscriptionData.plan?.monthlyCredits;

      // Only trigger if user is changing to a different tier
      if (selectedTier && selectedTier.monthlyCredits !== currentTierCredits) {
        console.log("Auto-triggering checkout for tier:", selectedTier);
        setIsAutoTriggeringCheckout(true);

        // Show toast to inform user
        toast.info(
          `Preparing checkout for ${selectedTier.monthlyCredits} credits/month tier...`,
          { duration: 3000 }
        );

        // Small delay to show the UI has loaded before opening checkout
        setTimeout(() => {
          handleOpenEmbeddedCheckout(selectedTier.monthlyCredits);
          setIsAutoTriggeringCheckout(false);
        }, 800);
      }
    }
  }, [
    isOpen,
    autoTriggerCheckout,
    initialTab,
    tierSetFromPricingPage,
    subscriptionData,
    selectedProTierIndex,
    isPurchasing,
    showEmbeddedCheckout,
    isAutoTriggeringCheckout,
  ]);

  // Initialize filters and values from URL parameters
  useEffect(() => {
    if (isOpen) {
      // Set initial usage filters if provided
      if (initialProject) {
        setSelectedProject(initialProject);
      }
      if (initialEndpoint) {
        setSelectedEndpoint(initialEndpoint);
      }
      if (initialPage) {
        setCurrentPage(initialPage);
      }
    }
  }, [isOpen, initialProject, initialEndpoint, initialPage]);

  // Fetch user profile when general tab is active
  useEffect(() => {
    // Only fetch if modal is open and user is authenticated
    if (!isOpen || !session?.user) return;

    if (activeTab === "general") {
      fetchUserProfile();
    }
  }, [activeTab, isOpen, session]);

  // Fetch usage data when usage tab is active
  useEffect(() => {
    // Only fetch if modal is open and user is authenticated
    if (!isOpen || !session?.user) return;

    if (activeTab === "usage") {
      fetchCreditUsage();
    }
  }, [
    activeTab,
    isOpen,
    session,
    currentPage,
    selectedProject,
    selectedEndpoint,
    startDate,
    endDate,
  ]);

  // Fetch linked accounts when account tab is active
  useEffect(() => {
    // Only fetch if modal is open and user is authenticated
    if (!isOpen || !session?.user) return;

    if (activeTab === "account") {
      fetchLinkedAccounts();
      fetchDeletionStatus();

      // Check if user just linked an account (from URL parameter)
      const urlParams = new URLSearchParams(window.location.search);
      const linkedProvider = urlParams.get("linked");
      if (linkedProvider) {
        const providerName =
          linkedProvider.charAt(0).toUpperCase() + linkedProvider.slice(1);
        toast.success(`${providerName} account linked successfully!`);
        // Remove the parameter from URL
        window.history.replaceState({}, "", window.location.pathname);
      }
    }
  }, [activeTab, isOpen, session]);

  // Fetch referral data when referrals tab is active
  useEffect(() => {
    // Only fetch if modal is open and user is authenticated
    if (!isOpen || !session?.user) return;

    if (activeTab === "referrals") {
      fetchReferralData();
    }
  }, [activeTab, isOpen, session]);

  const fetchBillingData = async () => {
    setIsLoadingBilling(true);
    try {
      // Fetch subscription details
      const subRes = await fetch("/api/billing/subscription");
      const subData = await subRes.json();
      if (subRes.ok) {
        setSubscriptionData(subData);

        // Set credit balance data from subscription response
        if (subData.monthly) {
          setCreditBalanceData({
            monthly: subData.monthly,
            plan: {
              name: subData.plan.name,
              displayName: subData.plan.displayName,
              monthlyCredits: subData.plan.monthlyCredits,
            },
          });
        }

        // Set current Pro tier index if user is on Pro plan
        // BUT only if tier wasn't already set from pricing page
        if (
          subData.plan?.name === "PRO" &&
          subData.plan?.monthlyCredits &&
          !tierSetFromPricingPage
        ) {
          const currentTierIndex = PRO_TIERS.findIndex(
            (tier) => tier.monthlyCredits === subData.plan.monthlyCredits
          );
          if (currentTierIndex !== -1) {
            console.log(
              "Setting tier index to current plan tier:",
              currentTierIndex
            );
            setSelectedProTierIndex(currentTierIndex);
          }
        }
      }

      // Fetch subscription history
      const historyRes = await fetch("/api/billing/subscription-history");
      const historyData = await historyRes.json();
      if (historyRes.ok) {
        setSubscriptionHistory(historyData);
      }
    } catch (error) {
      console.error("Error fetching billing data:", error);
    } finally {
      setIsLoadingBilling(false);
    }
  };

  const fetchReferralData = async () => {
    setIsLoadingReferralData(true);
    try {
      const res = await fetch("/api/referrals/stats");
      if (res.ok) {
        const data = await res.json();
        setReferralData(data);
      } else {
        toast.error("Failed to load referral data");
      }
    } catch (error) {
      console.error("Error fetching referral data:", error);
      toast.error("Failed to load referral data");
    } finally {
      setIsLoadingReferralData(false);
    }
  };

  const fetchUserProfile = async () => {
    setIsLoadingProfile(true);
    try {
      const res = await fetch("/api/user/profile");
      if (res.ok) {
        const data = await res.json();
        setUserName(data.name || "");
        setUserEmail(data.email || "");
        setProfileImage(data.image);
        setHasOAuthAccount(data.hasOAuthAccount);
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
      // Use Better Auth's updateUser method
      const result = await updateUser({
        name: userName.trim(),
      });

      if (result.error) {
        toast.error(result.error.message || "Failed to update profile", {
          id: "update-profile",
        });
      } else {
        // Success - refresh session to reflect the updated profile
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

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    // Check file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    setIsUploadingImage(true);
    toast.loading("Uploading profile picture...", { id: "upload-avatar" });

    try {
      // Create FormData and append file
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/user/upload-avatar", {
        method: "POST",
        body: formData, // Send FormData directly (no Content-Type header needed)
      });

      if (res.ok) {
        const data = await res.json();
        setProfileImage(data.user.image);
        // Refresh session to reflect the updated avatar
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
        // Refresh session to reflect the removed avatar
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

    // Validate email format using validator.js
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
        setEmailResendCooldown(60); // 60 second cooldown
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
        // Show different message based on whether OAuth accounts were unlinked
        const message = data.oauthUnlinked
          ? `Email changed successfully. Your ${data.unlinkedProviders.join(
              " and "
            )} account(s) were automatically unlinked. Please sign in and re-link them with your updated email.`
          : "Email changed successfully. Please sign in again.";

        toast.success(message, {
          id: "verify-email-change",
          duration: 7000, // Longer duration for OAuth unlink message
        });
        setShowEmailChangeForm(false);
        setNewEmail("");
        setEmailChangeOTP("");
        setIsEmailOTPSent(false);

        // Sign out after successful email change
        setTimeout(() => {
          window.location.href = "/auth/signin";
        }, 3000); // Longer delay to read the message
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

  const handleChangeEmail = handleSendEmailChangeOTP;

  const fetchLinkedAccounts = async () => {
    setIsLoadingLinkedAccounts(true);
    try {
      const res = await fetch("/api/auth/linked-accounts");
      if (res.ok) {
        const data = await res.json();
        setLinkedAccounts(data.accounts);
      } else {
        console.error("Failed to fetch linked accounts");
      }
    } catch (error) {
      console.error("Error fetching linked accounts:", error);
    } finally {
      setIsLoadingLinkedAccounts(false);
    }
  };

  const handleSetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast.error("Please fill in all fields");
      return;
    }

    // Validate password strength
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      toast.error(passwordValidation.errors[0]); // Show first error
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsSettingPassword(true);
    try {
      const res = await fetch("/api/auth/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      });

      if (res.ok) {
        toast.success(
          "Password set successfully! You can now sign in with email and password."
        );
        setShowPasswordSetupModal(false);
        setNewPassword("");
        setConfirmPassword("");
        // Refresh linked accounts
        await fetchLinkedAccounts();
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to set password");
      }
    } catch (error) {
      console.error("Error setting password:", error);
      toast.error("Failed to set password");
    } finally {
      setIsSettingPassword(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPasswordForChange || !confirmNewPassword) {
      toast.error("Please fill in all fields");
      return;
    }

    // Validate password strength
    const passwordValidation = validatePassword(newPasswordForChange);
    if (!passwordValidation.isValid) {
      toast.error(passwordValidation.errors[0]); // Show first error
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
        revokeOtherSessions: true, // Revoke other sessions for security
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

  const handleLinkProvider = async (provider: "google" | "github") => {
    setIsLinkingProvider(true);
    toast.loading(`Linking ${provider}...`, { id: "link-provider" });

    try {
      // Use Better Auth's linkSocial method
      const callbackURL = `${window.location.origin}/?linked=${provider}`;

      await linkSocial({
        provider,
        callbackURL,
      });

      // Note: linkSocial will redirect to OAuth provider, so code after this won't execute
    } catch (error) {
      console.error("Error linking provider:", error);
      toast.error("Failed to link account", { id: "link-provider" });
      setIsLinkingProvider(false);
    }
  };

  const handleUnlinkProvider = async (
    provider: "google" | "github" | "credentials"
  ) => {
    // Show confirmation dialog instead of native confirm()
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
      // Better Auth's unlinkAccount uses providerId
      // For credentials, the providerId is "credential" (singular in Better Auth)
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
        // Refresh linked accounts
        await fetchLinkedAccounts();
      }
    } catch (error) {
      console.error("Error unlinking provider:", error);
      toast.error("Failed to unlink provider", { id: "unlink-provider" });
    } finally {
      setPendingUnlinkProvider(null);
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
        setResendCooldown(60); // 60 second cooldown
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
        setShowDeleteModal(false);
        setDeleteOTP("");
        setIsOTPSent(false);
        // Refresh deletion status
        await fetchDeletionStatus();
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

  const handleRestoreAccount = async () => {
    try {
      const res = await fetch("/api/account/restore", {
        method: "POST",
      });

      if (res.ok) {
        toast.success("Account deletion cancelled successfully");
        // Refresh deletion status
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

  // Helper function to open embedded checkout
  // CRITICAL: Debouncing to prevent concurrent requests (Polar locker pattern equivalent)
  const lastRequestTimeRef = useRef<number>(0);
  const DEBOUNCE_MS = 3000; // 3 seconds between tier change requests

  const handleOpenEmbeddedCheckout = async (monthlyCredits: number) => {
    // CRITICAL: Prevent concurrent requests
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTimeRef.current;

    if (timeSinceLastRequest < DEBOUNCE_MS && lastRequestTimeRef.current > 0) {
      toast.error(
        `Please wait ${Math.ceil(
          (DEBOUNCE_MS - timeSinceLastRequest) / 1000
        )} more seconds before making another tier change.`,
        { duration: 3000 }
      );
      return;
    }

    lastRequestTimeRef.current = now;
    setIsPurchasing(true);

    try {
      // Check if user is already on Pro plan (tier change)
      const isProUser = subscriptionData?.plan?.name?.startsWith("PRO");
      const endpoint = isProUser
        ? "/api/billing/change-pro-tier"
        : "/api/billing/create-checkout-session";

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ monthlyCredits }),
      });

      const data = await response.json();

      if (!response.ok) {
        // CRITICAL: Handle specific error types from backend
        if (data.error === "MissingPaymentMethod") {
          toast.error(
            data.message || "Please add a payment method to upgrade.",
            {
              duration: 8000,
              action: {
                label: "Add Payment Method",
                onClick: () => {
                  // TODO: Open payment method modal or redirect to Polar customer portal
                  window.open("https://polar.sh/dashboard", "_blank");
                },
              },
            }
          );
          return;
        }

        if (data.error === "AlreadyCanceledSubscription") {
          toast.error(
            data.message ||
              "Your subscription has been cancelled. Please start a new subscription.",
            { duration: 8000 }
          );
          return;
        }

        if (data.error === "TrialingSubscription") {
          toast.error(
            data.message ||
              "Tier changes are not available during trial period.",
            { duration: 8000 }
          );
          return;
        }

        // Check for scheduled change conflict
        if (data.scheduledChange) {
          toast.error(
            data.error || "You already have a tier change scheduled.",
            { duration: 8000 }
          );
          return;
        }

        throw new Error(data.error || "Failed to process request");
      }

      // Handle tier change response
      if (data.success) {
        if (data.immediate) {
          // Upgrade - invoiced immediately
          toast.success(
            data.message ||
              `Tier upgrade completed! Your new plan is now active.`
          );
        } else if (data.scheduled) {
          // Downgrade - scheduled for end of billing period
          toast.success(
            data.message ||
              `Downgrade scheduled. Changes will take effect at the end of your billing period.`,
            { duration: 8000 }
          );
        }
        await fetchBillingData();
        setIsPurchasing(false);
        return;
      }

      // Open embedded checkout (for new Pro subscriptions)
      if (data.checkoutUrl) {
        setCheckoutUrl(data.checkoutUrl);
        setShowEmbeddedCheckout(true);
      }
    } catch (error) {
      console.error("Error processing checkout:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to process request. Please try again."
      );
    } finally {
      setIsPurchasing(false);
    }
  };

  // Handle checkout success
  const handleCheckoutSuccess = async () => {
    setShowEmbeddedCheckout(false);
    setCheckoutUrl("");

    // Refresh billing data
    await fetchBillingData();

    toast.success("Successfully upgraded! Your new plan is now active.");
  };

  // Handle checkout close
  const handleCheckoutClose = () => {
    setShowEmbeddedCheckout(false);
    setCheckoutUrl("");
    setIsPurchasing(false);
  };

  const fetchCreditUsage = () => {
    setIsLoadingUsage(true);

    const params = new URLSearchParams({
      page: currentPage.toString(),
      limit: "10",
    });

    if (selectedProject) params.append("projectId", selectedProject);
    if (selectedEndpoint) params.append("endpoint", selectedEndpoint);
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);

    fetch(`/api/usage/credits?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        // Only set data if it has the expected structure
        if (data && data.records && data.pagination && data.filters) {
          setCreditUsageData(data);
        } else {
          console.error("Invalid credit usage data:", data);
          setCreditUsageData(null);
        }
        setIsLoadingUsage(false);
      })
      .catch((error) => {
        console.error("Error fetching usage:", error);
        setCreditUsageData(null);
        setIsLoadingUsage(false);
      });
  };

  const resetFilters = () => {
    setSelectedProject("");
    setSelectedEndpoint("");
    setStartDate("");
    setEndDate("");
    setCurrentPage(1);
  };

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        clearUrlParams();
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const menuItems = [
    { id: "general" as SettingsTab, label: "General" },
    { id: "personalization" as SettingsTab, label: "Personalization" },
    { id: "billing" as SettingsTab, label: "Billing" },
    { id: "usage" as SettingsTab, label: "Usage" },
    { id: "account" as SettingsTab, label: "Account" },
    { id: "integrations" as SettingsTab, label: "Integrations" },
    { id: "referrals" as SettingsTab, label: "Referrals" },
  ];

  const getMenuIcon = (itemId: SettingsTab) => {
    const iconClass = "w-5 h-5";
    switch (itemId) {
      case "general":
        return (
          <svg
            className={iconClass}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        );
      case "billing":
        return (
          <svg
            className={iconClass}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
            />
          </svg>
        );
      case "usage":
        return (
          <svg
            className={iconClass}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
        );
      case "account":
        return (
          <svg
            className={iconClass}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        );
      case "integrations":
        return (
          <svg
            className={iconClass}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z"
            />
          </svg>
        );
      case "personalization":
        return (
          <svg
            className={iconClass}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
        );
      case "referrals":
        return (
          <svg
            className={iconClass}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
        );
    }
  };

  const modalContent = (
    <div
      className="fixed inset-0 bg-background animate-in fade-in duration-200 flex flex-col"
      onClick={(e) => e.stopPropagation()}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 99999,
        backgroundColor: "inherit",
      }}
    >
      {/* Top Header Bar */}
      <div
        className="flex-shrink-0 h-16 flex items-center justify-between px-6 bg-background border-b"
        style={{ zIndex: 100000 }}
      >
        <h1 className="text-xl font-semibold text-foreground">Settings</h1>
        <button
          onClick={() => {
            clearUrlParams();
            onClose();
          }}
          className="p-2 rounded-full hover:bg-muted transition-colors group"
          title="Close settings (Esc)"
          aria-label="Close settings"
        >
          <svg
            className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors"
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

      {/* Modal Content */}
      <div
        className="flex-1 flex overflow-hidden bg-background"
        style={{ zIndex: 100000 }}
      >
        {/* Left Sidebar - Menu */}
        <div
          className="w-64 flex-shrink-0 overflow-y-auto bg-background border-r [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-muted-foreground/30 [&::-webkit-scrollbar-thumb]:rounded-full"
          style={{ position: "relative", zIndex: 100001 }}
        >
          {/* Menu Items */}
          <nav
            className="p-4 space-y-1"
            style={{ position: "relative", zIndex: 100002 }}
          >
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors ${
                  activeTab === item.id
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:bg-muted/50"
                }`}
              >
                <div className="w-4 h-4 flex items-center justify-center">
                  {getMenuIcon(item.id)}
                </div>
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Right Panel - Content */}
        <div className="flex-1 overflow-y-auto bg-background [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-muted-foreground/30 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-muted-foreground/50">
          <div className="max-w-3xl mx-auto p-8">
            {/* General Tab */}
            {activeTab === "general" && (
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold mb-6">General</h2>
                <GeneralTab
                  theme={theme}
                  setTheme={setTheme}
                  chatPosition={chatPosition}
                  setChatPosition={setChatPosition}
                  suggestionsEnabled={suggestionsEnabled}
                  setSuggestionsEnabled={setSuggestionsEnabled}
                  soundNotifications={soundNotifications}
                  setSoundNotifications={setSoundNotifications}
                />
              </div>
            )}
            {/* Personalization Tab */}
            {activeTab === "personalization" && (
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold mb-6">Personalization</h2>
                <PersonalizationTab />
              </div>
            )}{" "}
            {/* Billing Tab */}
            {activeTab === "billing" && (
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold mb-6">Billing</h2>
                <BillingTab
                  isLoadingBilling={isLoadingBilling}
                  isAutoTriggeringCheckout={isAutoTriggeringCheckout}
                  subscriptionData={subscriptionData}
                  creditBalanceData={creditBalanceData}
                  subscriptionHistory={subscriptionHistory}
                  selectedProTierIndex={selectedProTierIndex}
                  setSelectedProTierIndex={setSelectedProTierIndex}
                  isPurchasing={isPurchasing}
                  updateUrlParams={updateUrlParams}
                  handleOpenEmbeddedCheckout={handleOpenEmbeddedCheckout}
                  fetchBillingData={fetchBillingData}
                />
              </div>
            )}{" "}
            {/* Usage Tab */}
            {activeTab === "usage" && (
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold mb-6">Usage</h2>
                <UsageTab
                  creditUsageData={creditUsageData}
                  isLoadingUsage={isLoadingUsage}
                  selectedProject={selectedProject}
                  setSelectedProject={setSelectedProject}
                  selectedEndpoint={selectedEndpoint}
                  setSelectedEndpoint={setSelectedEndpoint}
                  startDate={startDate}
                  setStartDate={setStartDate}
                  endDate={endDate}
                  setEndDate={setEndDate}
                  currentPage={currentPage}
                  setCurrentPage={setCurrentPage}
                  updateUrlParams={updateUrlParams}
                  resetFilters={resetFilters}
                />
              </div>
            )}
            {/* Account Tab */}
            {activeTab === "account" && (
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold mb-6">Account</h2>
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
                                email:
                                  linkedAccounts.credentials.email ?? undefined,
                              }
                            : undefined,
                        }
                      : null
                  }
                  isLoadingLinkedAccounts={isLoadingLinkedAccounts}
                  isLinkingProvider={isLinkingProvider}
                  handleLinkProvider={
                    handleLinkProvider as (provider: string) => void
                  }
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
                          isScheduledForDeletion:
                            deletionStatus.isScheduledForDeletion,
                          daysRemaining:
                            deletionStatus.daysRemaining ?? undefined,
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
            )}
            {/* Integrations Tab */}
            {activeTab === "integrations" && (
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold mb-6">Integrations</h2>
                <IntegrationsTab />
              </div>
            )}
            {/* Referrals Tab */}
            {activeTab === "referrals" && (
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold mb-6">Referrals</h2>
                <ReferralsTab
                  referralData={referralData}
                  isLoadingReferralData={isLoadingReferralData}
                  fetchReferralData={fetchReferralData}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {typeof window !== "undefined"
        ? createPortal(modalContent, document.body)
        : null}

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

      {/* Embedded Checkout Modal */}
      {showEmbeddedCheckout && checkoutUrl && (
        <EmbeddedCheckout
          checkoutUrl={checkoutUrl}
          onSuccess={handleCheckoutSuccess}
          onClose={handleCheckoutClose}
          theme={theme === "dark" ? "dark" : "light"}
        />
      )}
    </>
  );
}
