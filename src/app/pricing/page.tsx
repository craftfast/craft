"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import Logo from "@/components/Logo";
import HeaderNav from "@/components/HeaderNav";
import Footer from "@/components/Footer";
import { initiatePolarPayment, toSmallestUnit } from "@/lib/polar";
import { CREDIT_TIERS } from "@/lib/pricing-constants";

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

interface FAQItem {
  question: string;
  answer: React.ReactNode;
}

// FAQ Section Component
function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const faqs: FAQItem[] = [
    {
      question: "How does billing work?",
      answer: (
        <>
          <strong>Hobby:</strong> Free forever with up to 3 projects, 100k AI
          tokens/month, and fixed infrastructure limits. Perfect for trying out
          Craft. <strong>Pro:</strong> $50/month with unlimited projects, 10M AI
          tokens, Figma/GitHub imports, and pay-as-you-go for overages. Need
          more tokens? Check out our{" "}
          <a
            href="#token-packages"
            className="underline hover:text-neutral-900 dark:hover:text-neutral-200"
          >
            token packages
          </a>
          .
        </>
      ),
    },
    {
      question: "What's the difference between Hobby and Pro?",
      answer: (
        <>
          <strong>Hobby:</strong> Limited to 3 projects, no Figma/GitHub
          imports, includes Craft branding, and fixed 100k AI tokens.{" "}
          <strong>Pro:</strong> Unlimited projects, Figma/GitHub imports,
          without branding, 10M AI tokens, and ability to purchase{" "}
          <a
            href="#token-packages"
            className="underline hover:text-neutral-900 dark:hover:text-neutral-200"
          >
            additional token packages
          </a>
          .
        </>
      ),
    },
    {
      question: "Can I upgrade from Hobby to Pro?",
      answer:
        "Yes! Upgrade anytime to unlock unlimited projects, Figma/GitHub imports, and much higher AI token limits. Your existing projects will be preserved and immediately benefit from the Pro features.",
    },
    {
      question: "Can I cancel anytime?",
      answer:
        "Yes. No commitments. Cancel your Pro subscription anytime from your dashboard. You'll retain access until the end of your current billing period. See our refund policy for details on early cancellation refunds.",
    },
    {
      question: "How do token packages work?",
      answer:
        "Token packages are one-time purchases that add AI tokens to your account. They never expire and can be used anytime. Available in multiple tiers from 1M tokens ($5) up to 1000M tokens ($2,750). Larger packages offer better value with discounts of up to 45% off the base rate.",
    },
    {
      question: "What happens if I run out of tokens?",
      answer: (
        <>
          If you exceed your monthly token allocation, you can purchase
          additional{" "}
          <a
            href="#token-packages"
            className="underline hover:text-neutral-900 dark:hover:text-neutral-200"
          >
            token packages
          </a>{" "}
          at any time. Your projects will continue working, and you&apos;ll be
          notified when approaching your limit.
        </>
      ),
    },
    {
      question: "What AI models do you support?",
      answer:
        "Craft supports leading AI models including GPT-4, GPT-4 Turbo, Claude 3.5 Sonnet, and other cutting-edge models. You can switch between models based on your needs, with token usage calculated accordingly.",
    },
    {
      question: "Do unused tokens roll over?",
      answer:
        "Monthly token allocations (100k for Hobby, 10M for Pro, 100M for Agent) reset each billing cycle and don't roll over. However, purchased token packages never expire and remain available until used.",
    },
    {
      question: "What's included in the Agent plan?",
      answer:
        "The Agent plan ($5,000/month) includes everything in Pro plus: 100M tokens/month, ability to delegate long-running tasks with expert oversight, background task execution, architecture & design review, 2GB database + 5GB storage, and dedicated support.",
    },
    {
      question: "Can I use my own infrastructure?",
      answer:
        "Currently, Craft manages the infrastructure for you including database, storage, and deployment. This ensures optimal performance and seamless integration. For custom infrastructure needs, please contact our sales team about the Agent plan.",
    },
    {
      question: "What payment methods do you accept?",
      answer:
        "We accept all major credit cards (Visa, Mastercard, American Express, Discover) through our secure payment processor Polar. All transactions are encrypted and PCI-compliant.",
    },
    {
      question: "Is there a free trial for Pro?",
      answer:
        "Yes! New users can start a free trial of Pro to experience unlimited projects and advanced features. No credit card required to start. You can upgrade to Pro at any time to unlock the full experience.",
    },
    {
      question: "How is infrastructure billed?",
      answer:
        "Infrastructure is pay-as-you-go on Pro and Agent plans. Database storage: $0.10/GB/month after free tier. Object storage: $0.02/GB/month after free tier. Network egress: $0.09/GB after free tier. Hobby plan has fixed limits with no overages.",
    },
    {
      question: "Can I get a refund?",
      answer:
        "Yes, we offer refunds within 14 days of purchase for monthly subscriptions. Token packages are non-refundable once purchased. Please see our Cancellation & Refund Policy for complete details.",
    },
    {
      question: "What happens to my projects if I downgrade?",
      answer:
        "If you downgrade from Pro to Hobby, you'll need to select 3 projects to keep active. Other projects will be archived and can be restored by upgrading back to Pro. All your data is safely preserved.",
    },
    {
      question: "Do you offer discounts for annual plans?",
      answer:
        "Currently, we offer monthly billing only. However, purchasing larger token packages provides significant discounts (up to 45% off). Contact sales@craft.fast for information about annual contracts for Agent plans.",
    },
    {
      question: "What kind of support do you provide?",
      answer:
        "Hobby plan includes community support via our Discord and documentation. Pro plan includes priority email support with 24-48 hour response time. Agent plan includes dedicated support with direct access to our engineering team.",
    },
    {
      question: "Can I transfer projects between accounts?",
      answer:
        "Project transfers between accounts are not currently supported. For team collaboration needs or multi-user access requirements, please contact our sales team about custom solutions.",
    },
  ];

  return (
    <div id="faq" className="mt-16 sm:mt-20">
      <div className="bg-neutral-50 dark:bg-neutral-900 rounded-2xl p-8 sm:p-12">
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4 text-center">
          Frequently Asked Questions
        </h2>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 text-center mb-8 max-w-2xl mx-auto">
          Find answers to common questions about Craft pricing, features, and
          billing.
        </p>

        <div className="max-w-4xl mx-auto space-y-3">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden transition-all duration-200 hover:border-neutral-300 dark:hover:border-neutral-600"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full px-6 py-4 flex items-center justify-between text-left transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-700/50"
              >
                <span className="font-semibold text-foreground pr-4">
                  {faq.question}
                </span>
                <svg
                  className={`flex-shrink-0 w-5 h-5 text-neutral-600 dark:text-neutral-400 transition-transform duration-200 ${
                    openIndex === index ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  openIndex === index
                    ? "max-h-96 opacity-100"
                    : "max-h-0 opacity-0"
                }`}
              >
                <div className="px-6 pb-4 text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  {faq.answer}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">
            Still have questions?
          </p>
          <a
            href="mailto:support@craft.fast"
            className="inline-flex items-center gap-2 text-sm font-medium text-neutral-900 dark:text-neutral-100 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
          >
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
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            Contact Support
          </a>
        </div>
      </div>
    </div>
  );
}

