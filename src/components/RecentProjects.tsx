"use client";

import Link from "next/link";

export default function RecentProjects() {
  return (
    <div className="mt-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg sm:text-xl font-semibold text-foreground">
          Recent Projects
        </h2>
        <Link
          href="/projects"
          className="px-4 py-2 text-stone-600 dark:text-neutral-400 hover:text-stone-900 dark:hover:text-neutral-100 transition-colors text-sm font-medium"
        >
          View all →
        </Link>
      </div>

      {/* Recent Projects Grid - Show only 4 most recent */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Project Card 1 */}
        <div className="group p-6 bg-white dark:bg-neutral-800 rounded-2xl border border-stone-200 dark:border-neutral-700 hover:border-stone-300 dark:hover:border-neutral-600 transition-all cursor-pointer">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-stone-100 dark:bg-neutral-700 flex items-center justify-center">
              <svg
                className="w-5 h-5 text-stone-600 dark:text-neutral-300"
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
            </div>
            <span className="text-xs text-stone-500 dark:text-neutral-400">
              2 days ago
            </span>
          </div>
          <h3 className="font-semibold text-foreground mb-2">
            Website Redesign
          </h3>
          <p className="text-sm text-stone-600 dark:text-neutral-400 line-clamp-2">
            Modern landing page with dark mode support
          </p>
        </div>

        {/* Project Card 2 */}
        <div className="group p-6 bg-white dark:bg-neutral-800 rounded-2xl border border-stone-200 dark:border-neutral-700 hover:border-stone-300 dark:hover:border-neutral-600 transition-all cursor-pointer">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-stone-100 dark:bg-neutral-700 flex items-center justify-center">
              <svg
                className="w-5 h-5 text-stone-600 dark:text-neutral-300"
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
            <span className="text-xs text-stone-500 dark:text-neutral-400">
              5 days ago
            </span>
          </div>
          <h3 className="font-semibold text-foreground mb-2">
            API Integration
          </h3>
          <p className="text-sm text-stone-600 dark:text-neutral-400 line-clamp-2">
            REST API for payment processing
          </p>
        </div>

        {/* Project Card 3 */}
        <div className="group p-6 bg-white dark:bg-neutral-800 rounded-2xl border border-stone-200 dark:border-neutral-700 hover:border-stone-300 dark:hover:border-neutral-600 transition-all cursor-pointer">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-stone-100 dark:bg-neutral-700 flex items-center justify-center">
              <svg
                className="w-5 h-5 text-stone-600 dark:text-neutral-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                />
              </svg>
            </div>
            <span className="text-xs text-stone-500 dark:text-neutral-400">
              1 week ago
            </span>
          </div>
          <h3 className="font-semibold text-foreground mb-2">
            Brand Guidelines
          </h3>
          <p className="text-sm text-stone-600 dark:text-neutral-400 line-clamp-2">
            Design system and component library
          </p>
        </div>

        {/* Project Card 4 */}
        <div className="group p-6 bg-white dark:bg-neutral-800 rounded-2xl border border-stone-200 dark:border-neutral-700 hover:border-stone-300 dark:hover:border-neutral-600 transition-all cursor-pointer">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-stone-100 dark:bg-neutral-700 flex items-center justify-center">
              <svg
                className="w-5 h-5 text-stone-600 dark:text-neutral-300"
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
            <span className="text-xs text-stone-500 dark:text-neutral-400">
              2 weeks ago
            </span>
          </div>
          <h3 className="font-semibold text-foreground mb-2">
            Analytics Dashboard
          </h3>
          <p className="text-sm text-stone-600 dark:text-neutral-400 line-clamp-2">
            Real-time data visualization
          </p>
        </div>
      </div>
    </div>
  );
}
