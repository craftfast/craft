"use client";

import { useEffect, useState, useCallback } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SecurityEvent {
  id: string;
  userId: string | null;
  eventType: string;
  severity: string;
  ipAddress: string | null;
  userAgent: string | null;
  email: string | null;
  provider: string | null;
  success: boolean;
  errorReason: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

interface PaginationInfo {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export default function SecurityEventsPage() {
  // Auth is handled by admin layout - no need to check here
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    limit: 50,
    offset: 0,
    hasMore: false,
  });
  const [loading, setLoading] = useState(true);
  const [eventTypeFilter, setEventTypeFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");

  // Fetch security events
  const fetchEvents = useCallback(
    async (offset = 0) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          limit: "50",
          offset: offset.toString(),
        });

        if (eventTypeFilter && eventTypeFilter !== "all") {
          params.append("eventType", eventTypeFilter);
        }

        if (severityFilter && severityFilter !== "all") {
          params.append("severity", severityFilter);
        }

        const response = await fetch(`/api/admin/security-events?${params}`);
        const data = await response.json();

        if (response.ok) {
          setEvents(data.events);
          setPagination(data.pagination);
        } else {
          console.error("Failed to fetch security events:", data.error);
        }
      } catch (error) {
        console.error("Error fetching security events:", error);
      } finally {
        setLoading(false);
      }
    },
    [eventTypeFilter, severityFilter]
  );

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-200";
      case "warning":
        return "bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200";
      default:
        return "bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200";
    }
  };

  const getEventIcon = (eventType: string, success: boolean) => {
    if (!success) return "❌";

    switch (eventType) {
      case "LOGIN_SUCCESS":
        return "✅";
      case "LOGIN_FAILED":
        return "🚫";
      case "ACCOUNT_CREATED":
        return "🎉";
      case "PASSWORD_CHANGED":
      case "PASSWORD_SET":
        return "🔑";
      case "EMAIL_CHANGED":
      case "EMAIL_CHANGE_REQUESTED":
        return "📧";
      case "ACCOUNT_LINKED":
        return "🔗";
      case "ACCOUNT_UNLINKED":
        return "🔓";
      case "EMAIL_VERIFIED":
        return "✅";
      case "VERIFICATION_EMAIL_SENT":
        return "📨";
      default:
        return "📝";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
            Security Events
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1">
            Authentication and account activity logs
          </p>
        </div>
        <Button
          onClick={() => fetchEvents()}
          variant="outline"
          className="rounded-full"
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
          <SelectTrigger className="w-[200px] rounded-full">
            <SelectValue placeholder="Event Type" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all">All Events</SelectItem>
            <SelectItem value="LOGIN_SUCCESS">Login Success</SelectItem>
            <SelectItem value="LOGIN_FAILED">Login Failed</SelectItem>
            <SelectItem value="ACCOUNT_CREATED">Account Created</SelectItem>
            <SelectItem value="PASSWORD_CHANGED">Password Changed</SelectItem>
            <SelectItem value="EMAIL_VERIFIED">Email Verified</SelectItem>
          </SelectContent>
        </Select>

        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="w-[150px] rounded-full">
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all">All Severities</SelectItem>
            <SelectItem value="info">Info</SelectItem>
            <SelectItem value="warning">Warning</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Events Table */}
      <div className="overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-800">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 dark:bg-neutral-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                  Event
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                  Severity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                  IP Address
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                  Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 bg-white dark:divide-neutral-800 dark:bg-neutral-950">
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-neutral-500"
                  >
                    Loading...
                  </td>
                </tr>
              ) : events.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-neutral-500"
                  >
                    No security events found
                  </td>
                </tr>
              ) : (
                events.map((event) => (
                  <tr
                    key={event.id}
                    className="hover:bg-neutral-50 dark:hover:bg-neutral-900"
                  >
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">
                          {getEventIcon(event.eventType, event.success)}
                        </span>
                        <div>
                          <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                            {event.eventType.replace(/_/g, " ")}
                          </div>
                          {event.provider && (
                            <div className="text-xs text-neutral-500">
                              {event.provider}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getSeverityColor(
                          event.severity
                        )}`}
                      >
                        {event.severity}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-900 dark:text-neutral-100">
                      {event.email || "-"}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-neutral-500">
                      {event.ipAddress || "-"}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-neutral-500">
                      {new Date(event.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-500">
                      {event.errorReason && (
                        <div className="text-red-600 dark:text-red-400">
                          {event.errorReason}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-neutral-600 dark:text-neutral-400">
          Showing {pagination.offset + 1} to{" "}
          {Math.min(pagination.offset + pagination.limit, pagination.total)} of{" "}
          {pagination.total} events
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() =>
              fetchEvents(Math.max(0, pagination.offset - pagination.limit))
            }
            disabled={pagination.offset === 0}
            className="rounded-full"
          >
            Previous
          </Button>
          <Button
            variant="outline"
            onClick={() => fetchEvents(pagination.offset + pagination.limit)}
            disabled={!pagination.hasMore}
            className="rounded-full"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