export default function PricingPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [userPlan, setUserPlan] = useState<"hobby" | "pro" | null>(null);
  const [isLoadingPlan, setIsLoadingPlan] = useState(false);
  const hasFetchedRef = useRef(false);

  // Fetch user's actual subscription plan (only once when authenticated)
  useEffect(() => {
    // Skip if already fetched, not authenticated, or still loading session
    if (hasFetchedRef.current || status === "loading" || !session?.user) {
      if (!session?.user) {
        setUserPlan(null);
        hasFetchedRef.current = false; // Reset if user logs out
      }
      return;
    }

    const fetchUserPlan = async () => {
      setIsLoadingPlan(true);
      try {
        const response = await fetch("/api/user/subscription");
        if (response.ok) {
          const data = await response.json();
          // Map plan names to lowercase for consistency
          setUserPlan(data.plan === "PRO" ? "pro" : "hobby");
          hasFetchedRef.current = true; // Mark as fetched
        } else {
          // Default to hobby if fetch fails
          setUserPlan("hobby");
          hasFetchedRef.current = true;
        }
      } catch (error) {
        console.error("Failed to fetch user plan:", error);
        // Default to hobby if there's an error
        setUserPlan("hobby");
        hasFetchedRef.current = true;
      } finally {
        setIsLoadingPlan(false);
      }
    };

    fetchUserPlan();
  }, [session, status]);

  const handleProPayment = async () => {
    const amount = 50; // $50/month for Pro

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
              "📧 Email: support@craft.fast\n" +
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
          "📧 support@craft.fast\n\n" +
          "We apologize for the inconvenience."
      );
    }
  };

  const plans: PricingPlan[] = [
    {
      name: "Hobby",
      price: "Free",
      description: "Try Craft. Limited to 3 projects.",
      cta: isLoadingPlan
        ? "Loading..."
        : userPlan === "pro"
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
      price: "$50/mo",
      description: "Everything you need to build and scale your app.",
      cta: isLoadingPlan
        ? "Loading..."
        : !session
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
          text: "Purchase additional token packages as needed",
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
      name: "Agent",
      price: "$5,000/mo",
      description: "Delegate longer tasks with expert oversight.",
      cta: "Contact Sales",
      action: () => {
        window.location.href =
          "mailto:sales@craft.fast?subject=Agent Plan Inquiry";
      },
      features: [
        {
          text: "All Pro features, plus:",
          included: true,
          highlight: true,
        },
        { text: "100M AI tokens per month", included: true, highlight: true },
        { text: "Delegate long-running tasks", included: true },
        { text: "Expert oversight & review", included: true },
        { text: "Background task execution", included: true },
        { text: "Architecture & design review", included: true },
        { text: "2 GB database + 5 GB storage", included: true },
        { text: "Dedicated support", included: true },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header - Fixed */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md">
        <div className="px-3 sm:px-4 py-2">
          <div className="relative flex items-center justify-between">
            <Logo className="text-white dark:text-white" href="/" />
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
          <div
            id="pricing-plans"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch"
          >
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
                      isLoadingPlan ||
                      (plan.name === "Pro" && userPlan === "pro") ||
                      (plan.name === "Hobby" && userPlan === "hobby")
                    }
                    className={`w-full px-6 py-3 rounded-full font-medium transition-all duration-200 ${
                      isLoadingPlan ||
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
                      Agent
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
                        <a
                          href="#token-packages"
                          className="underline hover:text-neutral-900 dark:hover:text-neutral-200"
                        >
                          Purchase more
                        </a>
                      </div>
                    </td>
                    <td className="p-4 sm:p-6 text-xs sm:text-sm">
                      <div className="font-medium text-foreground mb-1">
                        100M tokens/month
                      </div>
                      <div className="text-neutral-600 dark:text-neutral-400">
                        <a
                          href="#token-packages"
                          className="underline hover:text-neutral-900 dark:hover:text-neutral-200"
                        >
                          Purchase more
                        </a>
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
                        Create as many as you need
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
                        2 GB free
                      </div>
                      <div className="text-neutral-600 dark:text-neutral-400 mb-1">
                        <span className="font-semibold">$0.10/GB/month</span>{" "}
                        after
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
                        5 GB free
                      </div>
                      <div className="text-neutral-600 dark:text-neutral-400 mb-1">
                        <span className="font-semibold">$0.05/GB/month</span>{" "}
                        after
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
                        No MAU limits
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

                  {/* Agent Plan Exclusive Features */}
                  <tr className="bg-neutral-50/50 dark:bg-neutral-800/30">
                    <td
                      colSpan={4}
                      className="p-3 sm:p-4 font-semibold text-sm text-neutral-700 dark:text-neutral-300 uppercase tracking-wide"
                    >
                      Agent Plan Exclusive Features
                    </td>
                  </tr>
                  <tr className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                    <td className="p-4 sm:p-6">
                      <div className="font-semibold text-foreground mb-1">
                        Long-Running Task Delegation
                      </div>
                      <div className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
                        Delegate tasks that take hours or days
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
                  </tr>
                  <tr className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                    <td className="p-4 sm:p-6">
                      <div className="font-semibold text-foreground mb-1">
                        Expert Oversight & Review
                      </div>
                      <div className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
                        All AI code reviewed by experts
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
                  </tr>
                  <tr className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                    <td className="p-4 sm:p-6">
                      <div className="font-semibold text-foreground mb-1">
                        Background Task Execution
                      </div>
                      <div className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
                        Tasks run in background without blocking
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
                  </tr>
                  <tr className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                    <td className="p-4 sm:p-6">
                      <div className="font-semibold text-foreground mb-1">
                        Architecture & Design Review
                      </div>
                      <div className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
                        Expert design and architecture guidance
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
                  </tr>
                  <tr className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                    <td className="p-4 sm:p-6">
                      <div className="font-semibold text-foreground mb-1">
                        Dedicated Support
                      </div>
                      <div className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
                        Priority access to support team
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
                        <span>Community only</span>
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
                        <span className="font-semibold">Priority email</span>
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
                        <span className="font-semibold">Dedicated</span>
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

          {/* Token Packages Section */}
          <div id="token-packages" className="mt-16 sm:mt-20">
            <div className="text-center mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
                Token Packages
              </h2>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 max-w-3xl mx-auto">
                Need more AI tokens? Purchase additional token packages to
                extend your monthly allocation.
              </p>
              {session && userPlan === "hobby" && !isLoadingPlan && (
                <div className="mt-4 max-w-2xl mx-auto">
                  <div className="bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-xl p-4">
                    <p className="text-sm text-neutral-700 dark:text-neutral-300">
                      📌 <strong>Pro plan required:</strong> Token packages are
                      only available to Pro subscribers.
                      <button
                        onClick={() =>
                          document
                            .getElementById("pricing-plans")
                            ?.scrollIntoView({ behavior: "smooth" })
                        }
                        className="ml-2 underline hover:text-neutral-900 dark:hover:text-neutral-100"
                      >
                        Upgrade to Pro
                      </button>
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="max-w-4xl mx-auto">
              <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-2xl overflow-hidden">
                <div className="divide-y divide-neutral-200 dark:divide-neutral-700">
                  {CREDIT_TIERS.map((tier, index) => {
                    // Calculate savings compared to base $5/1M rate
                    const basePrice = (tier.tokens / 1000000) * 5;
                    const savings = basePrice - tier.price;
                    const savingsPercent = Math.round(
                      (savings / basePrice) * 100
                    );

                    // Determine if this is the "best value" tier (5M tokens)
                    const isBestValue = tier.tokens === 5000000;

                    // Format token display (always show as M for millions)
                    const tokenDisplay =
                      tier.tokens >= 1000000
                        ? `${tier.tokens / 1000000}M`
                        : `${tier.tokens / 1000}K`;

                    return (
                      <div
                        key={index}
                        className={`p-4 sm:p-6 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors ${
                          isBestValue
                            ? "bg-neutral-50/50 dark:bg-neutral-800/30"
                            : ""
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                          {/* Left side - Token info */}
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-bold text-foreground">
                                {tokenDisplay} tokens
                              </h3>
                              {isBestValue && (
                                <span className="inline-block px-3 py-0.5 bg-neutral-900 dark:bg-neutral-100 text-neutral-50 dark:text-neutral-900 text-xs font-semibold rounded-full">
                                  Best Value
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-neutral-600 dark:text-neutral-400">
                              <span className="flex items-center gap-1">
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
                                Never expires
                              </span>
                              {savings > 0 && (
                                <span className="flex items-center gap-1 text-neutral-700 dark:text-neutral-300 font-medium">
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
                                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                  </svg>
                                  Save ${savings.toFixed(0)} ({savingsPercent}%
                                  off)
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Right side - Price and button */}
                          <div className="flex items-center gap-4 sm:gap-6">
                            <div className="text-right">
                              <div className="text-2xl sm:text-3xl font-bold text-foreground">
                                ${tier.price.toLocaleString()}
                              </div>
                              {savings > 0 && (
                                <div className="text-xs text-neutral-500 dark:text-neutral-500 line-through">
                                  ${basePrice.toFixed(0)}
                                </div>
                              )}
                            </div>
                            <button
                              disabled={
                                !session ||
                                userPlan === "hobby" ||
                                isLoadingPlan
                              }
                              className={`px-6 py-2.5 rounded-full font-medium transition-colors whitespace-nowrap ${
                                !session ||
                                userPlan === "hobby" ||
                                isLoadingPlan
                                  ? "bg-neutral-300 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-400 cursor-not-allowed"
                                  : isBestValue
                                  ? "bg-neutral-900 dark:bg-neutral-100 text-neutral-50 dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200 shadow-sm hover:shadow-md"
                                  : "bg-neutral-100 dark:bg-neutral-800 text-foreground hover:bg-neutral-200 dark:hover:bg-neutral-700 border border-neutral-300 dark:border-neutral-600"
                              }`}
                            >
                              {!session
                                ? "Sign in to purchase"
                                : userPlan === "hobby"
                                ? "Pro required"
                                : "Purchase"}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mt-6 text-center">
              <p className="text-xs text-neutral-500 dark:text-neutral-500">
                Token packages are one-time purchases that add to your account
                balance and never expire.
                <br />
                All purchases require an active Pro or Agent plan subscription.
              </p>
            </div>
          </div>

          {/* Frequently Asked Questions Section */}
          <FAQSection />

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
                    "mailto:sales@craft.fast?subject=Agent Plan Inquiry")
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
