"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { useSession, signOut } from "@/lib/auth-client";
import UserMenu from "./UserMenu";
import Logo from "./Logo";
import CreditCounter from "./CreditCounter";
import { useCreditBalance } from "@/hooks/useCreditBalance";
import SettingsModal from "./SettingsModal";

interface DashboardHeaderProps {
  userId?: string;
  showLogoText?: boolean;
}

export default function DashboardHeader({
  showLogoText = false,
}: DashboardHeaderProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<
    | "general"
    | "billing"
    | "usage"
    | "account"
    | "integrations"
    | "personalization"
    | "referrals"
  >("general");
  const { balance } = useCreditBalance(); // Only for mobile menu detailed breakdown

  // Check URL parameters to auto-open settings modal with specific tab
  useEffect(() => {
    const settings = searchParams.get("settings");
    const tab = searchParams.get("tab");

    if (settings === "true") {
      if (
        tab &&
        [
          "general",
          "billing",
          "usage",
          "account",
          "integrations",
          "personalization",
          "referrals",
        ].includes(tab)
      ) {
        setSettingsTab(tab as typeof settingsTab);
      }
      setIsSettingsOpen(true);
    }
  }, [searchParams]);

  // Format credits for display (only for mobile menu)
  const formatCredits = (credits: number): string => {
    if (credits >= 1000000) {
      return `$${(credits / 1000000).toFixed(2)}M`;
    } else if (credits >= 1000) {
      return `$${(credits / 1000).toFixed(2)}K`;
    }
    return `$${credits.toFixed(2)}`;
  };

  // Determine if tokens are low (10 or less) - for mobile menu
  const isLowTokens =
    balance && balance.totalAvailable > 0 && balance.totalAvailable <= 10;

  // Determine if tokens are exhausted - for mobile menu
  const isTokensExhausted = balance && balance.totalAvailable === 0;

  return (
    <>
      {/* Desktop Header - 3 column grid */}
      <div className="hidden lg:grid lg:grid-cols-3 lg:gap-4 lg:items-center w-full">
        {/* Left column - Logo */}
        <div className="flex items-center gap-3">
          <Logo
            variant={showLogoText ? "extended" : "icon"}
            className="!h-5"
            href="/chat"
          />
        </div>
        {/* Center column - Empty */}
        <div className="flex items-center justify-center">
          {/* Upgrade button removed */}
        </div>
        {/* Right column - Actions and user menu */}
        <div className="flex items-center gap-2 justify-end">
          <CreditCounter
            onClickAction={() => {
              // Open settings modal to billing tab
              setSettingsTab("billing");
              setIsSettingsOpen(true);
            }}
          />
          {session?.user && <UserMenu user={session.user} />}
        </div>
      </div>

      {/* Tablet Header */}
      <div className="hidden md:flex lg:hidden items-center justify-between w-full">
        <div className="flex items-center gap-3">
          <Logo
            variant={showLogoText ? "extended" : "icon"}
            className="!h-5"
            href="/chat"
          />
        </div>
        <div className="flex items-center gap-2">
          <CreditCounter
            onClickAction={() => {
              // Open settings modal to billing tab
              setSettingsTab("billing");
              setIsSettingsOpen(true);
            }}
          />
          {session?.user && <UserMenu user={session.user} />}
        </div>
      </div>

      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between w-full">
        <div className="flex items-center gap-2">
          <Logo
            variant={showLogoText ? "extended" : "icon"}
            className="!h-5"
            href="/chat"
          />
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors"
          aria-label="Toggle menu"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {isMobileMenuOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed top-16 left-0 right-0 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 shadow-lg z-[40] max-h-[calc(100vh-4rem)] overflow-y-auto">
          <nav className="flex flex-col p-4 space-y-2">
            {session?.user && (
              <>
                <div className="px-4 py-3 bg-neutral-50 dark:bg-neutral-800 rounded-xl mb-2">
                  <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
                    {session.user.name}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                      {session.user.email}
                    </p>
                    {(
                      session.user as {
                        hasPassword?: boolean;
                        emailVerified?: boolean;
                      }
                    ).hasPassword &&
                      !(
                        session.user as {
                          hasPassword?: boolean;
                          emailVerified?: boolean;
                        }
                      ).emailVerified && (
                        <span
                          className="shrink-0 flex items-center justify-center w-4 h-4 rounded-full bg-yellow-500/20 border border-yellow-500/40"
                          title="Email not verified"
                        >
                          <svg
                            className="w-2.5 h-2.5 text-yellow-600 dark:text-yellow-500"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </span>
                      )}
                  </div>
                  {balance && (
                    <div className="mt-2 pt-2 border-t border-neutral-200 dark:border-neutral-700">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-neutral-600 dark:text-neutral-400">
                          Total Credits
                        </span>
                        <span
                          className={`text-xs font-semibold ${
                            isTokensExhausted
                              ? "text-red-600 dark:text-red-400"
                              : "text-neutral-900 dark:text-neutral-100"
                          }`}
                        >
                          {isTokensExhausted
                            ? "$0.00 credits"
                            : formatCredits(balance.totalAvailable)}
                        </span>
                      </div>
                      <div className="text-xs text-neutral-500 dark:text-neutral-400">
                        <span>
                          Monthly credits:{" "}
                          {formatCredits(balance.subscriptionCreditsRemaining)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => {
                    router.push("/");
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors text-left"
                >
                  <svg
                    className="w-4 h-4 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                    />
                  </svg>
                  <span>Chat</span>
                </button>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    // Placeholder for new project action
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors text-left"
                >
                  <svg
                    className="w-4 h-4 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  <span>New Project</span>
                </button>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    // Placeholder for search action
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors text-left"
                >
                  <svg
                    className="w-4 h-4 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <span>Search</span>
                </button>
                <button
                  onClick={() => {
                    setIsSettingsOpen(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors text-left"
                >
                  <svg
                    className="w-4 h-4 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>Tokens & Billing</span>
                </button>
                <button
                  onClick={() => {
                    router.push("/help");
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors text-left"
                >
                  <svg
                    className="w-4 h-4 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>Help & Support</span>
                </button>
                <div className="border-t border-neutral-200 dark:border-neutral-800 my-2" />
                <button
                  onClick={async () => {
                    await signOut();
                    router.push("/");
                    setIsMobileMenuOpen(false);
                  }}
                  className="px-4 py-2.5 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl border border-neutral-300 dark:border-neutral-600 transition-colors text-left"
                >
                  Sign out
                </button>
              </>
            )}
          </nav>
        </div>
      )}

      {/* Settings Modal (for billing/tier changes) */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => {
          setIsSettingsOpen(false);
          // Clear URL parameters when closing
          const url = new URL(window.location.href);
          url.searchParams.delete("settings");
          url.searchParams.delete("tab");
          url.searchParams.delete("payment");
          window.history.replaceState({}, "", url.toString());
        }}
        initialTab={settingsTab}
      />
    </>
  );
}
