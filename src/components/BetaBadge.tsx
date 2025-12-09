"use client";

import { VERSION_INFO } from "@/lib/version";

interface BetaBadgeProps {
  showVersion?: boolean;
  className?: string;
}

/**
 * Beta Badge Component
 *
 * Displays a badge indicating the app is in beta stage.
 * Optionally shows the version number.
 */
export default function BetaBadge({
  showVersion = false,
  className = "",
}: BetaBadgeProps) {
  if (!VERSION_INFO.isPreRelease) {
    return null;
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 ${className}`}
    >
      {VERSION_INFO.stage}
      {showVersion && (
        <span className="text-neutral-500 dark:text-neutral-500">
          {VERSION_INFO.displayVersion}
        </span>
      )}
    </span>
  );
}
