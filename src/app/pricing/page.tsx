import SidebarLayout from "@/components/SidebarLayout";
import AppHeader from "@/components/AppHeader";
import Link from "next/link";

export const metadata = {
  title: "Pricing - Craft",
  description:
    "Transparent, pay-as-you-go pricing. 10% flat platform fee, then pay exact provider costs for AI models, E2B sandbox, Supabase backend, and Vercel deployment - zero markup.",
};

// External links for transparency - All services at actual cost
const EXTERNAL_LINKS = {
  anthropic: "https://www.anthropic.com/pricing#702",
  openai: "https://platform.openai.com/docs/pricing",
  google: "https://ai.google.dev/gemini-api/docs/pricing",
  xai: "https://docs.x.ai/docs/models",
  e2b: "https://e2b.dev/pricing",
  supabase: "https://supabase.com/pricing",
  supabasePlatforms:
    "https://supabase.com/docs/guides/integrations/supabase-for-platforms",
  vercel: "https://vercel.com/pricing",
  vercelPlatforms:
    "https://vercel.com/docs/accounts/plans/managed-infrastructure",
};

export default function PricingPage() {
  // AI Models with exact provider pricing
  const aiModels = {
    budget: [
      {
        name: "Grok Code Fast 1",
        provider: "xAI",
        input: 0.2,
        output: 1.5,
        context: "256K",
        badge: "Cheapest",
        link: EXTERNAL_LINKS.xai,
      },
      {
        name: "GPT-5 Mini",
        provider: "OpenAI",
        input: 0.25,
        output: 2.0,
        context: "400K",
        badge: null,
        link: EXTERNAL_LINKS.openai,
      },
      {
        name: "Gemini 2.5 Flash",
        provider: "Google",
        input: 0.3,
        output: 2.5,
        context: "1M",
        badge: "Largest Context",
        link: EXTERNAL_LINKS.google,
      },
      {
        name: "Claude Haiku 4.5",
        provider: "Anthropic",
        input: 1.0,
        output: 5.0,
        context: "200K",
        badge: null,
        link: EXTERNAL_LINKS.anthropic,
      },
    ],
    premium: [
      {
        name: "GPT-5.1",
        provider: "OpenAI",
        input: 1.25,
        output: 10.0,
        context: "400K",
        badge: null,
        link: EXTERNAL_LINKS.openai,
      },
      {
        name: "Gemini 3 Pro",
        provider: "Google",
        input: 2.0,
        output: 12.0,
        context: "1M",
        badge: "Multimodal",
        link: EXTERNAL_LINKS.google,
      },
      {
        name: "Claude Sonnet 4.5",
        provider: "Anthropic",
        input: 3.0,
        output: 15.0,
        context: "1M",
        badge: "Default",
        link: EXTERNAL_LINKS.anthropic,
      },
    ],
  };

  // What credits are used for
  const creditUsage = [
    {
      icon: (
        <svg
          className="w-6 h-6"
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
      ),
      title: "AI Models",
      description:
        "Code generation, debugging, and assistance from leading AI providers",
      details: "Pay exact provider rates with zero markup",
    },
    {
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"
          />
        </svg>
      ),
      title: "Sandbox Compute",
      description: "Live development environments powered by E2B",
      details: "$0.20/hour while active, $0 when paused",
    },
    {
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
          />
        </svg>
      ),
      title: "File Storage",
      description: "App files stored in Supabase Storage",
      details: "$0.021/GB per month",
    },
  ];

  const faqs = [
    {
      question: "How does the pricing work?",
      answer:
        "We charge a 10% flat platform fee when you top up your balance. After that, all provider services (AI models, E2B sandbox, Supabase backend, Vercel deployment) are billed at exact cost with zero markup. You can verify our prices against official provider pricing pages.",
    },
    {
      question: "What is included in the 10% platform fee?",
      answer:
        "The 10% platform fee covers payment processing, platform infrastructure, support, and ongoing development. This allows us to pass through all provider costs at zero markup, giving you complete transparency.",
    },
    {
      question: "Do my credits expire?",
      answer:
        "Yes, credits are valid for 1 year from the date of purchase. We'll send you reminder emails before expiration. This policy helps us maintain competitive pricing and platform sustainability.",
    },
    {
      question: "How do I track my usage?",
      answer:
        "Go to Dashboard → Usage to see a detailed breakdown of your AI, sandbox, database, and storage costs. Track usage by day, week, or month and see exactly which services are using your credits.",
    },
    {
      question: "What services are included?",
      answer:
        "Your credits cover: AI models (Claude, GPT, Gemini, Grok), E2B sandboxes for live preview, Supabase backend (database, auth, file storage), and Vercel deployment. All at exact provider cost with zero markup.",
    },
    {
      question: "Can I import existing projects?",
      answer:
        "Yes! You can import Next.js projects from GitHub that match our templates, and import designs from Figma to convert them to code using AI.",
    },
    {
      question: "How do environment variables work?",
      answer:
        "You can add environment variables via project settings. Secret values are encrypted at rest and never displayed after creation. They're automatically injected into your sandbox and deployments.",
    },
    {
      question: "What payment methods do you accept?",
      answer:
        "We accept all major credit cards, debit cards, UPI, and net banking through Razorpay. For Indian customers, 18% GST is additionally applicable. All payments are securely processed.",
    },
    {
      question: "Can I get a refund?",
      answer:
        "Credits are non-refundable once purchased, but they're valid for 1 year. If you have any issues, contact us at support@craftfast.ai.",
    },
  ];

  return (
    <SidebarLayout>
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        {/* Header */}
        <AppHeader />

        {/* Main Content */}
        <main className="flex-1 pb-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Hero Section */}
            <div className="text-center py-12 sm:py-16">
              <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
                Transparent, Pay-As-You-Go Pricing
              </h1>
              <p className="text-lg text-neutral-600 dark:text-neutral-400 max-w-3xl mx-auto mb-6">
                10% flat platform fee on top-ups. Then pay exact provider costs
                for AI models, E2B sandboxes, Supabase backend, and Vercel
                deployment — zero markup on any service.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-100 dark:bg-neutral-800 rounded-full text-sm">
                  <svg
                    className="w-5 h-5 text-neutral-600 dark:text-neutral-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="text-neutral-700 dark:text-neutral-300">
                    Zero markup on services
                  </span>
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-100 dark:bg-neutral-800 rounded-full text-sm">
                  <svg
                    className="w-5 h-5 text-neutral-600 dark:text-neutral-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="text-neutral-700 dark:text-neutral-300">
                    Credits valid for 1 year
                  </span>
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-100 dark:bg-neutral-800 rounded-full text-sm">
                  <svg
                    className="w-5 h-5 text-neutral-600 dark:text-neutral-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                  <span className="text-neutral-700 dark:text-neutral-300">
                    Top AI models for coding
                  </span>
                </div>
              </div>
            </div>

            {/* How It Works - Complete Flow */}
            <div className="mb-20">
              <div className="text-center mb-10">
                <h2 className="text-3xl font-bold text-foreground mb-4">
                  How It Works
                </h2>
                <p className="text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
                  Build production-ready Next.js apps with AI assistance,
                  instant preview, and one-click deployment
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                {/* Step 1: AI Code Generation */}
                <div className="relative bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-6">
                  <div className="absolute -top-3 -left-3 w-8 h-8 bg-neutral-900 dark:bg-neutral-100 text-neutral-100 dark:text-neutral-900 rounded-full flex items-center justify-center font-bold text-sm">
                    1
                  </div>
                  <div className="w-12 h-12 bg-neutral-100 dark:bg-neutral-800 rounded-xl flex items-center justify-center mb-4">
                    <svg
                      className="w-6 h-6 text-neutral-700 dark:text-neutral-300"
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
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    AI Code Generation
                  </h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">
                    Use top AI models (Claude, GPT, Gemini, Grok) ranked by
                    SWE-bench for code generation. Pay exact provider rates.
                  </p>
                  <div className="text-xs text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded-full inline-block">
                    Zero markup
                  </div>
                </div>

                {/* Step 2: E2B Live Preview */}
                <div className="relative bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-6">
                  <div className="absolute -top-3 -left-3 w-8 h-8 bg-neutral-900 dark:bg-neutral-100 text-neutral-100 dark:text-neutral-900 rounded-full flex items-center justify-center font-bold text-sm">
                    2
                  </div>
                  <div className="w-12 h-12 bg-neutral-100 dark:bg-neutral-800 rounded-xl flex items-center justify-center mb-4">
                    <svg
                      className="w-6 h-6 text-neutral-700 dark:text-neutral-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    E2B Live Preview
                  </h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">
                    Instant code execution and live preview in E2B sandboxes.
                    Auto-pauses when idle to save costs.
                  </p>
                  <a
                    href={EXTERNAL_LINKS.e2b}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded-full inline-flex items-center gap-1 hover:text-foreground transition-colors"
                  >
                    E2B pricing
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                  </a>
                </div>

                {/* Step 3: Supabase Backend */}
                <div className="relative bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-6">
                  <div className="absolute -top-3 -left-3 w-8 h-8 bg-neutral-900 dark:bg-neutral-100 text-neutral-100 dark:text-neutral-900 rounded-full flex items-center justify-center font-bold text-sm">
                    3
                  </div>
                  <div className="w-12 h-12 bg-neutral-100 dark:bg-neutral-800 rounded-xl flex items-center justify-center mb-4">
                    <svg
                      className="w-6 h-6 text-neutral-700 dark:text-neutral-300"
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
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Supabase Backend
                  </h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">
                    Database, Auth, Storage, and Edge Functions via Supabase for
                    Platforms. Full backend at actual cost.
                  </p>
                  <a
                    href={EXTERNAL_LINKS.supabasePlatforms}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded-full inline-flex items-center gap-1 hover:text-foreground transition-colors"
                  >
                    Supabase pricing
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                  </a>
                </div>

                {/* Step 4: Vercel Deployment */}
                <div className="relative bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-6">
                  <div className="absolute -top-3 -left-3 w-8 h-8 bg-neutral-900 dark:bg-neutral-100 text-neutral-100 dark:text-neutral-900 rounded-full flex items-center justify-center font-bold text-sm">
                    4
                  </div>
                  <div className="w-12 h-12 bg-neutral-100 dark:bg-neutral-800 rounded-xl flex items-center justify-center mb-4">
                    <svg
                      className="w-6 h-6 text-neutral-700 dark:text-neutral-300"
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
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Vercel Deployment
                  </h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">
                    Deploy to production via Vercel for Platforms. Preview URLs,
                    custom domains, and edge hosting.
                  </p>
                  <a
                    href={EXTERNAL_LINKS.vercelPlatforms}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded-full inline-flex items-center gap-1 hover:text-foreground transition-colors"
                  >
                    Vercel pricing
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                  </a>
                </div>
              </div>

              {/* Additional Features */}
              <div className="bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  Additional Features
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-neutral-200 dark:bg-neutral-700 rounded-lg flex items-center justify-center shrink-0">
                      <svg
                        className="w-4 h-4 text-neutral-600 dark:text-neutral-300"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        GitHub Import
                      </p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        Import Next.js projects
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-neutral-200 dark:bg-neutral-700 rounded-lg flex items-center justify-center shrink-0">
                      <svg
                        className="w-4 h-4 text-neutral-600 dark:text-neutral-300"
                        viewBox="0 0 38 57"
                        fill="currentColor"
                      >
                        <path d="M19 28.5c0 5.247-4.253 9.5-9.5 9.5S0 33.747 0 28.5 4.253 19 9.5 19 19 23.253 19 28.5z" />
                        <path d="M38 9.5C38 4.253 33.747 0 28.5 0S19 4.253 19 9.5v9.5h9.5c5.247 0 9.5-4.253 9.5-9.5z" />
                        <path d="M0 9.5C0 14.747 4.253 19 9.5 19H19V9.5C19 4.253 14.747 0 9.5 0S0 4.253 0 9.5z" />
                        <path d="M0 47.5C0 52.747 4.253 57 9.5 57S19 52.747 19 47.5V38H9.5C4.253 38 0 42.253 0 47.5z" />
                        <path d="M19 47.5c0 5.247 4.253 9.5 9.5 9.5s9.5-4.253 9.5-9.5-4.253-9.5-9.5-9.5H19v9.5z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Figma Import
                      </p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        Design to code
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-neutral-200 dark:bg-neutral-700 rounded-lg flex items-center justify-center shrink-0">
                      <svg
                        className="w-4 h-4 text-neutral-600 dark:text-neutral-300"
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
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Environment Variables
                      </p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        Secure secrets management
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-neutral-200 dark:bg-neutral-700 rounded-lg flex items-center justify-center shrink-0">
                      <svg
                        className="w-4 h-4 text-neutral-600 dark:text-neutral-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Usage Dashboard
                      </p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        Track all costs in real-time
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Pricing Model Explanation */}
            <div className="mb-20">
              <div className="bg-linear-to-br from-neutral-100 to-neutral-50 dark:from-neutral-800 dark:to-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-8">
                <div className="max-w-3xl mx-auto text-center mb-8">
                  <h2 className="text-2xl font-bold text-foreground mb-4">
                    Our Simple Pricing Model
                  </h2>
                  <p className="text-neutral-600 dark:text-neutral-400">
                    We charge a{" "}
                    <strong className="text-foreground">
                      10% flat platform fee
                    </strong>{" "}
                    on top-ups. This covers payment processing, platform
                    infrastructure, and support. All provider services (AI,
                    sandbox, database, deployment) are passed through at{" "}
                    <strong className="text-foreground">
                      exact cost with zero markup
                    </strong>
                    .
                  </p>
                </div>

                {/* Pricing Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  {[
                    { credits: 10, fee: 1, total: 11 },
                    { credits: 25, fee: 2.5, total: 27.5 },
                    { credits: 50, fee: 5, total: 55 },
                    { credits: 100, fee: 10, total: 110 },
                  ].map((example, idx) => (
                    <div
                      key={idx}
                      className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl p-4"
                    >
                      <div className="text-2xl font-bold text-foreground mb-1">
                        ${example.credits}
                      </div>
                      <div className="text-xs text-neutral-500 dark:text-neutral-400 mb-3">
                        credits
                      </div>
                      <div className="space-y-1 text-xs text-neutral-500 dark:text-neutral-400 border-t border-neutral-200 dark:border-neutral-700 pt-3">
                        <div className="flex justify-between">
                          <span>Service fee (10%)</span>
                          <span>${example.fee.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-semibold text-foreground pt-1 border-t border-neutral-200 dark:border-neutral-700">
                          <span>Total</span>
                          <span>${example.total.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* GST Note for Indian customers */}
                <div className="flex items-start gap-2 p-3 bg-neutral-200/50 dark:bg-neutral-700/50 rounded-lg">
                  <svg
                    className="w-5 h-5 text-neutral-600 dark:text-neutral-400 shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    <strong className="text-foreground">
                      Note for Indian customers:
                    </strong>{" "}
                    18% GST is additionally applicable as per Indian tax
                    regulations.
                  </p>
                </div>
              </div>
            </div>

            {/* What Credits Pay For */}
            <div className="mb-20">
              <div className="text-center mb-10">
                <h2 className="text-3xl font-bold text-foreground mb-4">
                  What Your Credits Pay For
                </h2>
                <p className="text-neutral-600 dark:text-neutral-400">
                  Three types of usage, all tracked in your Usage dashboard
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {creditUsage.map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-6"
                  >
                    <div className="w-12 h-12 bg-neutral-100 dark:bg-neutral-800 rounded-xl flex items-center justify-center mb-4 text-neutral-700 dark:text-neutral-300">
                      {item.icon}
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      {item.title}
                    </h3>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">
                      {item.description}
                    </p>
                    <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-3 py-1.5 rounded-full inline-block">
                      {item.details}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Model Pricing - Transparent */}
            <div className="mb-20">
              <div className="text-center mb-10">
                <h2 className="text-3xl font-bold text-foreground mb-4">
                  AI Model Pricing
                </h2>
                <p className="text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
                  We pass through exact provider pricing with zero markup. Click
                  any provider link to verify our rates match theirs.
                </p>
              </div>

              {/* Budget Models */}
              <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-2xl overflow-hidden mb-6">
                <div className="px-6 py-4 bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-700">
                  <h3 className="text-lg font-semibold text-foreground">
                    Budget Models
                  </h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Fast, cost-effective options for everyday tasks
                  </p>
                </div>
                <div className="divide-y divide-neutral-200 dark:divide-neutral-700">
                  {aiModels.budget.map((model, idx) => (
                    <div
                      key={idx}
                      className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-foreground">
                          {model.name}
                        </span>
                        {model.badge && (
                          <span className="px-2 py-0.5 text-xs font-medium bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-full">
                            {model.badge}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <span className="text-neutral-500 dark:text-neutral-400">
                            Input:
                          </span>
                          <span className="font-medium text-foreground">
                            ${model.input.toFixed(2)}/1M
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-neutral-500 dark:text-neutral-400">
                            Output:
                          </span>
                          <span className="font-medium text-foreground">
                            ${model.output.toFixed(2)}/1M
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-neutral-500 dark:text-neutral-400">
                            Context:
                          </span>
                          <span className="font-medium text-foreground">
                            {model.context}
                          </span>
                        </div>
                        <a
                          href={model.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-neutral-500 hover:text-foreground transition-colors"
                          title={`View ${model.provider} pricing`}
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
                              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                            />
                          </svg>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Premium Models */}
              <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-2xl overflow-hidden">
                <div className="px-6 py-4 bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-700">
                  <h3 className="text-lg font-semibold text-foreground">
                    Premium Models
                  </h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Advanced capabilities for complex projects
                  </p>
                </div>
                <div className="divide-y divide-neutral-200 dark:divide-neutral-700">
                  {aiModels.premium.map((model, idx) => (
                    <div
                      key={idx}
                      className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-foreground">
                          {model.name}
                        </span>
                        {model.badge && (
                          <span className="px-2 py-0.5 text-xs font-medium bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-full">
                            {model.badge}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <span className="text-neutral-500 dark:text-neutral-400">
                            Input:
                          </span>
                          <span className="font-medium text-foreground">
                            ${model.input.toFixed(2)}/1M
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-neutral-500 dark:text-neutral-400">
                            Output:
                          </span>
                          <span className="font-medium text-foreground">
                            ${model.output.toFixed(2)}/1M
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-neutral-500 dark:text-neutral-400">
                            Context:
                          </span>
                          <span className="font-medium text-foreground">
                            {model.context}
                          </span>
                        </div>
                        <a
                          href={model.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-neutral-500 hover:text-foreground transition-colors"
                          title={`View ${model.provider} pricing`}
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
                              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                            />
                          </svg>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Provider Links */}
              <div className="mt-6 flex flex-wrap justify-center gap-4">
                <a
                  href={EXTERNAL_LINKS.anthropic}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-full text-sm text-neutral-600 dark:text-neutral-400 hover:text-foreground hover:border-neutral-400 dark:hover:border-neutral-500 transition-colors"
                >
                  Anthropic Pricing
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </a>
                <a
                  href={EXTERNAL_LINKS.openai}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-full text-sm text-neutral-600 dark:text-neutral-400 hover:text-foreground hover:border-neutral-400 dark:hover:border-neutral-500 transition-colors"
                >
                  OpenAI Pricing
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </a>
                <a
                  href={EXTERNAL_LINKS.google}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-full text-sm text-neutral-600 dark:text-neutral-400 hover:text-foreground hover:border-neutral-400 dark:hover:border-neutral-500 transition-colors"
                >
                  Google AI Pricing
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </a>
                <a
                  href={EXTERNAL_LINKS.xai}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-full text-sm text-neutral-600 dark:text-neutral-400 hover:text-foreground hover:border-neutral-400 dark:hover:border-neutral-500 transition-colors"
                >
                  xAI Pricing
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </a>
              </div>
            </div>

            {/* Infrastructure Pricing - All Services */}
            <div className="mb-20">
              <div className="text-center mb-10">
                <h2 className="text-3xl font-bold text-foreground mb-4">
                  Infrastructure Pricing
                </h2>
                <p className="text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
                  All infrastructure services at exact provider cost — zero
                  markup. Links to official pricing pages for full transparency.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* E2B Sandbox Pricing */}
                <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-2xl overflow-hidden">
                  <div className="px-6 py-4 bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">
                        E2B Sandbox
                      </h3>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        Code execution & live preview
                      </p>
                    </div>
                    <a
                      href={EXTERNAL_LINKS.e2b}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-neutral-500 hover:text-foreground transition-colors flex items-center gap-1 text-xs"
                      title="View E2B pricing"
                    >
                      Verify pricing
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                    </a>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-neutral-600 dark:text-neutral-400">
                        2 vCPU sandbox (default)
                      </span>
                      <span className="font-medium text-foreground">
                        $0.10/hour
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-neutral-600 dark:text-neutral-400">
                        Per second billing
                      </span>
                      <span className="font-medium text-foreground">
                        $0.000028/s
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-neutral-600 dark:text-neutral-400">
                        Auto-pause after idle
                      </span>
                      <span className="font-medium text-foreground">5 min</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-neutral-600 dark:text-neutral-400">
                        Paused sandbox
                      </span>
                      <span className="font-medium text-foreground">$0.00</span>
                    </div>
                    <div className="pt-4 border-t border-neutral-200 dark:border-neutral-700">
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">
                        Sandboxes auto-pause when idle and resume instantly.
                        Charged per second only when running.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Supabase Backend Pricing */}
                <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-2xl overflow-hidden">
                  <div className="px-6 py-4 bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">
                        Supabase Backend
                      </h3>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        Database, Auth, Storage, Functions
                      </p>
                    </div>
                    <a
                      href={EXTERNAL_LINKS.supabase}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-neutral-500 hover:text-foreground transition-colors flex items-center gap-1 text-xs"
                      title="View Supabase pricing"
                    >
                      Verify pricing
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                    </a>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-neutral-600 dark:text-neutral-400">
                        Compute instance
                      </span>
                      <span className="font-medium text-foreground">
                        $0.018/hour
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-neutral-600 dark:text-neutral-400">
                        Database storage
                      </span>
                      <span className="font-medium text-foreground">
                        $0.125/GB/month
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-neutral-600 dark:text-neutral-400">
                        File storage
                      </span>
                      <span className="font-medium text-foreground">
                        $0.021/GB/month
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-neutral-600 dark:text-neutral-400">
                        Auth (50K MAUs free)
                      </span>
                      <span className="font-medium text-foreground">
                        $0.00325/MAU
                      </span>
                    </div>
                    <div className="pt-4 border-t border-neutral-200 dark:border-neutral-700">
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">
                        Compute pauses after 15 min inactivity. ~$13/mo if
                        always on.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Vercel Deployment Pricing */}
                <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-2xl overflow-hidden">
                  <div className="px-6 py-4 bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">
                        Vercel Deployment
                      </h3>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        Production hosting & edge network
                      </p>
                    </div>
                    <a
                      href={EXTERNAL_LINKS.vercel}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-neutral-500 hover:text-foreground transition-colors flex items-center gap-1 text-xs"
                      title="View Vercel pricing"
                    >
                      Verify pricing
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                    </a>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-neutral-600 dark:text-neutral-400">
                        Active CPU
                      </span>
                      <span className="font-medium text-foreground">
                        $0.128/hour
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-neutral-600 dark:text-neutral-400">
                        Provisioned memory
                      </span>
                      <span className="font-medium text-foreground">
                        $0.0106/GB-hr
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-neutral-600 dark:text-neutral-400">
                        Function invocations
                      </span>
                      <span className="font-medium text-foreground">
                        $0.60/1M
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-neutral-600 dark:text-neutral-400">
                        Pro plan includes
                      </span>
                      <span className="font-medium text-foreground">
                        4 CPU-hrs, 360 GB-hrs
                      </span>
                    </div>
                    <div className="pt-4 border-t border-neutral-200 dark:border-neutral-700">
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">
                        Vercel for Platforms with Fluid Compute pricing. You
                        only pay for actual CPU time during code execution.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Cost Examples */}
            <div className="mb-20">
              <div className="text-center mb-10">
                <h2 className="text-3xl font-bold text-foreground mb-4">
                  Real-World Cost Examples
                </h2>
                <p className="text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
                  See how much typical tasks cost with different models
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-6">
                  <div className="w-12 h-12 bg-neutral-100 dark:bg-neutral-800 rounded-xl flex items-center justify-center mb-4">
                    <svg
                      className="w-6 h-6 text-neutral-700 dark:text-neutral-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Small Edit
                  </h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                    5K input + 1K output tokens
                  </p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-600 dark:text-neutral-400">
                        Grok Code Fast
                      </span>
                      <span className="font-medium text-foreground">
                        $0.003
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-600 dark:text-neutral-400">
                        Claude Sonnet
                      </span>
                      <span className="font-medium text-foreground">
                        $0.030
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-6">
                  <div className="w-12 h-12 bg-neutral-100 dark:bg-neutral-800 rounded-xl flex items-center justify-center mb-4">
                    <svg
                      className="w-6 h-6 text-neutral-700 dark:text-neutral-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    New Feature
                  </h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                    50K input + 15K output tokens
                  </p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-600 dark:text-neutral-400">
                        Grok Code Fast
                      </span>
                      <span className="font-medium text-foreground">
                        $0.033
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-600 dark:text-neutral-400">
                        Claude Sonnet
                      </span>
                      <span className="font-medium text-foreground">
                        $0.375
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-6">
                  <div className="w-12 h-12 bg-neutral-100 dark:bg-neutral-800 rounded-xl flex items-center justify-center mb-4">
                    <svg
                      className="w-6 h-6 text-neutral-700 dark:text-neutral-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Full Project
                  </h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                    100K input + 80K output tokens
                  </p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-600 dark:text-neutral-400">
                        Grok Code Fast
                      </span>
                      <span className="font-medium text-foreground">$0.14</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-600 dark:text-neutral-400">
                        Claude Sonnet
                      </span>
                      <span className="font-medium text-foreground">$1.50</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* FAQs */}
            <div className="mb-16">
              <div className="text-center mb-10">
                <h2 className="text-3xl font-bold text-foreground mb-4">
                  Frequently Asked Questions
                </h2>
              </div>
              <div className="max-w-3xl mx-auto space-y-4">
                {faqs.map((faq, index) => (
                  <details
                    key={index}
                    className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl overflow-hidden group"
                  >
                    <summary className="px-6 py-4 cursor-pointer list-none flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors duration-200">
                      <h3 className="text-lg font-medium text-foreground pr-4">
                        {faq.question}
                      </h3>
                      <svg
                        className="w-5 h-5 text-neutral-500 group-open:rotate-180 transition-transform duration-200 shrink-0"
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
                    </summary>
                    <div className="px-6 pb-4 pt-2">
                      <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  </details>
                ))}
              </div>
            </div>

            {/* CTA Section */}
            <div className="bg-linear-to-br from-neutral-100 to-neutral-50 dark:from-neutral-800 dark:to-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-8 sm:p-12 text-center">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
                Ready to start building?
              </h2>
              <p className="text-neutral-600 dark:text-neutral-400 mb-6 max-w-xl mx-auto">
                Sign up for free, explore the platform, then top up when
                you&apos;re ready. Credits are valid for 1 year from purchase.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/auth/signup"
                  className="px-8 py-3 bg-neutral-900 dark:bg-neutral-100 text-neutral-100 dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200 rounded-full transition-colors duration-200 font-medium"
                >
                  Get Started Free
                </Link>
                <Link
                  href="/support"
                  className="px-8 py-3 bg-transparent border border-neutral-300 dark:border-neutral-700 text-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors duration-200 font-medium"
                >
                  Learn More
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    </SidebarLayout>
  );
}
