"use client";

import { useState } from "react";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Check, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PRO_TIERS } from "@/lib/pricing-constants";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface BillingPageProps {
  currentPlan?: string;
  currentCredits?: number;
}

export default function BillingPage({
  currentPlan = "HOBBY",
  currentCredits = 0,
}: BillingPageProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [selectedCredits, setSelectedCredits] = useState(500);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [isOpeningPortal, setIsOpeningPortal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedTier =
    PRO_TIERS.find((tier) => tier.monthlyCredits === selectedCredits) ||
    PRO_TIERS[0];

  const isOnPro = currentPlan === "PRO";
  const isCurrentTier = isOnPro && currentCredits === selectedCredits;

  const handleCheckout = async () => {
    if (!session?.user) {
      router.push("/auth/signin");
      return;
    }

    setIsCheckingOut(true);
    setError(null);

    try {
      // Create checkout session
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          monthlyCredits: selectedCredits,
          embedOrigin: window.location.origin,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create checkout session");
      }

      // Redirect to Polar checkout
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err) {
      console.error("Checkout error:", err);
      setError(err instanceof Error ? err.message : "Failed to start checkout");
      setIsCheckingOut(false);
    }
  };

  const handleManageSubscription = async () => {
    if (!session?.user) {
      router.push("/auth/signin");
      return;
    }

    setIsOpeningPortal(true);
    setError(null);

    try {
      const response = await fetch("/api/billing/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          returnUrl: `${window.location.origin}/billing`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to open customer portal");
      }

      // Redirect to Polar customer portal
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

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Choose Your Plan
        </h1>
        <p className="text-muted-foreground">
          Select a monthly credit allocation that fits your needs
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Plans Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Hobby Plan */}
        <div
          className={`relative rounded-2xl border-2 p-6 transition-all ${
            currentPlan === "HOBBY"
              ? "border-neutral-900 dark:border-neutral-100 bg-neutral-50 dark:bg-neutral-900"
              : "border-neutral-300 dark:border-neutral-700"
          }`}
        >
          {currentPlan === "HOBBY" && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="bg-neutral-900 dark:bg-neutral-100 text-neutral-50 dark:text-neutral-900 text-xs font-semibold px-3 py-1 rounded-full">
                Current Plan
              </span>
            </div>
          )}

          <div className="mb-6">
            <h2 className="text-2xl font-bold text-foreground mb-2">Hobby</h2>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold text-foreground">$0</span>
              <span className="text-muted-foreground">/month</span>
            </div>
          </div>

          <ul className="space-y-3 mb-6">
            <li className="flex items-start gap-3">
              <Check className="w-5 h-5 flex-shrink-0 mt-0.5 text-neutral-900 dark:text-neutral-100" />
              <span className="text-sm text-foreground">
                100 credits per month
              </span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="w-5 h-5 flex-shrink-0 mt-0.5 text-neutral-900 dark:text-neutral-100" />
              <span className="text-sm text-foreground">Up to 3 projects</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="w-5 h-5 flex-shrink-0 mt-0.5 text-neutral-900 dark:text-neutral-100" />
              <span className="text-sm text-foreground">
                AI-powered chat interface
              </span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="w-5 h-5 flex-shrink-0 mt-0.5 text-neutral-900 dark:text-neutral-100" />
              <span className="text-sm text-foreground">
                Live preview environment
              </span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="w-5 h-5 flex-shrink-0 mt-0.5 text-neutral-900 dark:text-neutral-100" />
              <span className="text-sm text-foreground">Community support</span>
            </li>
          </ul>

          <Button
            variant="outline"
            className="w-full rounded-full h-12"
            disabled={currentPlan === "HOBBY"}
          >
            {currentPlan === "HOBBY" ? "Current Plan" : "Downgrade"}
          </Button>
        </div>

        {/* Pro Plan */}
        <div className="relative rounded-2xl border-2 border-neutral-900 dark:border-neutral-100 p-6 bg-neutral-50 dark:bg-neutral-900">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <span className="bg-neutral-900 dark:bg-neutral-100 text-neutral-50 dark:text-neutral-900 text-xs font-semibold px-3 py-1 rounded-full">
              Popular
            </span>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-bold text-foreground mb-2">Pro</h2>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold text-foreground">
                {selectedTier.displayPrice}
              </span>
              <span className="text-muted-foreground">/month</span>
            </div>
          </div>

          {/* Tier Selector */}
          <div className="mb-6">
            <label className="text-sm font-medium text-foreground mb-2 block">
              Monthly Credits
            </label>
            <Select
              value={selectedCredits.toString()}
              onValueChange={(value) => setSelectedCredits(parseInt(value))}
            >
              <SelectTrigger className="w-full rounded-full h-11 bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-600">
                <SelectValue>
                  {selectedCredits.toLocaleString()} credits / month
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="rounded-xl border-neutral-200 dark:border-neutral-700">
                {PRO_TIERS.map((tier) => (
                  <SelectItem
                    key={tier.monthlyCredits}
                    value={tier.monthlyCredits.toString()}
                    className="rounded-lg cursor-pointer"
                  >
                    {tier.monthlyCredits.toLocaleString()} credits / month (
                    {tier.displayPrice})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <ul className="space-y-3 mb-6">
            <li className="flex items-start gap-3">
              <Check className="w-5 h-5 flex-shrink-0 mt-0.5 text-neutral-900 dark:text-neutral-100" />
              <span className="text-sm text-foreground">
                {selectedCredits.toLocaleString()} credits per month
              </span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="w-5 h-5 flex-shrink-0 mt-0.5 text-neutral-900 dark:text-neutral-100" />
              <span className="text-sm text-foreground">
                Unlimited projects
              </span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="w-5 h-5 flex-shrink-0 mt-0.5 text-neutral-900 dark:text-neutral-100" />
              <span className="text-sm text-foreground">Priority support</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="w-5 h-5 flex-shrink-0 mt-0.5 text-neutral-900 dark:text-neutral-100" />
              <span className="text-sm text-foreground">No Craft branding</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="w-5 h-5 flex-shrink-0 mt-0.5 text-neutral-900 dark:text-neutral-100" />
              <span className="text-sm text-foreground">Advanced features</span>
            </li>
          </ul>

          <Button
            className="w-full rounded-full h-12 bg-neutral-900 dark:bg-neutral-100 text-neutral-50 dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200"
            onClick={handleCheckout}
            disabled={isCheckingOut || isCurrentTier}
          >
            {isCheckingOut ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : isCurrentTier ? (
              "Current Tier"
            ) : isOnPro ? (
              "Change Tier"
            ) : (
              "Upgrade to Pro"
            )}
          </Button>
        </div>
      </div>

      {/* Manage Subscription Section (for existing Pro users) */}
      {isOnPro && (
        <div className="border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-foreground mb-2">
            Manage Your Subscription
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            Access the customer portal to cancel your subscription, update
            payment methods, view billing history, and download invoices.
          </p>
          <Button
            variant="outline"
            className="rounded-full h-12 gap-2"
            onClick={handleManageSubscription}
            disabled={isOpeningPortal}
          >
            {isOpeningPortal ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Opening Portal...
              </>
            ) : (
              <>
                <ExternalLink className="w-4 h-4" />
                Open Customer Portal
              </>
            )}
          </Button>
        </div>
      )}

      {/* Feature Comparison */}
      <div className="border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden">
        <div className="bg-neutral-50 dark:bg-neutral-900 px-6 py-4">
          <h2 className="text-xl font-bold text-foreground">
            Feature Comparison
          </h2>
        </div>
        <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
          {[
            { name: "Monthly Credits", hobby: "100", pro: "500-100,000" },
            { name: "Projects", hobby: "Up to 3", pro: "Unlimited" },
            { name: "AI Chat Interface", hobby: "✓", pro: "✓" },
            { name: "Live Preview", hobby: "✓", pro: "✓" },
            { name: "Deploy to Vercel", hobby: "✓", pro: "✓" },
            { name: "Supabase Integration", hobby: "✓", pro: "✓" },
            { name: "Support", hobby: "Community", pro: "Priority" },
            { name: "Craft Branding", hobby: "✓", pro: "—" },
          ].map((feature) => (
            <div
              key={feature.name}
              className="grid grid-cols-3 gap-4 px-6 py-4"
            >
              <div className="text-sm font-medium text-foreground">
                {feature.name}
              </div>
              <div className="text-sm text-center text-muted-foreground">
                {feature.hobby}
              </div>
              <div className="text-sm text-center text-foreground font-medium">
                {feature.pro}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-foreground">
          Frequently Asked Questions
        </h2>
        <div className="space-y-3">
          <details className="group border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden">
            <summary className="px-6 py-4 font-medium text-foreground cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-900">
              What happens if I exceed my monthly credits?
            </summary>
            <div className="px-6 pb-4 text-sm text-muted-foreground">
              When you reach your monthly credit limit, you can either upgrade
              to a higher tier or wait until your credits reset at the start of
              the next billing period.
            </div>
          </details>
          <details className="group border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden">
            <summary className="px-6 py-4 font-medium text-foreground cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-900">
              Can I change my Pro tier mid-month?
            </summary>
            <div className="px-6 pb-4 text-sm text-muted-foreground">
              Yes! You can upgrade or downgrade your Pro tier at any time.
              Upgrades take effect immediately, while downgrades take effect at
              the start of your next billing period.
            </div>
          </details>
          <details className="group border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden">
            <summary className="px-6 py-4 font-medium text-foreground cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-900">
              What payment methods do you accept?
            </summary>
            <div className="px-6 pb-4 text-sm text-muted-foreground">
              We accept all major credit cards (Visa, MasterCard, American
              Express) and other payment methods through our secure payment
              processor, Polar.
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}
