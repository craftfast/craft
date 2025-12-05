import Link from "next/link";
import { docsConfig } from "@/lib/docs-config";
import { Zap, Lightbulb, Wrench, BookOpen, ArrowRight } from "lucide-react";

const sectionIcons: Record<string, React.ReactNode> = {
  "getting-started": <Zap className="w-6 h-6" />,
  "core-concepts": <Lightbulb className="w-6 h-6" />,
  features: <Wrench className="w-6 h-6" />,
  guides: <BookOpen className="w-6 h-6" />,
  "api-reference": (
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
};

export default function DocsPage() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neutral-100 dark:bg-neutral-800 text-sm text-neutral-600 dark:text-neutral-400 mb-6">
          <BookOpen className="w-4 h-4" />
          Documentation
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
          Learn how to build with Craft
        </h1>
        <p className="text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
          Comprehensive guides and documentation to help you start building
          amazing projects with AI-powered development.
        </p>
      </div>

      {/* Quick Start Card */}
      <Link
        href="/docs/getting-started/introduction"
        className="block mb-12 p-6 bg-gradient-to-br from-neutral-100 to-neutral-50 dark:from-neutral-800 dark:to-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-2xl hover:border-neutral-400 dark:hover:border-neutral-600 transition-colors group"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              New to Craft?
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400">
              Start with our introduction guide to learn the basics and build
              your first project.
            </p>
          </div>
          <ArrowRight className="w-6 h-6 text-neutral-400 group-hover:text-foreground group-hover:translate-x-1 transition-all" />
        </div>
      </Link>

      {/* Documentation Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {docsConfig.map((section) => (
          <div
            key={section.slug}
            className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-6 hover:border-neutral-400 dark:hover:border-neutral-600 transition-colors"
          >
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                {sectionIcons[section.slug] || <BookOpen className="w-6 h-6" />}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-1">
                  {section.title}
                </h2>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  {section.items.length} articles
                </p>
              </div>
            </div>
            <ul className="space-y-1">
              {section.items.slice(0, 4).map((item) => (
                <li key={item.slug}>
                  <Link
                    href={`/docs/${section.slug}/${item.slug}`}
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
                    {item.title}
                  </Link>
                </li>
              ))}
              {section.items.length > 4 && (
                <li>
                  <Link
                    href={`/docs/${section.slug}/${section.items[0].slug}`}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-neutral-500 dark:text-neutral-400 hover:text-foreground transition-colors"
                  >
                    <span>+{section.items.length - 4} more</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </li>
              )}
            </ul>
          </div>
        ))}
      </div>

      {/* Need Help CTA */}
      <div className="mt-16 text-center p-8 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl">
        <h2 className="text-2xl font-bold text-foreground mb-4">
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
            className="px-8 py-3 bg-foreground text-background hover:bg-neutral-800 dark:hover:bg-neutral-200 rounded-full transition-colors font-medium inline-flex items-center justify-center gap-2"
          >
            Join Discord
          </Link>
          <Link
            href="/support"
            className="px-8 py-3 bg-transparent border border-neutral-300 dark:border-neutral-700 text-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors font-medium"
          >
            Visit Help Center
          </Link>
        </div>
      </div>
    </div>
  );
}
