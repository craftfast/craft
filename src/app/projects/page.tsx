"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "@/lib/auth-client";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import SidebarLayout from "@/components/SidebarLayout";
import AppHeader from "@/components/AppHeader";
import {
  Search,
  Plus,
  Grid3X3,
  List,
  Clock,
  ArrowUpAZ,
  ArrowDownAZ,
  Filter,
} from "lucide-react";
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

export default function ProjectsPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [sortBy, setSortBy] = useState<SortOption>("recent");
  const [searchQuery, setSearchQuery] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Initialize state from URL parameters
  useEffect(() => {
    const sort = searchParams.get("sort") as SortOption;
    const search = searchParams.get("search");
    const view = searchParams.get("view") as "grid" | "list";

    if (sort === "recent" || sort === "name" || sort === "oldest") {
      setSortBy(sort);
    }
    if (search) {
      setSearchQuery(search);
    }
    if (view === "grid" || view === "list") {
      setViewMode(view);
    }
  }, [searchParams]);

  // Update URL when filters change
  const updateUrlParams = (params: {
    sort?: SortOption;
    search?: string;
    view?: "grid" | "list";
  }) => {
    const url = new URL(window.location.href);

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
    if (params.view !== undefined) {
      url.searchParams.set("view", params.view);
    }

    router.replace(url.pathname + url.search, { scroll: false });
  };

  useEffect(() => {
    if (session && !isPending) {
      fetchProjects();
    } else if (!session && !isPending) {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, isPending]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/projects`);
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

  // Filter and sort projects client-side
  const filteredProjects = useMemo(() => {
    let result = [...projects];

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (project) =>
          project.name.toLowerCase().includes(query) ||
          project.description?.toLowerCase().includes(query)
      );
    }

    // Sort
    switch (sortBy) {
      case "name":
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "oldest":
        result.sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        break;
      case "recent":
      default:
        result.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
    }

    return result;
  }, [projects, searchQuery, sortBy]);

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

    let hash = 0;
    for (let i = 0; i < projectName.length; i++) {
      hash = projectName.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % gradients.length;
    return gradients[index];
  };

  const sortOptions = [
    { id: "recent" as SortOption, label: "Recent", icon: Clock },
    { id: "name" as SortOption, label: "Name (A-Z)", icon: ArrowUpAZ },
    { id: "oldest" as SortOption, label: "Oldest", icon: ArrowDownAZ },
  ];

  // Loading state
  if (isPending) {
    return (
      <SidebarLayout>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground" />
        </div>
      </SidebarLayout>
    );
  }

  // Show sign-in prompt for unauthenticated users
  if (!session) {
    return (
      <SidebarLayout>
        <div className="min-h-screen bg-background text-foreground flex flex-col">
          {/* Header */}
          <AppHeader />

          {/* Auth Required Message */}
          <main className="flex-1 flex items-center justify-center pb-12">
            <div className="text-center max-w-md mx-auto px-4">
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-muted flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-muted-foreground"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold mb-2">
                Sign in to view your projects
              </h2>
              <p className="text-muted-foreground mb-6">
                Create an account or sign in to start building and managing your
                projects.
              </p>
              <div className="flex items-center justify-center gap-3">
                <Button variant="outline" asChild className="rounded-full">
                  <Link href="/auth/signin">Log in</Link>
                </Button>
                <Button asChild className="rounded-full">
                  <Link href="/auth/signup">Sign up</Link>
                </Button>
              </div>
            </div>
          </main>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        {/* Header */}
        <AppHeader userId={session.user.id} />

        {/* Main Content */}
        <main className="flex-1 pb-12">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Page Header */}
            <div className="py-8 border-b border-border">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-foreground">
                    Projects
                  </h1>
                  <p className="text-sm text-muted-foreground mt-1">
                    Manage and access all your projects in one place
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">
                      {projects.length}
                    </span>{" "}
                    {projects.length === 1 ? "project" : "projects"}
                  </div>
                  <Button asChild className="rounded-full">
                    <Link
                      href="/"
                      className="flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      New Project
                    </Link>
                  </Button>
                </div>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="py-6 space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search projects..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      updateUrlParams({ search: e.target.value });
                    }}
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-muted/50 border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
                  />
                </div>

                {/* View Toggle */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-muted/50 rounded-lg p-1 border border-input">
                    <button
                      onClick={() => {
                        setViewMode("grid");
                        updateUrlParams({ view: "grid" });
                      }}
                      className={`p-1.5 rounded-md transition-colors ${
                        viewMode === "grid"
                          ? "bg-background shadow-sm text-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Grid3X3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setViewMode("list");
                        updateUrlParams({ view: "list" });
                      }}
                      className={`p-1.5 rounded-md transition-colors ${
                        viewMode === "list"
                          ? "bg-background shadow-sm text-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <List className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Sort Filters */}
              <div className="flex items-center gap-2 flex-wrap">
                <Filter className="w-4 h-4 text-muted-foreground" />
                {sortOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => {
                      setSortBy(option.id);
                      updateUrlParams({ sort: option.id });
                    }}
                    className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                      sortBy === option.id
                        ? "bg-foreground text-background"
                        : "bg-muted/50 text-muted-foreground hover:bg-muted border border-input"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Projects Grid/List */}
            {!loading && !error && filteredProjects.length > 0 && (
              <div
                className={
                  viewMode === "grid"
                    ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                    : "space-y-3"
                }
              >
                {filteredProjects.map((project) =>
                  viewMode === "grid" ? (
                    <Link
                      key={project.id}
                      href={`/project/${project.id}`}
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
                  ) : (
                    <Link
                      key={project.id}
                      href={`/project/${project.id}`}
                      className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl border border-input hover:border-foreground/20 transition-all"
                    >
                      {/* Thumbnail */}
                      <div className="w-20 h-14 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        {project.previewImage ? (
                          <Image
                            src={project.previewImage}
                            alt={project.name}
                            width={80}
                            height={56}
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <div
                            className={`w-full h-full bg-gradient-to-br ${getPlaceholderGradient(
                              project.name
                            )} flex items-center justify-center`}
                          >
                            <svg
                              className="w-6 h-6 text-white/30"
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
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-foreground truncate">
                          {project.name}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {getRelativeTime(project.createdAt)}
                        </p>
                      </div>
                    </Link>
                  )
                )}
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div
                className={
                  viewMode === "grid"
                    ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                    : "space-y-3"
                }
              >
                {Array.from({ length: 8 }).map((_, index) =>
                  viewMode === "grid" ? (
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
                  ) : (
                    <div
                      key={index}
                      className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl border border-input"
                    >
                      <Skeleton className="w-20 h-14 rounded-lg" />
                      <div className="flex-1">
                        <Skeleton className="h-5 w-3/4 mb-2" />
                        <Skeleton className="h-3 w-1/4" />
                      </div>
                    </div>
                  )
                )}
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
            {!loading && !error && filteredProjects.length === 0 && (
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
                  {searchQuery ? (
                    <button
                      onClick={() => {
                        setSearchQuery("");
                        updateUrlParams({ search: "" });
                      }}
                      className="text-sm text-foreground underline hover:no-underline"
                    >
                      Clear search
                    </button>
                  ) : (
                    <Button asChild className="rounded-full">
                      <Link href="/">
                        <Plus className="w-4 h-4 mr-2" />
                        Create New Project
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </SidebarLayout>
  );
}
