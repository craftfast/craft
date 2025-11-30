"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { docsConfig } from "@/lib/docs-config";
import { Search, X } from "lucide-react";

interface SearchResult {
  section: string;
  sectionTitle: string;
  slug: string;
  title: string;
  description?: string;
}

export function DocsSearch() {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isMac, setIsMac] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  // Detect OS
  useEffect(() => {
    setIsMac(navigator.platform.toUpperCase().indexOf("MAC") >= 0);
  }, []);

  // Handle keyboard shortcut (Ctrl+K / Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === "Escape" && isOpen) {
        e.preventDefault();
        closeModal();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Focus input when modal opens and prevent body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      if (inputRef.current) {
        inputRef.current.focus();
      }
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [results]);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    setQuery("");
    setResults([]);
    setSelectedIndex(0);
  }, []);

  const handleSearch = (searchQuery: string) => {
    setQuery(searchQuery);

    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    const searchResults: SearchResult[] = [];
    const lowerQuery = searchQuery.toLowerCase();

    for (const section of docsConfig) {
      for (const item of section.items) {
        if (
          item.title.toLowerCase().includes(lowerQuery) ||
          item.description?.toLowerCase().includes(lowerQuery)
        ) {
          searchResults.push({
            section: section.slug,
            sectionTitle: section.title,
            slug: item.slug,
            title: item.title,
            description: item.description,
          });
        }
      }
    }

    setResults(searchResults);
  };

  const handleSelect = (result: SearchResult) => {
    router.push(`/docs/${result.section}/${result.slug}`);
    closeModal();
  };

  const handleKeyDownInModal = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === "Enter" && results[selectedIndex]) {
      e.preventDefault();
      handleSelect(results[selectedIndex]);
    }
  };

  return (
    <>
      {/* Search Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="relative flex items-center w-full"
      >
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <div className="w-full pl-10 pr-16 py-2 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-full text-sm text-neutral-500 text-left cursor-pointer hover:border-neutral-300 dark:hover:border-neutral-600 transition-colors">
            Search docs...
          </div>
          <kbd className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 items-center gap-0.5 px-1.5 py-0.5 bg-neutral-200 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-400 text-xs rounded">
            {isMac ? "⌘K" : "Ctrl+K"}
          </kbd>
        </div>
      </button>

      {/* Search Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-white/80 dark:bg-neutral-950/80 min-h-screen">
          {/* Backdrop */}
          <div className="absolute inset-0" onClick={closeModal} />

          {/* Modal Content */}
          <div
            className="relative w-full max-w-xl mx-4 bg-background border border-neutral-200 dark:border-neutral-700 rounded-2xl shadow-2xl overflow-hidden"
            onKeyDown={handleKeyDownInModal}
          >
            {/* Search Input */}
            <div className="relative flex items-center border-b border-neutral-200 dark:border-neutral-700">
              <Search className="absolute left-4 w-5 h-5 text-neutral-400" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search documentation..."
                value={query}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-12 pr-12 py-4 bg-transparent text-foreground placeholder-neutral-500 focus:outline-none text-base"
              />
              <button
                onClick={closeModal}
                className="absolute right-3 p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                <X className="w-5 h-5 text-neutral-400" />
              </button>
            </div>

            {/* Search Results */}
            {results.length > 0 && (
              <ul className="py-2 max-h-80 overflow-y-auto">
                {results.map((result, index) => (
                  <li key={`${result.section}-${result.slug}`}>
                    <button
                      onClick={() => handleSelect(result)}
                      className={`w-full px-4 py-3 text-left transition-colors ${
                        index === selectedIndex
                          ? "bg-neutral-100 dark:bg-neutral-800"
                          : "hover:bg-neutral-100 dark:hover:bg-neutral-800"
                      }`}
                    >
                      <div className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">
                        {result.sectionTitle}
                      </div>
                      <div className="font-medium text-foreground">
                        {result.title}
                      </div>
                      {result.description && (
                        <div className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-1">
                          {result.description}
                        </div>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {/* No Results */}
            {query && results.length === 0 && (
              <div className="p-8 text-center text-sm text-neutral-500 dark:text-neutral-400">
                No results found for &quot;{query}&quot;
              </div>
            )}

            {/* Empty State with Recommended Searches */}
            {!query && (
              <div className="p-6">
                <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-3">
                  Recommended
                </p>
                <div className="space-y-1">
                  {[
                    {
                      title: "Quick Start",
                      section: "getting-started",
                      slug: "quick-start",
                    },
                    {
                      title: "AI Chat",
                      section: "core-concepts",
                      slug: "ai-chat",
                    },
                    {
                      title: "Live Preview",
                      section: "core-concepts",
                      slug: "live-preview",
                    },
                    {
                      title: "Code Generation",
                      section: "features",
                      slug: "code-generation",
                    },
                    {
                      title: "Deployment",
                      section: "features",
                      slug: "deployment",
                    },
                  ].map((item) => (
                    <button
                      key={`${item.section}-${item.slug}`}
                      onClick={() => {
                        router.push(`/docs/${item.section}/${item.slug}`);
                        closeModal();
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors group"
                    >
                      <Search className="w-4 h-4 text-neutral-400 group-hover:text-neutral-600 dark:group-hover:text-neutral-300" />
                      <span className="text-sm text-foreground">
                        {item.title}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50 text-xs text-neutral-500 dark:text-neutral-400">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-neutral-200 dark:bg-neutral-700 rounded text-[10px]">
                    ↑
                  </kbd>
                  <kbd className="px-1.5 py-0.5 bg-neutral-200 dark:bg-neutral-700 rounded text-[10px]">
                    ↓
                  </kbd>
                  <span className="ml-1">to navigate</span>
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-neutral-200 dark:bg-neutral-700 rounded text-[10px]">
                    ↵
                  </kbd>
                  <span className="ml-1">to select</span>
                </span>
              </div>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-neutral-200 dark:bg-neutral-700 rounded text-[10px]">
                  esc
                </kbd>
                <span className="ml-1">to close</span>
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
