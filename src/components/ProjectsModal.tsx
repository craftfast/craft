"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useSession } from "@/lib/auth-client";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import type { ProjectsSortOption } from "@/lib/url-params";

type SortOption = ProjectsSortOption;

interface Project {
  id: string;
  name: string;
  description: string | null;
  previewImage?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ProjectsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProjectsModal({ isOpen, onClose }: ProjectsModalProps) {
  const { data: session, isPending } = useSession();
  const [sortBy, setSortBy] = useState<SortOption>("recent");
  const [searchQuery, setSearchQuery] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Initialize state from URL parameters on first open
  useEffect(() => {
    if (isOpen && !hasInitialized && typeof window !== "undefined") {
      const url = new URL(window.location.href);
      const sort = url.searchParams.get("sort") as SortOption;
      const search = url.searchParams.get("search");

      if (sort === "recent" || sort === "name" || sort === "oldest") {
        setSortBy(sort);
      }
      if (search) {
        setSearchQuery(search);
      }

      setHasInitialized(true);
    }
  }, [isOpen, hasInitialized]);

  // Update URL when filters change
  const updateUrlParams = (params: { sort?: SortOption; search?: string }) => {
    if (typeof window === "undefined") return;

    const url = new URL(window.location.href);
    url.searchParams.set("modal", "projects");

    if (params.sort !== undefined) {
      url.searchParams.set("sort", params.sort);
    }
    if (params.search !== undefined) {
      if (params.search === "") {
        url.searchParams.delete("search");
      } else {
        url.searchParams.set("search", params.search);
      }
    }

    window.history.replaceState({}, "", url.toString());
  };

  // Clear URL params on close
  const clearUrlParams = () => {
    if (typeof window === "undefined") return;

    const url = new URL(window.location.href);
    url.searchParams.delete("modal");
    url.searchParams.delete("sort");
    url.searchParams.delete("search");

    window.history.replaceState({}, "", url.toString());
  };

  const handleClose = () => {
    clearUrlParams();
    onClose();
  };

  useEffect(() => {
    if (session && !isPending && isOpen) {
      fetchProjects();
    } else if (!session && !isPending) {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, isPending, sortBy, searchQuery, isOpen]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        sortBy,
        ...(searchQuery && { search: searchQuery }),
      });
      const response = await fetch(`/api/projects?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch projects");
      }
      const data = await response.json();
      setProjects(data.projects || []);
    } catch (err) {
      console.error("Error fetching projects:", err);
      setError("Failed to load projects. Please try again.");
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

  // Generate a consistent color pattern based on project name
  const getPlaceholderGradient = (projectName: string) => {
    const gradients = [
      "from-neutral-400 to-neutral-600",
      "from-stone-400 to-stone-600",
      "from-gray-400 to-gray-600",
      "from-neutral-500 to-stone-600",
      "from-stone-500 to-gray-600",
    ];

    // Simple hash function to get consistent index
    let hash = 0;
    for (let i = 0; i < projectName.length; i++) {
      hash = projectName.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % gradients.length;
    return gradients[index];
  };

  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose, handleClose]);

  if (!isOpen) return null;

  const modalContent = (
    <div
      className="fixed inset-0 bg-background animate-in fade-in duration-200 flex flex-col"
      onClick={(e) => e.stopPropagation()}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 99999,
        backgroundColor: "inherit",
      }}
    >
      {/* Top Header Bar */}
      <div
        className="flex-shrink-0 h-16 flex items-center justify-between px-6 bg-background border-b"
        style={{ zIndex: 100000 }}
      >
        <h1 className="text-xl font-semibold text-foreground">Projects</h1>
        <button
          onClick={handleClose}
          className="p-2 rounded-full hover:bg-muted transition-colors"
        >
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
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Modal Content */}
      <div
        className="flex-1 flex overflow-hidden bg-background"
        style={{ zIndex: 100000 }}
      >
        {/* Left Sidebar - Menu */}
        <div
          className="w-64 flex-shrink-0 overflow-y-auto bg-background border-r [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-muted-foreground/30 [&::-webkit-scrollbar-thumb]:rounded-full"
          style={{ position: "relative", zIndex: 100001 }}
        >
          <div className="p-3 space-y-6">
            <div className="space-y-3">
              {/* Search */}
              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <Input
                  type="text"
                  placeholder="Search projects"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    updateUrlParams({ search: e.target.value });
                  }}
                  className="pl-9 pr-9 rounded-lg h-10"
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      updateUrlParams({ search: "" });
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
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
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                )}
              </div>

              {/* New Project Button */}
              <Button
                asChild
                size="sm"
                className="w-full rounded-lg h-10"
                onClick={onClose}
              >
                <Link
                  href="/"
                  className="flex items-center justify-center gap-2"
                >
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
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  New Project
                </Link>
              </Button>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Sort by
              </label>
              <div className="space-y-2">
                <Button
                  variant={sortBy === "recent" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setSortBy("recent");
                    updateUrlParams({ sort: "recent" });
                  }}
                  className="w-full justify-start rounded-lg"
                >
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Most Recent
                </Button>
                <Button
                  variant={sortBy === "name" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setSortBy("name");
                    updateUrlParams({ sort: "name" });
                  }}
                  className="w-full justify-start rounded-lg"
                >
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"
                    />
                  </svg>
                  Name (A-Z)
                </Button>
                <Button
                  variant={sortBy === "oldest" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setSortBy("oldest");
                    updateUrlParams({ sort: "oldest" });
                  }}
                  className="w-full justify-start rounded-lg"
                >
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Oldest First
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 bg-background [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-muted-foreground/30 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-muted-foreground/50">
          {/* Projects Display */}
          {!loading && !error && projects.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {projects.map((project) => (
                <Link
                  key={project.id}
                  href={`/chat/${project.id}`}
                  onClick={onClose}
                  className="group bg-card rounded-2xl border border-border hover:border-muted-foreground/50 hover:shadow-md transition-all cursor-pointer overflow-hidden aspect-video"
                >
                  <div className="relative w-full h-full">
                    {/* Preview Image */}
                    <div className="absolute inset-0 rounded-2xl overflow-hidden bg-muted">
                      {project.previewImage ? (
                        <Image
                          src={project.previewImage}
                          alt={project.name}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                        />
                      ) : (
                        <div
                          className={`w-full h-full bg-gradient-to-br ${getPlaceholderGradient(
                            project.name
                          )} flex items-center justify-center`}
                        >
                          <svg
                            className="w-12 h-12 text-white/30"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                      )}
                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    </div>

                    {/* Project Info Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h3 className="font-semibold text-white line-clamp-2 break-words drop-shadow-lg">
                        {project.name}
                      </h3>
                    </div>

                    {/* Time Badge */}
                    <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-black/60 backdrop-blur-sm">
                      <span className="text-xs text-white font-medium">
                        {getRelativeTime(project.createdAt)}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <div
                  key={index}
                  className="group relative rounded-2xl border border-border bg-card overflow-hidden aspect-video"
                >
                  <Skeleton className="w-full h-full" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <Skeleton className="h-5 w-3/4" />
                  </div>
                  <div className="absolute top-3 right-3">
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="flex justify-center items-center py-20">
              <div className="text-center max-w-md">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-destructive"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Failed to load projects
                </h3>
                <p className="text-sm text-muted-foreground mb-6">{error}</p>
                <Button onClick={fetchProjects} className="rounded-full">
                  Try Again
                </Button>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && projects.length === 0 && (
            <div className="flex justify-center items-center py-20">
              <div className="text-center max-w-md">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
                  <svg
                    className="w-10 h-10 text-muted-foreground"
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
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {searchQuery ? "No projects found" : "No projects yet"}
                </h3>
                <p className="text-sm text-muted-foreground mb-6">
                  {searchQuery
                    ? "Try adjusting your search criteria"
                    : "Create your first project to get started"}
                </p>
                {!searchQuery && (
                  <Button asChild className="rounded-full" onClick={onClose}>
                    <Link href="/">
                      <svg
                        className="w-4 h-4 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                      Create New Project
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {typeof window !== "undefined"
        ? createPortal(modalContent, document.body)
        : null}
    </>
  );
}
