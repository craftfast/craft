"use client";

import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { useState, useEffect, useRef } from "react";
import Logo from "@/components/Logo";
import HeaderNav from "@/components/HeaderNav";
import Footer from "@/components/Footer";
import { PRO_TIERS } from "@/lib/pricing-constants";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
          <strong>Hobby:</strong> Free forever with up to 3 projects and 100
          credits/month. Perfect for trying out Craft. <strong>Pro:</strong>{" "}
          Choose from multiple tiers ranging from $25/month (500 credits/month)
          to $2,000/month (100,000 credits/month). Connect your own Supabase
          account for database and storage.
        </>
      ),
    },
    {
      question: "What's the difference between Hobby and Pro?",
      answer: (
        <>
          <strong>Hobby:</strong> Limited to 3 projects, no Figma/GitHub
          imports, includes Craft branding, and 100 credits per month.{" "}
          <strong>Pro:</strong> Unlimited projects, Figma/GitHub imports,
          without branding, and 500-100,000 credits per month based on your
          selected tier. You can change between Pro tiers anytime.
        </>
      ),
    },
    {
      question: "Can I upgrade from Hobby to Pro?",
      answer:
        "Yes! Upgrade anytime to unlock unlimited projects, Figma/GitHub imports, and much higher AI credit limits. Your existing projects will be preserved and immediately benefit from the Pro features.",
    },
    {
      question: "Can I cancel anytime?",
      answer:
        "Yes. No commitments. Cancel your Pro subscription anytime from your dashboard. Cancellations and downgrades to Hobby will be effective at the next billing cycle, so you'll retain full access until the end of your current billing period.",
    },
    {
      question: "How do credits work?",
      answer:
        "Credits are your monthly AI usage allocation. Hobby gets 100 credits/month. Pro plans range from 500 to 100,000 credits/month depending on your tier. Credits refresh monthly and don't roll over.",
    },
    {
      question: "What happens if I run out of credits?",
      answer: (
        <>
          If you exceed your monthly credit allocation, you&apos;ll need to wait
          until the next month when your credits refresh, or{" "}
          <a
            href="#pro-tiers"
            className="underline hover:text-neutral-900 dark:hover:text-neutral-200"
          >
            upgrade to a higher Pro tier
          </a>{" "}
          for more monthly credits. Your projects will continue working, and
          you&apos;ll be notified when approaching your limit.
        </>
      ),
    },
    {
      question: "What AI models do you support?",
      answer:
        "Craft supports Claude AI models: Claude Haiku 4.5 (fast & efficient) and Claude Sonnet 4.5 (most capable). You can switch between models based on your needs, with credit usage calculated from AI usage.",
    },
    {
      question: "Do unused credits roll over?",
      answer:
        "No, monthly credit allocations refresh at the start of each billing period and don't roll over. This ensures fair usage and predictable costs. If you consistently need more credits, consider upgrading to a higher Pro tier.",
    },
    {
      question: "What's included in the Enterprise plan?",
      answer:
        "The Enterprise plan includes everything in Pro plus: custom AI credit allocation, dedicated account manager, priority support with SLA, custom integrations, advanced security features, volume discounts, and custom contract terms. Contact sales@craft.fast for pricing and details.",
    },
    {
      question: "Can I use my own infrastructure?",
      answer:
        "Yes! Craft is a pure coding tool. You can connect your own Supabase account for database and storage. We support integrations with Figma (for design imports), GitHub (for code sync), and Vercel (for deployment). This gives you full control over your infrastructure while enjoying Craft's AI-powered development experience.",
    },
    {
      question: "What payment methods do you accept?",
      answer:
        "We accept all major credit cards (Visa, Mastercard, American Express, Discover) through our secure payment processor Polar. All transactions are encrypted and PCI-compliant.",
    },
    {
      question: "How do integrations work?",
      answer:
        "Craft integrates with best-in-class tools: Supabase for database & storage, Figma for design imports, GitHub for code sync, and Vercel for deployment. Pro and Enterprise plans include full access to these integrations. Simply connect your accounts and Craft handles the rest.",
    },
    {
      question: "Can I get a refund?",
      answer:
        "Yes, we offer refunds within 14 days of purchase for monthly subscriptions. Please see our Cancellation & Refund Policy for complete details.",
    },
    {
      question: "Can I change my Pro tier?",
      answer:
        "Yes! You can upgrade or downgrade between Pro tiers at any time from your dashboard. Upgrades take effect immediately, while downgrades will be effective at the next billing cycle.",
    },
    {
      question: "What happens to my projects if I downgrade?",
      answer:
        "If you downgrade from Pro to Hobby, you'll need to select 3 projects to keep active. Other projects will be archived and can be restored by upgrading back to Pro. All your data is safely preserved.",
    },
    {
      question: "Do you offer discounts for annual plans?",
      answer:
        "Currently, we offer monthly billing only. Higher Pro tiers provide better value with more credits per dollar. Contact sales@craft.fast for information about annual contracts for Enterprise plans.",
    },
    {
      question: "What kind of support do you provide?",
      answer:
        "Hobby plan includes community support via our Discord and documentation. Pro plan includes priority email support with 24-48 hour response time. Enterprise plan includes dedicated support with direct access to our engineering team and guaranteed SLA.",
    },
    {
      question: "Can I transfer projects between accounts?",
      answer:
        "Project transfers between accounts are not currently supported. For team collaboration needs or multi-user access requirements, please contact our sales team about custom solutions.",
    },
  ];

  return (
    <div id="faq" className="mt-16 sm:mt-20">
      <div>
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
  const { data: session, isPending } = useSession();
  const [userPlan, setUserPlan] = useState<
    "hobby" | "pro" | "enterprise" | null
  >(null);
  const [isLoadingPlan, setIsLoadingPlan] = useState(false);
  const hasFetchedRef = useRef(false);
  const [selectedProTier, setSelectedProTier] = useState<
    (typeof PRO_TIERS)[number]
  >(PRO_TIERS[0]); // Default to 500 credits/month ($25/mo)
  const [currentMonthlyCredits, setCurrentMonthlyCredits] = useState<
    number | null
  >(null); // Track user's current Pro tier credits

  // Fetch user's actual subscription plan (only once when authenticated)
  useEffect(() => {
    // Skip if already fetched, not authenticated, or still loading session
    if (hasFetchedRef.current || isPending || !session?.user) {
      if (!session?.user) {
        setUserPlan(null);
        setCurrentMonthlyCredits(null);
        hasFetchedRef.current = false; // Reset if user logs out
      }
      return;
    }

    const fetchUserPlan = async () => {
      setIsLoadingPlan(true);
      try {
        const response = await fetch("/api/billing/subscription");
        if (response.ok) {
          const data = await response.json();
          // Map plan names to lowercase for consistency
          const planName = data.plan?.name?.toLowerCase();
          setUserPlan(
            planName === "pro"
              ? "pro"
              : planName === "enterprise"
              ? "enterprise"
              : "hobby"
          );

          // Store current monthly credits if user is on Pro
          if (planName === "pro" && data.plan?.monthlyCredits) {
            setCurrentMonthlyCredits(data.plan.monthlyCredits);

            // Find matching tier and set as selected
            const matchingTierIndex = PRO_TIERS.findIndex(
              (tier) => tier.monthlyCredits === data.plan.monthlyCredits
            );
            if (matchingTierIndex !== -1) {
              setSelectedProTier(PRO_TIERS[matchingTierIndex]);
            }
          }

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
  }, [session, isPending]);

  const handleProPayment = async () => {
    // Redirect to signup if not authenticated
    if (!session?.user) {
      router.push("/auth/signup?callbackUrl=/&plan=pro");
      return;
    }

    try {
      // Call the upgrade-to-pro API with the selected tier's monthly credits
      const response = await fetch("/api/billing/upgrade-to-pro", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          monthlyCredits: selectedProTier.monthlyCredits,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to initiate upgrade");
      }

      // Redirect to checkout URL
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error("No checkout URL received");
      }
    } catch (error) {
      console.error("Payment failed:", error);
      const errorMsg =
        error instanceof Error ? error.message : "An unexpected error occurred";

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
    }
  };

  // Plan data

  const handleEnterpriseContact = () => {
    window.location.href =
      "mailto:sales@craft.fast?subject=Enterprise Plan Inquiry";
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
        : userPlan === "enterprise"
        ? "Downgrade"
        : userPlan === "hobby"
        ? "Current plan"
        : "Start Crafting",
      action: () => router.push("/auth/signup?callbackUrl=/"),
      features: [
        {
          text: "100 credits per month",
          included: true,
          highlight: true,
        },
        { text: "Up to 3 projects", included: true },
        { text: "AI-powered chat interface", included: true },
        { text: "Live preview environment", included: true },
        { text: "Deploy to Vercel", included: true },
        { text: "Supabase integration (database & storage)", included: true },
        { text: "Craft branding on projects", included: true },
        { text: "Community support", included: true },
      ],
    },
    {
      name: "Pro",
      price: selectedProTier.displayPrice,
      description: "Everything you need to build and scale your app.",
      cta: isLoadingPlan
        ? "Loading..."
        : !session
        ? "Upgrade Now"
        : userPlan === "pro"
        ? selectedProTier.monthlyCredits === currentMonthlyCredits
          ? "Current Tier"
          : "Change Tier"
        : userPlan === "enterprise"
        ? "Downgrade to Pro"
        : "Upgrade Now",
      popular: true,
      action: !session
        ? () => {
            // Find the index of the selected tier for signup redirect
            const tierIndex = PRO_TIERS.findIndex(
              (t) => t.monthlyCredits === selectedProTier.monthlyCredits
            );
            console.log(
              "Pricing page (signup) - Selected tier:",
              selectedProTier
            );
            console.log("Pricing page (signup) - Tier index:", tierIndex);
            router.push(
              `/auth/signup?callbackUrl=/&plan=pro&tier=${tierIndex}`
            );
          }
        : userPlan === "pro"
        ? () => {
            // For Pro users, redirect to settings billing with selected tier
            const tierIndex = PRO_TIERS.findIndex(
              (t) => t.monthlyCredits === selectedProTier.monthlyCredits
            );
            console.log(
              "Pricing page - Pro user changing tier:",
              selectedProTier
            );
            console.log("Pricing page - Tier index:", tierIndex);
            // Open settings modal with billing tab and selected tier
            router.push(`/?settings=billing&tier=${tierIndex}`);
          }
        : () => {
            // Find the index of the selected tier
            const tierIndex = PRO_TIERS.findIndex(
              (t) => t.monthlyCredits === selectedProTier.monthlyCredits
            );
            console.log("Pricing page - Selected tier:", selectedProTier);
            console.log("Pricing page - Tier index:", tierIndex);
            console.log(
              "Pricing page - Redirecting to:",
              `/?plan=pro&tier=${tierIndex}`
            );
            // Redirect to home with plan and tier parameters
            router.push(`/?plan=pro&tier=${tierIndex}`);
          },
      features: [
        { text: "Everything in hobby, plus:", included: true, highlight: true },
        {
          text: `${selectedProTier.monthlyCredits} credits per month`,
          included: true,
          highlight: true,
        },
        { text: "Unlimited projects", included: true, highlight: false },
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
        { text: "Priority email support", included: true, highlight: false },
      ],
    },
    {
      name: "Enterprise",
      price: "Custom",
      description: "Custom solutions for large teams and organizations.",
      cta: "Contact Sales",
      action: handleEnterpriseContact,
      features: [
        {
          text: "All Pro features, plus:",
          included: true,
          highlight: true,
        },
        {
          text: "Custom AI credit allocation",
          included: true,
          highlight: true,
        },
        { text: "Dedicated account manager", included: true },
        { text: "Priority support & SLA", included: true },
        { text: "Custom integrations", included: true },
        { text: "Advanced security features", included: true },
        { text: "Volume discounts", included: true },
        { text: "Custom contract terms", included: true },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header - Fixed */}
      <header className="fixed top-0 left-0 right-0 z-[40] bg-background/80 backdrop-blur-md">
        <div className="px-3 sm:px-4 py-2">
          <div className="relative flex items-center justify-between">
            <Logo
              variant="extended"
              className="text-white dark:text-white"
              href="/"
            />
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
              Simple, transparent pricing for builders. Choose from monthly
              credit allocations that match your AI usage needs.
            </p>
          </div>

          {/* Pricing Cards - Hobby, Pro, and Enterprise */}
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
                      (plan.name === "Pro" &&
                        userPlan === "pro" &&
                        selectedProTier.monthlyCredits ===
                          currentMonthlyCredits) ||
                      (plan.name === "Hobby" && userPlan === "hobby") ||
                      (plan.name === "Enterprise" && userPlan === "enterprise")
                    }
                    className={`w-full px-6 py-3 rounded-full font-medium transition-all duration-200 ${
                      isLoadingPlan ||
                      (plan.name === "Pro" &&
                        userPlan === "pro" &&
                        selectedProTier.monthlyCredits ===
                          currentMonthlyCredits) ||
                      (plan.name === "Hobby" && userPlan === "hobby") ||
                      (plan.name === "Enterprise" && userPlan === "enterprise")
                        ? "bg-neutral-300 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-400 cursor-not-allowed"
                        : plan.popular
                        ? "bg-neutral-900 dark:bg-neutral-100 text-neutral-50 dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200 shadow-md hover:shadow-lg"
                        : "bg-neutral-100 dark:bg-neutral-800 text-foreground hover:bg-neutral-200 dark:hover:bg-neutral-700 border border-neutral-300 dark:border-neutral-600"
                    }`}
                  >
                    {plan.cta}
                  </button>

                  {/* Pro Tier Selector */}
                  {plan.name === "Pro" && (
                    <div className="mt-4">
                      <Select
                        value={selectedProTier.monthlyCredits.toString()}
                        onValueChange={(value) => {
                          const tier = PRO_TIERS.find(
                            (t) => t.monthlyCredits === parseInt(value)
                          );
                          if (tier) setSelectedProTier(tier);
                        }}
                      >
                        <SelectTrigger className="w-full rounded-full h-11 px-4 bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors">
                          <SelectValue placeholder="Select tier">
                            {selectedProTier.monthlyCredits} credits / month
                            {userPlan === "pro" &&
                              selectedProTier.monthlyCredits ===
                                currentMonthlyCredits && (
                                <span className="ml-2 text-xs text-neutral-600 dark:text-neutral-400">
                                  (Current)
                                </span>
                              )}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-neutral-200 dark:border-neutral-700">
                          {PRO_TIERS.map((tier) => (
                            <SelectItem
                              key={tier.monthlyCredits}
                              value={tier.monthlyCredits.toString()}
                              className="rounded-lg cursor-pointer"
                            >
                              <div className="flex items-center justify-between w-full">
                                <span>
                                  {tier.monthlyCredits} credits / month
                                </span>
                                {userPlan === "pro" &&
                                  tier.monthlyCredits ===
                                    currentMonthlyCredits && (
                                    <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300">
                                      Current
                                    </span>
                                  )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
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

          {/* Frequently Asked Questions Section */}
          <FAQSection />
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
