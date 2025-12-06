"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-client";
import Image from "next/image";
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
        </div>
      )}
    </div>
  );
}
