"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-client";
import Image from "next/image";
import FeedbackModal from "./FeedbackModal";
import { useTheme } from "@/contexts/ThemeContext";
import { useChatPosition } from "@/contexts/ChatPositionContext";
import { useCreditBalance } from "@/contexts/CreditBalanceContext";

interface User {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  emailVerified?: boolean; // Better Auth uses boolean instead of Date
  hasPassword?: boolean;
}

interface UserMenuProps {
  user: User;
  className?: string;
}

export default function UserMenu({ user, className = "" }: UserMenuProps) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { chatPosition, setChatPosition } = useChatPosition();
  const { balance, isLoading } = useCreditBalance();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  // Format credits for display (e.g., 1,234,567 -> "$1.23M" or 5,000 -> "$5.00K")
  const formatCredits = (credits: number | null | undefined): string => {
    if (credits === null || credits === undefined) {
      return "$0.00";
    }
    if (credits >= 1000000) {
      return `$${(credits / 1000000).toFixed(2)}M`;
    } else if (credits >= 1000) {
      return `$${(credits / 1000).toFixed(2)}K`;
    }
    return `$${credits.toFixed(2)}`;
  };

  // Determine if credits are low (10 or less)
  const isLowCredits =
    balance && balance.totalAvailable > 0 && balance.totalAvailable <= 10;

  // Determine if credits are exhausted
  const isCreditsExhausted = balance && balance.totalAvailable === 0;

  // Handle click outside to close menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    if (isUserMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isUserMenuOpen]);

  return (
    <div ref={menuRef} className={`relative ${className}`}>
      <button
        onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
        className="flex items-center justify-center hover:opacity-80 transition-opacity"
        aria-label="User menu"
      >
        {user.image ? (
          <div className="w-8 h-8 rounded-full overflow-hidden relative ring-2 ring-border">
            <Image
              src={user.image}
              alt={user.name || "User"}
              width={32}
              height={32}
              className="rounded-full object-cover"
            />
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-semibold ring-2 ring-border">
            {user.name?.[0]?.toUpperCase() ||
              user.email?.[0]?.toUpperCase() ||
              "U"}
          </div>
        )}
      </button>

      {/* Dropdown Menu */}
      {isUserMenuOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-popover rounded-xl shadow-lg border border-border z-[50]">
          <div className="px-4 py-2 border-b border-border">
            <p className="text-sm font-semibold text-popover-foreground truncate">
              {user.name || "User"}
            </p>
            <div className="flex items-center gap-1.5">
              <p className="text-xs text-muted-foreground truncate">
                {user.email}
              </p>
              {user.hasPassword && !user.emailVerified && (
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
          </div>

          <div className="py-1">
            <button
              onClick={() => {
                setIsUserMenuOpen(false);
                router.push("/projects");
              }}
              className="w-full px-4 py-2 text-left text-sm text-popover-foreground hover:bg-accent hover:text-accent-foreground flex items-center gap-2"
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
                  d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                />
              </svg>
              Projects
            </button>

            <button
              onClick={() => {
                setIsUserMenuOpen(false);
                router.push("/integrations");
              }}
              className="w-full px-4 py-2 text-left text-sm text-popover-foreground hover:bg-accent hover:text-accent-foreground flex items-center gap-2"
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
                  d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z"
                />
              </svg>
              Integrations
            </button>

            <button
              onClick={() => {
                setIsUserMenuOpen(false);
                router.push("/pricing");
              }}
              className="w-full px-4 py-2 text-left text-sm text-popover-foreground hover:bg-accent hover:text-accent-foreground flex items-center gap-2"
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
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Pricing
            </button>

            <button
              onClick={() => {
                setIsUserMenuOpen(false);
                setIsFeedbackModalOpen(true);
              }}
              className="w-full px-4 py-2 text-left text-sm text-popover-foreground hover:bg-accent hover:text-accent-foreground flex items-center gap-2"
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
                  d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Feedback
            </button>

            <button
              onClick={() => {
                setIsUserMenuOpen(false);
                router.push("/settings");
              }}
              className="w-full px-4 py-2 text-left text-sm text-popover-foreground hover:bg-accent hover:text-accent-foreground flex items-center gap-2"
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
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              Settings
            </button>
          </div>

          <div className="border-t border-border"></div>

          {/* Credits Section */}
          <div className="px-4 py-3 border-b border-border space-y-2.5">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-popover-foreground">Credits</span>
              {!isLoading && balance && (
                <span
                  className={`text-sm font-semibold ${
                    isCreditsExhausted
                      ? "text-red-600 dark:text-red-400"
                      : isLowCredits
                      ? "text-yellow-600 dark:text-yellow-400"
                      : "text-muted-foreground"
                  }`}
                >
                  {formatCredits(balance.totalAvailable)}
                </span>
              )}
              {isLoading && (
                <span className="text-sm text-muted-foreground">...</span>
              )}
            </div>
            <button
              onClick={() => {
                setIsUserMenuOpen(false);
                router.push("/settings/billing");
              }}
              className="w-full px-3 py-1.5 text-xs font-medium bg-accent hover:bg-accent/80 text-accent-foreground rounded-lg transition-colors flex items-center justify-center gap-1.5"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              Add Credits
            </button>
          </div>

          {/* Theme & Chat Selectors */}
          <div className="px-4 py-3 border-b border-border space-y-2.5">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-popover-foreground">Theme</span>
              <div className="flex gap-1">
                <button
                  onClick={() => setTheme("light")}
                  className={`p-1.5 rounded-lg transition-colors ${
                    theme === "light"
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-accent/50 text-muted-foreground"
                  }`}
                  title="Light"
                >
                  <svg
                    className="w-3.5 h-3.5"
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
                </button>
                <button
                  onClick={() => setTheme("dark")}
                  className={`p-1.5 rounded-lg transition-colors ${
                    theme === "dark"
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-accent/50 text-muted-foreground"
                  }`}
                  title="Dark"
                >
                  <svg
                    className="w-3.5 h-3.5"
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
                </button>
                <button
                  onClick={() => setTheme("system")}
                  className={`p-1.5 rounded-lg transition-colors ${
                    theme === "system"
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-accent/50 text-muted-foreground"
                  }`}
                  title="System"
                >
                  <svg
                    className="w-3.5 h-3.5"
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
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-popover-foreground">Chat</span>
              <div className="flex gap-1">
                <button
                  onClick={() => setChatPosition("left")}
                  className={`px-2.5 py-1.5 text-xs rounded-lg transition-colors ${
                    chatPosition === "left"
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-accent/50 text-muted-foreground"
                  }`}
                >
                  Left
                </button>
                <button
                  onClick={() => setChatPosition("right")}
                  className={`px-2.5 py-1.5 text-xs rounded-lg transition-colors ${
                    chatPosition === "right"
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-accent/50 text-muted-foreground"
                  }`}
                >
                  Right
                </button>
              </div>
            </div>
          </div>

          <div className="border-t border-border py-1">
            <button
              onClick={handleSignOut}
              className="w-full px-4 py-2 text-left text-sm text-popover-foreground hover:bg-accent hover:text-accent-foreground flex items-center gap-2"
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
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              Sign Out
            </button>
          </div>

          {/* Social Links */}
          <div className="px-4 py-2 border-t border-border">
            <div className="flex gap-2">
              <a
                href="https://x.com/craftdotfast"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setIsUserMenuOpen(false)}
                className="p-2 text-muted-foreground hover:text-popover-foreground hover:bg-accent rounded-lg transition-colors"
                title="X (Twitter)"
              >
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a
                href="https://discord.gg/YvPKxcCV"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setIsUserMenuOpen(false)}
                className="p-2 text-muted-foreground hover:text-popover-foreground hover:bg-accent rounded-lg transition-colors"
                title="Discord"
              >
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" />
                </svg>
              </a>
              <a
                href="https://linkedin.com/company/craftfast"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setIsUserMenuOpen(false)}
                className="p-2 text-muted-foreground hover:text-popover-foreground hover:bg-accent rounded-lg transition-colors"
                title="LinkedIn"
              >
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>
              <a
                href="https://github.com/craftfast"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setIsUserMenuOpen(false)}
                className="p-2 text-muted-foreground hover:text-popover-foreground hover:bg-accent rounded-lg transition-colors"
                title="GitHub"
              >
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
              </a>
              <a
                href="https://www.youtube.com/channel/UCImqQGc8t8t0koAsw7pscnQ"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setIsUserMenuOpen(false)}
                className="p-2 text-muted-foreground hover:text-popover-foreground hover:bg-accent rounded-lg transition-colors"
                title="YouTube"
              >
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      {isFeedbackModalOpen && (
        <FeedbackModal
          isOpen={isFeedbackModalOpen}
          onClose={() => setIsFeedbackModalOpen(false)}
        />
      )}
    </div>
  );
}
