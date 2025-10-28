"use client";

import { useState, useEffect } from "react";
import { Check, ExternalLink, X } from "lucide-react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan?: string;
  targetPlan?: "HOBBY" | "PRO" | "ENTERPRISE"; // The plan user clicked to upgrade to
}

type PlanType = "HOBBY" | "PRO" | "ENTERPRISE";

export default function SubscriptionModal({
  isOpen,
  onClose,
  currentPlan = "HOBBY",
  targetPlan,
}: SubscriptionModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<PlanType>(
    targetPlan || (currentPlan as PlanType) || "HOBBY"
  );

  // Update selected tab when modal opens with a targetPlan
  useEffect(() => {
    if (isOpen && targetPlan) {
      setSelectedTab(targetPlan);
    }
  }, [isOpen, targetPlan]);

  if (!isOpen) return null;

  const isOnHobby = currentPlan === "HOBBY";
  const isOnPro = currentPlan === "PRO";
  const isOnEnterprise = currentPlan === "ENTERPRISE";

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

  const plans = {
    HOBBY: {
      name: "Hobby",
      price: "$0",
      period: "/month",
      features: [
        "100K AI tokens per month",
        "Up to 3 projects",
        "AI code generation",
        "Live preview",
        "Community support",
      ],
    },
    PRO: {
      name: "Pro",
      price: "$50",
      period: "/month",
      features: [
        "10M AI tokens per month",
        "Unlimited projects",
        "Buy tokens at $5/1M",
        "Priority support",
        "No Craft branding",
        "Advanced features",
      ],
    },
    ENTERPRISE: {
      name: "Enterprise",
      price: "Contact Sales",
      period: "",
      features: [
        "Custom AI token allocation",
        "Unlimited projects",
        "Dedicated account manager",
        "Priority support & SLA",
        "Custom integrations",
        "Advanced security",
      ],
    },
  };

  const currentPlanDisplay = currentPlan === "HOBBY" ? "Hobby" : currentPlan;

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={onClose}>
      <DialogPrimitive.Portal>
        {/* Modal overlay */}
        <DialogPrimitive.Overlay className="fixed inset-0 z-[60] bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

        {/* Modal content */}
        <DialogPrimitive.Content
          className={cn(
            "fixed left-[50%] top-[50%] z-[61] flex flex-col w-full max-w-2xl translate-x-[-50%] translate-y-[-50%] border bg-background shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 rounded-2xl max-h-[90vh] overflow-hidden p-0"
          )}
        >
          {/* Close button */}
          <DialogPrimitive.Close className="absolute right-4 top-4 z-10 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>

          {/* Header */}
          <div className="px-6 pt-6 pb-4 border-b">
            <DialogPrimitive.Title className="text-2xl font-semibold leading-none tracking-tight">
              Explore More Plans
            </DialogPrimitive.Title>
            <DialogPrimitive.Description className="text-sm text-muted-foreground mt-2">
              You are currently on the {currentPlanDisplay} plan. Upgrade or
              start a new plan for monthly credit limits.
            </DialogPrimitive.Description>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-4">
            {/* Error Display */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                <p className="text-sm text-red-700 dark:text-red-300">
                  {error}
                </p>
              </div>
            )}

            <Tabs
              value={selectedTab}
              onValueChange={(value) => setSelectedTab(value as PlanType)}
            >
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="HOBBY">Hobby</TabsTrigger>
                <TabsTrigger value="PRO">Pro</TabsTrigger>
                <TabsTrigger value="ENTERPRISE">Enterprise</TabsTrigger>
              </TabsList>

              {(["HOBBY", "PRO", "ENTERPRISE"] as PlanType[]).map((plan) => (
                <TabsContent key={plan} value={plan}>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        {plans[plan].name}
                      </CardTitle>
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold">
                          {plans[plan].price}
                        </span>
                        {plans[plan].period && (
                          <span className="text-muted-foreground">
                            {plans[plan].period}
                          </span>
                        )}
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <ul className="space-y-3">
                        {plans[plan].features.map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-3">
                            <Check className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            <span className="text-sm">{feature}</span>
                          </li>
                        ))}
                      </ul>

                      <Button
                        onClick={() => {
                          if (plan === "HOBBY") {
                            // Downgrade to Hobby
                            handleManageSubscription();
                          } else if (plan === "PRO") {
                            if (isOnHobby) {
                              handleUpgradeToPro();
                            } else if (isOnEnterprise) {
                              // Downgrade from Enterprise to Pro
                              handleManageSubscription();
                            } else {
                              handleManageSubscription();
                            }
                          } else if (plan === "ENTERPRISE") {
                            // Enterprise requires contacting sales
                            window.location.href =
                              "mailto:sales@craft.fast?subject=Enterprise Plan Inquiry";
                          }
                        }}
                        disabled={
                          isLoading ||
                          currentPlan === plan ||
                          plan === "ENTERPRISE"
                        }
                        className="w-full"
                        size="lg"
                      >
                        {isLoading
                          ? "Processing..."
                          : currentPlan === plan
                          ? "Current Plan"
                          : plan === "HOBBY" && (isOnPro || isOnEnterprise)
                          ? "Downgrade to Hobby"
                          : plan === "PRO" && isOnEnterprise
                          ? "Downgrade to Pro"
                          : plan === "PRO" && isOnHobby
                          ? "Upgrade to Pro"
                          : plan === "ENTERPRISE"
                          ? "Contact Sales"
                          : "Manage Subscription"}
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>
              ))}
            </Tabs>

            {/* Footer Link */}
            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Compare plans and options on our{" "}
                <a
                  href="/pricing"
                  className="text-foreground hover:underline inline-flex items-center gap-1"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  pricing page
                  <ExternalLink className="w-3 h-3" />
                </a>
                .
              </p>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
