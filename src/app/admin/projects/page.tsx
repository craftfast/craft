/**
 * Admin Projects Management Page
 *
 * Project listing with search, filtering, and management
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Filter,
  MoreVertical,
  Eye,
  Trash2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  FolderKanban,
  MessageSquare,
  History,
  ExternalLink,
  User,
  Bug,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface Project {
  id: string;
  name: string;
  description: string | null;
  type: string;
  status: string;
  visibility: string;
  version: number;
  generationStatus: string;
  sandboxId: string | null;
  previewImage: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
  _count: {
    chatMessages: number;
    versions: number;
  };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });
      if (search) params.set("search", search);
      if (statusFilter !== "all") params.set("status", statusFilter);

      const response = await fetch(`/api/admin/projects?${params}`);
      const data = await response.json();

      if (response.ok) {
        setProjects(data.projects);
        setPagination(data.pagination);
      } else {
        toast.error(data.error || "Failed to fetch projects");
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
      toast.error("Failed to fetch projects");
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, search, statusFilter]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleStatusChange = async (projectId: string, newStatus: string) => {
    try {
      const response = await fetch("/api/admin/projects", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          action: "updateStatus",
          data: { status: newStatus },
        }),
      });

      if (response.ok) {
        toast.success("Status updated successfully");
        fetchProjects();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to update status");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status");
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this project? This cannot be undone."
      )
    )
      return;

    try {
      const response = await fetch(
        `/api/admin/projects?projectId=${projectId}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        toast.success("Project deleted successfully");
        fetchProjects();
      } else {
        const error = await response.json();
        toast.error(error.error || "Delete failed");
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Delete failed");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300";
      case "archived":
        return "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300";
      case "deleted":
        return "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
            Projects
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1">
            Manage all projects across the platform
          </p>
        </div>
        <Button
          onClick={fetchProjects}
          variant="outline"
          className="rounded-full"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card className="rounded-2xl border-neutral-200 dark:border-neutral-800">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <Input
                placeholder="Search by name or description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 rounded-full"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
            >
              <SelectTrigger className="w-[180px] rounded-full">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
                <SelectItem value="deleted">Deleted</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Projects Table */}
      <Card className="overflow-hidden rounded-2xl border-neutral-200 dark:border-neutral-800">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 dark:bg-neutral-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                    Project
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                    Owner
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                    Messages
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                    Versions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                    Updated
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-neutral-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i}>
                      <td colSpan={7} className="px-6 py-4">
                        <div className="h-8 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
                      </td>
                    </tr>
                  ))
                ) : projects.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-12 text-center text-neutral-500"
                    >
                      No projects found
                    </td>
                  </tr>
                ) : (
                  projects.map((project) => (
                    <tr
                      key={project.id}
                      className="hover:bg-neutral-50 dark:hover:bg-neutral-900"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center overflow-hidden">
                            {project.previewImage ? (
                              <img
                                src={project.previewImage}
                                alt={project.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <FolderKanban className="h-5 w-5 text-neutral-500" />
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-neutral-900 dark:text-neutral-100">
                              {project.name}
                            </div>
                            <div className="text-sm text-neutral-500 truncate max-w-[200px]">
                              {project.description || "No description"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center overflow-hidden">
                            {project.user.image ? (
                              <img
                                src={project.user.image}
                                alt={project.user.name || "User"}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <User className="h-3 w-3 text-neutral-500" />
                            )}
                          </div>
                          <span className="text-sm text-neutral-600 dark:text-neutral-400 truncate max-w-[120px]">
                            {project.user.name || project.user.email}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          className={`rounded-full ${getStatusColor(
                            project.status
                          )}`}
                        >
                          {project.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-neutral-500">
                        <div className="flex items-center gap-1">
                          <MessageSquare className="h-4 w-4" />
                          {project._count.chatMessages}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-neutral-500">
                        <div className="flex items-center gap-1">
                          <History className="h-4 w-4" />v{project.version}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-neutral-500">
                        {new Date(project.updatedAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="rounded-full"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="rounded-xl"
                          >
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedProject(project);
                                setViewDialogOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <a href={`/admin/projects/${project.id}`}>
                                <Bug className="h-4 w-4 mr-2" />
                                Debug / Full Chat
                              </a>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <a
                                href={`/agent/${project.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Open Project
                              </a>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() =>
                                handleStatusChange(project.id, "active")
                              }
                              disabled={project.status === "active"}
                            >
                              Set Active
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                handleStatusChange(project.id, "archived")
                              }
                              disabled={project.status === "archived"}
                            >
                              Archive
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDeleteProject(project.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Project
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-neutral-200 dark:border-neutral-800 px-6 py-4">
              <div className="text-sm text-neutral-500">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
                of {pagination.total} projects
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setPagination((p) => ({ ...p, page: p.page - 1 }))
                  }
                  disabled={pagination.page === 1}
                  className="rounded-full"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-neutral-500">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setPagination((p) => ({ ...p, page: p.page + 1 }))
                  }
                  disabled={pagination.page === pagination.totalPages}
                  className="rounded-full"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Project Detail Dialog */}
      <ProjectDetailDialog
        project={selectedProject}
        open={viewDialogOpen}
        onClose={() => {
          setViewDialogOpen(false);
          setSelectedProject(null);
        }}
      />
    </div>
  );
}

// Project Detail Dialog Component
function ProjectDetailDialog({
  project,
  open,
  onClose,
}: {
  project: Project | null;
  open: boolean;
  onClose: () => void;
}) {
  const [data, setData] = useState<{
    project: Project & {
      chatMessages: Array<{
        id: string;
        role: string;
        content: string;
        createdAt: string;
      }>;
      versions: Array<{
        id: string;
        version: number;
        name: string | null;
        isBookmarked: boolean;
        createdAt: string;
      }>;
    };
    stats: {
      totalAiCalls: number;
      totalInputTokens: number;
      totalOutputTokens: number;
      totalAiCost: number;
    };
  } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && project) {
      setLoading(true);
      fetch(`/api/admin/projects/${project.id}`)
        .then((res) => res.json())
        .then((result) => {
          if (result.project) {
            setData(result);
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [open, project]);

  if (!project) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="rounded-2xl max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{project.name}</DialogTitle>
          <DialogDescription>
            {project.description || "No description"}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-6 w-6 animate-spin text-neutral-400" />
          </div>
        ) : data ? (
          <div className="space-y-6 py-4">
            {/* Project Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-neutral-500">Status</label>
                <p className="font-medium capitalize">{data.project.status}</p>
              </div>
              <div>
                <label className="text-xs text-neutral-500">Version</label>
                <p className="font-medium">v{data.project.version}</p>
              </div>
              <div>
                <label className="text-xs text-neutral-500">Created</label>
                <p className="font-medium">
                  {new Date(data.project.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <label className="text-xs text-neutral-500">Updated</label>
                <p className="font-medium">
                  {new Date(data.project.updatedAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* AI Usage Stats */}
            <div>
              <h4 className="font-medium mb-2">AI Usage</h4>
              <div className="grid grid-cols-2 gap-4 rounded-xl bg-neutral-50 dark:bg-neutral-900 p-4">
                <div>
                  <label className="text-xs text-neutral-500">
                    Total Calls
                  </label>
                  <p className="font-medium">
                    {data.stats.totalAiCalls.toLocaleString()}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-neutral-500">Total Cost</label>
                  <p className="font-medium">
                    ${data.stats.totalAiCost.toFixed(4)}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-neutral-500">
                    Input Tokens
                  </label>
                  <p className="font-medium">
                    {data.stats.totalInputTokens.toLocaleString()}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-neutral-500">
                    Output Tokens
                  </label>
                  <p className="font-medium">
                    {data.stats.totalOutputTokens.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Recent Messages */}
            <div>
              <h4 className="font-medium mb-2">
                Recent Messages ({data.project.chatMessages.length})
              </h4>
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {data.project.chatMessages.slice(0, 10).map((msg) => (
                  <div
                    key={msg.id}
                    className="rounded-xl bg-neutral-50 dark:bg-neutral-900 p-3"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <Badge
                        variant={msg.role === "user" ? "default" : "secondary"}
                        className="rounded-full text-xs"
                      >
                        {msg.role}
                      </Badge>
                      <span className="text-xs text-neutral-500">
                        {new Date(msg.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2">
                      {msg.content.slice(0, 200)}...
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Versions */}
            <div>
              <h4 className="font-medium mb-2">
                Recent Versions ({data.project.versions.length})
              </h4>
              <div className="space-y-2">
                {data.project.versions.map((ver) => (
                  <div
                    key={ver.id}
                    className="flex items-center justify-between rounded-xl bg-neutral-50 dark:bg-neutral-900 p-3"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium">v{ver.version}</span>
                      {ver.name && (
                        <span className="text-sm text-neutral-500">
                          {ver.name}
                        </span>
                      )}
                      {ver.isBookmarked && (
                        <Badge
                          variant="outline"
                          className="rounded-full text-xs"
                        >
                          Bookmarked
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-neutral-500">
                      {new Date(ver.createdAt).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="rounded-full">
            Close
          </Button>
          <Button asChild className="rounded-full">
            <a
              href={`/agent/${project.id}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open Project
            </a>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
