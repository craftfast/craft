"use client";

import { useCreditBalance } from "@/hooks/useCreditBalance";

interface TokenCounterProps {
  onClickAction?: () => void;
}

export default function TokenCounter({ onClickAction }: TokenCounterProps) {
  const { balance } = useCreditBalance();

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

  // Determine if tokens are low (less than 10k)
  const isLowTokens =
    balance && balance.totalAvailable > 0 && balance.totalAvailable < 10000;

  // Determine if tokens are exhausted
  const isTokensExhausted = balance && balance.totalAvailable === 0;

  return (
    <div
      className={`px-3 py-1.5 rounded-full border flex items-center gap-1.5 cursor-pointer transition-colors ${
        isTokensExhausted
          ? "bg-red-50 dark:bg-red-950 border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900"
          : isLowTokens
          ? "bg-amber-50 dark:bg-amber-950 border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900"
          : "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-700"
      }`}
      onClick={onClickAction}
      title={`Total: ${balance.totalAvailable.toLocaleString()} tokens\nMonthly: ${balance.subscriptionTokensRemaining.toLocaleString()} | Purchased: ${balance.purchasedTokensRemaining.toLocaleString()}`}
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
        {isTokensExhausted ? "0 tokens" : formatCredits(balance.totalAvailable)}
      </span>
    </div>
  );
}
