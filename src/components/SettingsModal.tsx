"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useSession } from "@/lib/auth-client";
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
import { toast } from "sonner";
import SubscriptionModal from "./SubscriptionModal";
import { TwoFactorSettings } from "@/components/auth/two-factor-settings";
import { PRO_TIERS } from "@/lib/pricing-constants";
import { AVAILABLE_MODELS, type ModelConfig } from "@/lib/models/config";
import { validatePassword } from "@/lib/password-validation";
import validator from "validator";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?:
    | "general"
    | "billing"
    | "usage"
    | "account"
    | "integrations"
    | "personalization";
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
    dailyCredits: number | null;
    monthlyCredits: number | null;
    features: Record<string, unknown>;
  };
  status: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  daily?: {
    limit: number;
    used: number;
    remaining: number;
    resetTime: Date;
    hoursUntilReset: number;
  };
}

interface CreditBalanceData {
  daily: {
    limit: number;
    used: number;
    remaining: number;
    resetTime: Date;
    hoursUntilReset: number;
  };
  plan: {
    name: string;
    displayName: string;
    dailyCredits: number | null;
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
  | "personalization";

export default function SettingsModal({
  isOpen,
  onClose,
  initialTab = "general",
}: SettingsModalProps) {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const { chatPosition, setChatPosition } = useChatPosition();
  const refreshSession = useRefreshSession();
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);
  const [suggestionsEnabled, setSuggestionsEnabled] = useState(true);
  const [soundNotifications, setSoundNotifications] = useState(false);
  const [location, setLocation] = useState("");
  const [profileLink, setProfileLink] = useState("");
  const [creditUsageData, setCreditUsageData] =
    useState<CreditUsageData | null>(null);
  const [isLoadingUsage, setIsLoadingUsage] = useState(false);

  // Model preferences
  const [preferredModel, setPreferredModel] = useState<string>("gpt-5");
  const [userPlan, setUserPlan] = useState<"HOBBY" | "PRO" | "ENTERPRISE">(
    "HOBBY"
  );
  const [isLoadingModelPrefs, setIsLoadingModelPrefs] = useState(false);
  const [isSavingModelPrefs, setIsSavingModelPrefs] = useState(false);

  // Billing state
  const [subscriptionData, setSubscriptionData] =
    useState<SubscriptionData | null>(null);
  const [creditBalanceData, setCreditBalanceData] =
    useState<CreditBalanceData | null>(null);
  const [subscriptionHistory, setSubscriptionHistory] =
    useState<SubscriptionHistoryData | null>(null);
  const [isLoadingBilling, setIsLoadingBilling] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [targetPlan, setTargetPlan] = useState<
    "HOBBY" | "PRO" | "ENTERPRISE" | undefined
  >(undefined);
  const [selectedProTierIndex, setSelectedProTierIndex] = useState<number>(0); // Default to first Pro tier (10 credits/day)
  const [isPurchasing, setIsPurchasing] = useState(false);

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

  // Email change state
  const [newEmail, setNewEmail] = useState("");
  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [showEmailChangeForm, setShowEmailChangeForm] = useState(false);

  // Account deletion state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deletionStatus, setDeletionStatus] = useState<{
    isScheduledForDeletion: boolean;
    deletionScheduledAt: string | null;
    daysRemaining: number | null;
  } | null>(null);
  const [isLoadingDeletionStatus, setIsLoadingDeletionStatus] = useState(false);

  // Reset to initial tab when modal opens
  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // Fetch billing data when billing tab is active
  useEffect(() => {
    if (activeTab === "billing") {
      fetchBillingData();
    }
  }, [activeTab]);

  // Fetch model preferences when general or personalization tab is active
  useEffect(() => {
    if (activeTab === "general") {
      fetchUserProfile();
    }
    if (activeTab === "general" || activeTab === "personalization") {
      fetchModelPreferences();
    }
  }, [activeTab]);

  // Fetch usage data when usage tab is active
  useEffect(() => {
    if (activeTab === "usage") {
      fetchCreditUsage();
    }
  }, [
    activeTab,
    currentPage,
    selectedProject,
    selectedEndpoint,
    startDate,
    endDate,
  ]);

  // Fetch linked accounts when account tab is active
  useEffect(() => {
    if (activeTab === "account") {
      fetchLinkedAccounts();
      fetchDeletionStatus();
    }
  }, [activeTab]);

