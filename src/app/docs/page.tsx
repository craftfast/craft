import HeaderNav from "@/components/HeaderNav";
import Logo from "@/components/Logo";
import Footer from "@/components/Footer";
import Link from "next/link";

export default function DocsPage() {
  const sections = [
    {
      title: "Getting Started",
      description: "Learn the basics of Craft and build your first project",
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
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
      ),
      articles: [
        { title: "Introduction to Craft", href: "#" },
        { title: "Quick Start Guide", href: "#" },
        { title: "Your First Project", href: "#" },
        { title: "Understanding the Interface", href: "#" },
      ],
    },
    {
      title: "Core Concepts",
      description: "Understand how Craft works under the hood",
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
            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
          />
        </svg>
      ),
      articles: [
        { title: "AI-Powered Development", href: "#" },
        { title: "Project Structure", href: "#" },
        { title: "Templates & Components", href: "#" },
        { title: "Live Preview", href: "#" },
      ],
    },
    {
      title: "Features",
      description: "Explore all the features Craft has to offer",
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
            d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
          />
        </svg>
      ),
      articles: [
        { title: "Chat Interface", href: "#" },
        { title: "Code Generation", href: "#" },
        { title: "Database Integration", href: "#" },
        { title: "Deployment Options", href: "#" },
      ],
    },
    {
      title: "API Reference",
      description: "Technical documentation for advanced users",
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
            d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
          />
        </svg>
      ),
      articles: [
        { title: "REST API", href: "#" },
        { title: "Webhooks", href: "#" },
        { title: "Authentication", href: "#" },
        { title: "Rate Limits", href: "#" },
      ],
    },
  ];

  const popularArticles = [
    {
      title: "How to create your first app with Craft",
      description:
        "A step-by-step guide to building your first application using natural language",
      readTime: "5 min read",
    },
    {
      title: "Understanding AI prompts for better results",
      description:
        "Learn how to write effective prompts to get exactly what you want",
      readTime: "8 min read",
    },
    {
      title: "Deploying your Craft projects",
      description: "Multiple ways to deploy and share your creations with the world",
      readTime: "6 min read",
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
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

      {/* Main Content */}
      <main className="pt-20 pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero Section */}
          <div className="text-center py-12 sm:py-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neutral-100 dark:bg-neutral-800 text-sm text-neutral-600 dark:text-neutral-400 mb-6">
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
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
              Documentation
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
              Learn how to build with Craft
            </h1>
            <p className="text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto mb-8">
              Comprehensive guides and documentation to help you start building
              amazing projects with AI-powered development.
            </p>

            {/* Search Box */}
            <div className="relative max-w-xl mx-auto">
              <input
                type="text"
                placeholder="Search documentation..."
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

          {/* Documentation Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
            {sections.map((section, index) => (
              <div
                key={index}
                className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-6 hover:border-neutral-400 dark:hover:border-neutral-600 transition-colors duration-200"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                    {section.icon}
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-foreground mb-1">
                      {section.title}
                    </h2>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      {section.description}
                    </p>
                  </div>
                </div>
                <ul className="space-y-2">
                  {section.articles.map((article, articleIndex) => (
                    <li key={articleIndex}>
                      <Link
                        href={article.href}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors group"
                      >
                        <svg
                          className="w-4 h-4 text-neutral-400 group-hover:text-neutral-600 dark:group-hover:text-neutral-300"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        {article.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Popular Articles */}
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-foreground mb-6">
              Popular Articles
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {popularArticles.map((article, index) => (
                <Link
                  key={index}
                  href="#"
                  className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-5 hover:border-neutral-400 dark:hover:border-neutral-600 transition-colors duration-200 group"
                >
                  <h3 className="font-semibold text-foreground mb-2 group-hover:text-neutral-700 dark:group-hover:text-neutral-300 transition-colors">
                    {article.title}
                  </h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">
                    {article.description}
                  </p>
                  <span className="text-xs text-neutral-500">{article.readTime}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Need Help CTA */}
          <div className="bg-gradient-to-br from-neutral-100 to-neutral-50 dark:from-neutral-800 dark:to-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-8 sm:p-12 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
              Can&apos;t find what you&apos;re looking for?
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400 mb-6 max-w-xl mx-auto">
              Join our community or reach out to our support team for help.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="https://discord.gg/YvPKxcCV"
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-3 bg-foreground text-background hover:bg-neutral-800 dark:hover:bg-neutral-700 rounded-full transition-colors duration-200 font-medium inline-flex items-center justify-center gap-2"
              >
                Join Discord
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
              </Link>
              <Link
                href="/help"
                className="px-8 py-3 bg-transparent border border-neutral-300 dark:border-neutral-700 text-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors duration-200 font-medium"
              >
                Visit Help Center
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
