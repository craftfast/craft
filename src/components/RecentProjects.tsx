"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useSession } from "@/lib/auth-client";

interface Project {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function RecentProjects() {
  const { data: session, isPending } = useSession();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (!session && !isPending) {
    return null;
  }

  return (
    <div className="mt-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-sm sm:text-lg font-semibold text-foreground">
          Recent Projects
        </h2>
        <Link
          href="/projects"
          className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors text-sm font-medium"
        >
          View all →
        </Link>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}

      {/* Empty State */}
      {!loading && projects.length === 0 && (
        <div className="text-center py-1">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            <svg
              className="w-8 h-8 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
          </div>
          <h3 className="text-md font-semibold text-foreground pb-1">
            No projects yet
          </h3>
          <p className="text-sm text-muted-foreground">
            Create your first project to get started
          </p>
        </div>
      )}

      {/* Recent Projects Grid - Show only 4 most recent */}
      {!loading && projects.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/chat/${project.id}`}
              className="group p-6 bg-card rounded-2xl border border-border hover:border-ring transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-muted-foreground"
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
                <span className="text-xs text-muted-foreground">
                  {getRelativeTime(project.createdAt)}
                </span>
              </div>
              <h3 className="font-semibold text-card-foreground mb-2 line-clamp-1 break-words">
                {project.name}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {project.description || "No description"}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
