"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Logo from "@/components/Logo";
import HeaderNav from "@/components/HeaderNav";
import Footer from "@/components/Footer";
import { initiatePolarPayment, toSmallestUnit } from "@/lib/polar";

interface PlanFeature {
  text: string;
  included: boolean;
  highlight?: boolean;
}

interface PricingPlan {
  name: string;
  price: string;
  description: string;
  features: PlanFeature[];
  cta: string;
  popular?: boolean;
  action: () => void;
}

export default function PricingPage() {
  const router = useRouter();
  const { data: session } = useSession();

  // TODO: Fetch actual subscription plan from user data when implemented
  // For now, we assume all authenticated users are on Hobby plan
  // In the future, fetch from: session.user.subscriptionPlan or similar
  const userPlan: "hobby" | "pro" | null = session
    ? ("hobby" as "hobby" | "pro") // Type assertion for future implementation
    : null;

  const handleProPayment = async () => {
    const amount = 25; // $25/month for Pro

    try {
      // Initiate Polar payment (this will redirect to Polar checkout)
      await initiatePolarPayment({
        amount: toSmallestUnit(amount),
        currency: "USD",
        productName: "Craft Pro",
        productDescription:
          "Pro Plan - Monthly Subscription with unlimited projects and advanced features",
        email: session?.user?.email || undefined,
        successUrl: `${window.location.origin}/dashboard?payment=success&plan=pro`,
        onFailure: (error) => {
          console.error("Payment failed:", error);
          const errorMsg =
            typeof error === "object" && "error" in error
              ? error.error
              : "An unexpected error occurred";

          // Show detailed error message
          alert(
            "❌ Payment Failed\n\n" +
              errorMsg +
              "\n\n" +
              "What to do:\n" +
              "• Try again in a few minutes\n" +
              "• Check your internet connection\n" +
              "• If the issue persists, contact support:\n\n" +
              "📧 Email: support@craft.tech\n" +
              "💬 We typically respond within 24 hours"
          );
        },
      });
    } catch (error) {
      console.error("Unexpected payment error:", error);
      alert(
        "⚠️ Unexpected Error\n\n" +
          "Something went wrong while initiating payment.\n\n" +
          "Please try again later or contact support:\n" +
          "📧 support@craft.tech\n\n" +
          "We apologize for the inconvenience."
      );
    }
  };

  const plans: PricingPlan[] = [
    {
      name: "Hobby",
      price: "Free",
      description: "Try Craft with basic features. Limited to 3 projects.",
      cta:
        userPlan === "pro"
          ? "Downgrade"
          : userPlan === "hobby"
          ? "Current plan"
          : "Start Crafting",
      action: () => router.push("/auth/signup"),
      features: [
        { text: "100k AI tokens per month", included: true, highlight: true },
        { text: "Up to 3 projects", included: true },
        { text: "AI-powered chat interface", included: true },
        { text: "Live preview environment", included: true },
        { text: "Integrated database & storage", included: true },
        { text: "Authentication", included: true },
        { text: "Craft branding on projects", included: true },
        { text: "Community support", included: true },
      ],
    },
    {
      name: "Pro",
      price: "$25/mo",
      description: "Everything you need to build and scale your app.",
      cta: !session
        ? "Start a free trial"
        : userPlan === "pro"
        ? "Current plan"
        : "Upgrade now",
      popular: true,
      action:
        userPlan === "pro"
          ? () => {} // No action for current plan
          : handleProPayment,
      features: [
        { text: "Everything in hobby, plus:", included: true, highlight: true },
        { text: "10M AI tokens per month", included: true, highlight: true },
        { text: "Unlimited projects", included: true, highlight: false },
        {
          text: "Purchase additional AI credits at $5 per million tokens",
          included: true,
          highlight: false,
        },
        {
          text: "Import from Figma & GitHub",
          included: true,
          highlight: false,
        },
        {
          text: "Remove Craft branding",
          included: true,
          highlight: false,
        },
        {
          text: "Pay-as-you-go for infrastructure",
          included: true,
          highlight: false,
        },
        { text: "Priority email support", included: true, highlight: false },
      ],
    },
    {
      name: "Enterprise",
      price: "Custom",
      description: "Security, performance, and dedicated support.",
      cta: "Contact Sales",
      action: () => {
        window.location.href =
          "mailto:sales@craft.tech?subject=Enterprise Plan Inquiry";
      },
      features: [
        {
          text: "All Pro features, plus:",
          included: true,
          highlight: true,
        },
        { text: "SSO & SAML authentication", included: true },
        { text: "Advanced security controls", included: true },
        { text: "Audit logs & compliance", included: true },
        { text: "Custom database & storage limits", included: true },
        { text: "99.9% uptime SLA", included: true },
        { text: "Dedicated account manager", included: true },
        { text: "24/7 priority support", included: true },
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
              Find a plan to craft your apps
            </h1>
            <p className="text-lg text-neutral-600 dark:text-neutral-400 max-w-3xl mx-auto">
              Simple, transparent pricing for builder.
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl border-2 transition-all duration-300 hover:shadow-xl flex flex-col ${
                  plan.popular
                    ? "bg-neutral-50 dark:bg-neutral-800/50 border-neutral-900 dark:border-neutral-100 shadow-md"
                    : "bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700"
                }`}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="inline-block px-4 py-1 bg-neutral-900 dark:bg-neutral-100 text-neutral-50 dark:text-neutral-900 text-xs font-semibold rounded-full">
                      Popular
                    </span>
                  </div>
                )}
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
                        {plan.price}
                      </span>
                    </div>
                  </div>

                  {/* CTA Button */}
                  <button
                    onClick={plan.action}
                    disabled={
                      (plan.name === "Pro" && userPlan === "pro") ||
                      (plan.name === "Hobby" && userPlan === "hobby")
                    }
                    className={`w-full px-6 py-3 rounded-full font-medium transition-all duration-200 ${
                      (plan.name === "Pro" && userPlan === "pro") ||
                      (plan.name === "Hobby" && userPlan === "hobby")
                        ? "bg-neutral-300 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-400 cursor-not-allowed"
                        : plan.popular
                        ? "bg-neutral-900 dark:bg-neutral-100 text-neutral-50 dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200 shadow-md hover:shadow-lg"
                        : "bg-neutral-100 dark:bg-neutral-800 text-foreground hover:bg-neutral-200 dark:hover:bg-neutral-700 border border-neutral-300 dark:border-neutral-600"
                    }`}
                  >
                    {plan.cta}
                  </button>

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
          <div className="mt-4 text-center">
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

          {/* Usage-Based Pricing Comparison Table */}
          <div className="mt-16 overflow-x-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4 text-center">
              Detailed Usage Limits & Costs
            </h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 text-center mb-4 max-w-3xl mx-auto">
              Compare features, limits, and pricing across all plans.
            </p>
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50">
                    <th className="text-left p-4 sm:p-6 font-bold text-foreground w-1/4">
                      Resource
                    </th>
                    <th className="text-left p-4 sm:p-6 font-bold text-foreground w-1/4">
                      Hobby
                    </th>
                    <th className="text-left p-4 sm:p-6 font-bold text-foreground w-1/4">
                      Pro
                    </th>
                    <th className="text-left p-4 sm:p-6 font-bold text-foreground w-1/4">
                      Enterprise
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                  {/* AI Usage Section */}
                  <tr className="bg-neutral-50/50 dark:bg-neutral-800/30">
                    <td
                      colSpan={4}
                      className="p-3 sm:p-4 font-semibold text-sm text-neutral-700 dark:text-neutral-300 uppercase tracking-wide"
                    >
                      AI Usage
                    </td>
                  </tr>
                  <tr className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                    <td className="p-4 sm:p-6">
                      <div className="font-semibold text-foreground mb-1">
                        AI Model Access
                      </div>
                      <div className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
                        Monthly AI usage allocation
                      </div>
                    </td>
                    <td className="p-4 sm:p-6 text-xs sm:text-sm">
                      <div className="font-medium text-foreground mb-1">
                        100k tokens/month
                      </div>
                      <div className="text-neutral-600 dark:text-neutral-400">
                        Fixed limit (upgrade to Pro for more)
                      </div>
                    </td>
                    <td className="p-4 sm:p-6 text-xs sm:text-sm">
                      <div className="font-medium text-foreground mb-1">
                        10M tokens/month
                      </div>
                      <div className="text-neutral-600 dark:text-neutral-400">
                        Purchase more at $5/1M
                      </div>
                    </td>
                    <td className="p-4 sm:p-6 text-xs sm:text-sm">
                      <div className="font-medium text-foreground mb-1">
                        Custom allocation
                      </div>
                    </td>
                  </tr>

                  {/* Project & Domain Features */}
                  <tr className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                    <td className="p-4 sm:p-6">
                      <div className="font-semibold text-foreground mb-1">
                        Projects Limit
                      </div>
                      <div className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
                        Maximum number of projects you can create
                      </div>
                    </td>
                    <td className="p-4 sm:p-6 text-xs sm:text-sm">
                      <div className="font-medium text-foreground mb-1">
                        <span className="font-semibold">3 projects</span>
                      </div>
                      <div className="text-neutral-600 dark:text-neutral-400">
                        Upgrade to Pro for unlimited
                      </div>
                    </td>
                    <td className="p-4 sm:p-6 text-xs sm:text-sm">
                      <div className="font-medium text-foreground mb-1">
                        <span className="font-semibold">Unlimited</span>
                      </div>
                      <div className="text-neutral-600 dark:text-neutral-400">
                        Create as many as you need
                      </div>
                    </td>
                    <td className="p-4 sm:p-6 text-xs sm:text-sm">
                      <div className="font-medium text-foreground mb-1">
                        <span className="font-semibold">Unlimited</span>
                      </div>
                      <div className="text-neutral-600 dark:text-neutral-400">
                        Custom project management
                      </div>
                    </td>
                  </tr>
                  {/* Infrastructure Section */}
                  <tr className="bg-neutral-50/50 dark:bg-neutral-800/30">
                    <td
                      colSpan={4}
                      className="p-3 sm:p-4 font-semibold text-sm text-neutral-700 dark:text-neutral-300 uppercase tracking-wide"
                    >
                      Infrastructure & Resources
                    </td>
                  </tr>
                  <tr className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                    <td className="p-4 sm:p-6">
                      <div className="font-semibold text-foreground mb-1">
                        Database Storage
                      </div>
                      <div className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
                        PostgreSQL database storage
                      </div>
                    </td>
                    <td className="p-4 sm:p-6 text-xs sm:text-sm">
                      <div className="font-medium text-foreground mb-1">
                        50 MB
                      </div>
                      <div className="text-neutral-600 dark:text-neutral-400">
                        Fixed limit (upgrade to Pro for more)
                      </div>
                    </td>
                    <td className="p-4 sm:p-6 text-xs sm:text-sm">
                      <div className="font-medium text-foreground mb-1">
                        500 MB free
                      </div>
                      <div className="text-neutral-600 dark:text-neutral-400 mb-1">
                        <span className="font-semibold">$0.10/GB/month</span>{" "}
                        after
                      </div>
                    </td>
                    <td className="p-4 sm:p-6 text-xs sm:text-sm">
                      <div className="font-medium text-foreground mb-1">
                        Custom storage limits
                      </div>
                      <div className="text-neutral-600 dark:text-neutral-400">
                        Dedicated database instances
                      </div>
                    </td>
                  </tr>
                  <tr className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                    <td className="p-4 sm:p-6">
                      <div className="font-semibold text-foreground mb-1">
                        Object Storage
                      </div>
                      <div className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
                        S3-compatible file storage
                      </div>
                    </td>
                    <td className="p-4 sm:p-6 text-xs sm:text-sm">
                      <div className="font-medium text-foreground mb-1">
                        100 MB
                      </div>
                      <div className="text-neutral-600 dark:text-neutral-400">
                        Fixed limit (upgrade to Pro for more)
                      </div>
                    </td>
                    <td className="p-4 sm:p-6 text-xs sm:text-sm">
                      <div className="font-medium text-foreground mb-1">
                        1 GB free
                      </div>
                      <div className="text-neutral-600 dark:text-neutral-400 mb-1">
                        <span className="font-semibold">$0.05/GB/month</span>{" "}
                        after
                      </div>
                    </td>
                    <td className="p-4 sm:p-6 text-xs sm:text-sm">
                      <div className="font-medium text-foreground mb-1">
                        Custom storage limits
                      </div>
                      <div className="text-neutral-600 dark:text-neutral-400">
                        Dedicated storage buckets
                      </div>
                    </td>
                  </tr>
                  <tr className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                    <td className="p-4 sm:p-6">
                      <div className="font-semibold text-foreground mb-1">
                        Authentication
                      </div>
                      <div className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
                        Monthly active users (MAU)
                      </div>
                    </td>
                    <td className="p-4 sm:p-6 text-xs sm:text-sm">
                      <div className="font-medium text-foreground mb-1">
                        <span className="font-semibold">Unlimited</span>
                      </div>
                      <div className="text-neutral-600 dark:text-neutral-400">
                        No MAU limits
                      </div>
                    </td>
                    <td className="p-4 sm:p-6 text-xs sm:text-sm">
                      <div className="font-medium text-foreground mb-1">
                        <span className="font-semibold">Unlimited</span>
                      </div>
                      <div className="text-neutral-600 dark:text-neutral-400">
                        No MAU limits
                      </div>
                    </td>
                    <td className="p-4 sm:p-6 text-xs sm:text-sm">
                      <div className="font-medium text-foreground mb-1">
                        <span className="font-semibold">Unlimited</span>
                      </div>
                      <div className="text-neutral-600 dark:text-neutral-400">
                        SSO & SAML included
                      </div>
                    </td>
                  </tr>

                  {/* Features Available Across All Plans */}
                  <tr className="bg-neutral-50/50 dark:bg-neutral-800/30">
                    <td
                      colSpan={4}
                      className="p-3 sm:p-4 font-semibold text-sm text-neutral-700 dark:text-neutral-300 uppercase tracking-wide"
                    >
                      Core Development Features
                    </td>
                  </tr>
                  <tr className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                    <td className="p-4 sm:p-6">
                      <div className="font-semibold text-foreground mb-1">
                        AI-Powered Chat Interface
                      </div>
                      <div className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
                        Chat with AI to build applications
                      </div>
                    </td>
                    <td className="p-4 sm:p-6 text-xs sm:text-sm">
                      <div className="flex items-center gap-2 text-neutral-900 dark:text-neutral-100">
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
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span className="font-semibold">Included</span>
                      </div>
                    </td>
                    <td className="p-4 sm:p-6 text-xs sm:text-sm">
                      <div className="flex items-center gap-2 text-neutral-900 dark:text-neutral-100">
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
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span className="font-semibold">Included</span>
                      </div>
                    </td>
                    <td className="p-4 sm:p-6 text-xs sm:text-sm">
                      <div className="flex items-center gap-2 text-neutral-900 dark:text-neutral-100">
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
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span className="font-semibold">Included</span>
                      </div>
                    </td>
                  </tr>
                  <tr className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                    <td className="p-4 sm:p-6">
                      <div className="font-semibold text-foreground mb-1">
                        Live Preview Environment
                      </div>
                      <div className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
                        See changes instantly in real browser
                      </div>
                    </td>
                    <td className="p-4 sm:p-6 text-xs sm:text-sm">
                      <div className="flex items-center gap-2 text-neutral-900 dark:text-neutral-100">
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
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span className="font-semibold">Included</span>
                      </div>
                    </td>
                    <td className="p-4 sm:p-6 text-xs sm:text-sm">
                      <div className="flex items-center gap-2 text-neutral-900 dark:text-neutral-100">
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
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span className="font-semibold">Included</span>
                      </div>
                    </td>
                    <td className="p-4 sm:p-6 text-xs sm:text-sm">
                      <div className="flex items-center gap-2 text-neutral-900 dark:text-neutral-100">
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
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span className="font-semibold">Included</span>
                      </div>
                    </td>
                  </tr>
                  <tr className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                    <td className="p-4 sm:p-6">
                      <div className="font-semibold text-foreground mb-1">
                        Real-Time Code Generation
                      </div>
                      <div className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
                        AI generates code as you describe
                      </div>
                    </td>
                    <td className="p-4 sm:p-6 text-xs sm:text-sm">
                      <div className="flex items-center gap-2 text-neutral-900 dark:text-neutral-100">
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
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span className="font-semibold">Included</span>
                      </div>
                    </td>
                    <td className="p-4 sm:p-6 text-xs sm:text-sm">
                      <div className="flex items-center gap-2 text-neutral-900 dark:text-neutral-100">
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
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span className="font-semibold">Included</span>
                      </div>
                    </td>
                    <td className="p-4 sm:p-6 text-xs sm:text-sm">
                      <div className="flex items-center gap-2 text-neutral-900 dark:text-neutral-100">
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
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span className="font-semibold">Included</span>
                      </div>
                    </td>
                  </tr>
                  <tr className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                    <td className="p-4 sm:p-6">
                      <div className="font-semibold text-foreground mb-1">
                        Figma Import
                      </div>
                      <div className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
                        Import designs directly from Figma
                      </div>
                    </td>
                    <td className="p-4 sm:p-6 text-xs sm:text-sm">
                      <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
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
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                        <span>Not included</span>
                      </div>
                    </td>
                    <td className="p-4 sm:p-6 text-xs sm:text-sm">
                      <div className="flex items-center gap-2 text-neutral-900 dark:text-neutral-100">
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
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span className="font-semibold">Included</span>
                      </div>
                    </td>
                    <td className="p-4 sm:p-6 text-xs sm:text-sm">
                      <div className="flex items-center gap-2 text-neutral-900 dark:text-neutral-100">
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
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span className="font-semibold">Included</span>
                      </div>
                    </td>
                  </tr>
                  <tr className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                    <td className="p-4 sm:p-6">
                      <div className="font-semibold text-foreground mb-1">
                        GitHub Integration
                      </div>
                      <div className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
                        Connect and sync with GitHub repos
                      </div>
                    </td>
                    <td className="p-4 sm:p-6 text-xs sm:text-sm">
                      <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
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
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                        <span>Not included</span>
                      </div>
                    </td>
                    <td className="p-4 sm:p-6 text-xs sm:text-sm">
                      <div className="flex items-center gap-2 text-neutral-900 dark:text-neutral-100">
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
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span className="font-semibold">Included</span>
                      </div>
                    </td>
                    <td className="p-4 sm:p-6 text-xs sm:text-sm">
                      <div className="flex items-center gap-2 text-neutral-900 dark:text-neutral-100">
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
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span className="font-semibold">Included</span>
                      </div>
                    </td>
                  </tr>
                  <tr className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                    <td className="p-4 sm:p-6">
                      <div className="font-semibold text-foreground mb-1">
                        Code Export & Download
                      </div>
                      <div className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
                        Download your project code anytime
                      </div>
                    </td>
                    <td className="p-4 sm:p-6 text-xs sm:text-sm">
                      <div className="flex items-center gap-2 text-neutral-900 dark:text-neutral-100">
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
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span className="font-semibold">Included</span>
                      </div>
                    </td>
                    <td className="p-4 sm:p-6 text-xs sm:text-sm">
                      <div className="flex items-center gap-2 text-neutral-900 dark:text-neutral-100">
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
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span className="font-semibold">Included</span>
                      </div>
                    </td>
                    <td className="p-4 sm:p-6 text-xs sm:text-sm">
                      <div className="flex items-center gap-2 text-neutral-900 dark:text-neutral-100">
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
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span className="font-semibold">Included</span>
                      </div>
                    </td>
                  </tr>

                  {/* Backend Services Section */}
                  <tr className="bg-neutral-50/50 dark:bg-neutral-800/30">
                    <td
                      colSpan={4}
                      className="p-3 sm:p-4 font-semibold text-sm text-neutral-700 dark:text-neutral-300 uppercase tracking-wide"
                    >
                      Backend Services
                    </td>
                  </tr>
                  <tr className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                    <td className="p-4 sm:p-6">
                      <div className="font-semibold text-foreground mb-1">
                        PostgreSQL Database
                      </div>
                      <div className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
                        Managed PostgreSQL database
                      </div>
                    </td>
                    <td className="p-4 sm:p-6 text-xs sm:text-sm">
                      <div className="flex items-center gap-2 text-neutral-900 dark:text-neutral-100">
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
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span className="font-semibold">Included</span>
                      </div>
                    </td>
                    <td className="p-4 sm:p-6 text-xs sm:text-sm">
                      <div className="flex items-center gap-2 text-neutral-900 dark:text-neutral-100">
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
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span className="font-semibold">Included</span>
                      </div>
                    </td>
                    <td className="p-4 sm:p-6 text-xs sm:text-sm">
                      <div className="flex items-center gap-2 text-neutral-900 dark:text-neutral-100">
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
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span className="font-semibold">Included</span>
                      </div>
                    </td>
                  </tr>
                  <tr className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                    <td className="p-4 sm:p-6">
                      <div className="font-semibold text-foreground mb-1">
                        Prisma ORM
                      </div>
                      <div className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
                        Type-safe database toolkit
                      </div>
                    </td>
                    <td className="p-4 sm:p-6 text-xs sm:text-sm">
                      <div className="flex items-center gap-2 text-neutral-900 dark:text-neutral-100">
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
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span className="font-semibold">Included</span>
                      </div>
                    </td>
                    <td className="p-4 sm:p-6 text-xs sm:text-sm">
                      <div className="flex items-center gap-2 text-neutral-900 dark:text-neutral-100">
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
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span className="font-semibold">Included</span>
                      </div>
                    </td>
                    <td className="p-4 sm:p-6 text-xs sm:text-sm">
                      <div className="flex items-center gap-2 text-neutral-900 dark:text-neutral-100">
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
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span className="font-semibold">Included</span>
                      </div>
                    </td>
                  </tr>
                  <tr className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                    <td className="p-4 sm:p-6">
                      <div className="font-semibold text-foreground mb-1">
                        File Storage
                      </div>
                      <div className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
                        S3-compatible object storage
                      </div>
                    </td>
                    <td className="p-4 sm:p-6 text-xs sm:text-sm">
                      <div className="flex items-center gap-2 text-neutral-900 dark:text-neutral-100">
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
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span className="font-semibold">Included</span>
                      </div>
                    </td>
                    <td className="p-4 sm:p-6 text-xs sm:text-sm">
                      <div className="flex items-center gap-2 text-neutral-900 dark:text-neutral-100">
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
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span className="font-semibold">Included</span>
                      </div>
                    </td>
                    <td className="p-4 sm:p-6 text-xs sm:text-sm">
                      <div className="flex items-center gap-2 text-neutral-900 dark:text-neutral-100">
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
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span className="font-semibold">Included</span>
                      </div>
                    </td>
                  </tr>
                  <tr className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                    <td className="p-4 sm:p-6">
                      <div className="font-semibold text-foreground mb-1">
                        Email/Password Authentication
                      </div>
                      <div className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
                        Built-in credential authentication
                      </div>
                    </td>
                    <td className="p-4 sm:p-6 text-xs sm:text-sm">
                      <div className="flex items-center gap-2 text-neutral-900 dark:text-neutral-100">
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
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span className="font-semibold">Included</span>
                      </div>
                    </td>
                    <td className="p-4 sm:p-6 text-xs sm:text-sm">
                      <div className="flex items-center gap-2 text-neutral-900 dark:text-neutral-100">
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
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span className="font-semibold">Included</span>
                      </div>
                    </td>
                    <td className="p-4 sm:p-6 text-xs sm:text-sm">
                      <div className="flex items-center gap-2 text-neutral-900 dark:text-neutral-100">
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
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span className="font-semibold">Included</span>
                      </div>
                    </td>
                  </tr>
                  <tr className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                    <td className="p-4 sm:p-6">
                      <div className="font-semibold text-foreground mb-1">
                        OAuth Providers
                      </div>
                      <div className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
                        Google, GitHub social login
                      </div>
                    </td>
                    <td className="p-4 sm:p-6 text-xs sm:text-sm">
                      <div className="flex items-center gap-2 text-neutral-900 dark:text-neutral-100">
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
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span className="font-semibold">Included</span>
                      </div>
                    </td>
                    <td className="p-4 sm:p-6 text-xs sm:text-sm">
                      <div className="flex items-center gap-2 text-neutral-900 dark:text-neutral-100">
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
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span className="font-semibold">Included</span>
                      </div>
                    </td>
                    <td className="p-4 sm:p-6 text-xs sm:text-sm">
                      <div className="flex items-center gap-2 text-neutral-900 dark:text-neutral-100">
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
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span className="font-semibold">Included</span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="mt-4 text-center text-xs text-neutral-500 dark:text-neutral-500">
              <p>
                * All usage limits reset monthly. Usage beyond free tiers is
                billed at the end of each month.
              </p>
            </div>
          </div>

          {/* Additional Information */}
          <div className="mt-16 sm:mt-20">
            <div className="bg-neutral-50 dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-8 sm:p-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-8 text-center">
                Frequently Asked Questions
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                <div>
                  <h3 className="font-semibold text-foreground mb-2">
                    How does billing work?
                  </h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    <strong>Hobby:</strong> Free forever with up to 3 projects,
                    100k AI tokens/month, and fixed infrastructure limits.
                    Perfect for trying out Craft. <strong>Pro:</strong>{" "}
                    $25/month with unlimited projects, 10M AI tokens,
                    Figma/GitHub imports, and pay-as-you-go for overages.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-2">
                    What&apos;s the difference between Hobby and Pro?
                  </h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    <strong>Hobby:</strong> Limited to 3 projects, no
                    Figma/GitHub imports, includes Craft branding, and fixed
                    100k AI tokens. <strong>Pro:</strong> Unlimited projects,
                    Figma/GitHub imports, without branding, 10M AI tokens, and
                    ability to purchase more credits.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-2">
                    Can I upgrade from Hobby to Pro?
                  </h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Yes! Upgrade anytime to unlock unlimited projects,
                    Figma/GitHub imports, and much higher AI token limits. Your
                    existing projects will be preserved.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-2">
                    Can I cancel anytime?
                  </h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Yes. No commitments. Cancel your Pro subscription anytime
                    from your dashboard. See our refund policy for details.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom CTA */}
          <div className="mt-16 sm:mt-20 text-center pb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
              Ready to start building?
            </h2>
            <p className="text-lg text-neutral-600 dark:text-neutral-400 mb-2">
              Get started today — no credit card required.
            </p>
            <p className="text-sm text-neutral-500 dark:text-neutral-500 mb-8">
              Start with the free Hobby plan (up to 3 projects). Upgrade to Pro
              for unlimited projects and advanced features.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={() => router.push("/auth/signup")}
                className="inline-flex items-center gap-2 px-8 py-3 bg-neutral-900 dark:bg-neutral-100 text-neutral-50 dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200 rounded-full font-medium transition-colors shadow-sm hover:shadow-md"
              >
                Start Building Free
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
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </button>
              <button
                onClick={() =>
                  (window.location.href =
                    "mailto:sales@craft.tech?subject=Enterprise Inquiry")
                }
                className="inline-flex items-center gap-2 px-8 py-3 bg-neutral-100 dark:bg-neutral-800 text-foreground hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-full font-medium transition-colors border border-neutral-300 dark:border-neutral-600"
              >
                Contact Sales
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
