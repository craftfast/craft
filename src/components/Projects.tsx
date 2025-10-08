"use client";

import { useState } from "react";

type ViewMode = "grid" | "list";
type SortOption = "recent" | "name" | "oldest";

export default function Projects() {
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortBy, setSortBy] = useState<SortOption>("recent");
  const [searchQuery, setSearchQuery] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  return (
    <div>
      {/* Search and Filter Bar */}
      <div className="mb-6 space-y-4">
        {/* Search Input with View Toggle */}
        <div className="flex flex-row gap-3">
          {/* Search Input */}
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 pl-11 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg text-sm text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:focus:ring-neutral-600 transition-all"
            />
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 dark:text-neutral-400"
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
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>

          {/* Filter and View Controls */}
          <div className="flex gap-2">
            {/* Filter Button */}
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`px-4 py-3 rounded-lg border transition-all flex items-center gap-2 ${
                isFilterOpen
                  ? "bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 border-neutral-900 dark:border-neutral-100"
                  : "bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700"
              }`}
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
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                />
              </svg>
              <span className="text-sm font-medium hidden sm:inline">
                Filter
              </span>
            </button>

            {/* View Toggle */}
            <div className="flex bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === "grid"
                    ? "bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900"
                    : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                }`}
                aria-label="Grid view"
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
                    d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                  />
                </svg>
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === "list"
                    ? "bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900"
                    : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                }`}
                aria-label="List view"
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
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Filter Options Dropdown */}
        {isFilterOpen && (
          <div className="bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-2xl p-4 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Sort by
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSortBy("recent")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      sortBy === "recent"
                        ? "bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900"
                        : "bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-600"
                    }`}
                  >
                    Most Recent
                  </button>
                  <button
                    onClick={() => setSortBy("name")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      sortBy === "name"
                        ? "bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900"
                        : "bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-600"
                    }`}
                  >
                    Name (A-Z)
                  </button>
                  <button
                    onClick={() => setSortBy("oldest")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      sortBy === "oldest"
                        ? "bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900"
                        : "bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-600"
                    }`}
                  >
                    Oldest First
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Projects Display */}
      <div
        className={
          viewMode === "grid"
            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
            : "flex flex-col gap-3"
        }
      >
        {/* Project Card 1 */}
        <div
          className={`group bg-white dark:bg-neutral-800 rounded-2xl border border-stone-200 dark:border-neutral-700 hover:border-stone-300 dark:hover:border-neutral-600 transition-all cursor-pointer ${
            viewMode === "grid" ? "p-6" : "p-4"
          }`}
        >
          {viewMode === "grid" ? (
            // Grid View
            <>
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
            </>
          ) : (
            // List View
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-stone-100 dark:bg-neutral-700 flex items-center justify-center flex-shrink-0">
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
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground mb-1">
                  Website Redesign
                </h3>
                <p className="text-sm text-stone-600 dark:text-neutral-400 truncate">
                  Modern landing page with dark mode support
                </p>
              </div>
              <span className="text-xs text-stone-500 dark:text-neutral-400 flex-shrink-0">
                2 days ago
              </span>
            </div>
          )}
        </div>

        {/* Project Card 2 */}
        <div
          className={`group bg-white dark:bg-neutral-800 rounded-2xl border border-stone-200 dark:border-neutral-700 hover:border-stone-300 dark:hover:border-neutral-600 transition-all cursor-pointer ${
            viewMode === "grid" ? "p-6" : "p-4"
          }`}
        >
          {viewMode === "grid" ? (
            <>
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
            </>
          ) : (
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-stone-100 dark:bg-neutral-700 flex items-center justify-center flex-shrink-0">
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
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground mb-1">
                  API Integration
                </h3>
                <p className="text-sm text-stone-600 dark:text-neutral-400 truncate">
                  REST API for payment processing
                </p>
              </div>
              <span className="text-xs text-stone-500 dark:text-neutral-400 flex-shrink-0">
                5 days ago
              </span>
            </div>
          )}
        </div>

        {/* Project Card 3 */}
        <div
          className={`group bg-white dark:bg-neutral-800 rounded-2xl border border-stone-200 dark:border-neutral-700 hover:border-stone-300 dark:hover:border-neutral-600 transition-all cursor-pointer ${
            viewMode === "grid" ? "p-6" : "p-4"
          }`}
        >
          {viewMode === "grid" ? (
            <>
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
            </>
          ) : (
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-stone-100 dark:bg-neutral-700 flex items-center justify-center flex-shrink-0">
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
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground mb-1">
                  Brand Guidelines
                </h3>
                <p className="text-sm text-stone-600 dark:text-neutral-400 truncate">
                  Design system and component library
                </p>
              </div>
              <span className="text-xs text-stone-500 dark:text-neutral-400 flex-shrink-0">
                1 week ago
              </span>
            </div>
          )}
        </div>

        {/* Project Card 4 */}
        <div
          className={`group bg-white dark:bg-neutral-800 rounded-2xl border border-stone-200 dark:border-neutral-700 hover:border-stone-300 dark:hover:border-neutral-600 transition-all cursor-pointer ${
            viewMode === "grid" ? "p-6" : "p-4"
          }`}
        >
          {viewMode === "grid" ? (
            <>
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
            </>
          ) : (
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-stone-100 dark:bg-neutral-700 flex items-center justify-center flex-shrink-0">
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
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground mb-1">
                  Analytics Dashboard
                </h3>
                <p className="text-sm text-stone-600 dark:text-neutral-400 truncate">
                  Real-time data visualization
                </p>
              </div>
              <span className="text-xs text-stone-500 dark:text-neutral-400 flex-shrink-0">
                2 weeks ago
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
