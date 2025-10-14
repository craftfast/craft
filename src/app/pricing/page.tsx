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
    const amount = 150; // $150/month for Pro

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
      description: "The perfect starting place for your next project.",
      cta:
        userPlan === "pro"
          ? "Downgrade"
          : userPlan === "hobby"
          ? "Current plan"
          : "Start Crafting",
      action: () => router.push("/auth/signup"),
      features: [
        { text: "Import from Figma & GitHub", included: true },
        { text: "AI-powered chat interface", included: true },
        { text: "Live preview environment", included: true },
        { text: "Up to 20 projects", included: true },
        { text: "Integrated database & storage", included: true },
        { text: "Authentication", included: true },
        { text: "Hosting & deployment", included: true },
        { text: "Community support", included: true },
      ],
    },
    {
      name: "Pro",
      price: "$150/mo",
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
        { text: "All Hobby features, plus:", included: true, highlight: true },
        { text: "Purchase additional AI tokens", included: true },
        { text: "Unlimited projects", included: true },
        { text: "Custom domains", included: true },
        { text: "Priority AI processing", included: true },
        { text: "Advanced code generation", included: true },
        { text: "Remove Craft branding", included: true },
        { text: "Email support", included: true },
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
              Craft supports teams of all sizes, with pricing that scales.
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

          {/* Usage-Based Pricing Comparison Table */}
          <div className="mt-16 overflow-x-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4 text-center">
              Detailed Usage Limits & Costs
            </h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 text-center mb-4 max-w-3xl mx-auto">
              <strong>Hobby:</strong> 1M tokens/month with hard limits on
              infrastructure (no pay-as-you-go). <strong>Pro:</strong> 10M
              tokens included + pay-as-you-go for tokens and infrastructure
              beyond generous free tiers. Usage resets monthly.
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
                      AI Models & Usage
                    </td>
                  </tr>
                  <tr className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                    <td className="p-4 sm:p-6">
                      <div className="font-semibold text-foreground mb-1">
                        AI Model Access
                      </div>
                      <div className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
                        Available AI models for chat & code generation
                      </div>
                    </td>
                    <td className="p-4 sm:p-6 text-xs sm:text-sm">
                      <div className="font-medium text-foreground mb-2">
                        Lite AI models only
                      </div>
                      <div className="text-neutral-600 dark:text-neutral-400 space-y-1">
                        <div>• Grok Code Fast 1</div>
                        <div>• GPT-5 mini</div>
                        <div>• Gemini 2.5 Flash</div>
                      </div>
                    </td>
                    <td className="p-4 sm:p-6 text-xs sm:text-sm">
                      <div className="font-medium text-foreground mb-2">
                        Premium models with priority
                      </div>
                      <div className="text-neutral-600 dark:text-neutral-400 space-y-1">
                        <div>• Claude Sonnet 4.5</div>
                        <div>• GPT-5 Codex</div>
                        <div>• Gemini 2.5 Pro</div>
                      </div>
                    </td>
                    <td className="p-4 sm:p-6 text-xs sm:text-sm">
                      <div className="font-medium text-foreground">
                        Custom model setup
                      </div>
                    </td>
                  </tr>
                  <tr className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                    <td className="p-4 sm:p-6">
                      <div className="font-semibold text-foreground mb-1">
                        AI Token Usage
                      </div>
                      <div className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
                        Monthly token allocation
                      </div>
                    </td>
                    <td className="p-4 sm:p-6 text-xs sm:text-sm">
                      <div className="font-medium text-foreground mb-1">
                        1M tokens/month
                      </div>
                      <div className="text-neutral-600 dark:text-neutral-400">
                        <span className="inline-block px-2 py-0.5 bg-neutral-200 dark:bg-neutral-700 rounded text-xs font-medium">
                          Hard limit - upgrade to Pro for more
                        </span>
                      </div>
                    </td>
                    <td className="p-4 sm:p-6 text-xs sm:text-sm">
                      <div className="font-medium text-foreground mb-1">
                        10M tokens included
                      </div>
                      <div className="text-neutral-600 dark:text-neutral-400">
                        Purchase additional tokens as needed
                      </div>
                    </td>
                    <td className="p-4 sm:p-6 text-xs sm:text-sm">
                      <div className="font-medium text-foreground mb-1">
                        Unlimited tokens
                      </div>
                      <div className="text-neutral-600 dark:text-neutral-400">
                        Custom allocations & volume discounts
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
                        500 MB free
                      </div>
                      <div className="text-neutral-500 dark:text-neutral-500 text-xs mb-1">
                        Hard limit - upgrade to Pro for more
                      </div>
                    </td>
                    <td className="p-4 sm:p-6 text-xs sm:text-sm">
                      <div className="font-medium text-foreground mb-1">
                        5 GB free
                      </div>
                      <div className="text-neutral-600 dark:text-neutral-400 mb-1">
                        <span className="font-semibold">$0.08/GB/month</span>{" "}
                        after
                      </div>
                      <div className="text-neutral-500 dark:text-neutral-500 text-xs">
                        Max 100 GB total
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
                        1 GB free
                      </div>
                      <div className="text-neutral-500 dark:text-neutral-500 text-xs mb-1">
                        Hard limit - upgrade to Pro for more
                      </div>
                    </td>
                    <td className="p-4 sm:p-6 text-xs sm:text-sm">
                      <div className="font-medium text-foreground mb-1">
                        10 GB free
                      </div>
                      <div className="text-neutral-600 dark:text-neutral-400 mb-1">
                        <span className="font-semibold">$0.04/GB/month</span>{" "}
                        after
                      </div>
                      <div className="text-neutral-500 dark:text-neutral-500 text-xs">
                        Max 500 GB total
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
                        Bandwidth
                      </div>
                      <div className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
                        Data transfer for hosting
                      </div>
                    </td>
                    <td className="p-4 sm:p-6 text-xs sm:text-sm">
                      <div className="font-medium text-foreground mb-1">
                        100 GB free
                      </div>
                      <div className="text-neutral-500 dark:text-neutral-500 text-xs">
                        Hard limit - upgrade to Pro for more
                      </div>
                    </td>
                    <td className="p-4 sm:p-6 text-xs sm:text-sm">
                      <div className="font-medium text-foreground mb-1">
                        500 GB free
                      </div>
                      <div className="text-neutral-600 dark:text-neutral-400">
                        <span className="font-semibold">$0.08/GB</span> after
                      </div>
                    </td>
                    <td className="p-4 sm:p-6 text-xs sm:text-sm">
                      <div className="font-medium text-foreground mb-1">
                        Custom bandwidth limits
                      </div>
                      <div className="text-neutral-600 dark:text-neutral-400">
                        Global CDN included
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
                        1,000 MAU free
                      </div>
                      <div className="text-neutral-500 dark:text-neutral-500 text-xs">
                        Hard limit - upgrade to Pro for more
                      </div>
                    </td>
                    <td className="p-4 sm:p-6 text-xs sm:text-sm">
                      <div className="font-medium text-foreground mb-1">
                        10,000 MAU free
                      </div>
                      <div className="text-neutral-600 dark:text-neutral-400">
                        <span className="font-semibold">$0.008/user</span> after
                      </div>
                    </td>
                    <td className="p-4 sm:p-6 text-xs sm:text-sm">
                      <div className="font-medium text-foreground mb-1">
                        Unlimited MAU
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
                      Features Included in All Plans
                    </td>
                  </tr>
                  <tr className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                    <td className="p-4 sm:p-6">
                      <div className="font-semibold text-foreground mb-1">
                        Core Development
                      </div>
                      <div className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
                        Essential development tools
                      </div>
                    </td>
                    <td
                      colSpan={3}
                      className="p-4 sm:p-6 text-xs sm:text-sm text-neutral-600 dark:text-neutral-400"
                    >
                      <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        <li className="flex items-center gap-2">
                          <svg
                            className="w-4 h-4 text-neutral-900 dark:text-neutral-100 flex-shrink-0"
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
                          <span>AI-powered chat interface</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <svg
                            className="w-4 h-4 text-neutral-900 dark:text-neutral-100 flex-shrink-0"
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
                          <span>Live preview environment</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <svg
                            className="w-4 h-4 text-neutral-900 dark:text-neutral-100 flex-shrink-0"
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
                          <span>Real-time code generation</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <svg
                            className="w-4 h-4 text-neutral-900 dark:text-neutral-100 flex-shrink-0"
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
                          <span>Figma import</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <svg
                            className="w-4 h-4 text-neutral-900 dark:text-neutral-100 flex-shrink-0"
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
                          <span>GitHub integration</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <svg
                            className="w-4 h-4 text-neutral-900 dark:text-neutral-100 flex-shrink-0"
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
                          <span>Code export & download</span>
                        </li>
                      </ul>
                    </td>
                  </tr>
                  <tr className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                    <td className="p-4 sm:p-6">
                      <div className="font-semibold text-foreground mb-1">
                        Hosting & Deployment
                      </div>
                      <div className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
                        Production-ready infrastructure
                      </div>
                    </td>
                    <td
                      colSpan={3}
                      className="p-4 sm:p-6 text-xs sm:text-sm text-neutral-600 dark:text-neutral-400"
                    >
                      <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        <li className="flex items-center gap-2">
                          <svg
                            className="w-4 h-4 text-neutral-900 dark:text-neutral-100 flex-shrink-0"
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
                          <span>Automatic SSL certificates</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <svg
                            className="w-4 h-4 text-neutral-900 dark:text-neutral-100 flex-shrink-0"
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
                          <span>Global CDN</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <svg
                            className="w-4 h-4 text-neutral-900 dark:text-neutral-100 flex-shrink-0"
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
                          <span>Automatic deployments</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <svg
                            className="w-4 h-4 text-neutral-900 dark:text-neutral-100 flex-shrink-0"
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
                          <span>Environment variables</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <svg
                            className="w-4 h-4 text-neutral-900 dark:text-neutral-100 flex-shrink-0"
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
                          <span>Instant rollbacks</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <svg
                            className="w-4 h-4 text-neutral-900 dark:text-neutral-100 flex-shrink-0"
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
                          <span>Preview deployments</span>
                        </li>
                      </ul>
                    </td>
                  </tr>
                  <tr className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                    <td className="p-4 sm:p-6">
                      <div className="font-semibold text-foreground mb-1">
                        Backend Services
                      </div>
                      <div className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
                        Integrated backend infrastructure
                      </div>
                    </td>
                    <td
                      colSpan={3}
                      className="p-4 sm:p-6 text-xs sm:text-sm text-neutral-600 dark:text-neutral-400"
                    >
                      <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        <li className="flex items-center gap-2">
                          <svg
                            className="w-4 h-4 text-neutral-900 dark:text-neutral-100 flex-shrink-0"
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
                          <span>PostgreSQL database</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <svg
                            className="w-4 h-4 text-neutral-900 dark:text-neutral-100 flex-shrink-0"
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
                          <span>Prisma ORM included</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <svg
                            className="w-4 h-4 text-neutral-900 dark:text-neutral-100 flex-shrink-0"
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
                          <span>File storage & CDN</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <svg
                            className="w-4 h-4 text-neutral-900 dark:text-neutral-100 flex-shrink-0"
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
                          <span>Email/password auth</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <svg
                            className="w-4 h-4 text-neutral-900 dark:text-neutral-100 flex-shrink-0"
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
                          <span>OAuth providers (Google, GitHub)</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <svg
                            className="w-4 h-4 text-neutral-900 dark:text-neutral-100 flex-shrink-0"
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
                          <span>API rate limiting</span>
                        </li>
                      </ul>
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
              <p className="mt-1">
                * Enterprise plans include custom limits tailored to your needs.
                Contact sales for details.
              </p>
            </div>
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

          {/* What's Included Section */}
          <div className="mt-16 sm:mt-20">
            <div className="bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-8 sm:p-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3 text-center">
                Everything you need to build & ship
              </h2>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 text-center mb-10 max-w-2xl mx-auto">
                Integrated platform with AI chat, live preview, database,
                storage, authentication, and deployment.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 border border-neutral-200 dark:border-neutral-700">
                  <div className="w-10 h-10 rounded-full bg-neutral-900 dark:bg-neutral-100 flex items-center justify-center mb-4">
                    <svg
                      className="w-5 h-5 text-white dark:text-black"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                      />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">
                    AI Development
                  </h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Chat with AI to build apps. Access GPT-4, Claude, o1, and
                    more.
                  </p>
                </div>

                <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 border border-neutral-200 dark:border-neutral-700">
                  <div className="w-10 h-10 rounded-full bg-neutral-900 dark:bg-neutral-100 flex items-center justify-center mb-4">
                    <svg
                      className="w-5 h-5 text-white dark:text-black"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">
                    Live Preview
                  </h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    See changes instantly in a real browser environment.
                  </p>
                </div>

                <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 border border-neutral-200 dark:border-neutral-700">
                  <div className="w-10 h-10 rounded-full bg-neutral-900 dark:bg-neutral-100 flex items-center justify-center mb-4">
                    <svg
                      className="w-5 h-5 text-white dark:text-black"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"
                      />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">
                    Database
                  </h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    PostgreSQL database with generous free tier.
                  </p>
                </div>

                <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 border border-neutral-200 dark:border-neutral-700">
                  <div className="w-10 h-10 rounded-full bg-neutral-900 dark:bg-neutral-100 flex items-center justify-center mb-4">
                    <svg
                      className="w-5 h-5 text-white dark:text-black"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                      />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">
                    Storage
                  </h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    S3-compatible storage for files and assets.
                  </p>
                </div>

                <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 border border-neutral-200 dark:border-neutral-700">
                  <div className="w-10 h-10 rounded-full bg-neutral-900 dark:bg-neutral-100 flex items-center justify-center mb-4">
                    <svg
                      className="w-5 h-5 text-white dark:text-black"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">
                    Authentication
                  </h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Built-in auth with social login support.
                  </p>
                </div>

                <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 border border-neutral-200 dark:border-neutral-700">
                  <div className="w-10 h-10 rounded-full bg-neutral-900 dark:bg-neutral-100 flex items-center justify-center mb-4">
                    <svg
                      className="w-5 h-5 text-white dark:text-black"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">
                    Deployment
                  </h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    One-click hosting with global CDN.
                  </p>
                </div>
              </div>
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
                    <strong>Hobby:</strong> Free with hard limits (1M
                    tokens/month, 500MB database). No pay-as-you-go - upgrade to
                    Pro for more. <strong>Pro:</strong> $150/month includes 10M
                    tokens + generous infrastructure limits, then pay-as-you-go
                    for additional usage.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-2">
                    Which AI models can I use?
                  </h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    <strong>Hobby:</strong> Free coding models including Grok
                    Code Fast 1, GPT-5 mini, and Gemini 2.5 Flash.{" "}
                    <strong>Pro:</strong> Premium models including Claude Sonnet
                    4.5, GPT-5 Codex, and Gemini 2.5 Pro with priority
                    processing.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-2">
                    What are the free usage limits?
                  </h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    All plans include free tiers for database, storage, auth,
                    and bandwidth. See the usage table above for specific
                    limits.
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
              Build and deploy your first project with the Hobby plan.
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
