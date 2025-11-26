"use client";

import { useCreditBalance } from "@/hooks/useCreditBalance";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import CreditIcon from "@/components/CreditIcon";

interface CreditCounterProps {
  onClickAction?: () => void;
}

export default function CreditCounter({ onClickAction }: CreditCounterProps) {
  const { balance } = useCreditBalance();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [, setCurrentTime] = useState(Date.now());

  // Update time every minute to keep the reset countdown fresh
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

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

  // Format full number with commas
  const formatFullNumber = (num: number | null | undefined): string => {
    if (num === null || num === undefined) {
      return "$0.00";
    }
    return `$${num.toFixed(2)}`;
  };

  // Calculate time until billing period end
  // Note: periodEnd is not currently tracked in the pay-as-you-go model
  const getTimeUntilReset = (): string => {
    // In pay-as-you-go model, there's no period reset
    return "No expiry";
  };

  // Determine if credits are low (10 or less)
  const isLowCredits =
    balance && balance.totalAvailable > 0 && balance.totalAvailable <= 10;

  // Determine if credits are exhausted
  const isCreditsExhausted = balance && balance.totalAvailable === 0;

  return (
    <div className="relative" ref={dropdownRef}>
      <div
        className="px-3 py-2 rounded-full border bg-neutral-100 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 flex items-center gap-1.5 cursor-pointer transition-colors hover:bg-neutral-200 dark:hover:bg-neutral-700"
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
      >
        <CreditIcon className="w-3.5 h-3.5 flex-shrink-0" />
        <span
          className={`text-xs font-medium whitespace-nowrap ${
            isCreditsExhausted
              ? "text-red-600 dark:text-red-400"
              : "text-neutral-700 dark:text-neutral-300"
          }`}
        >
          {isCreditsExhausted ? "$0.00" : formatCredits(balance.totalAvailable)}
        </span>
        <svg
          className={`w-3 h-3 flex-shrink-0 text-neutral-600 dark:text-neutral-400 transition-transform ${
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
              <p
                className={`text-2xl font-bold ${
                  isCreditsExhausted
                    ? "text-red-600 dark:text-red-400"
                    : "text-foreground"
                }`}
              >
                {formatFullNumber(balance.totalAvailable)}
              </p>
              <p className="text-xs text-muted-foreground">credits remaining</p>
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
                  d="M12 4v16m8-8H4"
                />
              </svg>
              <span>Top Up Credits</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
