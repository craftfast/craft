"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import ProjectCardSkeleton from "./ProjectCardSkeleton";

interface Project {
  id: string;
  name: string;
  description: string | null;
  previewImage: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    fileRecords: number;
    chatMessages: number;
  };
}

export default function RecentProjects() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);

  useEffect(() => {
    if (session && !isPending) {
      fetchRecentProjects();
    } else if (!session && !isPending) {
      setLoading(false);
    }
  }, [session, isPending]);

  const fetchRecentProjects = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/projects?sortBy=recent&limit=4");
      if (!response.ok) {
        throw new Error("Failed to fetch projects");
      }
      const data = await response.json();
      setProjects(data.projects || []);
    } catch (err) {
      console.error("Error fetching recent projects:", err);
    } finally {
      setLoading(false);
    }
  };

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return "Today";
    if (diffInDays === 1) return "Yesterday";
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
    return `${Math.floor(diffInDays / 365)} years ago`;
  };

  const handleDelete = async (projectId: string, projectName: string) => {
    if (!confirm(`Are you sure you want to delete "${projectName}"?`)) {
      return;
    }

    setDeletingId(projectId);
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete project");
      }

      // Remove from list
      setProjects(projects.filter((p) => p.id !== projectId));
    } catch (error) {
      console.error("Error deleting project:", error);
      alert("Failed to delete project. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleDuplicate = async (projectId: string) => {
    setDuplicatingId(projectId);
    try {
      const response = await fetch(`/api/projects/${projectId}/duplicate`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to duplicate project");
      }

      const data = await response.json();

      // Refresh the list
      await fetchRecentProjects();

      // Navigate to the duplicated project
      router.push(`/chat/${data.project.id}`);
    } catch (error) {
      console.error("Error duplicating project:", error);
      alert("Failed to duplicate project. Please try again.");
    } finally {
      setDuplicatingId(null);
    }
  };

  const getTechIcon = (model?: string) => {
    if (!model) return null;

    if (model.includes("claude")) {
      return (
        <span className="text-xs text-muted-foreground font-medium">
          Claude
        </span>
      );
    }
    if (model.includes("gpt")) {
      return (
        <span className="text-xs text-muted-foreground font-medium">GPT</span>
      );
    }
    return null;
  };

  if (!session && !isPending) {
    return null;
  }

  return (
    <div className="mt-16">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-muted-foreground">
          Recent Projects
        </h2>
        <Link
          href="/projects"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          View all →
        </Link>
      </div>

      {/* Loading State with Skeletons */}
      {loading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <ProjectCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && projects.length === 0 && (
        <div className="text-center py-8 opacity-50">
          <p className="text-sm text-muted-foreground">No projects yet</p>
        </div>
      )}

      {/* Recent Projects Grid - Show only 4 most recent */}
      {!loading && projects.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {projects.map((project) => (
            <div
              key={project.id}
              className="group relative bg-card/50 rounded-xl border border-border/50 hover:border-border hover:bg-card transition-all cursor-pointer overflow-hidden"
            >
              {/* Main Card Content - Clickable Link */}
              <Link href={`/chat/${project.id}`} className="block">
                {/* Thumbnail or Icon Header */}
                {project.previewImage ? (
                  <div className="relative w-full h-32 bg-muted overflow-hidden">
                    <img
                      src={project.previewImage}
                      alt={project.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                  </div>
                ) : (
                  <div className="relative w-full h-32 bg-muted/50 flex items-center justify-center">
                    <svg
                      className="w-12 h-12 text-muted-foreground/30"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                )}

                {/* Card Content */}
                <div className="p-4">
                  {/* Header with Time */}
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-xs text-muted-foreground">
                      {getRelativeTime(project.updatedAt)}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-sm font-medium text-foreground mb-2 line-clamp-1 break-words">
                    {project.name}
                  </h3>

                  {/* Metadata Footer */}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {project._count && (
                      <>
                        {/* File Count */}
                        <span>{project._count.fileRecords} files</span>
                        <span>•</span>
                        {/* Chat Count */}
                        <span>{project._count.chatMessages} chats</span>
                      </>
                    )}
                  </div>
                </div>
              </Link>

              {/* Action Buttons - Appear on Hover */}
              <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {/* Duplicate Button */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    handleDuplicate(project.id);
                  }}
                  disabled={duplicatingId === project.id}
                  className="p-1.5 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Duplicate project"
                >
                  {duplicatingId === project.id ? (
                    <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                  )}
                </button>

                {/* Delete Button */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    handleDelete(project.id, project.name);
                  }}
                  disabled={deletingId === project.id}
                  className="p-1.5 bg-secondary hover:bg-destructive hover:text-destructive-foreground text-secondary-foreground rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Delete project"
                >
                  {deletingId === project.id ? (
                    <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
