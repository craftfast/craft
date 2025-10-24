"use client";

import { useCreditBalance } from "@/hooks/useCreditBalance";
import { useState, useRef, useEffect } from "react";

interface TokenCounterProps {
  onClickAction?: () => void;
}

export default function TokenCounter({ onClickAction }: TokenCounterProps) {
  const { balance } = useCreditBalance();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  if (!balance) return null;

  // Format credits for display (e.g., 1,234,567 -> "1.23M" or 5,000 -> "5K")
  const formatCredits = (credits: number): string => {
    if (credits >= 1000000) {
      return `${(credits / 1000000).toFixed(2)}M`;
    } else if (credits >= 1000) {
      return `${(credits / 1000).toFixed(1)}K`;
    }
    return credits.toString();
  };

  // Format full number with commas
  const formatFullNumber = (num: number): string => {
    return num.toLocaleString();
  };

  // Determine if tokens are low (less than 10k)
  const isLowTokens =
    balance && balance.totalAvailable > 0 && balance.totalAvailable < 10000;

  // Determine if tokens are exhausted
  const isTokensExhausted = balance && balance.totalAvailable === 0;

  return (
    <div className="relative" ref={dropdownRef}>
      <div
        className={`px-3 py-1.5 rounded-full border flex items-center gap-1.5 cursor-pointer transition-colors ${
          isTokensExhausted
            ? "bg-red-50 dark:bg-red-950 border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900"
            : isLowTokens
            ? "bg-amber-50 dark:bg-amber-950 border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900"
            : "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-700"
        }`}
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
      >
        <svg
          className="w-3.5 h-3.5 flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          {isTokensExhausted || isLowTokens ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          )}
        </svg>
        <span className="text-xs font-medium whitespace-nowrap">
          {isTokensExhausted
            ? "0 tokens"
            : formatCredits(balance.totalAvailable)}
        </span>
        <svg
          className={`w-3 h-3 flex-shrink-0 transition-transform ${
            isDropdownOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>

      {/* Dropdown Menu */}
      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-lg z-50 overflow-hidden">
          {/* Token Balance Section */}
          <div className="p-4 border-b border-neutral-200 dark:border-neutral-800">
            <div className="mb-3">
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">
                Total Balance
              </p>
              <p
                className={`text-2xl font-bold ${
                  isTokensExhausted
                    ? "text-red-700 dark:text-red-300"
                    : isLowTokens
                    ? "text-amber-700 dark:text-amber-300"
                    : "text-neutral-900 dark:text-neutral-100"
                }`}
              >
                {formatFullNumber(balance.totalAvailable)}
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                tokens available
              </p>
            </div>

            {/* Token Breakdown */}
            <div className="space-y-2 pt-3 border-t border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-neutral-500 dark:text-neutral-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="text-sm text-neutral-700 dark:text-neutral-300">
                    Monthly Tokens
                  </span>
                </div>
                <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  {formatFullNumber(balance.subscriptionTokensRemaining)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-neutral-500 dark:text-neutral-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                    />
                  </svg>
                  <span className="text-sm text-neutral-700 dark:text-neutral-300">
                    Purchased Tokens
                  </span>
                </div>
                <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  {formatFullNumber(balance.purchasedTokensRemaining)}
                </span>
              </div>
            </div>
          </div>

          {/* Actions Section */}
          <div className="p-2 space-y-1">
            <button
              onClick={() => {
                setIsDropdownOpen(false);
                // TODO: Implement redeem code functionality
                console.log("Redeem code clicked");
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
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
                  d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
                />
              </svg>
              <span>Redeem Code</span>
            </button>

            <button
              onClick={() => {
                setIsDropdownOpen(false);
                onClickAction?.();
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-white bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200 rounded-lg transition-colors"
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
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              <span>Buy Tokens</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
