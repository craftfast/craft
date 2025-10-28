"use client";

import { useCreditBalance } from "@/hooks/useCreditBalance";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";

interface CreditCounterProps {
  onClickAction?: () => void;
}

export default function CreditCounter({ onClickAction }: CreditCounterProps) {
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
  const formatCredits = (credits: number | null | undefined): string => {
    if (credits === null || credits === undefined) {
      return "0";
    }
    if (credits >= 1000000) {
      return `${(credits / 1000000).toFixed(2)}M`;
    } else if (credits >= 1000) {
      return `${(credits / 1000).toFixed(1)}K`;
    }
    return credits.toString();
  };

  // Format full number with commas
  const formatFullNumber = (num: number | null | undefined): string => {
    if (num === null || num === undefined) {
      return "0";
    }
    return num.toLocaleString();
  };

  // Determine if credits are low (less than 10k)
  const isLowCredits =
    balance && balance.totalAvailable > 0 && balance.totalAvailable < 10000;

  // Determine if credits are exhausted
  const isCreditsExhausted = balance && balance.totalAvailable === 0;

  return (
    <div className="relative" ref={dropdownRef}>
      <div
        className={`px-3 py-2 rounded-full border flex items-center gap-1.5 cursor-pointer transition-colors ${
          isCreditsExhausted
            ? "bg-red-50 dark:bg-red-950 border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900"
            : isLowCredits
            ? "bg-amber-50 dark:bg-amber-950 border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900"
            : "bg-accent text-accent-foreground border-border hover:bg-accent/80"
        }`}
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
      >
        <svg
          className="w-3.5 h-3.5 flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          {isCreditsExhausted || isLowCredits ? (
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
          {isCreditsExhausted
            ? "0 credits"
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
        <div className="absolute right-0 mt-2 w-72 bg-popover border border-border rounded-xl shadow-lg z-50 overflow-hidden">
          {/* Credit Balance Section */}
          <div className="p-4 border-b border-neutral-200 dark:border-neutral-800">
            <div className="mb-3">
              <p className="text-xs text-muted-foreground mb-1">
                Available Today
              </p>
              <p
                className={`text-2xl font-bold ${
                  isCreditsExhausted
                    ? "text-red-700 dark:text-red-300"
                    : isLowCredits
                    ? "text-amber-700 dark:text-amber-300"
                    : "text-foreground"
                }`}
              >
                {formatFullNumber(balance.totalAvailable)}
              </p>
              <p className="text-xs text-muted-foreground">credits remaining</p>
            </div>

            {/* Credit Info */}
            <div className="space-y-2 pt-3 border-t border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-muted-foreground"
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
                  <span className="text-sm text-accent-foreground">
                    Daily Limit
                  </span>
                </div>
                <span className="text-sm font-medium text-foreground">
                  {formatFullNumber(balance.subscriptionTokensRemaining)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-muted-foreground"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  <span className="text-sm text-accent-foreground">
                    Resets Daily
                  </span>
                </div>
                <span className="text-sm font-medium text-muted-foreground">
                  12:00 AM UTC
                </span>
              </div>
            </div>
          </div>

          {/* Actions Section */}
          <div className="p-2 space-y-1">
            <Button
              onClick={() => {
                setIsDropdownOpen(false);
                onClickAction?.();
              }}
              className="w-full rounded-lg"
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
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                />
              </svg>
              <span>Upgrade Plan</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
