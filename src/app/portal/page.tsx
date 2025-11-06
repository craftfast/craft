"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import {
  Loader2,
  ExternalLink,
  CreditCard,
  FileText,
  XCircle,
  Calendar,
  DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface SubscriptionData {
  hasSubscription: boolean;
  subscription?: {
    planName: string;
    status: string;
    currentPeriodEnd: Date;
    cancelAtPeriodEnd: boolean;
    cancelledAt: Date | null;
    priceMonthlyUsd: number;
    monthlyCredits: number;
  };
}

export default function CustomerPortalPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isOpeningPortal, setIsOpeningPortal] = useState(false);
  const [subscriptionData, setSubscriptionData] =
    useState<SubscriptionData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.user) {
      router.push("/auth/signin");
      return;
    }

    // Fetch subscription details
    fetchSubscriptionData();
  }, [session, router]);

  const fetchSubscriptionData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/billing/subscription");
      const data = await response.json();

      if (response.ok) {
        setSubscriptionData({
          hasSubscription: !!data.plan,
          subscription: data.plan
            ? {
                planName: data.plan.displayName,
                status: data.status,
                currentPeriodEnd: new Date(data.currentPeriodEnd),
                cancelAtPeriodEnd: data.cancelAtPeriodEnd,
                cancelledAt: null,
                priceMonthlyUsd: data.plan.priceMonthlyUsd,
                monthlyCredits: data.plan.monthlyCredits,
              }
            : undefined,
        });
      }
    } catch (err) {
      console.error("Error fetching subscription:", err);
      setError("Failed to load subscription details");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenPortal = async () => {
    setIsOpeningPortal(true);
    setError(null);

    try {
      const response = await fetch("/api/billing/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          returnUrl: `${window.location.origin}/portal`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to open customer portal");
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No portal URL returned");
      }
    } catch (err) {
      console.error("Portal error:", err);
      setError(
        err instanceof Error ? err.message : "Failed to open customer portal"
      );
      setIsOpeningPortal(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-neutral-500" />
          <p className="text-muted-foreground">
            Loading subscription details...
          </p>
        </div>
      </div>
    );
  }

  if (!subscriptionData?.hasSubscription) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto p-6">
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>No Active Subscription</CardTitle>
              <CardDescription>
                You don&apos;t have an active subscription yet
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Subscribe to a Pro plan to access the customer portal and manage
                your billing settings.
              </p>
              <Button
                onClick={() => router.push("/billing")}
                className="rounded-full"
              >
                View Plans
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const subscription = subscriptionData.subscription!;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Subscription Management
          </h1>
          <p className="text-muted-foreground">
            Manage your subscription, billing, and payment settings
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {/* Current Subscription */}
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>Current Plan</CardTitle>
            <CardDescription>Your active subscription details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-200 dark:border-neutral-800">
              <div>
                <h3 className="text-xl font-bold text-foreground">
                  {subscription.planName}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {subscription.monthlyCredits?.toLocaleString() || 0} credits
                  per month
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-foreground">
                  ${subscription.priceMonthlyUsd.toFixed(2)}
                </div>
                <div className="text-sm text-muted-foreground">/month</div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 mt-0.5 text-neutral-500" />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Next Billing Date
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {subscription.currentPeriodEnd.toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <DollarSign className="w-5 h-5 mt-0.5 text-neutral-500" />
                <div>
                  <p className="text-sm font-medium text-foreground">Status</p>
                  <p className="text-sm text-muted-foreground capitalize">
                    {subscription.status.toLowerCase()}
                  </p>
                </div>
              </div>
            </div>

            {subscription.cancelAtPeriodEnd && (
              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  Your subscription will be cancelled at the end of the current
                  billing period (
                  {subscription.currentPeriodEnd.toLocaleDateString()}).
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Portal Actions */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="rounded-2xl hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-neutral-900 dark:text-neutral-100" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">
                    Payment Method
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Update your card details
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-neutral-900 dark:text-neutral-100" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">
                    Billing History
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    View past invoices
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-neutral-900 dark:text-neutral-100" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">
                    Cancel Subscription
                  </h3>
                  <p className="text-xs text-muted-foreground">End your plan</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Portal Access */}
        <Card className="rounded-2xl border-2 border-neutral-900 dark:border-neutral-100">
          <CardHeader>
            <CardTitle>Customer Portal</CardTitle>
            <CardDescription>
              Access the secure Polar customer portal to manage all aspects of
              your subscription
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-neutral-900 dark:text-neutral-100" />
                Update payment method and billing information
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-neutral-900 dark:text-neutral-100" />
                View and download all invoices
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-neutral-900 dark:text-neutral-100" />
                Cancel or modify your subscription
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-neutral-900 dark:text-neutral-100" />
                View complete billing history
              </li>
            </ul>

            <Button
              className="w-full rounded-full h-12 bg-neutral-900 dark:bg-neutral-100 text-neutral-50 dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200"
              onClick={handleOpenPortal}
              disabled={isOpeningPortal}
            >
              {isOpeningPortal ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Opening Portal...
                </>
              ) : (
                <>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open Customer Portal
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Back to Billing */}
        <div className="text-center">
          <Button
            variant="outline"
            onClick={() => router.push("/billing")}
            className="rounded-full"
          >
            Back to Billing
          </Button>
        </div>
      </div>
    </div>
  );
}

function Check({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 13l4 4L19 7"
      />
    </svg>
  );
}