  const fetchBillingData = async () => {
    setIsLoadingBilling(true);
    try {
      // Fetch subscription details
      const subRes = await fetch("/api/billing/subscription");
      const subData = await subRes.json();
      if (subRes.ok) {
        setSubscriptionData(subData);

        // Set credit balance data from subscription response
        if (subData.daily) {
          setCreditBalanceData({
            daily: subData.daily,
            plan: {
              name: subData.plan.name,
              displayName: subData.plan.displayName,
              dailyCredits: subData.plan.dailyCredits,
              monthlyCredits: subData.plan.monthlyCredits,
            },
          });
        }

        // Set current Pro tier index if user is on Pro plan
        if (subData.plan?.name === "PRO" && subData.plan?.dailyCredits) {
          const currentTierIndex = PRO_TIERS.findIndex(
            (tier) => tier.dailyCredits === subData.plan.dailyCredits
          );
          if (currentTierIndex !== -1) {
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

  const fetchModelPreferences = async () => {
    setIsLoadingModelPrefs(true);
    try {
      const res = await fetch("/api/user/model-preferences");
      if (res.ok) {
        const data = await res.json();
        setPreferredModel(data.preferredModel || "gpt-5");
        setUserPlan(data.userPlan || "HOBBY");
      }
    } catch (error) {
      console.error("Error fetching model preferences:", error);
    } finally {
      setIsLoadingModelPrefs(false);
    }
  };

  const saveModelPreference = async (modelId: string) => {
    setIsSavingModelPrefs(true);
    try {
      const res = await fetch("/api/user/model-preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferredModel: modelId }),
      });

      if (res.ok) {
        const data = await res.json();
        setPreferredModel(data.preferredModel);
        toast.success("Model preference updated successfully");
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to update model preference");
      }
    } catch (error) {
      console.error("Error saving model preference:", error);
      toast.error("Failed to update model preference");
    } finally {
      setIsSavingModelPrefs(false);
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
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: userName }),
      });

      if (res.ok) {
        const data = await res.json();
        setUserName(data.user.name || "");
        // Refresh session to reflect the updated profile
        await refreshSession();
        toast.success("Profile updated successfully");
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error("Failed to update profile");
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

  const handleChangeEmail = async () => {
    if (!newEmail.trim()) {
      toast.error("Please enter a new email address");
      return;
    }

    // Validate email format using validator.js
    if (!validator.isEmail(newEmail)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsChangingEmail(true);
    toast.loading("Sending verification email...", { id: "change-email" });

    try {
      const res = await fetch("/api/user/change-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newEmail }),
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(data.message || "Verification email sent", {
          id: "change-email",
        });
        setShowEmailChangeForm(false);
        setNewEmail("");
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to change email", {
          id: "change-email",
        });
      }
    } catch (error) {
      console.error("Error changing email:", error);
      toast.error("Failed to change email", { id: "change-email" });
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

  const handleLinkProvider = async (provider: "google" | "github") => {
    setIsLinkingProvider(true);
    try {
      // Redirect to OAuth provider with callback to link account
      const callbackUrl = `${window.location.origin}/auth/link-callback?provider=${provider}`;
      window.location.href = `/api/auth/signin/${provider}?callbackUrl=${encodeURIComponent(
        callbackUrl
      )}`;
    } catch (error) {
      console.error("Error linking provider:", error);
      toast.error("Failed to link account");
      setIsLinkingProvider(false);
    }
  };

  const handleUnlinkProvider = async (
    provider: "google" | "github" | "credentials"
  ) => {
    // Confirm before unlinking
    const providerName =
      provider === "credentials"
        ? "Email+Password"
        : provider.charAt(0).toUpperCase() + provider.slice(1);

    if (
      !confirm(
        `Are you sure you want to unlink ${providerName} authentication? Make sure you have another way to sign in.`
      )
    ) {
      return;
    }

    try {
      const res = await fetch("/api/auth/unlink-provider", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider }),
      });

      if (res.ok) {
        toast.success(`${providerName} authentication removed successfully`);
        // Refresh linked accounts
        await fetchLinkedAccounts();
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to unlink provider");
      }
    } catch (error) {
      console.error("Error unlinking provider:", error);
      toast.error("Failed to unlink provider");
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

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      toast.error("Please enter your password to confirm");
      return;
    }

    setIsDeletingAccount(true);
    try {
      const res = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: deletePassword }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(
          "Account scheduled for deletion. You have 30 days to cancel.",
          { duration: 5000 }
        );
        setShowDeleteModal(false);
        setDeletePassword("");
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
        className="flex-shrink-0 h-16 flex items-center justify-between px-6 bg-background"
        style={{ zIndex: 100000 }}
      >
        <h1 className="text-xl font-semibold text-foreground">Settings</h1>
        <button
          onClick={onClose}
          className="p-2 rounded-full hover:bg-muted transition-colors"
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

      {/* Modal Content */}
      <div
        className="flex-1 flex overflow-hidden bg-background"
        style={{ zIndex: 100000 }}
      >
        {/* Left Sidebar - Menu */}
        <div
          className="w-64 flex-shrink-0 overflow-y-auto bg-background [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-muted-foreground/30 [&::-webkit-scrollbar-thumb]:rounded-full"
          style={{ position: "relative", zIndex: 100001 }}
        >
          {/* Menu Items */}
          <nav
            className="p-3 space-y-1"
            style={{ position: "relative", zIndex: 100002 }}
          >
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${
                  activeTab === item.id
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                }`}
              >
                {getMenuIcon(item.id)}
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Right Panel - Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 m-2 border border-border rounded-2xl bg-background [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-muted-foreground/30 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-muted-foreground/50">
          <div className="max-w-3xl mx-auto">
            {/* General Tab */}
            {activeTab === "general" && (
              <div className="space-y-6">
                <div className="">
                  <h3 className="text-lg font-semibold text-foreground mb-4">
                    Appearance
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-muted-foreground mb-3">
                        Theme Preference
                      </Label>
                      <p className="text-sm text-muted-foreground mb-3">
                        Choose your preferred color theme. Dark mode is the
                        default.
                      </p>
                      <div className="grid grid-cols-3 gap-3">
                        <Button
                          onClick={() => setTheme("light")}
                          variant={theme === "light" ? "default" : "outline"}
                          className="flex flex-col h-auto gap-2 p-4 rounded-xl"
                        >
                          <svg
                            className="w-6 h-6"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                            />
                          </svg>
                          <span className="text-sm font-medium">Light</span>
                        </Button>

                        <Button
                          onClick={() => setTheme("dark")}
                          variant={theme === "dark" ? "default" : "outline"}
                          className="flex flex-col h-auto gap-2 p-4 rounded-xl"
                        >
                          <svg
                            className="w-6 h-6"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                            />
                          </svg>
                          <span className="text-sm font-medium">Dark</span>
                        </Button>

                        <Button
                          onClick={() => setTheme("system")}
                          variant={theme === "system" ? "default" : "outline"}
                          className="flex flex-col h-auto gap-2 p-4 rounded-xl"
                        >
                          <svg
                            className="w-6 h-6"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                            />
                          </svg>
                          <span className="text-sm font-medium">System</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-border pt-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">
                    Chat Position
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Choose which side of the screen the chat is on.
                  </p>
                  <div className="flex gap-3">
                    <Button
                      onClick={() => setChatPosition("left")}
                      variant={chatPosition === "left" ? "default" : "outline"}
                      className="flex-1 rounded-xl"
                    >
                      Left
                    </Button>
                    <Button
                      onClick={() => setChatPosition("right")}
                      variant={chatPosition === "right" ? "default" : "outline"}
                      className="flex-1 rounded-xl"
                    >
                      Right
                    </Button>
                  </div>
                </div>

                <div className="border-t border-border pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">
                        Suggestions
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Get relevant in-chat suggestions to refine your project.
                      </p>
                    </div>
                    <Switch
                      checked={suggestionsEnabled}
                      onCheckedChange={setSuggestionsEnabled}
                    />
                  </div>
                </div>

                <div className="border-t border-border pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">
                        Sound Notifications
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        A new sound will play when v0 is finished responding and
                        the window is not focused.
                      </p>
                    </div>
                    <Switch
                      checked={soundNotifications}
                      onCheckedChange={setSoundNotifications}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Personalization Tab */}
            {activeTab === "personalization" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-4">
                    Preferred AI Model
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Choose your default AI model for new projects. Premium
                    models require a Pro plan.
                  </p>

                  {isLoadingModelPrefs ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="w-6 h-6 border-4 border-neutral-200 dark:border-neutral-800 border-t-neutral-900 dark:border-t-neutral-100 rounded-full animate-spin"></div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {Object.values(AVAILABLE_MODELS).map((model) => {
                        const isAccessible =
                          model.minPlanRequired === "HOBBY" ||
                          (model.minPlanRequired === "PRO" &&
                            (userPlan === "PRO" ||
                              userPlan === "ENTERPRISE")) ||
                          (model.minPlanRequired === "ENTERPRISE" &&
                            userPlan === "ENTERPRISE");
                        const isSelected = preferredModel === model.id;
                        const isPremiumModel =
                          model.minPlanRequired === "PRO" ||
                          model.minPlanRequired === "ENTERPRISE";

                        return (
                          <button
                            key={model.id}
                            onClick={() => {
                              if (isAccessible && !isSavingModelPrefs) {
                                saveModelPreference(model.id);
                              }
                            }}
                            disabled={!isAccessible || isSavingModelPrefs}
                            className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                              isSelected
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/50"
                            } ${
                              !isAccessible
                                ? "opacity-50 cursor-not-allowed"
                                : "cursor-pointer"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-semibold text-foreground">
                                    {model.displayName}
                                  </span>
                                  {!isAccessible && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-700 dark:text-yellow-400 text-xs font-medium">
                                      <svg
                                        className="w-3 h-3"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                      >
                                        <path
                                          fillRule="evenodd"
                                          d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                                          clipRule="evenodd"
                                        />
                                      </svg>
                                      Pro
                                    </span>
                                  )}
                                  {isSelected && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-medium">
                                      <svg
                                        className="w-3 h-3"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                      >
                                        <path
                                          fillRule="evenodd"
                                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                          clipRule="evenodd"
                                        />
                                      </svg>
                                      Selected
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {model.description}
                                  {!isAccessible &&
                                    " • Upgrade to Pro to access"}
                                </p>
                              </div>
                              <div className="flex-shrink-0 text-right">
                                <span className="text-sm font-medium text-muted-foreground">
                                  {model.creditMultiplier}× credits
                                </span>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="border-t border-border pt-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">
                    Custom Instructions
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Manage your custom user rules or preferences for the LLM.
                  </p>
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
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                      <div>
                        <p className="text-sm font-medium text-foreground mb-1">
                          Premium Feature
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Custom instructions are not available on the Free
                          plan.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Billing Tab */}
            {activeTab === "billing" && (
              <div className="space-y-6">
                {isLoadingBilling ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <div className="w-8 h-8 border-4 border-neutral-200 dark:border-neutral-800 border-t-neutral-900 dark:border-t-neutral-100 rounded-full animate-spin mx-auto mb-3"></div>
                      <p className="text-sm text-muted-foreground">
                        Loading billing information...
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Current Plan */}
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-4">
                        Current Plan
                      </h3>
                      <div className="space-y-6">
                        {/* Plan Details */}
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="text-base font-semibold text-foreground">
                              {subscriptionData?.plan.displayName || "Hobby"}
                            </h4>
                            <p className="text-2xl font-bold text-foreground mt-1">
                              ${subscriptionData?.plan.priceMonthlyUsd || 0}
                              <span className="text-sm font-normal text-muted-foreground">
                                /mo
                              </span>
                            </p>
                            <p className="text-sm text-muted-foreground mt-2">
                              {subscriptionData?.plan.dailyCredits
                                ? `Includes ${
                                    subscriptionData.plan.dailyCredits
                                  } credit${
                                    subscriptionData.plan.dailyCredits > 1
                                      ? "s"
                                      : ""
                                  } per day (~${
                                    subscriptionData.plan.monthlyCredits
                                  } credits/month).`
                                : "Custom credit allocation."}
                            </p>
                          </div>
                          <span
                            className={`px-3 py-1 text-xs font-semibold rounded-full ${
                              subscriptionData?.status === "active"
                                ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                                : "bg-secondary text-secondary-foreground"
                            }`}
                          >
                            {subscriptionData?.status === "active"
                              ? "Active"
                              : subscriptionData?.status || "Unknown"}
                          </span>
                        </div>

                        {/* Daily Credit Balance */}
                        <div className="mt-4 space-y-3">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <span className="text-sm font-medium text-muted-foreground">
                                Daily Credits
                              </span>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                Resets in{" "}
                                {creditBalanceData?.daily.hoursUntilReset || 0}h
                              </p>
                            </div>
                            <span className="text-2xl font-bold text-foreground">
                              {(
                                creditBalanceData?.daily.remaining || 0
                              ).toFixed(2)}{" "}
                              <span className="text-base text-muted-foreground font-normal">
                                /{" "}
                                {(creditBalanceData?.daily.limit || 0).toFixed(
                                  2
                                )}
                              </span>
                            </span>
                          </div>
                          <div className="w-full h-2 relative rounded-full overflow-hidden">
                            <div
                              className="bg-neutral-700 dark:bg-neutral-300 h-full rounded-full transition-all"
                              style={{
                                width: `${
                                  creditBalanceData &&
                                  (creditBalanceData.daily.limit ?? 0) > 0
                                    ? ((creditBalanceData.daily.remaining ??
                                        0) /
                                        creditBalanceData.daily.limit) *
                                      100
                                    : 0
                                }%`,
                              }}
                            ></div>
                          </div>
                        </div>

                        {/* Upgrade to Pro - Only for Hobby users */}
                        {subscriptionData?.plan.name === "HOBBY" && (
                          <div className="mt-6 pt-6 border-t border-border">
                            <div className="flex items-center gap-2 mb-3">
                              <h3 className="text-base font-semibold text-foreground">
                                Upgrade to Pro
                              </h3>
                              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-primary/10 text-primary">
                                Recommended
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground mb-4">
                              Get more daily credits and unlock unlimited
                              projects
                            </p>
                            <div className="space-y-3">
                              <Select
                                value={selectedProTierIndex.toString()}
                                onValueChange={(value) =>
                                  setSelectedProTierIndex(parseInt(value))
                                }
                              >
                                <SelectTrigger className="w-full rounded-full h-12 px-6 text-base">
                                  <SelectValue placeholder="Select a Pro tier" />
                                </SelectTrigger>
                                <SelectContent className="z-[100001] rounded-2xl max-h-[300px] overflow-y-auto">
                                  {PRO_TIERS.map((tier, index) => (
                                    <SelectItem
                                      key={index}
                                      value={index.toString()}
                                      className="text-base py-3"
                                    >
                                      {tier.dailyCredits} credits per day{" "}
                                      <span className="text-muted-foreground">
                                        - {tier.displayPrice}
                                      </span>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>

                              <Button
                                className="w-full rounded-full h-12 text-base font-semibold"
                                disabled={isPurchasing}
                                onClick={async () => {
                                  setIsPurchasing(true);
                                  try {
                                    const selectedTier =
                                      PRO_TIERS[selectedProTierIndex];
                                    const response = await fetch(
                                      "/api/billing/upgrade-to-pro",
                                      {
                                        method: "POST",
                                        headers: {
                                          "Content-Type": "application/json",
                                        },
                                        body: JSON.stringify({
                                          dailyCredits:
                                            selectedTier.dailyCredits,
                                        }),
                                      }
                                    );
                                    const data = await response.json();
                                    if (response.ok && data.checkoutUrl) {
                                      window.location.href = data.checkoutUrl;
                                    } else {
                                      throw new Error(
                                        data.error ||
                                          "Failed to create checkout"
                                      );
                                    }
                                  } catch (error) {
                                    console.error(
                                      "Error purchasing Pro plan:",
                                      error
                                    );
                                    toast.error(
                                      "Failed to initiate purchase. Please try again."
                                    );
                                  } finally {
                                    setIsPurchasing(false);
                                  }
                                }}
                              >
                                {isPurchasing ? (
                                  <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                                    Processing...
                                  </>
                                ) : (
                                  `Upgrade - ${PRO_TIERS[selectedProTierIndex].displayPrice}`
                                )}
                              </Button>
                            </div>
                          </div>
                        )}

                        {subscriptionData?.plan.name === "PRO" && (
                          <div className="space-y-4 pt-6 border-t border-border">
                            <div className="flex items-center gap-3 pb-3">
                              <div className="h-px flex-1 bg-border"></div>
                              <h4 className="text-sm font-semibold text-foreground">
                                Manage Pro Plan
                              </h4>
                              <div className="h-px flex-1 bg-border"></div>
                            </div>

                            {/* Pro Plan Tier Switcher */}
                            <div className="space-y-3 bg-muted/30 p-5 rounded-2xl border border-border">
                              <Label
                                htmlFor="pro-tier-change"
                                className="text-sm font-medium"
                              >
                                Change Pro Tier
                              </Label>
                              <Select
                                value={selectedProTierIndex.toString()}
                                onValueChange={(value) =>
                                  setSelectedProTierIndex(parseInt(value))
                                }
                              >
                                <SelectTrigger className="w-full rounded-full h-12 px-6 text-base bg-background">
                                  <SelectValue placeholder="Select a different tier" />
                                </SelectTrigger>
                                <SelectContent className="z-[100001] rounded-2xl max-h-[300px] overflow-y-auto">
                                  {PRO_TIERS.map((tier, index) => (
                                    <SelectItem
                                      key={index}
                                      value={index.toString()}
                                      className="text-base py-3"
                                    >
                                      {tier.dailyCredits} credits/day{" "}
                                      <span className="text-muted-foreground">
                                        - {tier.displayPrice}
                                      </span>
                                      {tier.dailyCredits ===
                                        subscriptionData?.plan.dailyCredits &&
                                        " (Current)"}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <p className="text-xs text-muted-foreground">
                                Switch to a different Pro tier to adjust your
                                daily credit allocation.
                              </p>

                              <Button
                                className="w-full rounded-full h-12 text-base font-semibold mt-4"
                                disabled={
                                  isPurchasing ||
                                  PRO_TIERS[selectedProTierIndex]
                                    .dailyCredits ===
                                    subscriptionData?.plan.dailyCredits
                                }
                                onClick={async () => {
                                  setIsPurchasing(true);
                                  try {
                                    const selectedTier =
                                      PRO_TIERS[selectedProTierIndex];
                                    const response = await fetch(
                                      "/api/billing/upgrade-to-pro",
                                      {
                                        method: "POST",
                                        headers: {
                                          "Content-Type": "application/json",
                                        },
                                        body: JSON.stringify({
                                          dailyCredits:
                                            selectedTier.dailyCredits,
                                        }),
                                      }
                                    );
                                    const data = await response.json();
                                    if (response.ok && data.checkoutUrl) {
                                      window.location.href = data.checkoutUrl;
                                    } else {
                                      throw new Error(
                                        data.error ||
                                          "Failed to create checkout"
                                      );
                                    }
                                  } catch (error) {
                                    console.error(
                                      "Error changing Pro tier:",
                                      error
                                    );
                                    toast.error(
                                      "Failed to change tier. Please try again."
                                    );
                                  } finally {
                                    setIsPurchasing(false);
                                  }
                                }}
                              >
                                {isPurchasing ? (
                                  <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                                    Processing...
                                  </>
                                ) : PRO_TIERS[selectedProTierIndex]
                                    .dailyCredits ===
                                  subscriptionData?.plan.dailyCredits ? (
                                  "Current Tier"
                                ) : (
                                  `Change to ${PRO_TIERS[selectedProTierIndex].displayPrice}`
                                )}
                              </Button>
                            </div>

                            <div className="bg-muted/30 p-5 rounded-2xl border border-border">
                              <Button
                                variant="outline"
                                className="w-full rounded-full h-12 text-base"
                                onClick={async () => {
                                  // Show toast with action button for confirmation
                                  toast("Downgrade to Hobby plan?", {
                                    description:
                                      "This will take effect at the end of your billing period.",
                                    action: {
                                      label: "Confirm",
                                      onClick: async () => {
                                        try {
                                          const res = await fetch(
                                            "/api/billing/change-plan",
                                            {
                                              method: "POST",
                                              headers: {
                                                "Content-Type":
                                                  "application/json",
                                              },
                                              body: JSON.stringify({
                                                targetPlan: "HOBBY",
                                              }),
                                            }
                                          );
                                          const data = await res.json();
                                          if (
                                            data.action ===
                                            "scheduled_downgrade"
                                          ) {
                                            toast.success(data.message);
                                            fetchBillingData(); // Refresh data
                                          }
                                        } catch (error) {
                                          console.error(
                                            "Error downgrading:",
                                            error
                                          );
                                          toast.error(
                                            "Failed to downgrade. Please try again."
                                          );
                                        }
                                      },
                                    },
                                  });
                                }}
                              >
                                Downgrade to Hobby
                              </Button>
                            </div>
                          </div>
                        )}

                        {subscriptionData?.plan.name === "ENTERPRISE" && (
                          <div className="space-y-4">
                            <div className="flex items-center gap-3 pb-3">
                              <div className="h-px flex-1 bg-border"></div>
                              <h4 className="text-sm font-semibold text-foreground">
                                Enterprise Plan
                              </h4>
                              <div className="h-px flex-1 bg-border"></div>
                            </div>
                            <div className="bg-muted/30 p-5 rounded-2xl border border-border">
                              <p className="text-sm text-muted-foreground text-center">
                                For plan changes, please contact
                                sales@craft.fast
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Manage Subscription Button for Pro/Enterprise users */}
                        {(subscriptionData?.plan.name === "PRO" ||
                          subscriptionData?.plan.name === "ENTERPRISE") && (
                          <div className="mt-6 pt-6 border-t border-border">
                            <p className="text-xs text-muted-foreground mb-3">
                              Manage your subscription: Cancel, update payment
                              method, or view billing history.
                            </p>
                            <Button
                              variant="outline"
                              className="w-full rounded-full h-12 text-base"
                              onClick={async () => {
                                try {
                                  const response = await fetch(
                                    "/api/billing/portal",
                                    {
                                      method: "POST",
                                    }
                                  );
                                  const data = await response.json();
                                  if (response.ok) {
                                    window.location.href = data.url;
                                  }
                                } catch (error) {
                                  console.error(
                                    "Error opening billing portal:",
                                    error
                                  );
                                }
                              }}
                            >
                              Open Billing Portal
                            </Button>
                          </div>
                        )}

                        {subscriptionData?.cancelAtPeriodEnd && (
                          <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                            <p className="text-sm text-yellow-800 dark:text-yellow-200">
                              Your plan will change at the end of the current
                              billing period (
                              {new Date(
                                subscriptionData.currentPeriodEnd
                              ).toLocaleDateString()}
                              ).
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Subscription History */}
                    {subscriptionHistory && (
                      <div className="border-t border-border pt-6">
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                          Subscription Details
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Your current subscription information.
                        </p>
                        <div className="space-y-4">
                          {/* Current Subscription Info */}
                          {subscriptionHistory.currentSubscription && (
                            <div className="p-4 bg-muted/50 rounded-xl border border-input">
                              <div className="flex items-center justify-between mb-3">
                                <div>
                                  <h4 className="text-sm font-semibold text-foreground">
                                    {
                                      subscriptionHistory.currentSubscription
                                        .planDisplayName
                                    }
                                  </h4>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Active since{" "}
                                    {new Date(
                                      subscriptionHistory.currentSubscription.createdAt
                                    ).toLocaleDateString()}
                                  </p>
                                </div>
                                <span className="text-lg font-bold text-foreground">
                                  $
                                  {subscriptionHistory.currentSubscription.priceMonthlyUsd.toFixed(
                                    2
                                  )}
                                  /mo
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">
                                  Current Period
                                </span>
                                <span className="text-foreground font-medium">
                                  {new Date(
                                    subscriptionHistory.currentSubscription.currentPeriodStart
                                  ).toLocaleDateString()}{" "}
                                  -{" "}
                                  {new Date(
                                    subscriptionHistory.currentSubscription.currentPeriodEnd
                                  ).toLocaleDateString()}
                                </span>
                              </div>
                              {subscriptionHistory.currentSubscription
                                .cancelAtPeriodEnd && (
                                <div className="mt-3 pt-3 border-t border-border">
                                  <p className="text-xs text-orange-600 dark:text-orange-400">
                                    ⚠️ This subscription will be cancelled at
                                    the end of the current period
                                  </p>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Invoices */}
                          {subscriptionHistory.invoices.length > 0 && (
                            <div className="mt-4 space-y-2">
                              <h4 className="text-sm font-semibold text-foreground mb-2">
                                Recent Invoices
                              </h4>
                              {subscriptionHistory.invoices
                                .slice(0, 3)
                                .map((invoice) => (
                                  <div
                                    key={invoice.id}
                                    className="p-3 bg-muted/50 rounded-xl border border-input"
                                  >
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-foreground">
                                          {invoice.invoiceNumber}
                                        </span>
                                        <span
                                          className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                                            invoice.status === "paid"
                                              ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                                              : invoice.status === "issued"
                                              ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                                              : "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-400"
                                          }`}
                                        >
                                          {invoice.status}
                                        </span>
                                      </div>
                                      <span className="text-sm font-bold text-foreground">
                                        ${invoice.totalUsd.toFixed(2)}
                                      </span>
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {new Date(
                                        invoice.createdAt
                                      ).toLocaleDateString()}
                                      {invoice.paidAt && (
                                        <span className="ml-2">
                                          • Paid{" "}
                                          {new Date(
                                            invoice.paidAt
                                          ).toLocaleDateString()}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Usage Tab */}
            {activeTab === "usage" && (
              <div className="space-y-6">
                {/* Header */}
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Credit Usage History
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    View detailed breakdown of credit consumption for each
                    interaction
                  </p>
                </div>

                {/* Filters */}
                <div className="p-4 bg-muted/50 rounded-xl border border-input">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* Project Filter */}
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                        Project
                      </label>
                      <select
                        value={selectedProject}
                        onChange={(e) => {
                          setSelectedProject(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-white dark:bg-neutral-800 text-foreground focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:focus:ring-neutral-600"
                      >
                        <option value="">All Projects</option>
                        {creditUsageData?.filters?.projects?.map((project) => (
                          <option key={project.id} value={project.id}>
                            {project.name}
                          </option>
                        )) || null}
                      </select>
                    </div>

                    {/* Endpoint Filter */}
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                        Type
                      </label>
                      <select
                        value={selectedEndpoint}
                        onChange={(e) => {
                          setSelectedEndpoint(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-white dark:bg-neutral-800 text-foreground focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:focus:ring-neutral-600"
                      >
                        <option value="">All Types</option>
                        {creditUsageData?.filters?.endpoints?.map(
                          (endpoint) => (
                            <option key={endpoint} value={endpoint}>
                              {endpoint}
                            </option>
                          )
                        ) || null}
                      </select>
                    </div>

                    {/* Start Date Filter */}
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => {
                          setStartDate(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-white dark:bg-neutral-800 text-foreground focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:focus:ring-neutral-600"
                      />
                    </div>

                    {/* End Date Filter */}
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                        End Date
                      </label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => {
                          setEndDate(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-white dark:bg-neutral-800 text-foreground focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:focus:ring-neutral-600"
                      />
                    </div>
                  </div>

                  {/* Reset Filters Button */}
                  {(selectedProject ||
                    selectedEndpoint ||
                    startDate ||
                    endDate) && (
                    <button
                      onClick={resetFilters}
                      className="mt-3 px-3 py-1.5 text-xs font-medium text-muted-foreground bg-white dark:bg-neutral-800 border border-input rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                    >
                      Reset Filters
                    </button>
                  )}
                </div>

                {/* Loading State */}
                {isLoadingUsage ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-900 dark:border-neutral-50"></div>
                  </div>
                ) : creditUsageData && creditUsageData.records.length > 0 ? (
                  <>
                    {/* Table */}
                    <div className="border border-input rounded-xl overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-accent border-b border-input">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Date & Time
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Project
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Model
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Type
                              </th>
                              <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Credits Used
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                            {creditUsageData.records.map((record, index) => (
                              <tr
                                key={record.id}
                                className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                              >
                                <td className="px-4 py-3 text-sm text-foreground">
                                  <div>
                                    {new Date(
                                      record.createdAt
                                    ).toLocaleDateString()}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {new Date(
                                      record.createdAt
                                    ).toLocaleTimeString()}
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-sm text-foreground">
                                  <div className="flex items-center gap-2">
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-neutral-100 dark:bg-neutral-700 text-muted-foreground">
                                      {record.projectName}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-sm text-foreground">
                                  {record.model}
                                </td>
                                <td className="px-4 py-3 text-sm">
                                  <span
                                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                                      record.callType === "agent"
                                        ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                                        : record.callType === "chat"
                                        ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                                        : "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400"
                                    }`}
                                  >
                                    {record.callType}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-sm text-right font-mono font-semibold text-foreground">
                                  {record.creditsUsed.toFixed(4)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between px-2">
                      <div className="text-sm text-muted-foreground">
                        Showing {(currentPage - 1) * 10 + 1} to{" "}
                        {Math.min(
                          currentPage * 10,
                          creditUsageData.pagination.totalCount
                        )}{" "}
                        of {creditUsageData.pagination.totalCount} records
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            setCurrentPage(Math.max(1, currentPage - 1))
                          }
                          disabled={currentPage === 1}
                          className="px-3 py-1.5 text-sm font-medium text-muted-foreground bg-white dark:bg-neutral-800 border border-input rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          Previous
                        </button>

                        <div className="flex items-center gap-1">
                          {Array.from(
                            {
                              length: Math.min(
                                5,
                                creditUsageData.pagination.totalPages
                              ),
                            },
                            (_, i) => {
                              let pageNum;
                              if (creditUsageData.pagination.totalPages <= 5) {
                                pageNum = i + 1;
                              } else if (currentPage <= 3) {
                                pageNum = i + 1;
                              } else if (
                                currentPage >=
                                creditUsageData.pagination.totalPages - 2
                              ) {
                                pageNum =
                                  creditUsageData.pagination.totalPages - 4 + i;
                              } else {
                                pageNum = currentPage - 2 + i;
                              }

                              return (
                                <button
                                  key={i}
                                  onClick={() => setCurrentPage(pageNum)}
                                  className={`w-8 h-8 text-sm font-medium rounded-lg transition-colors ${
                                    currentPage === pageNum
                                      ? "bg-primary text-neutral-50 dark:text-neutral-900"
                                      : "text-muted-foreground hover:bg-neutral-100 dark:hover:bg-neutral-700"
                                  }`}
                                >
                                  {pageNum}
                                </button>
                              );
                            }
                          )}
                        </div>

                        <button
                          onClick={() =>
                            setCurrentPage(
                              Math.min(
                                creditUsageData.pagination.totalPages,
                                currentPage + 1
                              )
                            )
                          }
                          disabled={
                            currentPage ===
                            creditUsageData.pagination.totalPages
                          }
                          className="px-3 py-1.5 text-sm font-medium text-muted-foreground bg-white dark:bg-neutral-800 border border-input rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-muted-foreground mb-2">
                      No usage records found
                    </div>
                    <p className="text-sm text-neutral-400 dark:text-neutral-500">
                      {selectedProject ||
                      selectedEndpoint ||
                      startDate ||
                      endDate
                        ? "Try adjusting your filters"
                        : "Start using the platform to see your credit usage here"}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Account Tab */}
            {activeTab === "account" && (
              <div className="space-y-6">
                {/* Profile Section */}
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-4">
                    Profile
                  </h3>
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
                            isSavingProfile ||
                            isLoadingProfile ||
                            !userName.trim()
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
                    Manage your primary email address for signing in and
                    receiving notifications.
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
                            disabled={isChangingEmail}
                          />
                          <p className="text-xs text-muted-foreground mt-1.5">
                            A verification link will be sent to your new email
                            address
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={handleChangeEmail}
                            disabled={isChangingEmail || !newEmail.trim()}
                            className="rounded-full"
                          >
                            {isChangingEmail
                              ? "Sending..."
                              : "Send Verification"}
                          </Button>
                          <Button
                            onClick={() => {
                              setShowEmailChangeForm(false);
                              setNewEmail("");
                            }}
                            variant="outline"
                            className="rounded-full"
                            disabled={isChangingEmail}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

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
                                ? linkedAccounts.google.email ||
                                  session?.user?.email
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
                                ? linkedAccounts.github.email ||
                                  session?.user?.email
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
                                ? linkedAccounts.credentials.email ||
                                  session?.user?.email
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

                <div className="border-t border-border pt-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">
                    Security
                  </h3>
                  <div className="space-y-4">
                    {/* Password Section */}
                    {linkedAccounts?.credentials?.connected ? (
                      <div>
                        <p className="text-sm text-muted-foreground mb-3">
                          Change your password to keep your account secure.
                        </p>
                        <button
                          disabled
                          className="w-full px-4 py-3 text-sm font-medium text-muted-foreground border border-neutral-300 dark:border-neutral-700 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Change Password (Coming Soon)
                        </button>
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
                              {linkedAccounts?.google?.connected
                                ? "Google"
                                : "GitHub"}
                              . To use a password, set up Email + Password
                              authentication in the Linked sign-in providers
                              section above.
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
                  <h3 className="text-lg font-semibold text-foreground mb-4">
                    API Keys
                  </h3>
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
                              . You can cancel this at any time within the grace
                              period.
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
                        Once you delete your account, there is no going back.
                        Your account will be scheduled for deletion with a
                        30-day grace period for recovery.
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
            )}

            {/* Integrations Tab */}
            {activeTab === "integrations" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-4">
                    Connected Services
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Connect your account with third-party services to enhance
                    your workflow
                  </p>
                  <div className="space-y-3">
                    {/* Figma */}
                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl border border-input">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white dark:bg-neutral-900 flex items-center justify-center border border-input">
                          <svg
                            className="w-6 h-6"
                            viewBox="0 0 38 57"
                            fill="none"
                          >
                            <path
                              d="M19 28.5C19 23.2533 23.2533 19 28.5 19C33.7467 19 38 23.2533 38 28.5C38 33.7467 33.7467 38 28.5 38C23.2533 38 19 33.7467 19 28.5Z"
                              fill="#1ABCFE"
                            />
                            <path
                              d="M0 47.5C0 42.2533 4.25329 38 9.5 38H19V47.5C19 52.7467 14.7467 57 9.5 57C4.25329 57 0 52.7467 0 47.5Z"
                              fill="#0ACF83"
                            />
                            <path
                              d="M19 0V19H28.5C33.7467 19 38 14.7467 38 9.5C38 4.25329 33.7467 0 28.5 0H19Z"
                              fill="#FF7262"
                            />
                            <path
                              d="M0 9.5C0 14.7467 4.25329 19 9.5 19H19V0H9.5C4.25329 0 0 4.25329 0 9.5Z"
                              fill="#F24E1E"
                            />
                            <path
                              d="M0 28.5C0 33.7467 4.25329 38 9.5 38H19V19H9.5C4.25329 19 0 23.2533 0 28.5Z"
                              fill="#A259FF"
                            />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            Figma
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Import designs and export code
                          </p>
                        </div>
                      </div>
                      <button className="px-4 py-2 text-sm font-medium bg-accent text-foreground rounded-lg hover:bg-accent/80 transition-colors">
                        Connect
                      </button>
                    </div>

                    {/* GitHub */}
                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl border border-input">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-neutral-900 dark:bg-white flex items-center justify-center">
                          <svg
                            className="w-6 h-6 text-primary-foreground"
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
                          <p className="text-sm font-medium text-foreground">
                            GitHub
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Deploy and manage repositories
                          </p>
                        </div>
                      </div>
                      <button className="px-4 py-2 text-sm font-medium bg-accent text-foreground rounded-lg hover:bg-accent/80 transition-colors">
                        Connect
                      </button>
                    </div>

                    {/* Supabase */}
                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl border border-input">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-neutral-900 dark:bg-white flex items-center justify-center">
                          <svg
                            className="w-6 h-6"
                            viewBox="0 0 109 113"
                            fill="none"
                          >
                            <path
                              d="M63.7076 110.284C60.8481 113.885 55.0502 111.912 54.9813 107.314L53.9738 40.0627L99.1935 40.0627C107.384 40.0627 111.952 49.5228 106.859 55.9374L63.7076 110.284Z"
                              fill="url(#paint0_linear)"
                            />
                            <path
                              d="M63.7076 110.284C60.8481 113.885 55.0502 111.912 54.9813 107.314L53.9738 40.0627L99.1935 40.0627C107.384 40.0627 111.952 49.5228 106.859 55.9374L63.7076 110.284Z"
                              fill="url(#paint1_linear)"
                              fillOpacity="0.2"
                            />
                            <path
                              d="M45.317 2.07103C48.1765 -1.53037 53.9745 0.442937 54.0434 5.041L54.4849 72.2922H9.83113C1.64038 72.2922 -2.92775 62.8321 2.1655 56.4175L45.317 2.07103Z"
                              fill="#3ECF8E"
                            />
                            <defs>
                              <linearGradient
                                id="paint0_linear"
                                x1="53.9738"
                                y1="54.974"
                                x2="94.1635"
                                y2="71.8295"
                                gradientUnits="userSpaceOnUse"
                              >
                                <stop stopColor="#249361" />
                                <stop offset="1" stopColor="#3ECF8E" />
                              </linearGradient>
                              <linearGradient
                                id="paint1_linear"
                                x1="36.1558"
                                y1="30.578"
                                x2="54.4844"
                                y2="65.0806"
                                gradientUnits="userSpaceOnUse"
                              >
                                <stop />
                                <stop offset="1" stopOpacity="0" />
                              </linearGradient>
                            </defs>
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            Supabase
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Backend database and authentication
                          </p>
                        </div>
                      </div>
                      <button className="px-4 py-2 text-sm font-medium bg-accent text-foreground rounded-lg hover:bg-accent/80 transition-colors">
                        Connect
                      </button>
                    </div>

                    {/* Vercel */}
                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl border border-input">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-neutral-900 dark:bg-neutral-900 flex items-center justify-center">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            fill="white"
                            viewBox="0 0 24 24"
                          >
                            <path d="M12 2L2 20h20L12 2z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            Vercel
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Deploy and host your projects
                          </p>
                        </div>
                      </div>
                      <button className="px-4 py-2 text-sm font-medium bg-accent text-foreground rounded-lg hover:bg-accent/80 transition-colors">
                        Connect
                      </button>
                    </div>
                  </div>
                </div>
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

      {/* Subscription Modal for upgrades */}
      <SubscriptionModal
        isOpen={showSubscriptionModal}
        onClose={() => {
          setShowSubscriptionModal(false);
          setTargetPlan(undefined); // Reset target plan
          // Refresh billing data after modal closes
          if (activeTab === "billing") {
            fetchBillingData();
          }
        }}
        currentPlan={subscriptionData?.plan.name || "HOBBY"}
        targetPlan={targetPlan}
      />

      {/* Password Setup Modal */}
      {showPasswordSetupModal &&
        typeof window !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 z-[99999] flex items-center justify-center">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => {
                setShowPasswordSetupModal(false);
                setNewPassword("");
                setConfirmPassword("");
              }}
            />

            {/* Modal */}
            <div className="relative bg-background border border-border rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-foreground">
                  Set Up Password
                </h2>
                <button
                  onClick={() => {
                    setShowPasswordSetupModal(false);
                    setNewPassword("");
                    setConfirmPassword("");
                  }}
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

              <p className="text-sm text-muted-foreground mb-6">
                Add a password to enable signing in with email and password as a
                backup authentication method.
              </p>

              <div className="space-y-4">
                <div>
                  <Label
                    htmlFor="new-password"
                    className="text-sm font-medium text-muted-foreground"
                  >
                    New Password
                  </Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter password (min 12 characters)"
                    className="mt-1.5"
                    disabled={isSettingPassword}
                  />
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Must include uppercase, lowercase, number, and special
                    character
                  </p>
                </div>

                <div>
                  <Label
                    htmlFor="confirm-password"
                    className="text-sm font-medium text-muted-foreground"
                  >
                    Confirm Password
                  </Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    className="mt-1.5"
                    disabled={isSettingPassword}
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    onClick={() => {
                      setShowPasswordSetupModal(false);
                      setNewPassword("");
                      setConfirmPassword("");
                    }}
                    variant="outline"
                    className="flex-1"
                    disabled={isSettingPassword}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSetPassword}
                    className="flex-1"
                    disabled={
                      isSettingPassword || !newPassword || !confirmPassword
                    }
                  >
                    {isSettingPassword ? "Setting up..." : "Set Password"}
                  </Button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Delete Account Confirmation Modal */}
      {showDeleteModal &&
        typeof window !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 z-[99999] flex items-center justify-center">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => {
                setShowDeleteModal(false);
                setDeletePassword("");
              }}
            />

            {/* Modal */}
            <div className="relative bg-background border border-border rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-red-600 dark:text-red-400">
                  Delete Account
                </h2>
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeletePassword("");
                  }}
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
                        Your account will be scheduled for deletion with a
                        30-day grace period. During this time, you can cancel
                        the deletion and restore your account. After 30 days,
                        all your data will be permanently deleted.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <Label
                    htmlFor="delete-password"
                    className="text-sm font-medium text-muted-foreground"
                  >
                    Confirm your password
                  </Label>
                  <Input
                    id="delete-password"
                    type="password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    placeholder="Enter your password to confirm"
                    className="mt-1.5"
                    disabled={isDeletingAccount}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && deletePassword) {
                        handleDeleteAccount();
                      }
                    }}
                  />
                  <p className="text-xs text-muted-foreground mt-1.5">
                    This helps us verify that it&apos;s really you
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    onClick={() => {
                      setShowDeleteModal(false);
                      setDeletePassword("");
                    }}
                    variant="outline"
                    className="flex-1 rounded-full"
                    disabled={isDeletingAccount}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleDeleteAccount}
                    className="flex-1 rounded-full bg-red-600 hover:bg-red-700 text-white"
                    disabled={isDeletingAccount || !deletePassword}
                  >
                    {isDeletingAccount ? "Scheduling..." : "Delete My Account"}
                  </Button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
