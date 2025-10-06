"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";
import HeaderNav from "@/components/HeaderNav";
import Footer from "@/components/Footer";
import CreditSelector from "@/components/CreditSelector";
import {
  initiateRazorpayPayment,
  verifyPayment,
  convertToSmallestUnit,
} from "@/lib/razorpay";
import {
  calculateTierPrice,
  getTierDisplayPrice,
  type BillingPeriod,
} from "@/lib/pricing-constants";

interface PlanFeature {
  text: string;
  included: boolean;
  highlight?: boolean;
}

interface PricingPlan {
  name: string;
  priceMonthly: string;
  priceYearly: string;
  description: string;
  features: PlanFeature[];
  cta: string;
  popular?: boolean;
  action: () => void;
  showCreditSelector?: boolean;
}

export default function PricingPage() {
  const router = useRouter();
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>("MONTHLY");
  const [proCredits, setProCredits] = useState(100);
  const [businessCredits, setBusinessCredits] = useState(100);

  const handleProPayment = async () => {
    const amount = calculateTierPrice("PRO", proCredits, billingPeriod);

    await initiateRazorpayPayment({
      amount: convertToSmallestUnit(amount),
      currency: "USD",
      name: "Craft Pro",
      description: `Pro Plan - ${proCredits} credits/month (${
        billingPeriod === "YEARLY" ? "Yearly" : "Monthly"
      })`,
      planName: "Pro",
      onSuccess: async (response) => {
        // Verify payment
        const isVerified = await verifyPayment(
          response.razorpay_order_id,
          response.razorpay_payment_id,
          response.razorpay_signature
        );

        if (isVerified) {
          alert("Payment successful! Welcome to Pro 🎉");
          router.push("/dashboard");
        } else {
          alert("Payment verification failed. Please contact support.");
        }
      },
      onFailure: (error) => {
        console.error("Payment failed:", error);
        alert("Payment failed. Please try again or contact support.");
      },
    });
  };

  const handleBusinessPayment = async () => {
    const amount = calculateTierPrice(
      "BUSINESS",
      businessCredits,
      billingPeriod
    );

    await initiateRazorpayPayment({
      amount: convertToSmallestUnit(amount),
      currency: "USD",
      name: "Craft Business",
      description: `Business Plan - ${businessCredits} credits/month (${
        billingPeriod === "YEARLY" ? "Yearly" : "Monthly"
      })`,
      planName: "Business",
      onSuccess: async (response) => {
        // Verify payment
        const isVerified = await verifyPayment(
          response.razorpay_order_id,
          response.razorpay_payment_id,
          response.razorpay_signature
        );

        if (isVerified) {
          alert("Payment successful! Welcome to Business 🎉");
          router.push("/dashboard");
        } else {
          alert("Payment verification failed. Please contact support.");
        }
      },
      onFailure: (error) => {
        console.error("Payment failed:", error);
        alert("Payment failed. Please try again or contact support.");
      },
    });
  };

  const plans: PricingPlan[] = [
    {
      name: "Free",
      priceMonthly: "$0",
      priceYearly: "$0",
      description: "Perfect for getting started and trying out Craft",
      cta: "Get Started Free",
      action: () => router.push("/auth/signup"),
      showCreditSelector: false,
      features: [
        {
          text: "20 credits per month",
          included: true,
          highlight: true,
        },
        {
          text: "Max 5 credits per day",
          included: true,
          highlight: false,
        },
        { text: "AI-powered app building", included: true },
        { text: "Up to 3 projects", included: true },
        { text: "Deploy to Vercel", included: true },
        { text: "Import from Figma", included: true },
        { text: "GitHub sync", included: true },
        { text: "0.5GB database storage", included: true },
        { text: "Community support", included: true },
        { text: "Credit rollover", included: false },
        { text: "Custom domain", included: false },
        { text: "Private projects", included: false },
        { text: "Priority support", included: false },
      ],
    },
    {
      name: "Pro",
      priceMonthly: getTierDisplayPrice("PRO", proCredits, "MONTHLY"),
      priceYearly: getTierDisplayPrice("PRO", proCredits, "YEARLY"),
      description: "Designed for fast-moving teams building in real time",
      cta: "Start Pro",
      popular: true,
      action: handleProPayment,
      showCreditSelector: true,
      features: [
        { text: "Everything in Free, plus:", included: true, highlight: true },
        {
          text: `${proCredits.toLocaleString()} credits per month`,
          included: true,
          highlight: true,
        },
        {
          text: "No daily limits - use freely",
          included: true,
          highlight: true,
        },
        { text: "Credit rollover", included: true },
        { text: "Unlimited projects", included: true },
        { text: "Custom domains", included: true },
        { text: "Private projects", included: true },
        { text: "Remove Craft branding", included: true },
        { text: "5GB database storage", included: true },
        { text: "Priority support", included: true },
      ],
    },
    {
      name: "Business",
      priceMonthly: getTierDisplayPrice("BUSINESS", businessCredits, "MONTHLY"),
      priceYearly: getTierDisplayPrice("BUSINESS", businessCredits, "YEARLY"),
      description: "Advanced controls for growing departments",
      cta: "Start Business",
      action: handleBusinessPayment,
      showCreditSelector: true,
      features: [
        { text: "All features in Pro, plus:", included: true, highlight: true },
        {
          text: `${businessCredits.toLocaleString()} credits per month`,
          included: true,
          highlight: true,
        },
        {
          text: "No daily limits - use freely",
          included: true,
          highlight: true,
        },
        { text: "SSO authentication", included: true },
        { text: "Opt out of data training", included: true },
        { text: "20GB database storage", included: true },
        { text: "Priority support", included: true },
      ],
    },
    {
      name: "Enterprise",
      priceMonthly: "Custom",
      priceYearly: "Custom",
      description: "Built for large orgs needing flexibility & scale",
      cta: "Contact Sales",
      showCreditSelector: false,
      action: () => {
        window.location.href =
          "mailto:sales@craft.tech?subject=Enterprise Plan Inquiry";
      },
      features: [
        {
          text: "Everything in Business, plus:",
          included: true,
          highlight: true,
        },
        {
          text: "Custom credit allocation",
          included: true,
          highlight: true,
        },
        { text: "Dedicated support team", included: true },
        { text: "Onboarding services", included: true },
        { text: "Custom integrations", included: true },
        { text: "Group-based access control", included: true },
        { text: "Custom design systems", included: true },
        { text: "SLA guarantees", included: true },
        { text: "Unlimited database storage", included: true },
        { text: "Advanced analytics", included: true },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header - Fixed */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md">
        <div className="px-3 sm:px-4 py-2">
          <div className="relative flex items-center justify-between">
            <Logo iconClassName="text-white dark:text-white" href="/" />
            <HeaderNav />
          </div>
        </div>
      </header>

      {/* Main Content with padding to account for fixed header */}
      <main className="pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Section */}
          <div className="text-center py-12 sm:py-16">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4">
              Simple, transparent pricing
            </h1>
            <p className="text-lg text-neutral-600 dark:text-neutral-400 max-w-3xl mx-auto">
              Start for free. Upgrade to get the capacity that exactly matches
              your needs.
            </p>

            {/* Billing Period Toggle */}
            <div className="mt-8 flex flex-col items-center gap-4">
              <div className="inline-flex items-center bg-neutral-100 dark:bg-neutral-800 rounded-full p-1 border border-neutral-200 dark:border-neutral-700">
                <button
                  onClick={() => setBillingPeriod("MONTHLY")}
                  className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    billingPeriod === "MONTHLY"
                      ? "bg-neutral-900 dark:bg-neutral-100 text-neutral-50 dark:text-neutral-900 shadow-sm"
                      : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100"
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingPeriod("YEARLY")}
                  className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    billingPeriod === "YEARLY"
                      ? "bg-neutral-900 dark:bg-neutral-100 text-neutral-50 dark:text-neutral-900 shadow-sm"
                      : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100"
                  }`}
                >
                  Yearly
                </button>
              </div>
              {billingPeriod === "YEARLY" && (
                <div className="inline-flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                  <svg
                    className="w-4 h-4"
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
                  <span className="font-medium">
                    Save ~17% with yearly billing
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl border-2 transition-all duration-300 hover:shadow-xl flex flex-col ${
                  plan.popular
                    ? "bg-neutral-50 dark:bg-neutral-800/50 border-neutral-900 dark:border-neutral-100 shadow-md"
                    : "bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700"
                }`}
              >
                <div className="p-6 sm:p-8 flex flex-col flex-grow">
                  {/* Plan Header */}
                  <div className="mb-6">
                    <h3 className="text-xl font-bold text-foreground mb-2">
                      {plan.name}
                    </h3>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      {plan.description}
                    </p>
                  </div>

                  {/* Price */}
                  <div className="mb-6">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold text-foreground">
                        {billingPeriod === "YEARLY"
                          ? plan.priceYearly
                          : plan.priceMonthly}
                      </span>
                      {plan.name !== "Enterprise" && (
                        <span className="text-neutral-600 dark:text-neutral-400">
                          {billingPeriod === "YEARLY" ? "/year" : "/month"}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* CTA Button */}
                  <button
                    onClick={plan.action}
                    className={`w-full px-6 py-3 rounded-full font-medium transition-all duration-200 ${
                      plan.popular
                        ? "bg-neutral-900 dark:bg-neutral-100 text-neutral-50 dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200 shadow-md hover:shadow-lg"
                        : "bg-neutral-100 dark:bg-neutral-800 text-foreground hover:bg-neutral-200 dark:hover:bg-neutral-700 border border-neutral-300 dark:border-neutral-600"
                    }`}
                  >
                    {plan.cta}
                  </button>

                  {/* Credit Selector Dropdown for Pro and Business */}
                  {plan.showCreditSelector && (
                    <CreditSelector
                      selectedCredits={
                        plan.name === "Pro" ? proCredits : businessCredits
                      }
                      onCreditsChange={(credits) => {
                        if (plan.name === "Pro") {
                          setProCredits(credits);
                        } else {
                          setBusinessCredits(credits);
                        }
                      }}
                      popular={plan.popular}
                    />
                  )}

                  {/* Features List */}
                  <div className="mt-8 space-y-4 flex-grow">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          {feature.included ? (
                            <svg
                              className={`w-5 h-5 ${
                                feature.highlight
                                  ? "text-neutral-900 dark:text-neutral-100"
                                  : "text-neutral-600 dark:text-neutral-400"
                              }`}
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
                          ) : (
                            <svg
                              className="w-5 h-5 text-neutral-300 dark:text-neutral-600"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          )}
                        </div>
                        <span
                          className={`text-sm ${
                            feature.included
                              ? feature.highlight
                                ? "text-foreground font-medium"
                                : "text-neutral-700 dark:text-neutral-300"
                              : "text-neutral-400 dark:text-neutral-600 line-through"
                          }`}
                        >
                          {feature.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pricing Disclaimer */}
          <div className="mt-8 text-center">
            <p className="text-xs text-neutral-500 dark:text-neutral-500">
              By subscribing, you agree to our{" "}
              <a
                href="/terms"
                className="underline hover:text-neutral-700 dark:hover:text-neutral-400"
              >
                Terms of Service
              </a>{" "}
              and{" "}
              <a
                href="/refunds"
                className="underline hover:text-neutral-700 dark:hover:text-neutral-400"
              >
                Cancellation &amp; Refund Policy
              </a>
              .
            </p>
          </div>

          {/* Additional Information */}
          <div className="mt-16 sm:mt-20">
            <div className="bg-neutral-50 dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-8 sm:p-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-6 text-center">
                Frequently Asked Questions
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                <div>
                  <h3 className="font-semibold text-foreground mb-2">
                    What is a credit?
                  </h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    A credit represents a unit of AI interaction. Each message,
                    code generation, or AI task consumes credits based on
                    complexity. Simple queries use fewer credits than complex
                    app generation.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-2">
                    Do unused credits roll over?
                  </h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Yes! On Pro and Business plans, unused credits roll over to
                    the next month, so you never lose what you&apos;ve paid for.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-2">
                    Are there daily credit limits?
                  </h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Free plan has a 5 credits/day limit to prevent abuse. Pro
                    and Business plans have NO daily limits - use your monthly
                    credits freely whenever you need them!
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-2">
                    What payment methods do you accept?
                  </h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    We accept all major credit cards, debit cards, UPI, and net
                    banking through Razorpay for secure payments.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-2">
                    Can I upgrade or downgrade my plan?
                  </h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Yes! You can change your plan at any time. Upgrades take
                    effect immediately, and downgrades apply at the next billing
                    cycle.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-2">
                    What happens to my projects if I cancel?
                  </h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Your projects remain accessible. Premium features will be
                    downgraded to Free plan limits, but your data stays safe.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-2">
                    What is your refund policy?
                  </h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Monthly subscriptions are generally non-refundable. However,
                    we consider refunds for exceptional circumstances. See our{" "}
                    <a
                      href="/refunds"
                      className="text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 underline"
                    >
                      Cancellation &amp; Refund Policy
                    </a>{" "}
                    for details.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom CTA */}
          <div className="mt-16 sm:mt-20 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
              Still have questions?
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400 mb-6">
              Our team is here to help you find the perfect plan for your needs
            </p>
            <button
              onClick={() =>
                (window.location.href = "mailto:support@craft.tech")
              }
              className="inline-flex items-center gap-2 px-6 py-3 bg-neutral-900 dark:bg-neutral-100 text-neutral-50 dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200 rounded-full font-medium transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              Contact Support
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
