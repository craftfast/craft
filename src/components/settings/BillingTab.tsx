"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PRO_TIERS } from "@/lib/pricing-constants";
import { toast } from "sonner";
import type { BillingTabProps } from "./types";

export function BillingTab({
  isLoadingBilling,
  isAutoTriggeringCheckout,
  subscriptionData,
  creditBalanceData,
  subscriptionHistory,
  selectedProTierIndex,
  setSelectedProTierIndex,
  isPurchasing,
  updateUrlParams,
  handleOpenEmbeddedCheckout,
  fetchBillingData,
}: BillingTabProps) {
  return (
    <div className="space-y-6">
      {isLoadingBilling || isAutoTriggeringCheckout ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-neutral-200 dark:border-neutral-800 border-t-neutral-900 dark:border-t-neutral-100 rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-sm text-muted-foreground">
              {isAutoTriggeringCheckout
                ? "Preparing checkout for your selected tier..."
                : "Loading billing information..."}
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Current Plan */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Current Plan
            </h3>
            <div className="space-y-6">
              {/* Plan Details */}
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-base font-semibold text-foreground">
                    {subscriptionData?.plan.displayName || "Hobby"}
                  </h4>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    ${subscriptionData?.plan.priceMonthlyUsd || 0}
                    <span className="text-sm font-normal text-muted-foreground">
                      /mo
                    </span>
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {subscriptionData?.plan.monthlyCredits
                      ? `Includes ${
                          subscriptionData.plan.monthlyCredits
                        } credit${
                          subscriptionData.plan.monthlyCredits > 1 ? "s" : ""
                        } per month.`
                      : "Custom credit allocation."}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 text-xs font-semibold rounded-full ${
                    subscriptionData?.status === "active"
                      ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                      : "bg-secondary text-secondary-foreground"
                  }`}
                >
                  {subscriptionData?.status === "active"
                    ? "Active"
                    : subscriptionData?.status || "Unknown"}
                </span>
              </div>

              {/* Monthly Credit Balance */}
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">
                      Monthly Credits
                    </span>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Resets in {creditBalanceData?.monthly.daysUntilReset || 0}{" "}
                      days
                    </p>
                  </div>
                  <span className="text-2xl font-bold text-foreground">
                    {(creditBalanceData?.monthly.remaining || 0).toFixed(2)}{" "}
                    <span className="text-base text-muted-foreground font-normal">
                      / {(creditBalanceData?.monthly.limit || 0).toFixed(2)}
                    </span>
                  </span>
                </div>
                <div className="w-full h-2 relative rounded-full overflow-hidden">
                  <div
                    className="bg-neutral-700 dark:bg-neutral-300 h-full rounded-full transition-all"
                    style={{
                      width: `${
                        creditBalanceData &&
                        (creditBalanceData.monthly.limit ?? 0) > 0
                          ? ((creditBalanceData.monthly.remaining ?? 0) /
                              creditBalanceData.monthly.limit) *
                            100
                          : 0
                      }%`,
                    }}
                  ></div>
                </div>
              </div>

              {/* Upgrade to Pro - Only for Hobby users */}
              {subscriptionData?.plan.name === "HOBBY" && (
                <div className="mt-6 pt-6 border-t border-border">
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="text-base font-semibold text-foreground">
                      Upgrade to Pro
                    </h3>
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-primary/10 text-primary">
                      Recommended
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Get more monthly credits and unlock unlimited projects
                  </p>
                  <div className="space-y-3">
                    <Select
                      value={selectedProTierIndex.toString()}
                      onValueChange={(value) => {
                        const tierIndex = parseInt(value);
                        setSelectedProTierIndex(tierIndex);
                        updateUrlParams({ tier: tierIndex });
                      }}
                    >
                      <SelectTrigger className="w-full rounded-full h-12 px-6 text-base bg-muted/50 border-input hover:bg-muted/70 transition-colors">
                        <SelectValue placeholder="Select a Pro tier" />
                      </SelectTrigger>
                      <SelectContent className="z-[100001] rounded-2xl max-h-[300px] overflow-y-auto">
                        {PRO_TIERS.map((tier, index) => (
                          <SelectItem
                            key={index}
                            value={index.toString()}
                            className="text-base py-3"
                          >
                            {tier.monthlyCredits} credits per month{" "}
                            <span className="text-muted-foreground">
                              - {tier.displayPrice}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Button
                      className="w-full rounded-full h-12 text-base font-semibold"
                      disabled={isPurchasing}
                      onClick={async () => {
                        const selectedTier = PRO_TIERS[selectedProTierIndex];
                        await handleOpenEmbeddedCheckout(
                          selectedTier.monthlyCredits
                        );
                      }}
                    >
                      {isPurchasing ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                          Processing...
                        </>
                      ) : (
                        `Upgrade - ${PRO_TIERS[selectedProTierIndex].displayPrice}`
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* Pro Plan Management */}
              {subscriptionData?.plan.name === "PRO" && (
                <div className="space-y-4 pt-6 border-t border-border">
                  <div className="flex items-center gap-3 pb-3">
                    <div className="h-px flex-1 bg-border"></div>
                    <h4 className="text-sm font-semibold text-foreground">
                      Manage Pro Plan
                    </h4>
                    <div className="h-px flex-1 bg-border"></div>
                  </div>

                  {/* Pro Plan Tier Switcher */}
                  <div className="space-y-3 bg-muted/30 p-5 rounded-2xl border border-border">
                    <Label
                      htmlFor="pro-tier-change"
                      className="text-sm font-medium"
                    >
                      Change Pro Tier
                    </Label>
                    <Select
                      value={selectedProTierIndex.toString()}
                      onValueChange={(value) => {
                        const tierIndex = parseInt(value);
                        setSelectedProTierIndex(tierIndex);
                        updateUrlParams({ tier: tierIndex });
                      }}
                    >
                      <SelectTrigger className="w-full rounded-full h-12 px-6 text-base bg-background border-input hover:bg-muted/50 transition-colors">
                        <SelectValue placeholder="Select a different tier" />
                      </SelectTrigger>
                      <SelectContent className="z-[100001] rounded-2xl max-h-[300px] overflow-y-auto">
                        {PRO_TIERS.map((tier, index) => (
                          <SelectItem
                            key={index}
                            value={index.toString()}
                            className="text-base py-3"
                          >
                            {tier.monthlyCredits} credits/month{" "}
                            <span className="text-muted-foreground">
                              - {tier.displayPrice}
                            </span>
                            {tier.monthlyCredits ===
                              subscriptionData?.plan.monthlyCredits &&
                              " (Current)"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Switch to a different Pro tier to adjust your monthly
                      credit allocation.
                    </p>

                    <Button
                      className="w-full rounded-full h-12 text-base font-semibold mt-4"
                      disabled={
                        isPurchasing ||
                        PRO_TIERS[selectedProTierIndex].monthlyCredits ===
                          subscriptionData?.plan.monthlyCredits
                      }
                      onClick={async () => {
                        const selectedTier = PRO_TIERS[selectedProTierIndex];
                        await handleOpenEmbeddedCheckout(
                          selectedTier.monthlyCredits
                        );
                      }}
                    >
                      {isPurchasing ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                          Processing...
                        </>
                      ) : PRO_TIERS[selectedProTierIndex].monthlyCredits ===
                        subscriptionData?.plan.monthlyCredits ? (
                        "Current Tier"
                      ) : (
                        `Change to ${PRO_TIERS[selectedProTierIndex].displayPrice}`
                      )}
                    </Button>
                  </div>

                  {/* Downgrade to Hobby */}
                  <div className="bg-muted/30 p-5 rounded-2xl border border-border">
                    <Button
                      variant="outline"
                      className="w-full rounded-full h-12 text-base"
                      onClick={async () => {
                        toast("Downgrade to Hobby plan?", {
                          description:
                            "This will take effect at the end of your billing period.",
                          action: {
                            label: "Confirm",
                            onClick: async () => {
                              try {
                                const res = await fetch(
                                  "/api/billing/change-plan",
                                  {
                                    method: "POST",
                                    headers: {
                                      "Content-Type": "application/json",
                                    },
                                    body: JSON.stringify({
                                      targetPlan: "HOBBY",
                                    }),
                                  }
                                );
                                const data = await res.json();
                                if (data.action === "scheduled_downgrade") {
                                  toast.success(data.message);
                                  fetchBillingData();
                                }
                              } catch (error) {
                                console.error("Error downgrading:", error);
                                toast.error(
                                  "Failed to downgrade. Please try again."
                                );
                              }
                            },
                          },
                        });
                      }}
                    >
                      Downgrade to Hobby
                    </Button>
                  </div>
                </div>
              )}

              {/* Enterprise Plan */}
              {subscriptionData?.plan.name === "ENTERPRISE" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 pb-3">
                    <div className="h-px flex-1 bg-border"></div>
                    <h4 className="text-sm font-semibold text-foreground">
                      Enterprise Plan
                    </h4>
                    <div className="h-px flex-1 bg-border"></div>
                  </div>
                  <div className="bg-muted/30 p-5 rounded-2xl border border-border">
                    <p className="text-sm text-muted-foreground text-center">
                      For plan changes, please contact sales@craft.fast
                    </p>
                  </div>
                </div>
              )}

              {/* Manage Subscription Button */}
              {(subscriptionData?.plan.name === "PRO" ||
                subscriptionData?.plan.name === "ENTERPRISE") && (
                <div className="mt-6 pt-6 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-3">
                    Manage your subscription: Cancel, update payment method, or
                    view billing history.
                  </p>
                  <Button
                    variant="outline"
                    className="w-full rounded-full h-12 text-base"
                    onClick={async () => {
                      try {
                        const response = await fetch("/api/billing/portal", {
                          method: "POST",
                        });
                        const data = await response.json();
                        if (response.ok) {
                          window.location.href = data.url;
                        }
                      } catch (error) {
                        console.error("Error opening billing portal:", error);
                      }
                    }}
                  >
                    Open Billing Portal
                  </Button>
                </div>
              )}

              {/* Cancellation Notice */}
              {subscriptionData?.cancelAtPeriodEnd && (
                <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    Your plan will change at the end of the current billing
                    period (
                    {new Date(
                      subscriptionData.currentPeriodEnd
                    ).toLocaleDateString()}
                    ).
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Subscription History */}
          {subscriptionHistory && (
            <div className="border-t border-border pt-6">
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Subscription Details
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Your current subscription information.
              </p>
              <div className="space-y-4">
                {/* Current Subscription Info */}
                {subscriptionHistory.currentSubscription && (
                  <div className="p-4 bg-muted/50 rounded-xl border border-input">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="text-sm font-semibold text-foreground">
                          {
                            subscriptionHistory.currentSubscription
                              .planDisplayName
                          }
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          Active since{" "}
                          {new Date(
                            subscriptionHistory.currentSubscription.createdAt
                          ).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="text-lg font-bold text-foreground">
                        $
                        {subscriptionHistory.currentSubscription.priceMonthlyUsd.toFixed(
                          2
                        )}
                        /mo
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        Current Period
                      </span>
                      <span className="text-foreground font-medium">
                        {new Date(
                          subscriptionHistory.currentSubscription.currentPeriodStart
                        ).toLocaleDateString()}{" "}
                        -{" "}
                        {new Date(
                          subscriptionHistory.currentSubscription.currentPeriodEnd
                        ).toLocaleDateString()}
                      </span>
                    </div>
                    {subscriptionHistory.currentSubscription
                      .cancelAtPeriodEnd && (
                      <div className="mt-3 pt-3 border-t border-border">
                        <p className="text-xs text-orange-600 dark:text-orange-400">
                          ⚠️ This subscription will be cancelled at the end of
                          the current period
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Recent Invoices */}
                {subscriptionHistory.invoices.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <h4 className="text-sm font-semibold text-foreground mb-2">
                      Recent Invoices
                    </h4>
                    {subscriptionHistory.invoices.slice(0, 3).map((invoice) => (
                      <div
                        key={invoice.id}
                        className="p-3 bg-muted/50 rounded-xl border border-input"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-foreground">
                              {invoice.invoiceNumber}
                            </span>
                            <span
                              className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                                invoice.status === "paid"
                                  ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                                  : invoice.status === "issued"
                                  ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                                  : "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-400"
                              }`}
                            >
                              {invoice.status}
                            </span>
                          </div>
                          <span className="text-sm font-bold text-foreground">
                            ${invoice.totalUsd.toFixed(2)}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(invoice.createdAt).toLocaleDateString()}
                          {invoice.paidAt && (
                            <span className="ml-2">
                              • Paid{" "}
                              {new Date(invoice.paidAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
