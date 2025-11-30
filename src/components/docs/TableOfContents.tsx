"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  className?: string;
}

export function TableOfContents({ className }: TableOfContentsProps) {
  const [headings, setHeadings] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    // Find all headings in the article content
    const article = document.querySelector("[data-docs-content]");
    if (!article) return;

    const elements = article.querySelectorAll("h2, h3");
    const items: TocItem[] = [];

    elements.forEach((element) => {
      const id = element.id;
      const text = element.textContent?.replace("#", "").trim() || "";
      const level = element.tagName === "H2" ? 2 : 3;

      if (id && text) {
        items.push({ id, text, level });
      }
    });

    setHeadings(items);
  }, []);

  useEffect(() => {
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      {
        rootMargin: "-80px 0px -80% 0px",
        threshold: 0,
      }
    );

    headings.forEach((heading) => {
      const element = document.getElementById(heading.id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, [headings]);

  if (headings.length === 0) {
    return null;
  }

  return (
    <nav className={cn("space-y-1", className)}>
      <p className="text-sm font-semibold text-foreground mb-4">On this page</p>
      <ul className="space-y-2 text-sm">
        {headings.map((heading) => (
          <li
            key={heading.id}
            style={{ paddingLeft: heading.level === 3 ? "0.75rem" : 0 }}
          >
            <a
              href={`#${heading.id}`}
              onClick={(e) => {
                e.preventDefault();
                const element = document.getElementById(heading.id);
                if (element) {
                  element.scrollIntoView({ behavior: "smooth" });
                  // Update URL without triggering navigation
                  window.history.pushState(null, "", `#${heading.id}`);
                }
              }}
              className={cn(
                "block py-1 transition-colors duration-200 border-l-2 pl-3 -ml-px",
                activeId === heading.id
                  ? "border-neutral-900 dark:border-neutral-100 text-foreground font-medium"
                  : "border-transparent text-neutral-500 dark:text-neutral-400 hover:text-foreground hover:border-neutral-400 dark:hover:border-neutral-500"
              )}
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
