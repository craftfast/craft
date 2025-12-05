import SidebarLayout from "@/components/SidebarLayout";
import AppHeader from "@/components/AppHeader";
import Link from "next/link";

export const metadata = {
  title: "Pricing - Craft",
  description:
    "Transparent, pay-as-you-go pricing. Top up your balance and pay only for what you use - AI models, sandbox compute, and storage.",
};

// External links for transparency
const EXTERNAL_LINKS = {
  anthropic: "https://www.anthropic.com/pricing#702",
  openai: "https://platform.openai.com/docs/pricing",
  google: "https://ai.google.dev/gemini-api/docs/pricing",
  xai: "https://docs.x.ai/docs/models",
  e2b: "https://e2b.dev/pricing",
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
      title: "Storage",
      description: "Project files and assets stored securely",
      details: "$0.015/GB per month",
    },
  ];

  const faqs = [
    {
      question: "How do I top up my balance?",
      answer:
        "Go to your Dashboard → Click on your balance → Choose an amount → Pay securely via Razorpay. Your balance is credited instantly and you can start using it right away.",
    },
    {
      question: "What is the 10% service fee? Are there any taxes?",
      answer:
        "We charge a 10% platform fee on top-ups to cover payment processing, platform maintenance, and support. For Indian customers, 18% GST is additionally applicable as per Indian tax regulations. This allows us to pass through AI costs at zero markup.",
    },
    {
      question: "Do my credits expire?",
      answer:
        "Yes, unused credits expire 1 year from the date of purchase. We'll send you reminder emails before expiration so you can use them. This policy helps us maintain competitive pricing and platform sustainability.",
    },
    {
      question: "How do I track my usage?",
      answer:
        "Go to Dashboard → Usage to see a detailed breakdown of your AI, sandbox, and storage costs. You can track usage by day, week, or month and see exactly which models and projects are using your credits.",
    },
    {
      question: "Are AI model prices the same as the provider?",
      answer:
        "Yes! We charge the exact same rates as Anthropic, OpenAI, Google, and xAI. Zero markup. We believe in complete transparency - that's why we link to each provider's pricing page.",
    },
    {
      question: "What happens when my balance is low?",
      answer:
        "You'll see a warning when your balance drops below $5. At $0.50 or less, new operations will be paused until you top up. You won't lose any work - just add more credits to continue.",
    },
    {
      question: "What payment methods do you accept?",
      answer:
        "We accept all major credit cards, debit cards, UPI, and net banking through Razorpay. All payments are securely processed and encrypted.",
    },
    {
      question: "Can I get a refund?",
      answer:
        "Credits are non-refundable once purchased, but they never expire so you can always use them later. If you have any issues, contact us at support@craftfast.ai.",
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
              <p className="text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto mb-6">
                Top up your balance, use it for AI, compute, and storage. We
                charge exactly what providers charge — zero markup on usage.
              </p>
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
            </div>

            {/* How It Works */}
            <div className="mb-20">
              <div className="text-center mb-10">
                <h2 className="text-3xl font-bold text-foreground mb-4">
                  How Credits Work
                </h2>
                <p className="text-neutral-600 dark:text-neutral-400">
                  Simple three-step process to start building
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Step 1 */}
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
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Top Up Your Balance
                  </h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Add credits starting from $10. We charge a 10% service fee.
                    Credits are valid for 1 year.
                  </p>
                </div>

                {/* Step 2 */}
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
                        d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Build With AI
                  </h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Use any AI model, run code in sandboxes, store your
                    projects. Pay only for what you use.
                  </p>
                </div>

                {/* Step 3 */}
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
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Track Usage
                  </h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Monitor your spending in the Usage dashboard. See exactly
                    where your credits go.
                  </p>
                </div>
              </div>
            </div>

            {/* Top-Up Examples */}
            <div className="mb-20">
              <div className="bg-gradient-to-br from-neutral-100 to-neutral-50 dark:from-neutral-800 dark:to-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-8">
                <div className="flex flex-col gap-6">
                  {/* Header */}
                  <div>
                    <h2 className="text-2xl font-bold text-foreground mb-2">
                      Top-Up Examples
                    </h2>
                    <p className="text-neutral-600 dark:text-neutral-400">
                      10% service fee • Min $10 • Additional taxes applicable
                    </p>
                  </div>

                  {/* Pricing Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                      className="w-5 h-5 text-neutral-600 dark:text-neutral-400 flex-shrink-0 mt-0.5"
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

            {/* Sandbox & Storage Pricing */}
            <div className="mb-20">
              <div className="text-center mb-10">
                <h2 className="text-3xl font-bold text-foreground mb-4">
                  Infrastructure Pricing
                </h2>
                <p className="text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
                  Sandbox compute and storage costs based on actual usage
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Sandbox Pricing */}
                <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-2xl overflow-hidden">
                  <div className="px-6 py-4 bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">
                        Sandbox Compute
                      </h3>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        Powered by E2B
                      </p>
                    </div>
                    <a
                      href={EXTERNAL_LINKS.e2b}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-neutral-500 hover:text-foreground transition-colors"
                      title="View E2B pricing"
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
                  <div className="p-6 space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-neutral-600 dark:text-neutral-400">
                        Active sandbox
                      </span>
                      <span className="font-medium text-foreground">
                        $0.20/hour
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-neutral-600 dark:text-neutral-400">
                        Paused sandbox
                      </span>
                      <span className="font-medium text-foreground">$0.00</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-neutral-600 dark:text-neutral-400">
                        Auto-pause after
                      </span>
                      <span className="font-medium text-foreground">
                        5 min idle
                      </span>
                    </div>
                    <div className="pt-4 border-t border-neutral-200 dark:border-neutral-700">
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">
                        Sandboxes automatically pause when idle to save costs.
                        Resume instantly when you return.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Storage Pricing */}
                <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-2xl overflow-hidden">
                  <div className="px-6 py-4 bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-700">
                    <h3 className="text-lg font-semibold text-foreground">
                      Storage
                    </h3>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      Project files & assets
                    </p>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-neutral-600 dark:text-neutral-400">
                        File storage
                      </span>
                      <span className="font-medium text-foreground">
                        $0.015/GB/month
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-neutral-600 dark:text-neutral-400">
                        Operations
                      </span>
                      <span className="font-medium text-foreground">
                        $0.36/1M ops
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-neutral-600 dark:text-neutral-400">
                        Typical project
                      </span>
                      <span className="font-medium text-foreground">
                        &lt; $0.01/month
                      </span>
                    </div>
                    <div className="pt-4 border-t border-neutral-200 dark:border-neutral-700">
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">
                        Most projects use minimal storage. You only pay for what
                        you actually use.
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
                        className="w-5 h-5 text-neutral-500 group-open:rotate-180 transition-transform duration-200 flex-shrink-0"
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
            <div className="bg-gradient-to-br from-neutral-100 to-neutral-50 dark:from-neutral-800 dark:to-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-8 sm:p-12 text-center">
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
