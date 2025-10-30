"use client";

import { useEffect, useState } from "react";
import { useSession as useBetterAuthSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

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
  metadata: any;
  createdAt: string;
}

interface PaginationInfo {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export default function SecurityEventsPage() {
  const { data: session, isPending } = useBetterAuthSession();
  const router = useRouter();
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    limit: 50,
    offset: 0,
    hasMore: false,
  });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    eventType: "",
    severity: "",
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!isPending && !session) {
      router.push("/auth/signin");
    }
  }, [isPending, session, router]);

  // Fetch security events
  const fetchEvents = async (offset = 0) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: "50",
        offset: offset.toString(),
      });

      if (filter.eventType) {
        params.append("eventType", filter.eventType);
      }

      if (filter.severity) {
        params.append("severity", filter.severity);
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
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchEvents();
    }
  }, [status, filter]);

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-neutral-500">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

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
      case "ACCOUNT_LOCKED":
        return "🔒";
      case "LOCKOUT_CLEARED":
        return "🔓";
      case "VERIFICATION_EMAIL_SENT":
        return "📨";
      default:
        return "📝";
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50">
            Security Events
          </h1>
          <p className="mt-2 text-neutral-600 dark:text-neutral-400">
            Monitor authentication and account activity
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6 flex gap-4">
          <select
            value={filter.eventType}
            onChange={(e) =>
              setFilter({ ...filter, eventType: e.target.value })
            }
            className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
          >
            <option value="">All Event Types</option>
            <option value="LOGIN_SUCCESS">Login Success</option>
            <option value="LOGIN_FAILED">Login Failed</option>
            <option value="ACCOUNT_CREATED">Account Created</option>
            <option value="PASSWORD_CHANGED">Password Changed</option>
            <option value="PASSWORD_SET">Password Set</option>
            <option value="EMAIL_CHANGED">Email Changed</option>
            <option value="EMAIL_CHANGE_REQUESTED">
              Email Change Requested
            </option>
            <option value="ACCOUNT_LINKED">Account Linked</option>
            <option value="ACCOUNT_UNLINKED">Account Unlinked</option>
            <option value="EMAIL_VERIFIED">Email Verified</option>
            <option value="ACCOUNT_LOCKED">Account Locked</option>
            <option value="LOCKOUT_CLEARED">Lockout Cleared</option>
          </select>

          <select
            value={filter.severity}
            onChange={(e) => setFilter({ ...filter, severity: e.target.value })}
            className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
          >
            <option value="">All Severities</option>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="critical">Critical</option>
          </select>
        </div>

        {/* Events Table */}
        <div className="overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800">
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
                {events.length === 0 ? (
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
                        {event.metadata &&
                          Object.keys(event.metadata).length > 0 && (
                            <details className="cursor-pointer">
                              <summary className="text-neutral-600 dark:text-neutral-400">
                                View metadata
                              </summary>
                              <pre className="mt-2 max-w-xs overflow-auto rounded-lg bg-neutral-100 p-2 text-xs dark:bg-neutral-900">
                                {JSON.stringify(event.metadata, null, 2)}
                              </pre>
                            </details>
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
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-neutral-600 dark:text-neutral-400">
            Showing {pagination.offset + 1} to{" "}
            {Math.min(pagination.offset + pagination.limit, pagination.total)}{" "}
            of {pagination.total} events
          </div>
          <div className="flex gap-2">
            <button
              onClick={() =>
                fetchEvents(Math.max(0, pagination.offset - pagination.limit))
              }
              disabled={pagination.offset === 0}
              className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
            >
              Previous
            </button>
            <button
              onClick={() => fetchEvents(pagination.offset + pagination.limit)}
              disabled={!pagination.hasMore}
              className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
