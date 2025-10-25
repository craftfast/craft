"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useSession } from "next-auth/react";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ExtendedUser {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

interface TokenUsageRecord {
  id: string;
  projectId: string;
  projectName: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  endpoint: string;
  createdAt: string;
}

interface TokenUsageData {
  records: TokenUsageRecord[];
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

type SettingsTab = "general" | "billing" | "usage" | "account" | "integrations";

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");
  const [chatPosition, setChatPosition] = useState<"left" | "right">("left");
  const [suggestionsEnabled, setSuggestionsEnabled] = useState(true);
  const [soundNotifications, setSoundNotifications] = useState(false);
  const [location, setLocation] = useState("");
  const [profileLink, setProfileLink] = useState("");
  const [tokenUsageData, setTokenUsageData] = useState<TokenUsageData | null>(
    null
  );
  const [isLoadingUsage, setIsLoadingUsage] = useState(false);

  // Filters and pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // This would be set based on the user's authentication method from the database
  // For now, we'll assume false (OAuth user). Set to true for email+password users.
  const hasEmailPassword = false;

  // Load user settings on mount
  useEffect(() => {
    const loadUserSettings = async () => {
      try {
        const response = await fetch("/api/user/settings");
        if (response.ok) {
          const data = await response.json();
          if (data.preferredChatPosition) {
            setChatPosition(data.preferredChatPosition);
          }
        }
      } catch (error) {
        console.error("Error loading user settings:", error);
      }
    };

    if (isOpen) {
      loadUserSettings();
    }
  }, [isOpen]);

