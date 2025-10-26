"use client";

import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";
import HeaderNav from "@/components/HeaderNav";
import Footer from "@/components/Footer";
import {
  Sparkles,
  Zap,
  Shield,
  Clock,
  Database,
  HeadphonesIcon,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

export default function AgentPage() {
  const router = useRouter();

  const handleContactSales = () => {
    window.location.href = "mailto:sales@craft.fast?subject=Agent Plan Inquiry";
  };

  const features = [
    {
      icon: Sparkles,
      title: "100M Tokens per Month",
      description:
        "Massive token allocation for extensive AI-powered development work",
    },
    {
      icon: Zap,
      title: "Long-Running Tasks",
      description:
        "Delegate complex projects that run in the background with expert oversight",
    },
    {
      icon: Shield,
      title: "Architecture Review",
      description:
        "Get expert feedback on system design and architectural decisions",
    },
    {
      icon: Clock,
      title: "Background Execution",
      description:
        "Tasks continue running even when you&apos;re not actively monitoring",
    },
    {
      icon: Database,
      title: "Supabase & Vercel Integration",
      description:
        "Connect your own Supabase database and deploy to Vercel with one click",
    },
    {
      icon: HeadphonesIcon,
      title: "Dedicated Support",
      description:
        "Direct access to our engineering team for priority assistance",
    },
  ];

  const benefits = [
    "Everything in Pro plan included",
    "100M AI tokens per month",
    "Unlimited projects",
    "Priority model access (GPT-4, Claude 3.5)",
    "Figma & GitHub imports",
    "Long-running task delegation",
    "Background task execution",
    "Architecture & design review",
    "Supabase integration (database & storage)",
    "Vercel deployment",
    "Dedicated support channel",
    "Direct engineering team access",
    "Priority feature requests",
    "Custom workflows & automations",
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-neutral-200 dark:border-neutral-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Logo variant="extended" href="/" />
            <HeaderNav />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 sm:py-28">
        <div className="absolute inset-0 bg-gradient-to-br from-stone-50 via-background to-stone-100 dark:from-neutral-900 dark:via-background dark:to-neutral-800 opacity-60" />

        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-100 dark:bg-neutral-800 rounded-full mb-6">
              <Sparkles className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
              <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Enterprise-Grade AI Development
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-neutral-900 to-neutral-600 dark:from-neutral-100 dark:to-neutral-400 bg-clip-text text-transparent">
              Craft Agent Plan
            </h1>

            <p className="text-xl sm:text-2xl text-neutral-600 dark:text-neutral-400 mb-8 max-w-2xl mx-auto">
              For teams and organizations that need advanced AI capabilities,
              expert oversight, and dedicated support
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={handleContactSales}
                className="px-8 py-4 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-full font-semibold hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors flex items-center gap-2"
              >
                Contact Sales
                <ArrowRight className="w-5 h-5" />
              </button>

              <button
                onClick={() => router.push("/pricing")}
                className="px-8 py-4 bg-transparent border-2 border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 rounded-full font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                View All Plans
              </button>
            </div>

            <div className="mt-8 text-neutral-600 dark:text-neutral-400">
              <p className="text-3xl font-bold mb-2">$5,000/month</p>
              <p className="text-sm">Billed monthly · Cancel anytime</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-neutral-50 dark:bg-neutral-900/50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12">
              Everything You Need
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => {
                const IconComponent = feature.icon;
                return (
                  <div
                    key={index}
                    className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors"
                  >
                    <div className="w-12 h-12 bg-neutral-100 dark:bg-neutral-800 rounded-xl flex items-center justify-center mb-4">
                      <IconComponent className="w-6 h-6 text-neutral-700 dark:text-neutral-300" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-neutral-600 dark:text-neutral-400">
                      {feature.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Full Benefits List */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12">
              Complete Feature Set
            </h2>

            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-8 sm:p-12">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-neutral-700 dark:text-neutral-300 flex-shrink-0 mt-0.5" />
                    <span className="text-neutral-700 dark:text-neutral-300">
                      {benefit}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 bg-neutral-50 dark:bg-neutral-900/50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12">
              Perfect For
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800">
                <h3 className="text-xl font-semibold mb-3">
                  Development Teams
                </h3>
                <p className="text-neutral-600 dark:text-neutral-400">
                  Scale your team&apos;s productivity with AI-powered
                  development tools and dedicated support for complex projects.
                </p>
              </div>

              <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800">
                <h3 className="text-xl font-semibold mb-3">
                  Enterprise Organizations
                </h3>
                <p className="text-neutral-600 dark:text-neutral-400">
                  Build mission-critical applications with enhanced capacity,
                  security, and direct engineering support.
                </p>
              </div>

              <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800">
                <h3 className="text-xl font-semibold mb-3">Product Studios</h3>
                <p className="text-neutral-600 dark:text-neutral-400">
                  Deliver multiple client projects simultaneously with massive
                  token allocations and unlimited projects.
                </p>
              </div>

              <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800">
                <h3 className="text-xl font-semibold mb-3">
                  Technical Founders
                </h3>
                <p className="text-neutral-600 dark:text-neutral-400">
                  Get expert architecture reviews and delegate long-running
                  development tasks while you focus on strategy.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-neutral-600 dark:text-neutral-400 mb-8">
              Contact our sales team to discuss your specific needs and get a
              custom onboarding plan.
            </p>

            <button
              onClick={handleContactSales}
              className="px-8 py-4 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-full font-semibold hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors text-lg flex items-center gap-2 mx-auto"
            >
              Contact Sales Team
              <ArrowRight className="w-5 h-5" />
            </button>

            <p className="mt-6 text-sm text-neutral-500 dark:text-neutral-400">
              We typically respond within 24 hours
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
