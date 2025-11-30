/**
 * Admin User Management Page
 *
 * User listing with search, filtering, role management, and actions
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Filter,
  MoreVertical,
  Shield,
  Ban,
  UserCheck,
  CreditCard,
  Eye,
  Trash2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  X,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface User {
  id: string;
  name: string | null;
  email: string;
  emailVerified: boolean;
  image: string | null;
  role: string;
  banned: boolean | null;
  banReason: string | null;
  banExpires: string | null;
  accountBalance: number;
  createdAt: string;
  updatedAt: string;
  preferredCodingModel: string | null;
  enableMemory: boolean;
  enableWebSearch: boolean;
  _count: {
    projects: number;
    sessions: number;
  };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [actionDialog, setActionDialog] = useState<{
    type: "ban" | "role" | "credits" | "view" | "delete" | null;
    user: User | null;
  }>({ type: null, user: null });
  const [actionData, setActionData] = useState<Record<string, string>>({});

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });
      if (search) params.set("search", search);
      if (roleFilter !== "all") params.set("role", roleFilter);

      const response = await fetch(`/api/admin/users?${params}`);
      const data = await response.json();

      if (response.ok) {
        setUsers(data.users);
        setPagination(data.pagination);
      } else {
        toast.error(data.error || "Failed to fetch users");
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, search, roleFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleAction = async (
    action: string,
    userId: string,
    data?: Record<string, unknown>
  ) => {
    try {
      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action, data }),
      });

      if (response.ok) {
        toast.success(`Action "${action}" completed successfully`);
        fetchUsers();
        setActionDialog({ type: null, user: null });
        setActionData({});
      } else {
        const error = await response.json();
        toast.error(error.error || "Action failed");
      }
    } catch (error) {
      console.error("Action error:", error);
      toast.error("Action failed");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("User deleted successfully");
        fetchUsers();
      } else {
        const error = await response.json();
        toast.error(error.error || "Delete failed");
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Delete failed");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
            Users
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1">
            Manage user accounts, roles, and permissions
          </p>
        </div>
        <Button onClick={fetchUsers} variant="outline" className="rounded-full">
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
                placeholder="Search by email or name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 rounded-full"
              />
            </div>
            <Select
              value={roleFilter}
              onValueChange={(value) => {
                setRoleFilter(value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
            >
              <SelectTrigger className="w-[180px] rounded-full">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="user">User</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="rounded-2xl border-neutral-200 dark:border-neutral-800">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 dark:bg-neutral-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                    Balance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                    Projects
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                    Joined
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
                ) : users.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-12 text-center text-neutral-500"
                    >
                      No users found
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr
                      key={user.id}
                      className="hover:bg-neutral-50 dark:hover:bg-neutral-900"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center overflow-hidden">
                            {user.image ? (
                              <img
                                src={user.image}
                                alt={user.name || "User"}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                                {user.name?.[0] || user.email[0].toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-neutral-900 dark:text-neutral-100">
                              {user.name || "No name"}
                            </div>
                            <div className="text-sm text-neutral-500">
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          variant={
                            user.role === "admin" ? "default" : "secondary"
                          }
                          className="rounded-full"
                        >
                          {user.role}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        {user.banned ? (
                          <Badge variant="destructive" className="rounded-full">
                            Banned
                          </Badge>
                        ) : user.emailVerified ? (
                          <Badge
                            variant="outline"
                            className="rounded-full text-green-600 border-green-600"
                          >
                            Verified
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="rounded-full">
                            Unverified
                          </Badge>
                        )}
                      </td>
                      <td className="px-6 py-4 text-neutral-900 dark:text-neutral-100">
                        ${Number(user.accountBalance).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-neutral-500">
                        {user._count.projects}
                      </td>
                      <td className="px-6 py-4 text-neutral-500">
                        {new Date(user.createdAt).toLocaleDateString()}
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
                              onClick={() =>
                                setActionDialog({ type: "view", user })
                              }
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                setActionDialog({ type: "role", user })
                              }
                            >
                              <Shield className="h-4 w-4 mr-2" />
                              Change Role
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                setActionDialog({ type: "credits", user })
                              }
                            >
                              <CreditCard className="h-4 w-4 mr-2" />
                              Add Credits
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {user.banned ? (
                              <DropdownMenuItem
                                onClick={() => handleAction("unban", user.id)}
                              >
                                <UserCheck className="h-4 w-4 mr-2" />
                                Unban User
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() =>
                                  setActionDialog({ type: "ban", user })
                                }
                                className="text-red-600"
                              >
                                <Ban className="h-4 w-4 mr-2" />
                                Ban User
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => handleDeleteUser(user.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete User
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
                of {pagination.total} users
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

      {/* Action Dialogs */}
      <Dialog
        open={actionDialog.type !== null}
        onOpenChange={() => {
          setActionDialog({ type: null, user: null });
          setActionData({});
        }}
      >
        <DialogContent className="rounded-2xl">
          {actionDialog.type === "ban" && actionDialog.user && (
            <>
              <DialogHeader>
                <DialogTitle>Ban User</DialogTitle>
                <DialogDescription>
                  Ban {actionDialog.user.email} from the platform
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <label className="text-sm font-medium">Reason</label>
                  <Textarea
                    placeholder="Enter ban reason..."
                    value={actionData.reason || ""}
                    onChange={(e) =>
                      setActionData({ ...actionData, reason: e.target.value })
                    }
                    className="mt-1 rounded-xl"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setActionDialog({ type: null, user: null })}
                  className="rounded-full"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() =>
                    handleAction("ban", actionDialog.user!.id, {
                      reason: actionData.reason,
                    })
                  }
                  className="rounded-full"
                >
                  Ban User
                </Button>
              </DialogFooter>
            </>
          )}

          {actionDialog.type === "role" && actionDialog.user && (
            <>
              <DialogHeader>
                <DialogTitle>Change Role</DialogTitle>
                <DialogDescription>
                  Update role for {actionDialog.user.email}
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Select
                  value={actionData.role || actionDialog.user.role}
                  onValueChange={(value) =>
                    setActionData({ ...actionData, role: value })
                  }
                >
                  <SelectTrigger className="rounded-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setActionDialog({ type: null, user: null })}
                  className="rounded-full"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() =>
                    handleAction("changeRole", actionDialog.user!.id, {
                      role: actionData.role || actionDialog.user!.role,
                    })
                  }
                  className="rounded-full"
                >
                  Update Role
                </Button>
              </DialogFooter>
            </>
          )}

          {actionDialog.type === "credits" && actionDialog.user && (
            <>
              <DialogHeader>
                <DialogTitle>Add Credits</DialogTitle>
                <DialogDescription>
                  Add credits to {actionDialog.user.email}&apos;s account
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <label className="text-sm font-medium">Amount (USD)</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="10.00"
                    value={actionData.amount || ""}
                    onChange={(e) =>
                      setActionData({ ...actionData, amount: e.target.value })
                    }
                    className="mt-1 rounded-full"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Input
                    placeholder="Reason for credit adjustment"
                    value={actionData.description || ""}
                    onChange={(e) =>
                      setActionData({
                        ...actionData,
                        description: e.target.value,
                      })
                    }
                    className="mt-1 rounded-full"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setActionDialog({ type: null, user: null })}
                  className="rounded-full"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() =>
                    handleAction("addCredits", actionDialog.user!.id, {
                      amount: parseFloat(actionData.amount || "0"),
                      description: actionData.description,
                    })
                  }
                  disabled={
                    !actionData.amount || parseFloat(actionData.amount) <= 0
                  }
                  className="rounded-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Credits
                </Button>
              </DialogFooter>
            </>
          )}

          {actionDialog.type === "view" && actionDialog.user && (
            <UserDetailView
              userId={actionDialog.user.id}
              onClose={() => setActionDialog({ type: null, user: null })}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// User Detail View Component
function UserDetailView({
  userId,
  onClose,
}: {
  userId: string;
  onClose: () => void;
}) {
  const [data, setData] = useState<{
    user: User & {
      sessions: Array<{
        id: string;
        createdAt: string;
        expiresAt: string;
        ipAddress: string | null;
        userAgent: string | null;
      }>;
      projects: Array<{
        id: string;
        name: string;
        status: string;
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      try {
        const response = await fetch(`/api/admin/users/${userId}`);
        const result = await response.json();
        if (response.ok) {
          setData(result);
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-6 w-6 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12 text-neutral-500">User not found</div>
    );
  }

  const { user, stats } = data;

  return (
    <>
      <DialogHeader>
        <DialogTitle>User Details</DialogTitle>
        <DialogDescription>{user.email}</DialogDescription>
      </DialogHeader>
      <div className="space-y-6 py-4 max-h-[60vh] overflow-y-auto">
        {/* User Info */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-neutral-500">Name</label>
            <p className="font-medium">{user.name || "No name"}</p>
          </div>
          <div>
            <label className="text-xs text-neutral-500">Role</label>
            <p className="font-medium capitalize">{user.role}</p>
          </div>
          <div>
            <label className="text-xs text-neutral-500">Balance</label>
            <p className="font-medium">
              ${Number(user.accountBalance).toFixed(2)}
            </p>
          </div>
          <div>
            <label className="text-xs text-neutral-500">Joined</label>
            <p className="font-medium">
              {new Date(user.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* AI Usage Stats */}
        <div>
          <h4 className="font-medium mb-2">AI Usage</h4>
          <div className="grid grid-cols-2 gap-4 rounded-xl bg-neutral-50 dark:bg-neutral-900 p-4">
            <div>
              <label className="text-xs text-neutral-500">Total Calls</label>
              <p className="font-medium">
                {stats.totalAiCalls.toLocaleString()}
              </p>
            </div>
            <div>
              <label className="text-xs text-neutral-500">Total Cost</label>
              <p className="font-medium">${stats.totalAiCost.toFixed(4)}</p>
            </div>
            <div>
              <label className="text-xs text-neutral-500">Input Tokens</label>
              <p className="font-medium">
                {stats.totalInputTokens.toLocaleString()}
              </p>
            </div>
            <div>
              <label className="text-xs text-neutral-500">Output Tokens</label>
              <p className="font-medium">
                {stats.totalOutputTokens.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Active Sessions */}
        <div>
          <h4 className="font-medium mb-2">
            Active Sessions ({user.sessions.length})
          </h4>
          <div className="space-y-2">
            {user.sessions.slice(0, 5).map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between rounded-xl bg-neutral-50 dark:bg-neutral-900 p-3 text-sm"
              >
                <div>
                  <p className="text-xs text-neutral-500">
                    {session.ipAddress || "Unknown IP"}
                  </p>
                  <p className="text-xs text-neutral-400 truncate max-w-[200px]">
                    {session.userAgent?.slice(0, 50) || "Unknown device"}
                  </p>
                </div>
                <div className="text-xs text-neutral-500">
                  {new Date(session.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Projects */}
        <div>
          <h4 className="font-medium mb-2">
            Recent Projects ({user.projects.length})
          </h4>
          <div className="space-y-2">
            {user.projects.slice(0, 5).map((project) => (
              <div
                key={project.id}
                className="flex items-center justify-between rounded-xl bg-neutral-50 dark:bg-neutral-900 p-3"
              >
                <div>
                  <p className="font-medium text-sm">{project.name}</p>
                  <p className="text-xs text-neutral-500">{project.status}</p>
                </div>
                <div className="text-xs text-neutral-500">
                  {new Date(project.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose} className="rounded-full">
          Close
        </Button>
      </DialogFooter>
    </>
  );
}