  // Save chat position preference
  const handleChatPositionChange = async (position: "left" | "right") => {
    setChatPosition(position);

    try {
      const response = await fetch("/api/user/settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ preferredChatPosition: position }),
      });

      if (!response.ok) {
        console.error("Failed to save chat position preference");
      }
    } catch (error) {
      console.error("Error saving chat position:", error);
    }
  };

  // Fetch usage data when usage tab is active
  useEffect(() => {
    if (activeTab === "usage") {
      fetchTokenUsage();
    }
  }, [
    activeTab,
    currentPage,
    selectedProject,
    selectedEndpoint,
    startDate,
    endDate,
  ]);

  const fetchTokenUsage = () => {
    setIsLoadingUsage(true);

    const params = new URLSearchParams({
      page: currentPage.toString(),
      limit: "10",
    });

    if (selectedProject) params.append("projectId", selectedProject);
    if (selectedEndpoint) params.append("endpoint", selectedEndpoint);
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);

    fetch(`/api/usage/tokens?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        // Only set data if it has the expected structure
        if (data && data.records && data.pagination && data.filters) {
          setTokenUsageData(data);
        } else {
          console.error("Invalid token usage data:", data);
          setTokenUsageData(null);
        }
        setIsLoadingUsage(false);
      })
      .catch((error) => {
        console.error("Error fetching usage:", error);
        setTokenUsageData(null);
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
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-4">
                    Profile
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-2">
                        Name
                      </label>
                      <input
                        type="text"
                        value={session?.user?.name || ""}
                        readOnly
                        className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-muted text-foreground cursor-not-allowed text-sm"
                      />
                      <p className="text-xs text-muted-foreground mt-1.5">
                        Your display name from your authentication provider
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        value={session?.user?.email || ""}
                        readOnly
                        className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-muted text-foreground cursor-not-allowed text-sm"
                      />
                      <p className="text-xs text-muted-foreground mt-1.5">
                        Your email address
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-2">
                        Profile Picture
                      </label>
                      <div className="flex items-center gap-4">
                        {session?.user?.image ? (
                          <img
                            src={session.user.image}
                            alt={session.user.name || "User"}
                            className="w-16 h-16 rounded-full object-cover ring-2 ring-ring"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-2xl font-semibold ring-2 ring-ring">
                            {session?.user?.name?.[0]?.toUpperCase() ||
                              session?.user?.email?.[0]?.toUpperCase() ||
                              "U"}
                          </div>
                        )}
                        <p className="text-sm text-muted-foreground">
                          Profile picture is managed by your authentication
                          provider
                        </p>
                      </div>
                    </div>

                    <div>
                      <Label
                        htmlFor="location"
                        className="text-muted-foreground mb-2"
                      >
                        Location
                      </Label>
                      <Input
                        id="location"
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="e.g., San Francisco, CA"
                        className="rounded-xl"
                      />
                      <p className="text-xs text-muted-foreground mt-1.5">
                        Where you&apos;re based.
                      </p>
                    </div>

                    <div>
                      <Label
                        htmlFor="profile-link"
                        className="text-muted-foreground mb-2"
                      >
                        Link
                      </Label>
                      <Input
                        id="profile-link"
                        type="url"
                        value={profileLink}
                        onChange={(e) => setProfileLink(e.target.value)}
                        placeholder="https://yourwebsite.com"
                        className="rounded-xl"
                      />
                      <p className="text-xs text-muted-foreground mt-1.5">
                        Add a link to your personal website or portfolio.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-border pt-6">
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
                      onClick={() => handleChatPositionChange("left")}
                      variant={chatPosition === "left" ? "default" : "outline"}
                      className="flex-1 rounded-xl"
                    >
                      Left
                    </Button>
                    <Button
                      onClick={() => handleChatPositionChange("right")}
                      variant={chatPosition === "right" ? "default" : "outline"}
                      className="flex-1 rounded-xl"
                    >
                      Right
                    </Button>
                  </div>
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

            {/* Billing Tab */}
            {activeTab === "billing" && (
              <div className="space-y-6">
                {/* Current Plan */}
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-4">
                    Current Plan
                  </h3>
                  <div className="p-5 bg-muted/50 rounded-xl border border-border">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="text-base font-semibold text-foreground">
                          Free Plan
                        </h4>
                        <p className="text-2xl font-bold text-foreground mt-1">
                          $0
                          <span className="text-sm font-normal text-muted-foreground">
                            /mo
                          </span>
                        </p>
                      </div>
                      <span className="px-3 py-1 text-xs font-semibold bg-secondary text-secondary-foreground rounded-full">
                        Active
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Includes 100,000 tokens every month.
                    </p>
                    <Button className="w-full mt-4 rounded-xl">
                      Upgrade Plan
                    </Button>
                  </div>
                </div>

                {/* Token Balance */}
                <div className="border-t border-border pt-6">
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Token Balance
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Your monthly tokens reset in 23 days. Tokens are used in the
                    following order: gifted, monthly, purchased.
                  </p>

                  <div className="space-y-3">
                    {/* Total Available */}
                    <div className="p-4 bg-primary rounded-xl">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-primary-foreground/70">
                          Total Available Tokens
                        </span>
                        <span className="text-2xl font-bold text-primary-foreground">
                          98,000
                        </span>
                      </div>
                    </div>

                    {/* Gifted Tokens */}
                    <div className="p-3 bg-muted/50 rounded-xl border border-input">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">
                          Gifted Tokens
                        </span>
                        <span className="text-sm font-semibold text-foreground">
                          0
                        </span>
                      </div>
                    </div>

                    {/* Monthly Tokens */}
                    <div className="p-3 bg-muted/50 rounded-xl border border-input">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-muted-foreground">
                          Monthly Tokens
                        </span>
                        <span className="text-sm font-semibold text-foreground">
                          98,000 / 100,000
                        </span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ width: "98%" }}
                        ></div>
                      </div>
                    </div>

                    {/* Purchased Tokens */}
                    <div className="p-3 bg-muted/50 rounded-xl border border-input">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">
                          Purchased Tokens
                        </span>
                        <span className="text-sm font-semibold text-foreground">
                          0
                        </span>
                      </div>
                    </div>

                    <Button variant="secondary" className="w-full rounded-xl">
                      Purchase More Tokens
                    </Button>
                  </div>
                </div>

                {/* Payment Method */}
                <div className="border-t border-border pt-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">
                    Payment Method
                  </h3>
                  <div className="p-4 bg-muted/50 rounded-xl border border-input">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                          <svg
                            className="w-6 h-6 text-muted-foreground"
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
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            No payment method
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Add a payment method to purchase tokens
                          </p>
                        </div>
                      </div>
                      <Button size="sm" className="rounded-lg">
                        Add
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Payments are processed securely through Polar.
                  </p>
                </div>

                {/* Usage Code */}
                <div className="border-t border-border pt-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">
                    Redeem a Usage Code
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Redeem a usage code to claim your gifted tokens.
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter code"
                      className="flex-1 px-3.5 py-2.5 rounded-xl border border-input bg-white dark:bg-neutral-900 text-foreground placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-neutral-50 focus:border-transparent text-sm"
                    />
                    <button className="px-4 py-2.5 text-sm font-medium bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors whitespace-nowrap">
                      Redeem
                    </button>
                  </div>
                </div>

                {/* Subscription Management (for paid plans) */}
                <div className="border-t border-border pt-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">
                    Subscription Management
                  </h3>
                  <div className="p-4 bg-muted/50 rounded-xl border border-input">
                    <p className="text-sm text-muted-foreground mb-3">
                      You&apos;re currently on the Free plan. Upgrade to access
                      subscription management features.
                    </p>
                    {/* This section would show when user has a paid subscription:
                    <div className="space-y-2">
                      <button className="w-full px-4 py-2.5 text-sm font-medium bg-accent text-foreground rounded-xl hover:bg-accent/80 transition-colors">
                        Manage Subscription
                      </button>
                      <button className="w-full px-4 py-2.5 text-sm font-medium text-muted-foreground border border-input rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                        Cancel Subscription
                      </button>
                    </div>
                    */}
                  </div>
                </div>

                {/* Invoices */}
                <div className="border-t border-border pt-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">
                    Invoices
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    View and download your billing history.
                  </p>

                  {/* No invoices state */}
                  <div className="p-6 bg-muted/50 rounded-xl border border-input text-center">
                    <svg
                      className="w-12 h-12 text-neutral-400 dark:text-neutral-600 mx-auto mb-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <p className="text-sm font-medium text-foreground mb-1">
                      No invoices yet
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Your invoices will appear here after purchases or
                      subscription payments.
                    </p>
                  </div>

                  {/* Example invoices (commented out - will show when user has invoices)
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl border border-input hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                          <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            Pro Plan - January 2025
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Issued on Jan 1, 2025 • $29.00
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 text-xs font-medium bg-secondary text-muted-foreground rounded-full">
                          Paid
                        </span>
                        <button className="p-2 text-muted-foreground hover:bg-accent/80 rounded-lg transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl border border-input hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                          <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            Token Purchase - 500K tokens
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Issued on Dec 15, 2024 • $49.00
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 text-xs font-medium bg-secondary text-muted-foreground rounded-full">
                          Paid
                        </span>
                        <button className="p-2 text-muted-foreground hover:bg-accent/80 rounded-lg transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                  */}
                </div>
              </div>
            )}

            {/* Usage Tab */}
            {activeTab === "usage" && (
              <div className="space-y-6">
                {/* Header */}
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Token Usage History
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    View detailed breakdown of token consumption for each
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
                        {tokenUsageData?.filters?.projects?.map((project) => (
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
                        {tokenUsageData?.filters?.endpoints?.map((endpoint) => (
                          <option key={endpoint} value={endpoint}>
                            {endpoint}
                          </option>
                        )) || null}
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
                ) : tokenUsageData && tokenUsageData.records.length > 0 ? (
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
                                Type
                              </th>
                              <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Input Tokens
                              </th>
                              <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Output Tokens
                              </th>
                              <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Total Tokens
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                            {tokenUsageData.records.map((record, index) => (
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
                                <td className="px-4 py-3 text-sm text-muted-foreground capitalize">
                                  {record.endpoint}
                                </td>
                                <td className="px-4 py-3 text-sm text-right font-mono text-foreground">
                                  {record.inputTokens.toLocaleString()}
                                </td>
                                <td className="px-4 py-3 text-sm text-right font-mono text-foreground">
                                  {record.outputTokens.toLocaleString()}
                                </td>
                                <td className="px-4 py-3 text-sm text-right font-mono font-semibold text-foreground">
                                  {record.totalTokens.toLocaleString()}
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
                          tokenUsageData.pagination.totalCount
                        )}{" "}
                        of {tokenUsageData.pagination.totalCount} records
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
                                tokenUsageData.pagination.totalPages
                              ),
                            },
                            (_, i) => {
                              let pageNum;
                              if (tokenUsageData.pagination.totalPages <= 5) {
                                pageNum = i + 1;
                              } else if (currentPage <= 3) {
                                pageNum = i + 1;
                              } else if (
                                currentPage >=
                                tokenUsageData.pagination.totalPages - 2
                              ) {
                                pageNum =
                                  tokenUsageData.pagination.totalPages - 4 + i;
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
                                tokenUsageData.pagination.totalPages,
                                currentPage + 1
                              )
                            )
                          }
                          disabled={
                            currentPage === tokenUsageData.pagination.totalPages
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
                        : "Start using the platform to see your token usage here"}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Account Tab */}
            {activeTab === "account" && (
              <div className="space-y-6">
                <div>
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
                  <div className="space-y-3">
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
                            <span className="px-2 py-0.5 text-xs font-medium bg-secondary text-muted-foreground rounded-full">
                              Primary
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {session?.user?.email || "sudheerkm72@gmail.com"}
                          </p>
                        </div>
                      </div>
                      <button className="px-3 py-1.5 text-xs font-medium text-muted-foreground border border-input rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                        Manage
                      </button>
                    </div>

                    {/* GitHub - Not Connected */}
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
                          <p className="text-sm font-medium text-foreground">
                            GitHub
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Not connected
                          </p>
                        </div>
                      </div>
                      <button className="px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                        Connect
                      </button>
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
                          <p className="text-sm font-medium text-foreground">
                            Email + Password
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Not connected
                          </p>
                        </div>
                      </div>
                      <button className="px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                        Set up
                      </button>
                    </div>
                  </div>
                </div>

                <div className="border-t border-border pt-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">
                    Security
                  </h3>
                  {hasEmailPassword ? (
                    <button className="w-full px-4 py-3 text-sm font-medium bg-accent text-foreground rounded-xl hover:bg-accent/80 transition-colors">
                      Change Password
                    </button>
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
                            You&apos;re signed in with Google or GitHub. To use
                            a password, set up Email + Password authentication
                            in the Linked sign-in providers section above.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
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
                  <p className="text-sm text-muted-foreground mb-3">
                    Once you delete your account, there is no going back. Please
                    be certain.
                  </p>
                  <button
                    disabled
                    className="px-4 py-2.5 text-sm font-medium text-muted-foreground border border-neutral-300 dark:border-neutral-700 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Delete Account (Coming Soon)
                  </button>
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

  return typeof window !== "undefined"
    ? createPortal(modalContent, document.body)
    : null;
}
