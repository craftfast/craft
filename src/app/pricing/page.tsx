"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";
import HeaderNav from "@/components/HeaderNav";
import {
  initiateRazorpayPayment,
  verifyPayment,
  convertToSmallestUnit,
  getPlanPrice,
} from "@/lib/razorpay";

// Detect user location for currency
function useUserLocation() {
  const [isIndia, setIsIndia] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Try to detect user location
    fetch("https://ipapi.co/json/")
      .then((res) => res.json())
      .then((data) => {
        setIsIndia(data.country_code === "IN");
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  return { isIndia, loading };
}

interface PlanFeature {
  text: string;
  included: boolean;
  highlight?: boolean;
}

interface PricingPlan {
  name: string;
  priceUSD: string;
  priceINR: string;
  description: string;
  features: PlanFeature[];
  cta: string;
  popular?: boolean;
  action: () => void;
}

export default function PricingPage() {
  const router = useRouter();
  const { isIndia, loading } = useUserLocation();
  const [selectedCurrency, setSelectedCurrency] = useState<"INR" | "USD">(
    "USD"
  );

  // Update selected currency based on location when detected
  useEffect(() => {
    if (!loading) {
      setSelectedCurrency(isIndia ? "INR" : "USD");
    }
  }, [isIndia, loading]);

  const handlePremiumPayment = async () => {
    const currency = selectedCurrency;
    const amount = getPlanPrice("Premium", currency);

    await initiateRazorpayPayment({
      amount: convertToSmallestUnit(amount),
      currency: currency,
      name: "Craft Premium",
      description: "Premium Plan - Monthly Subscription",
      planName: "Premium",
      onSuccess: async (response) => {
        // Verify payment
        const isVerified = await verifyPayment(
          response.razorpay_order_id,
          response.razorpay_payment_id,
          response.razorpay_signature
        );

        if (isVerified) {
          alert("Payment successful! Welcome to Premium 🎉");
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
      priceUSD: "$0",
      priceINR: "₹0",
      description: "For prototypes and side projects",
      cta: "Get Started",
      action: () => router.push("/auth/signup"),
      features: [
        {
          text: "Chat with AI to craft an app",
          included: true,
          highlight: true,
        },
        { text: "Unlimited projects (max 1,000)", included: true },
        { text: "Deploy apps to Vercel", included: true },
        { text: "Import from Figma", included: true },
        { text: "Sync with GitHub", included: true },
        { text: "Limited database access (0.5GB per project)", included: true },
        { text: "Bring your own OpenRouter API key", included: true },
        { text: "Limited user memory for context", included: true },
        { text: "Community support", included: true },
        { text: "Pay-as-you-go: $20 per 1M tokens", included: true },
        { text: "No included AI tokens", included: false },
        { text: "Priority support", included: false },
      ],
    },
    {
      name: "Premium",
      priceUSD: "$500",
      priceINR: "₹41,500",
      description: "For startups and growing teams",
      cta: "Start Premium",
      popular: true,
      action: handlePremiumPayment,
      features: [
        { text: "Everything in Free", included: true, highlight: true },
        { text: "1M tokens per day", included: true, highlight: true },
        { text: "Extended memory for personalized code", included: true },
        { text: "Priority support", included: true },
        { text: "Human oversight help when needed", included: true },
        { text: "Advanced AI capabilities", included: true },
        { text: "Faster response times", included: true },
        { text: "Priority deployment queue", included: true },
        { text: "Enhanced context sharing", included: true },
        { text: "Premium integrations", included: true },
      ],
    },
    {
      name: "Enterprise",
      priceUSD: "Contact Us",
      priceINR: "Contact Us",
      description: "For large companies requiring additional security",
      cta: "Contact Sales",
      action: () => {
        window.location.href =
          "mailto:sales@craft.tech?subject=Enterprise Plan Inquiry";
      },
      features: [
        { text: "Everything in Premium", included: true, highlight: true },
        {
          text: "Training opt-out by default",
          included: true,
          highlight: true,
        },
        { text: "SAML SSO", included: true },
        { text: "Priority access with no queues", included: true },
        { text: "Dedicated support team", included: true },
        { text: "Human oversight on demand", included: true },
        { text: "Custom security policies", included: true },
        { text: "SLA guarantees", included: true },
        { text: "Custom integrations", included: true },
        { text: "Unlimited projects", included: true },
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
      <main className="py-12 sm:py-16 md:py-20 pt-20 sm:pt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Section */}
          <div className="text-center mb-12 sm:mb-16">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4">
              Pricing
            </h1>
            <p className="text-lg sm:text-xl text-neutral-600 dark:text-neutral-400 max-w-3xl mx-auto">
              Choose the perfect plan to craft your applications with AI-powered
              assistance
            </p>

            {/* Currency Toggle */}
            {!loading && (
              <div className="mt-8 flex flex-col items-center gap-4">
                <div className="inline-flex items-center bg-neutral-100 dark:bg-neutral-800 rounded-full p-1 border border-neutral-200 dark:border-neutral-700">
                  <button
                    onClick={() => setSelectedCurrency("USD")}
                    className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                      selectedCurrency === "USD"
                        ? "bg-neutral-900 dark:bg-neutral-100 text-neutral-50 dark:text-neutral-900 shadow-sm"
                        : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100"
                    }`}
                  >
                    USD ($)
                  </button>
                  <button
                    onClick={() => setSelectedCurrency("INR")}
                    className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                      selectedCurrency === "INR"
                        ? "bg-neutral-900 dark:bg-neutral-100 text-neutral-50 dark:text-neutral-900 shadow-sm"
                        : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100"
                    }`}
                  >
                    INR (₹)
                  </button>
                </div>
                <div className="inline-flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-500">
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
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <span>
                    Auto-detected:{" "}
                    {isIndia ? "India (INR)" : "International (USD)"}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative bg-white dark:bg-neutral-900 rounded-2xl border-2 transition-all duration-300 hover:shadow-xl ${
                  plan.popular
                    ? "border-neutral-900 dark:border-neutral-100 shadow-lg scale-105"
                    : "border-neutral-200 dark:border-neutral-700"
                }`}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center px-4 py-1 rounded-full text-xs font-medium bg-neutral-900 dark:bg-neutral-100 text-neutral-50 dark:text-neutral-900">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="p-6 sm:p-8">
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
                        {loading
                          ? "..."
                          : selectedCurrency === "INR"
                          ? plan.priceINR
                          : plan.priceUSD}
                      </span>
                      {plan.name !== "Enterprise" && (
                        <span className="text-neutral-600 dark:text-neutral-400">
                          /month
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

                  {/* Features List */}
                  <div className="mt-8 space-y-4">
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

          {/* Additional Information */}
          <div className="mt-16 sm:mt-20">
            <div className="bg-neutral-50 dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-8 sm:p-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-6 text-center">
                Frequently Asked Questions
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
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
                    What is the database powered by?
                  </h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    All database storage is powered by Neon PostgreSQL,
                    providing reliable and scalable database solutions.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-2">
                    How does the pay-as-you-go pricing work?
                  </h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    On the Free plan, you can purchase credits at $20 per 1M
                    tokens when needed. No subscription required.
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
                    Is my data secure?
                  </h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Absolutely. We use industry-standard encryption and security
                    practices. Enterprise plans include training opt-out by
                    default.
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
      <footer className="relative z-10 w-full py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            © 2025 Craft. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
