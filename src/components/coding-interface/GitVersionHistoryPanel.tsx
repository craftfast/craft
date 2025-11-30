"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Bookmark,
  BookmarkCheck,
  Clock,
  RotateCcw,
  GitCommit,
  Github,
  ExternalLink,
} from "lucide-react";

interface GitVersion {
  sha: string;
  shortSha: string;
  message: string;
  author: string;
  date: Date | string;
  isBookmarked?: boolean;
}

interface GitVersionHistoryPanelProps {
  projectId: string;
  currentVersion?: number;
  onRestore?: () => void;
  onClose?: () => void;
  isSidebar?: boolean;
}

export default function GitVersionHistoryPanel({
  projectId,
  currentVersion,
  onRestore,
  onClose,
  isSidebar = false,
}: GitVersionHistoryPanelProps) {
  const [versions, setVersions] = useState<GitVersion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLinkedRepository, setHasLinkedRepository] = useState(false);
  const [restoringVersionSha, setRestoringVersionSha] = useState<string | null>(
    null
  );
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  const loadVersions = useCallback(
    async (pageNum = 1, append = false) => {
      try {
        if (!append) setIsLoading(true);

        const response = await fetch(
          `/api/projects/${projectId}/git-versions?page=${pageNum}&limit=20`
        );

        if (response.ok) {
          const data = await response.json();
          setHasLinkedRepository(data.hasLinkedRepository);
          setTotalCount(data.totalCount || 0);
          setHasMore(data.hasMore || false);

          if (append) {
            setVersions((prev) => [...prev, ...data.commits]);
          } else {
            setVersions(data.commits || []);
          }
        }
      } catch (error) {
        console.error("Error loading git versions:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [projectId]
  );

  useEffect(() => {
    loadVersions();
  }, [loadVersions]);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadVersions(nextPage, true);
  };

  const handleRestore = async (sha: string, shortSha: string) => {
    if (
      !confirm(
        `Restore to commit ${shortSha}? This will create a new commit with the restored state.`
      )
    ) {
      return;
    }

    try {
      setRestoringVersionSha(sha);
      const response = await fetch(
        `/api/projects/${projectId}/git-versions/${sha}/restore`,
        {
          method: "POST",
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Restored to commit ${shortSha}`, data);
        // Reload versions to show the new restore commit
        await loadVersions();
        // Notify parent to refresh files
        if (onRestore) onRestore();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to restore version. Please try again.");
      }
    } catch (error) {
      console.error("Error restoring version:", error);
      alert("Failed to restore version. Please try again.");
    } finally {
      setRestoringVersionSha(null);
    }
  };

  const handleBookmark = async (sha: string, name: string) => {
    const bookmarkName = prompt(
      "Enter a name for this bookmark:",
      name || "checkpoint"
    );
    if (!bookmarkName) return;

    try {
      const response = await fetch(
        `/api/projects/${projectId}/git-versions/${sha}/bookmark`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: bookmarkName }),
        }
      );

      if (response.ok) {
        // Update local state
        setVersions(
          versions.map((v) =>
            v.sha === sha ? { ...v, isBookmarked: true } : v
          )
        );
      } else {
        const error = await response.json();
        alert(error.error || "Failed to bookmark commit.");
      }
    } catch (error) {
      console.error("Error bookmarking commit:", error);
    }
  };

  const formatDate = (dateInput: Date | string) => {
    const date =
      typeof dateInput === "string" ? new Date(dateInput) : dateInput;
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return "Just now";
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? "s" : ""} ago`;
    } else {
      return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
      });
    }
  };

  const containerClasses = isSidebar
    ? "h-full flex flex-col bg-white dark:bg-neutral-900 border-l border-neutral-200 dark:border-neutral-800"
    : "absolute inset-0 bg-white dark:bg-neutral-900 z-10 flex flex-col";

  return (
    <div className={containerClasses}>
      {/* Header */}
      <div className="border-b border-neutral-200 dark:border-neutral-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <Github className="w-4 h-4" />
              Git History
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              {totalCount > 0 ? `${totalCount} commits` : "Connected to GitHub"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors"
          >
            <svg
              className="w-4 h-4 text-neutral-600 dark:text-neutral-400"
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
        </div>
      </div>

      {/* Version List */}
      <div className="flex-1 overflow-y-auto scrollbar-minimal">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-2 border-neutral-300 dark:border-neutral-600 border-t-neutral-900 dark:border-t-neutral-100 rounded-full animate-spin" />
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                Loading commits...
              </p>
            </div>
          </div>
        ) : !hasLinkedRepository ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-sm px-4">
              <Github className="w-12 h-12 text-neutral-300 dark:text-neutral-600 mx-auto mb-3" />
              <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-1">
                Connect GitHub Repository
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4">
                Link a GitHub repository to enable version history with Git
                commits.
              </p>
              <a
                href="#github"
                className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
              >
                <Github className="w-4 h-4" />
                Connect GitHub
              </a>
            </div>
          </div>
        ) : versions.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-sm px-4">
              <GitCommit className="w-12 h-12 text-neutral-300 dark:text-neutral-600 mx-auto mb-3" />
              <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-1">
                No commits yet
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Commits will appear here as you make changes with AI.
              </p>
            </div>
          </div>
        ) : (
          <div className="p-4">
            {/* Commit Timeline */}
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-4 top-6 bottom-6 w-px bg-neutral-200 dark:bg-neutral-700" />

              <div className="space-y-1">
                {versions.map((version, index) => (
                  <CommitCard
                    key={version.sha}
                    version={version}
                    isFirst={index === 0}
                    onRestore={handleRestore}
                    onBookmark={handleBookmark}
                    isRestoring={restoringVersionSha === version.sha}
                    formatDate={formatDate}
                  />
                ))}
              </div>
            </div>

            {/* Load More */}
            {hasMore && (
              <div className="mt-4 text-center">
                <button
                  onClick={loadMore}
                  className="px-4 py-2 text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
                >
                  Load more commits...
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function CommitCard({
  version,
  isFirst,
  onRestore,
  onBookmark,
  isRestoring,
  formatDate,
}: {
  version: GitVersion;
  isFirst: boolean;
  onRestore: (sha: string, shortSha: string) => void;
  onBookmark: (sha: string, name: string) => void;
  isRestoring: boolean;
  formatDate: (date: Date | string) => string;
}) {
  // Truncate long commit messages
  const truncatedMessage =
    version.message.length > 60
      ? version.message.substring(0, 60) + "..."
      : version.message;

  return (
    <div className="group relative flex items-start gap-3 py-2">
      {/* Timeline dot */}
      <div
        className={`relative z-10 flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center ${
          isFirst
            ? "border-neutral-900 dark:border-neutral-100 bg-neutral-900 dark:bg-neutral-100"
            : "border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900"
        }`}
      >
        <GitCommit
          className={`w-4 h-4 ${
            isFirst
              ? "text-white dark:text-neutral-900"
              : "text-neutral-400 dark:text-neutral-500"
          }`}
        />
      </div>

      {/* Commit Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p
              className={`text-sm font-medium truncate ${
                isFirst
                  ? "text-neutral-900 dark:text-neutral-100"
                  : "text-neutral-700 dark:text-neutral-300"
              }`}
            >
              {truncatedMessage}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <code className="text-xs font-mono text-neutral-500 dark:text-neutral-400">
                {version.shortSha}
              </code>
              <span className="text-xs text-neutral-400 dark:text-neutral-500">
                ·
              </span>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                {formatDate(version.date)}
              </span>
              <span className="text-xs text-neutral-400 dark:text-neutral-500">
                ·
              </span>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                {version.author}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {/* Bookmark */}
            <button
              onClick={() =>
                onBookmark(version.sha, version.message.split("\n")[0])
              }
              className={`p-1.5 rounded-lg transition-colors ${
                version.isBookmarked
                  ? "text-neutral-900 dark:text-neutral-100"
                  : "text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100"
              }`}
              title="Bookmark this commit"
            >
              {version.isBookmarked ? (
                <BookmarkCheck className="w-4 h-4" fill="currentColor" />
              ) : (
                <Bookmark className="w-4 h-4" />
              )}
            </button>

            {/* Restore */}
            {!isFirst && (
              <button
                onClick={() => onRestore(version.sha, version.shortSha)}
                disabled={isRestoring}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors disabled:opacity-50"
                title="Restore to this commit"
              >
                {isRestoring ? (
                  <div className="w-4 h-4 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin" />
                ) : (
                  <RotateCcw className="w-4 h-4" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Current indicator */}
        {isFirst && (
          <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 text-xs font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 rounded-full">
            Latest
          </span>
        )}
      </div>
    </div>
  );
}
