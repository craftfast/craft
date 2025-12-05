"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import Link from "next/link";
import SidebarLayout from "@/components/SidebarLayout";
import AppHeader from "@/components/AppHeader";
import FeedbackModal from "@/components/FeedbackModal";
import { Button } from "@/components/ui/button";
import { Search, MessageCircleQuestion, X } from "lucide-react";

type SettingsSection =
  | "general"
  | "personalization"
  | "models"
  | "billing"
  | "usage"
  | "account";

const menuItems: {
  id: SettingsSection;
  label: string;
  path: string;
  keywords: string[];
}[] = [
  {
    id: "general",
    label: "General",
    path: "/settings",
    keywords: [
      "theme",
      "dark",
      "light",
      "appearance",
      "chat position",
      "sound",
      "notifications",
      "suggestions",
    ],
  },
  {
    id: "personalization",
    label: "Personalization",
    path: "/settings/personalization",
    keywords: [
      "profile",
      "name",
      "bio",
      "custom",
      "instructions",
      "preferences",
    ],
  },
  {
    id: "models",
    label: "Models",
    path: "/settings/models",
    keywords: [
      "ai",
      "gpt",
      "claude",
      "llm",
      "default",
      "chat",
      "agent",
      "reasoning",
    ],
  },
  {
    id: "billing",
    label: "Billing",
    path: "/settings/billing",
    keywords: [
      "payment",
      "subscription",
      "plan",
      "credit card",
      "invoice",
      "upgrade",
      "pro",
    ],
  },
  {
    id: "usage",
    label: "Usage",
    path: "/settings/usage",
    keywords: [
      "credits",
      "tokens",
      "cost",
      "history",
      "consumption",
      "spending",
    ],
  },
  {
    id: "account",
    label: "Account",
    path: "/settings/account",
    keywords: ["email", "password", "security", "delete", "logout", "sign out"],
  },
];

const getMenuIcon = (itemId: SettingsSection) => {
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
    case "models":
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
            d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
          />
        </svg>
      );
  }
};

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Determine active section from pathname
  const getActiveSection = (): SettingsSection => {
    if (pathname === "/settings" || pathname === "/settings/general")
      return "general";
    if (pathname === "/settings/personalization") return "personalization";
    if (pathname === "/settings/models") return "models";
    if (pathname === "/settings/billing") return "billing";
    if (pathname === "/settings/usage") return "usage";
    if (pathname === "/settings/account") return "account";
    return "general";
  };

  const activeSection = getActiveSection();

  // Filter menu items based on search query
  const filteredMenuItems = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return menuItems.filter(
      (item) =>
        item.label.toLowerCase().includes(query) ||
        item.keywords.some((keyword) => keyword.toLowerCase().includes(query))
    );
  }, [searchQuery]);

  // Get matching keyword for display
  const getMatchingKeyword = (item: (typeof menuItems)[0]) => {
    if (!searchQuery.trim()) return null;
    const query = searchQuery.toLowerCase();
    if (item.label.toLowerCase().includes(query)) return null;
    return item.keywords.find((keyword) =>
      keyword.toLowerCase().includes(query)
    );
  };

  // Close search dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const showSearchResults = isSearchFocused && searchQuery.trim().length > 0;

  // Show loading state
  if (isPending) {
    return (
      <SidebarLayout>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground" />
        </div>
      </SidebarLayout>
    );
  }

  // Show sign-in prompt for unauthenticated users
  if (!session) {
    return (
      <SidebarLayout>
        <div className="min-h-screen bg-background text-foreground flex flex-col">
          {/* Header */}
          <AppHeader />

          {/* Auth Required Message */}
          <main className="flex-1 flex items-center justify-center pb-12">
            <div className="text-center max-w-md mx-auto px-4">
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-muted flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-muted-foreground"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold mb-2">
                Sign in to access settings
              </h2>
              <p className="text-muted-foreground mb-6">
                Create an account or sign in to customize your preferences and
                manage your account.
              </p>
              <div className="flex items-center justify-center gap-3">
                <Button variant="outline" asChild className="rounded-full">
                  <Link href="/auth/signin">Log in</Link>
                </Button>
                <Button asChild className="rounded-full">
                  <Link href="/auth/signup">Sign up</Link>
                </Button>
              </div>
            </div>
          </main>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <div className="h-screen bg-background text-foreground flex flex-col overflow-hidden">
        {/* Header */}
        <AppHeader
          afterLogo={
            <Link
              href="/settings"
              className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-muted transition-colors"
            >
              <span className="text-md font-semibold text-foreground">
                Settings
              </span>
            </Link>
          }
          centerContent={
            <div
              ref={searchContainerRef}
              className="hidden md:flex items-center w-full max-w-md relative"
            >
              <div className="flex-1 flex items-center bg-muted/50 border border-input rounded-lg overflow-hidden">
                <Search className="w-4 h-4 text-muted-foreground ml-3" />
                <input
                  type="text"
                  placeholder="Search settings..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  className="flex-1 px-3 py-1.5 text-sm bg-transparent border-none focus:outline-none placeholder:text-muted-foreground"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="p-1.5 mr-1 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Search Results Dropdown */}
              {showSearchResults && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-xl shadow-lg overflow-hidden z-50">
                  {filteredMenuItems.length > 0 ? (
                    <div className="py-1">
                      {filteredMenuItems.map((item) => {
                        const matchingKeyword = getMatchingKeyword(item);
                        return (
                          <button
                            key={item.id}
                            onClick={() => {
                              router.push(item.path);
                              setSearchQuery("");
                              setIsSearchFocused(false);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted transition-colors text-left"
                          >
                            <div className="w-5 h-5 flex items-center justify-center text-muted-foreground">
                              {getMenuIcon(item.id)}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-foreground">
                                {item.label}
                              </span>
                              {matchingKeyword && (
                                <span className="text-xs text-muted-foreground">
                                  {matchingKeyword}
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="px-4 py-6 text-center">
                      <p className="text-sm text-muted-foreground">
                        No settings found for &quot;{searchQuery}&quot;
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          }
          beforeCredits={
            <Button
              variant="outline"
              size="sm"
              className="rounded-full"
              onClick={() => setIsFeedbackModalOpen(true)}
            >
              <MessageCircleQuestion className="w-4 h-4" />
              <span className="hidden sm:inline ml-1.5">Feedback</span>
            </Button>
          }
        />

        {/* Feedback Modal */}
        <FeedbackModal
          isOpen={isFeedbackModalOpen}
          onClose={() => setIsFeedbackModalOpen(false)}
        />

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar - Menu */}
          <div className="w-64 flex-shrink-0 overflow-y-auto bg-background [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-muted-foreground/30 [&::-webkit-scrollbar-thumb]:rounded-full">
            <nav className="p-4 space-y-1">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => router.push(item.path)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors ${
                    activeSection === item.id
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
          <div className="flex-1 bg-background p-2 overflow-hidden">
            <div className="h-full border border-border rounded-2xl overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-muted-foreground/30 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-muted-foreground/50">
              <div className="max-w-4xl mx-auto p-8 pt-14">{children}</div>
            </div>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}
