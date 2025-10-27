"use client";

import { useState } from "react";
import { X, Sparkles, Zap, Check } from "lucide-react";

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan?: string;
}

export default function SubscriptionModal({
  isOpen,
  onClose,
  currentPlan = "HOBBY",
}: SubscriptionModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const isOnHobby = currentPlan === "HOBBY";
  const isOnPro = currentPlan === "PRO";
  const isOnAgent = currentPlan === "AGENT";

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

  const handleManageSubscription = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/billing/portal", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to open billing portal");
      }

      window.location.href = data.url;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to open billing portal"
      );
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4 min-h-screen">
      <div
        className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex-shrink-0 px-6 py-5 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-50">
                Choose Your Plan
              </h2>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                Select the plan that best fits your needs
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
        <div className="flex-1 overflow-y-auto px-6 py-6 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-neutral-300 dark:[&::-webkit-scrollbar-thumb]:bg-neutral-700 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-neutral-400 dark:[&::-webkit-scrollbar-thumb]:hover:bg-neutral-600">
          {/* Error Display */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          {/* Plans Grid */}
          <div className="grid md:grid-cols-2 gap-5">
            {/* Hobby Plan */}
            <div className="border border-neutral-200 dark:border-neutral-700 rounded-2xl p-6 bg-neutral-50/50 dark:bg-neutral-800/50">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-neutral-300 dark:bg-neutral-600 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
                </div>
                <div>
                  <h4 className="text-base font-semibold text-neutral-900 dark:text-neutral-50">
                    Hobby
                  </h4>
                </div>
              </div>

              <div className="flex items-baseline gap-1 mb-5">
                <span className="text-3xl font-bold text-neutral-900 dark:text-neutral-50">
                  Free
                </span>
              </div>

              <ul className="space-y-2.5 mb-6">
                <li className="flex items-start gap-2 text-sm text-neutral-700 dark:text-neutral-300">
                  <Check className="w-4 h-4 flex-shrink-0 text-neutral-500 mt-0.5" />
                  <span>100K AI tokens per month</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-neutral-700 dark:text-neutral-300">
                  <Check className="w-4 h-4 flex-shrink-0 text-neutral-500 mt-0.5" />
                  <span>Up to 3 projects</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-neutral-700 dark:text-neutral-300">
                  <Check className="w-4 h-4 flex-shrink-0 text-neutral-500 mt-0.5" />
                  <span>AI-powered code generation</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-neutral-700 dark:text-neutral-300">
                  <Check className="w-4 h-4 flex-shrink-0 text-neutral-500 mt-0.5" />
                  <span>Community support</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-neutral-500 dark:text-neutral-500 line-through">
                  <X className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>Purchase additional tokens</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-neutral-500 dark:text-neutral-500 line-through">
                  <X className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>Remove Craft branding</span>
                </li>
              </ul>

              <button
                disabled={currentPlan === "HOBBY"}
                className="w-full px-4 py-2.5 bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-full font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {currentPlan === "HOBBY" ? "Current Plan" : "Downgrade"}
              </button>
            </div>

            {/* Pro Plan */}
            <div className="border-2 border-neutral-900 dark:border-neutral-100 rounded-2xl p-6 bg-neutral-50/50 dark:bg-neutral-800/50 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-xs font-semibold rounded-full">
                Most Popular
              </div>

              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-neutral-900 dark:bg-neutral-100 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-white dark:text-neutral-900" />
                </div>
                <div>
                  <h4 className="text-base font-semibold text-neutral-900 dark:text-neutral-50">
                    Pro
                  </h4>
                </div>
              </div>

              <div className="flex items-baseline gap-1 mb-5">
                <span className="text-3xl font-bold text-neutral-900 dark:text-neutral-50">
                  $50
                </span>
                <span className="text-sm text-neutral-500 dark:text-neutral-400">
                  /month
                </span>
              </div>

              <ul className="space-y-2.5 mb-6">
                <li className="flex items-start gap-2 text-sm text-neutral-700 dark:text-neutral-300">
                  <Check className="w-4 h-4 flex-shrink-0 text-neutral-900 dark:text-neutral-100 mt-0.5" />
                  <span className="font-medium">10M AI tokens per month</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-neutral-700 dark:text-neutral-300">
                  <Check className="w-4 h-4 flex-shrink-0 text-neutral-900 dark:text-neutral-100 mt-0.5" />
                  <span className="font-medium">Unlimited projects</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-neutral-700 dark:text-neutral-300">
                  <Check className="w-4 h-4 flex-shrink-0 text-neutral-900 dark:text-neutral-100 mt-0.5" />
                  <span>Purchase additional tokens at $5/1M</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-neutral-700 dark:text-neutral-300">
                  <Check className="w-4 h-4 flex-shrink-0 text-neutral-900 dark:text-neutral-100 mt-0.5" />
                  <span>Priority support</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-neutral-700 dark:text-neutral-300">
                  <Check className="w-4 h-4 flex-shrink-0 text-neutral-900 dark:text-neutral-100 mt-0.5" />
                  <span>Remove Craft branding</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-neutral-700 dark:text-neutral-300">
                  <Check className="w-4 h-4 flex-shrink-0 text-neutral-900 dark:text-neutral-100 mt-0.5" />
                  <span>All future features</span>
                </li>
              </ul>

              <button
                onClick={
                  isOnHobby ? handleUpgradeToPro : handleManageSubscription
                }
                disabled={isLoading}
                className="w-full px-4 py-2.5 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-full font-medium hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {isLoading
                  ? "Processing..."
                  : isOnPro
                  ? "Current Plan"
                  : isOnAgent
                  ? "Downgrade to Pro"
                  : "Upgrade to Pro"}
              </button>
            </div>
          </div>

          {/* Manage Subscription for existing customers */}
          {(isOnPro || isOnAgent) && (
            <div className="mt-6 p-4 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-xl">
              <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-3">
                � <strong>Manage your subscription:</strong> Cancel, update
                payment method, or view billing history.
              </p>
              <button
                onClick={handleManageSubscription}
                disabled={isLoading}
                className="w-full px-4 py-2 bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 rounded-full text-sm font-medium hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-all disabled:opacity-50"
              >
                Open Billing Portal
              </button>
            </div>
          )}

          {/* Info for Hobby users */}
          {isOnHobby && (
            <div className="mt-6 p-4 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-xl">
              <p className="text-xs text-neutral-600 dark:text-neutral-400">
                💡 <strong>Note:</strong> All plans include access to our
                AI-powered code generation, live preview, and deployment
                features. Pro plans get significantly more AI tokens and can
                purchase additional tokens as needed.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
