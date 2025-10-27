"use client";

import { useState } from "react";
import { X, Sparkles, AlertCircle, Zap } from "lucide-react";
import { getCreditTiers } from "@/lib/pricing-constants";

interface TokenPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan?: string;
}

export default function TokenPurchaseModal({
  isOpen,
  onClose,
  currentPlan = "HOBBY",
}: TokenPurchaseModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const creditTiers = getCreditTiers();

  // Determine if user can purchase tokens
  const isOnHobby = currentPlan === "HOBBY";
  const canPurchaseTokens = !isOnHobby; // Only Pro and Agent can purchase

  if (!isOpen) return null;

  const handlePurchaseTokens = async (tokens: number) => {
    if (!canPurchaseTokens) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/tokens/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tokens }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create checkout");
      }

      // Redirect to Polar checkout
      window.location.href = data.checkoutUrl;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to initiate purchase"
      );
      setIsLoading(false);
    }
  };

  const handleUpgradeToPro = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/billing/upgrade-to-pro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ billingPeriod: "MONTHLY" }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create checkout");
      }

      window.location.href = data.checkoutUrl;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to initiate upgrade"
      );
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4 min-h-screen">
      <div
        className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex-shrink-0 px-6 py-5 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-50">
                Purchase AI Tokens
              </h2>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                Add more AI tokens to power your projects
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors flex-shrink-0"
              disabled={isLoading}
            >
              <X className="w-5 h-5 text-neutral-500 dark:text-neutral-400" />
            </button>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-5 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-neutral-300 dark:[&::-webkit-scrollbar-thumb]:bg-neutral-700 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-neutral-400 dark:[&::-webkit-scrollbar-thumb]:hover:bg-neutral-600">
          {/* Error Display */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          {/* Hobby Plan Warning - Show upgrade prompt */}
          {isOnHobby && (
            <div className="mb-6">
              <div className="p-5 bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-800 dark:to-neutral-850 border-2 border-neutral-200 dark:border-neutral-700 rounded-2xl">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-neutral-900 dark:bg-neutral-100 flex items-center justify-center flex-shrink-0">
                    <Zap className="w-5 h-5 text-white dark:text-neutral-900" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-50 mb-1">
                      Upgrade to Purchase Tokens
                    </h3>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      Token purchases are only available for Pro and Agent
                      plans. Upgrade now to unlock the ability to purchase
                      additional AI tokens and access unlimited projects.
                    </p>
                  </div>
                </div>

                <div className="bg-white dark:bg-neutral-900 rounded-xl p-4 mb-4">
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-3 font-medium">
                    Pro Plan Benefits:
                  </p>
                  <ul className="space-y-2 text-sm text-neutral-700 dark:text-neutral-300">
                    <li className="flex items-start gap-2">
                      <Sparkles className="w-4 h-4 flex-shrink-0 mt-0.5 text-neutral-500" />
                      <span>10M AI tokens per month included</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Sparkles className="w-4 h-4 flex-shrink-0 mt-0.5 text-neutral-500" />
                      <span>Purchase additional tokens at $5/1M</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Sparkles className="w-4 h-4 flex-shrink-0 mt-0.5 text-neutral-500" />
                      <span>Unlimited projects</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Sparkles className="w-4 h-4 flex-shrink-0 mt-0.5 text-neutral-500" />
                      <span>Priority support & no branding</span>
                    </li>
                  </ul>
                </div>

                <button
                  onClick={handleUpgradeToPro}
                  disabled={isLoading}
                  className="w-full px-4 py-3 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-full font-medium hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-all text-sm disabled:opacity-50"
                >
                  {isLoading ? "Processing..." : "Upgrade to Pro - $50/month"}
                </button>
              </div>
            </div>
          )}

          {/* Token Packages Section */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-neutral-700 dark:text-neutral-300" />
              </div>
              <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-50">
                Additional Token Packages
              </h3>
            </div>

            {/* Success message for eligible users */}
            {canPurchaseTokens && (
              <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-green-700 dark:text-green-300 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-green-800 dark:text-green-200">
                  ✓ You can purchase additional tokens at any time. They never
                  expire within 1 year of purchase.
                </p>
              </div>
            )}

            {/* Warning for non-eligible users - shown inline with packages */}
            {!canPurchaseTokens && (
              <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-700 dark:text-amber-300 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  ⚠️ Token purchases are only available for Pro and Agent plans.
                  Please upgrade to Pro to unlock this feature.
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 gap-3">
              {creditTiers.map((tier) => {
                const pricePerMillion = (
                  tier.price /
                  (tier.tokens / 1000000)
                ).toFixed(2);
                const savingsPercent =
                  tier.tokens > 1000000
                    ? Math.round((1 - parseFloat(pricePerMillion) / 5) * 100)
                    : 0;

                return (
                  <div
                    key={tier.tokens}
                    className={`border border-neutral-200 dark:border-neutral-700 rounded-xl p-4 transition-all flex items-center justify-between ${
                      canPurchaseTokens
                        ? "hover:border-neutral-300 dark:hover:border-neutral-600"
                        : "opacity-50"
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-neutral-900 dark:text-neutral-50 mb-0.5">
                        {(tier.tokens / 1000000).toFixed(
                          tier.tokens >= 1000000 ? 0 : 1
                        )}
                        M tokens
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-xl font-bold text-neutral-900 dark:text-neutral-50">
                          ${tier.price}
                        </span>
                        {savingsPercent > 0 && (
                          <span className="text-xs font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-full">
                            Save {savingsPercent}%
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                        ${pricePerMillion} per 1M tokens
                      </div>
                    </div>
                    <button
                      onClick={() => handlePurchaseTokens(tier.tokens)}
                      disabled={isLoading || !canPurchaseTokens}
                      className="px-5 py-2 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-full text-sm font-medium hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                      {isLoading ? "..." : "Purchase"}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Token Expiration Disclaimer */}
            <div className="mt-4 p-3 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-lg">
              <p className="text-xs text-neutral-600 dark:text-neutral-400">
                ⏱️ <strong>Important:</strong> Purchased tokens expire 1 year
                from purchase date if not used. Tokens are non-refundable and
                non-transferable. See our{" "}
                <a
                  href="/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-neutral-900 dark:hover:text-neutral-200"
                >
                  Terms of Service
                </a>{" "}
                for complete details.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
