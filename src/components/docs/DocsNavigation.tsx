import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DocItem } from "@/lib/docs-config";

interface DocsNavigationProps {
  prev: { section: string; doc: DocItem } | null;
  next: { section: string; doc: DocItem } | null;
}

export function DocsNavigation({ prev, next }: DocsNavigationProps) {
  return (
    <div className="flex flex-col sm:flex-row items-stretch gap-4 mt-12 pt-8 border-t border-neutral-200 dark:border-neutral-800">
      {prev ? (
        <Link
          href={`/docs/${prev.section}/${prev.doc.slug}`}
          className="flex-1 group p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-600 transition-colors"
        >
          <div className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400 mb-1">
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </div>
          <div className="font-medium text-foreground group-hover:text-neutral-700 dark:group-hover:text-neutral-300 transition-colors">
            {prev.doc.title}
          </div>
        </Link>
      ) : (
        <div className="flex-1" />
      )}

      {next ? (
        <Link
          href={`/docs/${next.section}/${next.doc.slug}`}
          className="flex-1 group p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-600 transition-colors text-right"
        >
          <div className="flex items-center justify-end gap-2 text-sm text-neutral-500 dark:text-neutral-400 mb-1">
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </div>
          <div className="font-medium text-foreground group-hover:text-neutral-700 dark:group-hover:text-neutral-300 transition-colors">
            {next.doc.title}
          </div>
        </Link>
      ) : (
        <div className="flex-1" />
      )}
    </div>
  );
}
