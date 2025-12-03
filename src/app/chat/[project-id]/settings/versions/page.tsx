"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Clock,
  GitCommit,
  Github,
  RotateCcw,
  Bookmark,
  BookmarkCheck,
  ExternalLink,
  Loader2,
  ArrowRight,
  Database,
  Cloud,
} from "lucide-react";

// Database version type
interface DbVersion {
  id: string;
  version: number;
  name: string | null;
  isBookmarked: boolean;
  isPublished: boolean;
  createdAt: string;
}

// Git version type
interface GitVersion {
  sha: string;
  shortSha: string;
  message: string;
  author: string;
  date: string;
  isBookmarked?: boolean;
}

type VersionSource = "database" | "git";

export default function ProjectVersionsSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params["project-id"] as string;

  const [isLoading, setIsLoading] = useState(true);
  const [versionSource, setVersionSource] = useState<VersionSource>("database");
  const [hasLinkedRepo, setHasLinkedRepo] = useState(false);
  const [currentVersion, setCurrentVersion] = useState(0);

  // Database versions
  const [dbVersions, setDbVersions] = useState<DbVersion[]>([]);

  // Git versions
  const [gitVersions, setGitVersions] = useState<GitVersion[]>([]);
  const [gitTotalCount, setGitTotalCount] = useState(0);
  const [gitHasMore, setGitHasMore] = useState(false);
  const [gitPage, setGitPage] = useState(1);

  // Action states
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [bookmarkingId, setBookmarkingId] = useState<string | null>(null);

  // Check if GitHub is connected and load appropriate versions
  const loadVersions = useCallback(async () => {
    setIsLoading(true);
    try {
      // First, check if there's a linked GitHub repository
      const gitRes = await fetch(
        `/api/projects/${projectId}/git-versions?page=1&limit=20`
      );
      const gitData = await gitRes.json();

      if (gitData.hasLinkedRepository) {
        setHasLinkedRepo(true);
        setVersionSource("git");
        setGitVersions(gitData.commits || []);
        setGitTotalCount(gitData.totalCount || 0);
        setGitHasMore(gitData.hasMore || false);
      } else {
        // Fall back to database versions
        setHasLinkedRepo(false);
        setVersionSource("database");

        const dbRes = await fetch(`/api/projects/${projectId}/versions`);
        if (dbRes.ok) {
          const dbData = await dbRes.json();
          setDbVersions(dbData.versions || []);
          setCurrentVersion(dbData.currentVersion || 0);
        }
      }
    } catch (error) {
      console.error("Failed to load versions:", error);
      toast.error("Failed to load versions");
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadVersions();
  }, [loadVersions]);

  // Load more Git versions
  const loadMoreGitVersions = async () => {
    const nextPage = gitPage + 1;
    try {
      const res = await fetch(
        `/api/projects/${projectId}/git-versions?page=${nextPage}&limit=20`
      );
      const data = await res.json();
      setGitVersions((prev) => [...prev, ...(data.commits || [])]);
      setGitHasMore(data.hasMore || false);
      setGitPage(nextPage);
    } catch (error) {
      toast.error("Failed to load more versions");
    }
  };

  // Restore database version
  const handleRestoreDbVersion = async (versionId: string) => {
    setRestoringId(versionId);
    try {
      const response = await fetch(
        `/api/projects/${projectId}/versions/${versionId}/restore`,
        { method: "POST" }
      );

      if (response.ok) {
        toast.success("Version restored successfully");
        loadVersions();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to restore version");
      }
    } catch (error) {
      toast.error("Failed to restore version");
    } finally {
      setRestoringId(null);
    }
  };

  // Restore Git version
  const handleRestoreGitVersion = async (sha: string, shortSha: string) => {
    setRestoringId(sha);
    try {
      const response = await fetch(
        `/api/projects/${projectId}/git-versions/${sha}/restore`,
        { method: "POST" }
      );

      if (response.ok) {
        toast.success(`Restored to commit ${shortSha}`);
        loadVersions();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to restore version");
      }
    } catch (error) {
      toast.error("Failed to restore version");
    } finally {
      setRestoringId(null);
    }
  };

  // Toggle bookmark for database version
  const handleToggleDbBookmark = async (
    versionId: string,
    currentState: boolean
  ) => {
    setBookmarkingId(versionId);
    try {
      const response = await fetch(
        `/api/projects/${projectId}/versions/${versionId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isBookmarked: !currentState }),
        }
      );

      if (response.ok) {
        setDbVersions((prev) =>
          prev.map((v) =>
            v.id === versionId ? { ...v, isBookmarked: !currentState } : v
          )
        );
      }
    } catch (error) {
      toast.error("Failed to update bookmark");
    } finally {
      setBookmarkingId(null);
    }
  };

  // Format date helper
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
    }
    if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    }
    if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? "s" : ""} ago`;
    }
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="pb-4 border-b border-border">
          <h2 className="text-2xl font-semibold">Version History</h2>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-border">
        <h2 className="text-2xl font-semibold">Version History</h2>
        <p className="text-muted-foreground text-sm mt-1">
          View and restore previous versions of your project
        </p>
      </div>

      {/* Version Source Indicator */}
      <div className="flex items-center gap-2 p-3 rounded-xl border bg-muted/30">
        {versionSource === "git" ? (
          <>
            <div className="p-1.5 rounded-lg bg-neutral-900 dark:bg-white">
              <Github className="w-4 h-4 text-white dark:text-neutral-900" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Git-based Version Control</p>
              <p className="text-xs text-muted-foreground">
                {gitTotalCount} commits from linked GitHub repository
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="rounded-lg text-xs"
              onClick={() => router.push(`/chat/${projectId}/settings/git`)}
            >
              Manage
              <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </>
        ) : (
          <>
            <div className="p-1.5 rounded-lg bg-neutral-200 dark:bg-neutral-700">
              <Database className="w-4 h-4 text-neutral-600 dark:text-neutral-300" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Local Version Snapshots</p>
              <p className="text-xs text-muted-foreground">
                {dbVersions.length} versions stored locally
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="rounded-lg text-xs"
              onClick={() => router.push(`/chat/${projectId}/settings/git`)}
            >
              <Cloud className="w-3 h-3 mr-1" />
              Connect GitHub
            </Button>
          </>
        )}
      </div>

      {/* Git Versions List */}
      {versionSource === "git" && (
        <div className="space-y-2">
          {gitVersions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <GitCommit className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No commits yet</p>
              <p className="text-sm mt-1">
                Commits will appear as you make changes
              </p>
            </div>
          ) : (
            <>
              {/* Timeline */}
              <div className="relative pl-6">
                {/* Timeline line */}
                <div className="absolute left-[11px] top-4 bottom-4 w-px bg-border" />

                {gitVersions.map((version, index) => (
                  <div
                    key={version.sha}
                    className="relative flex items-start gap-3 py-3"
                  >
                    {/* Timeline dot */}
                    <div
                      className={`absolute left-0 w-[22px] h-[22px] rounded-full border-2 flex items-center justify-center ${
                        index === 0
                          ? "border-foreground bg-foreground"
                          : "border-muted-foreground/30 bg-background"
                      }`}
                    >
                      <GitCommit
                        className={`w-3 h-3 ${
                          index === 0
                            ? "text-background"
                            : "text-muted-foreground/50"
                        }`}
                      />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 ml-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p
                            className={`text-sm font-medium truncate ${
                              index === 0
                                ? "text-foreground"
                                : "text-muted-foreground"
                            }`}
                          >
                            {version.message.length > 60
                              ? version.message.substring(0, 60) + "..."
                              : version.message}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                            <code className="font-mono">
                              {version.shortSha}
                            </code>
                            <span>·</span>
                            <span>{formatDate(version.date)}</span>
                            <span>·</span>
                            <span>{version.author}</span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {index === 0 ? (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-muted-foreground">
                              Latest
                            </span>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 rounded-lg"
                              onClick={() =>
                                handleRestoreGitVersion(
                                  version.sha,
                                  version.shortSha
                                )
                              }
                              disabled={restoringId === version.sha}
                            >
                              {restoringId === version.sha ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <>
                                  <RotateCcw className="w-3 h-3 mr-1" />
                                  Restore
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Load More */}
              {gitHasMore && (
                <div className="pt-2 text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={loadMoreGitVersions}
                    className="rounded-lg"
                  >
                    Load more commits...
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Database Versions List */}
      {versionSource === "database" && (
        <div className="space-y-2">
          {dbVersions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No versions yet</p>
              <p className="text-sm mt-1">
                Versions are created automatically when you make changes
              </p>
            </div>
          ) : (
            dbVersions.map((version) => {
              const isCurrent = version.version === currentVersion;
              return (
                <div
                  key={version.id}
                  className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${
                    isCurrent
                      ? "border-foreground/20 bg-muted/50"
                      : "hover:bg-muted/30"
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">
                        {version.name || `Version ${version.version}`}
                      </span>
                      {isCurrent && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900">
                          Current
                        </span>
                      )}
                      {version.isBookmarked && (
                        <BookmarkCheck className="w-4 h-4 text-foreground" />
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground mt-0.5">
                      {formatDate(version.createdAt)}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Bookmark toggle */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-lg"
                      onClick={() =>
                        handleToggleDbBookmark(version.id, version.isBookmarked)
                      }
                      disabled={bookmarkingId === version.id}
                    >
                      {bookmarkingId === version.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : version.isBookmarked ? (
                        <BookmarkCheck className="w-4 h-4" />
                      ) : (
                        <Bookmark className="w-4 h-4" />
                      )}
                    </Button>

                    {/* Restore button */}
                    {!isCurrent && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRestoreDbVersion(version.id)}
                        disabled={restoringId === version.id}
                        className="rounded-lg"
                      >
                        {restoringId === version.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <RotateCcw className="w-3 h-3 mr-1" />
                            Restore
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Upgrade prompt for database users */}
      {versionSource === "database" && dbVersions.length > 0 && (
        <div className="p-4 rounded-xl border border-dashed bg-muted/20 space-y-3">
          <div className="flex items-start gap-3">
            <Github className="w-5 h-5 text-muted-foreground mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium">
                Upgrade to Git-based versioning
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Connect GitHub to get real diffs, collaboration features, and
                industry-standard version control. Your existing versions will
                be preserved.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full rounded-lg"
            onClick={() => router.push(`/chat/${projectId}/settings/git`)}
          >
            <Github className="w-4 h-4 mr-2" />
            Connect GitHub Repository
          </Button>
        </div>
      )}
    </div>
  );
}
