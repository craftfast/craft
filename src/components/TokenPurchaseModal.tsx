"use client";

import { useState, useEffect } from "react";
import { Sparkles, AlertCircle, Zap, Info } from "lucide-react";
import { getCreditTiers } from "@/lib/pricing-constants";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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

  // Fix z-index for dialog overlay when component mounts
  useEffect(() => {
    if (isOpen) {
      // Find the dialog overlay and update its z-index
      const timer = setTimeout(() => {
        const overlays = document.querySelectorAll(
          "[data-radix-dialog-overlay]"
        );
        overlays.forEach((overlay) => {
          const htmlElement = overlay as HTMLElement;
          htmlElement.style.zIndex = "100000";
        });
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto z-[100000] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-muted-foreground/30">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Purchase AI Tokens
          </DialogTitle>
          <DialogDescription>
            Add more AI tokens to power your projects
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Hobby Plan Warning */}
          {isOnHobby ? (
            <Card className="border-2">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-neutral-900 dark:bg-neutral-100 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-white dark:text-neutral-900" />
                  </div>
                  <div>
                    <CardTitle>Upgrade to Purchase Tokens</CardTitle>
                    <CardDescription>
                      Token purchases are only available for Pro and Agent plans
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardDescription className="font-medium">
                      Pro Plan Benefits:
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <Sparkles className="w-4 h-4 flex-shrink-0 mt-0.5 text-muted-foreground" />
                      <span>10M AI tokens per month included</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Sparkles className="w-4 h-4 flex-shrink-0 mt-0.5 text-muted-foreground" />
                      <span>Purchase additional tokens at $5/1M</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Sparkles className="w-4 h-4 flex-shrink-0 mt-0.5 text-muted-foreground" />
                      <span>Unlimited projects</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Sparkles className="w-4 h-4 flex-shrink-0 mt-0.5 text-muted-foreground" />
                      <span>Priority support & no branding</span>
                    </div>
                  </CardContent>
                </Card>
                <Button
                  onClick={handleUpgradeToPro}
                  disabled={isLoading}
                  className="w-full rounded-full"
                  size="lg"
                >
                  {isLoading ? "Processing..." : "Upgrade to Pro - $50/month"}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Success Message */}
              <Alert>
                <Sparkles className="h-4 w-4" />
                <AlertDescription>
                  ✓ You can purchase additional tokens at any time. They never
                  expire within 1 year of purchase.
                </AlertDescription>
              </Alert>

              {/* Token Packages List */}
              <div className="space-y-3">
                <div>
                  <h3 className="text-base font-semibold mb-1">
                    Select Token Package
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Choose the number of tokens you'd like to purchase
                  </p>
                </div>

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
                    <Card
                      key={tier.tokens}
                      className="transition-all hover:border-primary hover:shadow-md"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="font-semibold text-lg mb-1">
                              {(tier.tokens / 1000000).toFixed(
                                tier.tokens >= 1000000 ? 0 : 1
                              )}
                              M tokens
                            </div>
                            <div className="flex items-baseline gap-2 mb-1">
                              <span className="text-2xl font-bold">
                                ${tier.price}
                              </span>
                              {savingsPercent > 0 && (
                                <span className="text-xs font-medium px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full">
                                  Save {savingsPercent}%
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              ${pricePerMillion} per 1M tokens
                            </div>
                          </div>
                          <Button
                            onClick={() => handlePurchaseTokens(tier.tokens)}
                            disabled={isLoading}
                            className="rounded-full px-6"
                            size="lg"
                          >
                            {isLoading ? "Processing..." : "Purchase"}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Token Expiration Disclaimer */}
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Important</AlertTitle>
                <AlertDescription>
                  Purchased tokens expire 1 year from purchase date if not used.
                  Tokens are non-refundable and non-transferable. See our{" "}
                  <a
                    href="/terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-foreground"
                  >
                    Terms of Service
                  </a>{" "}
                  for complete details.
                </AlertDescription>
              </Alert>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
