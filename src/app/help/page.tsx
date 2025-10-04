import HeaderNav from "@/components/HeaderNav";
import Logo from "@/components/Logo";
import Footer from "@/components/Footer";
import Link from "next/link";

export default function HelpPage() {
  const faqs = [
    {
      question: "What is Craft?",
      answer:
        "Craft is a revolutionary open-source vibecoding tool that lets you build apps and websites through natural conversation with AI. Simply describe what you want to create, and Craft turns your ideas into reality.",
    },
    {
      question: "How do I get started?",
      answer:
        "Getting started is easy! Join our waitlist to get early access. Once you're in, you can start building by simply chatting with Craft about what you want to create.",
    },
    {
      question: "What can I build with Craft?",
      answer:
        "You can build a wide variety of applications including web apps, mobile apps, landing pages, dashboards, e-commerce sites, and more. If you can describe it, Craft can help you build it.",
    },
    {
      question: "Is Craft free to use?",
      answer:
        "Craft offers various pricing plans to suit different needs. We have a free tier for getting started, as well as premium plans with additional features and higher usage limits. Check our pricing page for details.",
    },
    {
      question: "Do I need coding experience?",
      answer:
        "No! Craft is designed for everyone, from complete beginners to experienced developers. You describe what you want in natural language, and Craft handles the technical implementation.",
    },
    {
      question: "Is Craft open source?",
      answer:
        "Yes! Craft is proudly open source. You can view our code, contribute to the project, and even self-host if you prefer. We believe in transparency and community collaboration.",
    },
    {
      question: "What technologies does Craft use?",
      answer:
        "Craft is built with modern web technologies including Next.js, TypeScript, Tailwind CSS, and integrates with powerful AI models to understand your requirements and generate code.",
    },
    {
      question: "Can I export my projects?",
      answer:
        "Absolutely! Your projects are yours. You can export your code at any time and deploy it wherever you like. Craft gives you full ownership of what you create.",
    },
    {
      question: "How do payments work?",
      answer:
        "We use Razorpay for secure payment processing. Your payment information is encrypted and secure. We support multiple payment methods including cards, UPI, and net banking.",
    },
    {
      question: "What if I need help or support?",
      answer:
        "We're here to help! You can reach out through our support channels, join our community, or check our documentation. For billing issues or technical problems, contact us directly.",
    },
  ];

  const resources = [
    {
      title: "Getting Started Guide",
      description: "Learn the basics and build your first app with Craft",
      icon: "📚",
    },
    {
      title: "Documentation",
      description: "Comprehensive guides and API references",
      icon: "📖",
    },
    {
      title: "Community",
      description: "Join our Discord community for help and inspiration",
      icon: "💬",
    },
    {
      title: "Blog & Tutorials",
      description: "Tips, tricks, and best practices from the Craft team",
      icon: "✍️",
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md">
        <div className="px-3 sm:px-4 py-2">
          <div className="relative flex items-center justify-between">
            <Logo iconClassName="text-white dark:text-white" href="/" />
            <HeaderNav />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-20 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero Section */}
          <div className="text-center py-12 sm:py-16">
            <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
              How can we help you?
            </h1>
            <p className="text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
              Find answers to common questions or explore our resources to get
              the most out of Craft.
            </p>
          </div>

          {/* Search Box */}
          <div className="mb-16">
            <div className="relative max-w-2xl mx-auto">
              <input
                type="text"
                placeholder="Search for help..."
                className="w-full px-6 py-4 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-foreground placeholder-neutral-500 focus:border-neutral-600 dark:focus:border-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-500/20 rounded-full transition-all duration-200"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <svg
                  className="w-5 h-5 text-neutral-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Quick Resources */}
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-foreground mb-6">
              Quick Resources
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {resources.map((resource, index) => (
                <div
                  key={index}
                  className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6 hover:border-neutral-400 dark:hover:border-neutral-600 transition-colors duration-200 cursor-pointer group"
                >
                  <div className="flex items-start gap-4">
                    <div className="text-3xl">{resource.icon}</div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-foreground mb-1 group-hover:text-neutral-700 dark:group-hover:text-neutral-300 transition-colors">
                        {resource.title}
                      </h3>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        {resource.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* FAQs */}
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-foreground mb-6">
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <details
                  key={index}
                  className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl overflow-hidden group"
                >
                  <summary className="px-6 py-4 cursor-pointer list-none flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors duration-200">
                    <h3 className="text-lg font-medium text-foreground">
                      {faq.question}
                    </h3>
                    <svg
                      className="w-5 h-5 text-neutral-500 group-open:rotate-180 transition-transform duration-200"
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

          {/* Contact Support */}
          <div className="bg-gradient-to-br from-neutral-100 to-neutral-50 dark:from-neutral-800 dark:to-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-8 sm:p-12 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
              Still need help?
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400 mb-6 max-w-xl mx-auto">
              Our support team is here to assist you. Reach out and we&apos;ll
              get back to you as soon as possible.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="mailto:support@craft.tech"
                className="px-8 py-3 bg-foreground text-background hover:bg-neutral-800 dark:hover:bg-neutral-700 rounded-full transition-colors duration-200 font-medium"
              >
                Email Support
              </Link>
              <Link
                href="/"
                className="px-8 py-3 bg-transparent border border-neutral-300 dark:border-neutral-700 text-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors duration-200 font-medium"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
