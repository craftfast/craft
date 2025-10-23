"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useSession } from "next-auth/react";
import UserMenu from "./UserMenu";
import Logo from "./Logo";
import TokenCounter from "./TokenCounter";
import { useCreditBalance } from "@/hooks/useCreditBalance";
import PricingModal from "./PricingModal";

interface DashboardHeaderProps {
  planName?: string;
  userId?: string;
  userSubscription?: {
    plan: {
      name: string;
      displayName: string;
    };
  } | null;
  showLogoText?: boolean;
}

export default function DashboardHeader({
  planName,
  showLogoText = false,
}: DashboardHeaderProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [pricingModalMode, setPricingModalMode] = useState<
    "all" | "tokens" | "pro"
  >("all");
  const { balance } = useCreditBalance(); // Only for mobile menu detailed breakdown

  const showPlanBadge =
    planName === "HOBBY" || planName === "PRO" || planName === "AGENT";

  // Format credits for display (only for mobile menu)
  const formatCredits = (credits: number): string => {
    if (credits >= 1000000) {
      return `${(credits / 1000000).toFixed(2)}M`;
    } else if (credits >= 1000) {
      return `${(credits / 1000).toFixed(1)}K`;
    }
    return credits.toString();
  };

  // Determine if tokens are low (less than 10k) - for mobile menu
  const isLowTokens =
    balance && balance.totalAvailable > 0 && balance.totalAvailable < 10000;

  // Determine if tokens are exhausted - for mobile menu
  const isTokensExhausted = balance && balance.totalAvailable === 0;

  // Get plan display name and styling
  const getPlanBadgeInfo = () => {
    if (planName === "HOBBY") {
      return {
        displayName: "Hobby",
        className:
          "px-2 py-1 leading-tight text-xs font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-full border border-neutral-200 dark:border-neutral-700",
      };
    } else if (planName === "PRO") {
      return {
        displayName: "Pro",
        className:
          "px-2 py-1 leading-tight text-xs font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-full border border-neutral-200 dark:border-neutral-700",
      };
    } else if (planName === "AGENT") {
      return {
        displayName: "Agent",
        className:
          "px-2 py-1 leading-tight text-xs font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-full border border-neutral-200 dark:border-neutral-700",
      };
    }
    return null;
  };

  const planBadgeInfo = getPlanBadgeInfo();

  return (
    <>
      {/* Desktop Header - 3 column grid */}
      <div className="hidden lg:grid lg:grid-cols-3 lg:gap-4 lg:items-center w-full">
        {/* Left column - Logo and Plan Badge */}
        <div className="flex items-center gap-2">
          <Logo
            variant={showLogoText ? "extended" : "icon"}
            className="text-white dark:text-white"
            href="/dashboard"
          />
          {showPlanBadge && planBadgeInfo && (
            <span className={planBadgeInfo.className}>
              {planBadgeInfo.displayName}
            </span>
          )}
        </div>
        {/* Center column - Upgrade button */}
        <div className="flex items-center justify-center">
          {planName === "HOBBY" && (
            <button
              onClick={() => {
                setPricingModalMode("pro");
                setIsPricingModalOpen(true);
              }}
              className="flex items-center leading-tight gap-2 px-4 py-2 text-sm font-medium text-white bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200 rounded-full transition-colors shadow-sm"
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
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              <span className="whitespace-nowrap">Upgrade to Pro</span>
            </button>
          )}
        </div>
        {/* Right column - Actions and user menu */}
        <div className="flex items-center gap-2 justify-end">
          <TokenCounter
            onClickAction={() => {
              setPricingModalMode(planName === "PRO" ? "tokens" : "all");
              setIsPricingModalOpen(true);
            }}
          />
          {session?.user && (
            <UserMenu user={session.user} showDashboardLink={false} />
          )}
        </div>
      </div>

      {/* Tablet Header */}
      <div className="hidden md:flex lg:hidden items-center justify-between w-full">
        <div className="flex items-center gap-3">
          <Logo
            variant={showLogoText ? "extended" : "icon"}
            className="text-white dark:text-white"
            href="/dashboard"
          />
          {showPlanBadge && planBadgeInfo && (
            <span className={planBadgeInfo.className}>
              {planBadgeInfo.displayName}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {planName === "HOBBY" && (
            <button
              onClick={() => {
                setPricingModalMode("pro");
                setIsPricingModalOpen(true);
              }}
              className="flex items-center leading-tight gap-2 px-3 py-2 text-sm font-medium text-white bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200 rounded-full transition-colors shadow-sm"
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
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              <span className="hidden xl:inline">Upgrade to Pro</span>
            </button>
          )}
          <TokenCounter
            onClickAction={() => {
              setPricingModalMode(planName === "PRO" ? "tokens" : "all");
              setIsPricingModalOpen(true);
            }}
          />
          {session?.user && (
            <UserMenu user={session.user} showDashboardLink={false} />
          )}
        </div>
      </div>

      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between w-full">
        <div className="flex items-center gap-2">
          <Logo
            variant={showLogoText ? "extended" : "icon"}
            className="text-white dark:text-white"
            href="/dashboard"
          />
          {showPlanBadge && planBadgeInfo && (
            <span className={planBadgeInfo.className}>
              {planBadgeInfo.displayName}
            </span>
          )}
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
        <div className="md:hidden fixed top-16 left-0 right-0 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 shadow-lg z-50 max-h-[calc(100vh-4rem)] overflow-y-auto">
          <nav className="flex flex-col p-4 space-y-2">
            {session?.user && (
              <>
                <div className="px-4 py-3 bg-neutral-50 dark:bg-neutral-800 rounded-xl mb-2">
                  <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
                    {session.user.name}
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                    {session.user.email}
                  </p>
                  {balance && (
                    <div className="mt-2 pt-2 border-t border-neutral-200 dark:border-neutral-700">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-neutral-600 dark:text-neutral-400">
                          Total Credits
                        </span>
                        <span
                          className={`text-xs font-semibold ${
                            isTokensExhausted
                              ? "text-red-700 dark:text-red-300"
                              : isLowTokens
                              ? "text-amber-700 dark:text-amber-300"
                              : "text-neutral-900 dark:text-neutral-100"
                          }`}
                        >
                          {isTokensExhausted
                            ? "0 tokens"
                            : formatCredits(balance.totalAvailable)}
                          {isLowTokens && !isTokensExhausted && " ⚠️"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
                        <span>
                          Monthly:{" "}
                          {formatCredits(balance.subscriptionTokensRemaining)}
                        </span>
                        <span>
                          Purchased:{" "}
                          {formatCredits(balance.purchasedTokensRemaining)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => {
                    router.push("/dashboard");
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
                  <span>Dashboard</span>
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
                    setPricingModalMode("all");
                    setIsPricingModalOpen(true);
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
                {planName === "HOBBY" && (
                  <button
                    onClick={() => {
                      setPricingModalMode("pro");
                      setIsPricingModalOpen(true);
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
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                    <span>Upgrade to Pro</span>
                  </button>
                )}
                <div className="border-t border-neutral-200 dark:border-neutral-800 my-2" />
                <button
                  onClick={async () => {
                    const { signOut } = await import("next-auth/react");
                    await signOut({ callbackUrl: "/home" });
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

      {/* Pricing Modal */}
      <PricingModal
        isOpen={isPricingModalOpen}
        onClose={() => setIsPricingModalOpen(false)}
        currentPlan={planName}
        showTokensOnly={pricingModalMode === "tokens"}
        showProOnly={pricingModalMode === "pro"}
      />
    </>
  );
}
