"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { docsConfig } from "@/lib/docs-config";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface DocsSidebarProps {
  className?: string;
}

export function DocsSidebar({ className }: DocsSidebarProps) {
  const pathname = usePathname();
  const [expandedSections, setExpandedSections] = useState<string[]>(
    docsConfig.map((s) => s.slug) // All expanded by default
  );

  const toggleSection = (slug: string) => {
    setExpandedSections((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  };

  return (
    <nav className={cn("space-y-1", className)}>
      {docsConfig.map((section) => {
        const isExpanded = expandedSections.includes(section.slug);

        return (
          <div key={section.slug} className="mb-4">
            {/* Section Header */}
            <button
              onClick={() => toggleSection(section.slug)}
              className="flex items-center justify-between w-full px-3 py-2 text-sm font-semibold text-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
            >
              <span>{section.title}</span>
              <svg
                className={cn(
                  "w-4 h-4 text-neutral-500 transition-transform duration-200",
                  isExpanded && "rotate-90"
                )}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>

            {/* Section Items */}
            {isExpanded && (
              <div className="mt-1 ml-3 space-y-0.5">
                {section.items.map((item) => {
                  const href = `/docs/${section.slug}/${item.slug}`;
                  const isActive = pathname === href;

                  return (
                    <Link
                      key={item.slug}
                      href={href}
                      className={cn(
                        "block px-3 py-2 text-sm rounded-lg transition-colors",
                        isActive
                          ? "bg-neutral-200 dark:bg-neutral-700 text-foreground font-medium"
                          : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-foreground"
                      )}
                    >
                      {item.title}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}
