"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Bookmark,
  BookmarkCheck,
  Clock,
  RotateCcw,
  Upload,
} from "lucide-react";

interface ProjectVersion {
  id: string;
  version: number;
  name: string | null;
  files: Record<string, string>;
  chatMessageId: string | null;
  isBookmarked: boolean;
  isPublished: boolean;
  createdAt: string;
}

interface VersionHistoryPanelProps {
  projectId: string;
  currentVersion: number;
  onRestore?: () => void;
  onClose?: () => void;
  isSidebar?: boolean; // New prop to control sidebar vs overlay mode
}

export default function VersionHistoryPanel({
  projectId,
  currentVersion,
  onRestore,
  onClose,
  isSidebar = false,
}: VersionHistoryPanelProps) {
  const [versions, setVersions] = useState<ProjectVersion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [restoringVersionId, setRestoringVersionId] = useState<string | null>(
    null
  );

  const loadVersions = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/projects/${projectId}/versions`);
      if (response.ok) {
        const data = await response.json();
        setVersions(data.versions);
      }
    } catch (error) {
      console.error("Error loading versions:", error);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadVersions();
  }, [loadVersions]);

  const handleRestore = async (versionId: string, versionNumber: number) => {
    if (
      !confirm(
        `Restore to Version ${versionNumber}? Your current work will be saved as a new version before restoring.`
      )
    ) {
      return;
    }

    try {
      setRestoringVersionId(versionId);
      const response = await fetch(
        `/api/projects/${projectId}/versions/${versionId}/restore`,
        {
          method: "POST",
        }
      );

      if (response.ok) {
        console.log(`✅ Successfully restored to version ${versionNumber}`);
        // Reload versions to show the new snapshot
        await loadVersions();
        // Notify parent to refresh files
        if (onRestore) onRestore();
      } else {
        alert("Failed to restore version. Please try again.");
      }
    } catch (error) {
      console.error("Error restoring version:", error);
      alert("Failed to restore version. Please try again.");
    } finally {
      setRestoringVersionId(null);
    }
  };

  const handleToggleBookmark = async (
    versionId: string,
    currentBookmarkState: boolean
  ) => {
    try {
      const response = await fetch(
        `/api/projects/${projectId}/versions/${versionId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            isBookmarked: !currentBookmarkState,
          }),
        }
      );

      if (response.ok) {
        // Update local state
        setVersions(
          versions.map((v) =>
            v.id === versionId
              ? { ...v, isBookmarked: !currentBookmarkState }
              : v
          )
        );
      }
    } catch (error) {
      console.error("Error toggling bookmark:", error);
    }
  };

  const handleTogglePublished = async (
    versionId: string,
    currentPublishedState: boolean
  ) => {
    try {
      const response = await fetch(
        `/api/projects/${projectId}/versions/${versionId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            isPublished: !currentPublishedState,
          }),
        }
      );

      if (response.ok) {
        // Update local state
        setVersions(
          versions.map((v) =>
            v.id === versionId
              ? { ...v, isPublished: !currentPublishedState }
              : v
          )
        );
      }
    } catch (error) {
      console.error("Error toggling published status:", error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
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

  const bookmarkedVersions = versions.filter((v) => v.isBookmarked);
  const unbookmarkedVersions = versions.filter((v) => !v.isBookmarked);

  const containerClasses = isSidebar
    ? "h-full flex flex-col bg-white dark:bg-neutral-900 border-l border-neutral-200 dark:border-neutral-800"
    : "absolute inset-0 bg-white dark:bg-neutral-900 z-10 flex flex-col";

  return (
    <div className={containerClasses}>
      {/* Header */}
      <div className="border-b border-neutral-200 dark:border-neutral-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              Version History
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Current: Version {currentVersion}
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
                Loading versions...
              </p>
            </div>
          </div>
        ) : versions.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-sm px-4">
              <Clock className="w-12 h-12 text-neutral-300 dark:text-neutral-600 mx-auto mb-3" />
              <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-1">
                No version history yet
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Versions are automatically saved when you make changes with AI.
              </p>
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-6">
            {/* Bookmarked Section */}
            {bookmarkedVersions.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <BookmarkCheck className="w-3.5 h-3.5" />
                  Bookmarked
                </h3>
                <div className="space-y-2">
                  {bookmarkedVersions.map((version) => (
                    <VersionCard
                      key={version.id}
                      version={version}
                      currentVersion={currentVersion}
                      onRestore={handleRestore}
                      onToggleBookmark={handleToggleBookmark}
                      onTogglePublished={handleTogglePublished}
                      isRestoring={restoringVersionId === version.id}
                      formatDate={formatDate}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Unpublished/All Versions Section */}
            {unbookmarkedVersions.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider mb-3">
                  {bookmarkedVersions.length > 0
                    ? "Unpublished"
                    : "All Versions"}
                </h3>
                <div className="space-y-2">
                  {unbookmarkedVersions.map((version) => (
                    <VersionCard
                      key={version.id}
                      version={version}
                      currentVersion={currentVersion}
                      onRestore={handleRestore}
                      onToggleBookmark={handleToggleBookmark}
                      onTogglePublished={handleTogglePublished}
                      isRestoring={restoringVersionId === version.id}
                      formatDate={formatDate}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function VersionCard({
  version,
  currentVersion,
  onRestore,
  onToggleBookmark,
  onTogglePublished,
  isRestoring,
  formatDate,
}: {
  version: ProjectVersion;
  currentVersion: number;
  onRestore: (versionId: string, versionNumber: number) => void;
  onToggleBookmark: (versionId: string, currentBookmarkState: boolean) => void;
  onTogglePublished: (
    versionId: string,
    currentPublishedState: boolean
  ) => void;
  isRestoring: boolean;
  formatDate: (dateString: string) => string;
}) {
  const isCurrent = version.version === currentVersion;
  const fileCount = Object.keys(version.files).length;

  return (
    <div
      className={`group relative rounded-xl border transition-all ${
        isCurrent
          ? "border-neutral-900 dark:border-neutral-100 bg-neutral-50 dark:bg-neutral-800"
          : "border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600 bg-white dark:bg-neutral-800/50"
      }`}
    >
      <div className="p-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h4 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                {version.name || `Version ${version.version}`}
              </h4>
              {isCurrent && (
                <span className="px-2 py-0.5 text-xs font-medium bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-full">
                  Current
                </span>
              )}
              {version.isPublished && (
                <span className="px-2 py-0.5 text-xs font-medium bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-full flex items-center gap-1">
                  <Upload className="w-3 h-3" />
                  Published
                </span>
              )}
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {formatDate(version.createdAt)} · {fileCount} file
              {fileCount !== 1 ? "s" : ""}
            </p>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Bookmark Button */}
            <button
              onClick={() => onToggleBookmark(version.id, version.isBookmarked)}
              className={`p-1.5 rounded-lg transition-colors ${
                version.isBookmarked
                  ? "text-neutral-900 dark:text-neutral-100"
                  : "text-neutral-400 dark:text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
              }`}
              title={
                version.isBookmarked
                  ? "Remove bookmark"
                  : "Bookmark this version"
              }
            >
              {version.isBookmarked ? (
                <BookmarkCheck className="w-4 h-4" fill="currentColor" />
              ) : (
                <Bookmark className="w-4 h-4" />
              )}
            </button>

            {/* Publish Button */}
            <button
              onClick={() => onTogglePublished(version.id, version.isPublished)}
              className={`p-1.5 rounded-lg transition-colors ${
                version.isPublished
                  ? "text-neutral-900 dark:text-neutral-100 bg-neutral-100 dark:bg-neutral-700"
                  : "text-neutral-400 dark:text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-700"
              }`}
              title={
                version.isPublished
                  ? "Unpublish this version"
                  : "Publish this version"
              }
            >
              <Upload className="w-4 h-4" />
            </button>

            {/* Restore Button */}
            {!isCurrent && (
              <button
                onClick={() => onRestore(version.id, version.version)}
                disabled={isRestoring}
                className="p-1.5 rounded-lg text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Restore this version"
              >
                {isRestoring ? (
                  <div className="w-4 h-4 border-2 border-neutral-300 dark:border-neutral-600 border-t-neutral-900 dark:border-t-neutral-100 rounded-full animate-spin" />
                ) : (
                  <RotateCcw className="w-4 h-4" />
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
