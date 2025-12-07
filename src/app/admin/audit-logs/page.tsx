/**
 * Admin Audit Logs Page
 *
 * View AI model configuration audit logs
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import {
  RefreshCw,
  History,
  ChevronLeft,
  ChevronRight,
  Filter,
  User,
  Calendar,
  FileEdit,
  Plus,
  Trash2,
  Power,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface AuditLog {
  id: string;
  modelId: string | null;
  action: string;
  changes: Record<string, unknown> | null;
  performedBy: string;
  performedByUser?: {
    name: string | null;
    email: string;
  };
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionFilter, setActionFilter] = useState("all");
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "50",
      });
      if (actionFilter !== "all") {
        params.set("action", actionFilter);
      }

      const response = await fetch(`/api/admin/audit-logs?${params}`);
      const data = await response.json();

      if (response.ok) {
        setLogs(data.logs);
        setTotalPages(data.pagination.totalPages);
      } else {
        toast.error(data.error || "Failed to fetch audit logs");
      }
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      toast.error("Failed to fetch audit logs");
    } finally {
      setLoading(false);
    }
  }, [page, actionFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const getActionIcon = (action: string) => {
    switch (action) {
      case "created":
        return <Plus className="h-4 w-4 text-green-600 dark:text-green-400" />;
      case "updated":
        return (
          <FileEdit className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        );
      case "deleted":
        return <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />;
      case "enabled":
        return <Power className="h-4 w-4 text-green-600 dark:text-green-400" />;
      case "disabled":
        return <Power className="h-4 w-4 text-neutral-500" />;
      case "set_default":
        return <Star className="h-4 w-4 text-yellow-500" />;
      default:
        return <History className="h-4 w-4 text-neutral-500" />;
    }
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case "created":
        return (
          <Badge className="rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
            Created
          </Badge>
        );
      case "updated":
        return (
          <Badge className="rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
            Updated
          </Badge>
        );
      case "deleted":
        return (
          <Badge className="rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
            Deleted
          </Badge>
        );
      case "enabled":
        return (
          <Badge className="rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
            Enabled
          </Badge>
        );
      case "disabled":
        return (
          <Badge className="rounded-full bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
            Disabled
          </Badge>
        );
      case "set_default":
        return (
          <Badge className="rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300">
            Set Default
          </Badge>
        );
      default:
        return (
          <Badge className="rounded-full bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
            {action}
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
            Audit Logs
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1">
            Track AI model configuration changes
          </p>
        </div>
        <Button onClick={fetchLogs} variant="outline" className="rounded-full">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card className="rounded-2xl border-neutral-200 dark:border-neutral-800">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Select
              value={actionFilter}
              onValueChange={(value) => {
                setActionFilter(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[180px] rounded-full">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by action" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="created">Created</SelectItem>
                <SelectItem value="updated">Updated</SelectItem>
                <SelectItem value="deleted">Deleted</SelectItem>
                <SelectItem value="enabled">Enabled</SelectItem>
                <SelectItem value="disabled">Disabled</SelectItem>
                <SelectItem value="set_default">Set Default</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card className="overflow-hidden rounded-2xl border-neutral-200 dark:border-neutral-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Audit Trail
          </CardTitle>
          <CardDescription>
            History of all AI model configuration changes
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 dark:bg-neutral-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                    Model
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                    Performed By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                    IP Address
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-neutral-500">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {loading ? (
                  [...Array(10)].map((_, i) => (
                    <tr key={i}>
                      <td colSpan={6} className="px-6 py-4">
                        <div className="h-8 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
                      </td>
                    </tr>
                  ))
                ) : logs.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-12 text-center text-neutral-500"
                    >
                      <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No audit logs found</p>
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr
                      key={log.id}
                      className="hover:bg-neutral-50 dark:hover:bg-neutral-900"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {getActionIcon(log.action)}
                          {getActionBadge(log.action)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-sm text-neutral-600 dark:text-neutral-400">
                          {log.modelId || "Global Settings"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-neutral-400" />
                          <span className="text-sm text-neutral-900 dark:text-neutral-100">
                            {log.performedByUser?.name ||
                              log.performedByUser?.email ||
                              log.performedBy.slice(0, 8)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-neutral-500">
                        {log.ipAddress || "-"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 text-sm text-neutral-500">
                          <Calendar className="h-4 w-4" />
                          {new Date(log.createdAt).toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="rounded-full"
                          onClick={() => {
                            setSelectedLog(log);
                            setDetailsDialogOpen(true);
                          }}
                        >
                          View
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-neutral-200 dark:border-neutral-800 px-6 py-4">
              <div className="text-sm text-neutral-500">
                Page {page} of {totalPages}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p - 1)}
                  disabled={page === 1}
                  className="rounded-full"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page === totalPages}
                  className="rounded-full"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="rounded-2xl max-w-2xl">
          <DialogHeader>
            <DialogTitle>Audit Log Details</DialogTitle>
            <DialogDescription>
              Full details of the configuration change
            </DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-neutral-500">Action</label>
                  <p className="font-medium capitalize">{selectedLog.action}</p>
                </div>
                <div>
                  <label className="text-xs text-neutral-500">Model ID</label>
                  <p className="font-medium font-mono">
                    {selectedLog.modelId || "N/A"}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-neutral-500">
                    Performed By
                  </label>
                  <p className="font-medium">
                    {selectedLog.performedByUser?.name ||
                      selectedLog.performedByUser?.email ||
                      selectedLog.performedBy}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-neutral-500">Timestamp</label>
                  <p className="font-medium">
                    {new Date(selectedLog.createdAt).toLocaleString()}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-neutral-500">IP Address</label>
                  <p className="font-medium">
                    {selectedLog.ipAddress || "N/A"}
                  </p>
                </div>
              </div>

              {selectedLog.changes &&
                Object.keys(selectedLog.changes).length > 0 && (
                  <div>
                    <label className="text-xs text-neutral-500">Changes</label>
                    <pre className="mt-2 p-4 bg-neutral-100 dark:bg-neutral-900 rounded-xl overflow-auto text-sm">
                      {JSON.stringify(selectedLog.changes, null, 2)}
                    </pre>
                  </div>
                )}

              {selectedLog.userAgent && (
                <div>
                  <label className="text-xs text-neutral-500">User Agent</label>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 truncate">
                    {selectedLog.userAgent}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
