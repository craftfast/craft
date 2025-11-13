"use client";

/**
 * Project List Component with Screenshot Thumbnails
 *
 * Example implementation showing how to display project screenshots
 * captured by the screenshot capture system.
 *
 * This is a reference implementation - adapt to your UI needs.
 */

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

interface Project {
  id: string;
  name: string;
  description: string | null;
  thumbnailUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function ProjectListExample() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await fetch("/api/projects");
      const data = await response.json();
      setProjects(data.projects || []);
    } catch (error) {
      console.error("Failed to fetch projects:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="border border-border rounded-xl overflow-hidden animate-pulse"
          >
            <div className="w-full h-48 bg-muted"></div>
            <div className="p-4 space-y-2">
              <div className="h-5 bg-muted rounded w-3/4"></div>
              <div className="h-4 bg-muted rounded w-full"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="text-center py-12">
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
        <h3 className="text-lg font-semibold text-foreground mb-2">
          No projects yet
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Create your first project to get started
        </p>
        <Link
          href="/create"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors"
        >
          Create Project
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((project) => (
        <Link
          key={project.id}
          href={`/projects/${project.id}`}
          className="group border border-border rounded-xl overflow-hidden hover:border-primary/50 transition-all hover:shadow-lg"
        >
          {/* Screenshot Thumbnail */}
          <div className="relative w-full h-48 bg-muted overflow-hidden">
            {project.thumbnailUrl ? (
              <Image
                src={project.thumbnailUrl}
                alt={project.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center">
                  <svg
                    className="w-12 h-12 mx-auto mb-2 text-muted-foreground/50"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <span className="text-xs text-muted-foreground">
                    No preview
                  </span>
                </div>
              </div>
            )}

            {/* Overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="absolute bottom-4 left-4 right-4">
                <div className="flex items-center gap-2 text-white text-sm">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                  <span>View Project</span>
                </div>
              </div>
            </div>
          </div>

          {/* Project Info */}
          <div className="p-4">
            <h3 className="font-semibold text-foreground mb-1 line-clamp-1 group-hover:text-primary transition-colors">
              {project.name}
            </h3>
            {project.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                {project.description}
              </p>
            )}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Updated {getRelativeTime(project.updatedAt)}</span>
              {project.thumbnailUrl && (
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span>Preview ready</span>
                </div>
              )}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

// Utility function to format relative time
function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) {
    return "just now";
  } else if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else {
    return date.toLocaleDateString();
  }
}
