"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import Image from "next/image";

interface User {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

interface UserMenuProps {
  user: User;
  showDashboardLink?: boolean;
  className?: string;
}

export default function UserMenu({
  user,
  showDashboardLink = true,
  className = "",
}: UserMenuProps) {
  const router = useRouter();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/home" });
  };

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
          <div className="w-8 h-8 rounded-full overflow-hidden relative ring-2 ring-neutral-200 dark:ring-neutral-700">
            <Image
              src={user.image}
              alt={user.name || "User"}
              width={32}
              height={32}
              className="rounded-full object-cover"
            />
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-neutral-300 dark:bg-neutral-700 flex items-center justify-center text-sm font-semibold ring-2 ring-neutral-200 dark:ring-neutral-700">
            {user.name?.[0]?.toUpperCase() ||
              user.email?.[0]?.toUpperCase() ||
              "U"}
          </div>
        )}
      </button>

      {/* Dropdown Menu */}
      {isUserMenuOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-neutral-800 rounded-xl shadow-lg border border-neutral-200 dark:border-neutral-700 py-2 z-[101]">
          <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-700">
            <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate">
              {user.name || "User"}
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
              {user.email}
            </p>
          </div>
          <div className="py-1">
            {showDashboardLink && (
              <button
                onClick={() => {
                  setIsUserMenuOpen(false);
                  router.push("/dashboard");
                }}
                className="w-full px-4 py-2 text-left text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 flex items-center gap-2"
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
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
                Dashboard
              </button>
            )}
            <button
              onClick={() => {
                setIsUserMenuOpen(false);
                router.push("/pricing");
              }}
              className="w-full px-4 py-2 text-left text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 flex items-center gap-2"
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
              Credits & Billing
            </button>
            <button
              onClick={() => {
                setIsUserMenuOpen(false);
                router.push("/help");
              }}
              className="w-full px-4 py-2 text-left text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 flex items-center gap-2"
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
              Help & Support
            </button>
          </div>
          <div className="border-t border-neutral-200 dark:border-neutral-700 py-1">
            <button
              onClick={handleSignOut}
              className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 flex items-center gap-2"
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
