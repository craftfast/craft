/**
 * Webhook Monitoring Dashboard
 *
 * Admin page for monitoring webhook event processing
 * Shows queue statistics, failed webhooks, and retry options
 */

"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface WebhookStats {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  total: number;
}

interface FailedWebhook {
  id: string;
  eventId: string;
  eventType: string;
  attempt: number;
  maxAttempts: number;
  error: string;
  timestamp: number;
  processedOn?: number;
  finishedOn?: number;
}

export default function WebhookMonitoringDashboard() {
  const [stats, setStats] = useState<WebhookStats | null>(null);
  const [failedWebhooks, setFailedWebhooks] = useState<FailedWebhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/admin/webhook-queue?view=stats");
      const data = await response.json();
      setStats(data.stats);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  };

  const fetchFailedWebhooks = async () => {
    try {
      const response = await fetch(
        "/api/admin/webhook-queue?view=failed&limit=50"
      );
      const data = await response.json();
      setFailedWebhooks(data.failed);
    } catch (error) {
      console.error("Failed to fetch failed webhooks:", error);
    }
  };

  const retryWebhook = async (eventId: string) => {
    setRetrying(eventId);
    try {
      const response = await fetch("/api/admin/webhook-queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "retry", eventId }),
      });
      const data = await response.json();

      if (data.success) {
        alert("Webhook queued for retry!");
        await fetchFailedWebhooks();
      } else {
        alert(`Failed to retry: ${data.message}`);
      }
    } catch (error) {
      alert("Error retrying webhook");
      console.error(error);
    } finally {
      setRetrying(null);
    }
  };

  const cleanupQueue = async () => {
    if (!confirm("Clean up completed jobs older than 7 days?")) return;

    try {
      const response = await fetch("/api/admin/webhook-queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cleanup", gracePeriodDays: 7 }),
      });
      const data = await response.json();
      alert(`Cleaned up ${data.removed} old jobs`);
      await fetchStats();
    } catch (error) {
      alert("Error cleaning up queue");
      console.error(error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchStats(), fetchFailedWebhooks()]);
      setLoading(false);
    };

    loadData();
    const interval = setInterval(loadData, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-neutral-500">Loading webhook statistics...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Webhook Monitoring</h1>
          <p className="text-neutral-500 mt-1">
            Monitor webhook event processing and retry failed events
          </p>
        </div>
        <Button onClick={cleanupQueue} variant="outline">
          Clean Up Old Jobs
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-500">
              Waiting
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats?.waiting || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-500">
              Active
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">
              {stats?.active || 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-500">
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              {stats?.completed || 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-500">
              Failed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">
              {stats?.failed || 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-500">
              Delayed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-orange-600">
              {stats?.delayed || 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-500">
              Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats?.total || 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Failed Webhooks Table */}
      <Card>
        <CardHeader>
          <CardTitle>Failed Webhooks</CardTitle>
          <CardDescription>
            Recent webhook events that failed processing
          </CardDescription>
        </CardHeader>
        <CardContent>
          {failedWebhooks.length === 0 ? (
            <p className="text-neutral-500 text-center py-8">
              No failed webhooks 🎉
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b">
                  <tr className="text-left">
                    <th className="pb-2 font-medium text-neutral-500">
                      Event Type
                    </th>
                    <th className="pb-2 font-medium text-neutral-500">
                      Event ID
                    </th>
                    <th className="pb-2 font-medium text-neutral-500">
                      Attempts
                    </th>
                    <th className="pb-2 font-medium text-neutral-500">Error</th>
                    <th className="pb-2 font-medium text-neutral-500">
                      Timestamp
                    </th>
                    <th className="pb-2 font-medium text-neutral-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {failedWebhooks.map((webhook) => (
                    <tr key={webhook.id} className="border-b">
                      <td className="py-3 font-mono text-sm">
                        {webhook.eventType}
                      </td>
                      <td className="py-3 font-mono text-xs text-neutral-500">
                        {webhook.eventId.substring(0, 12)}...
                      </td>
                      <td className="py-3">
                        <span
                          className={
                            webhook.attempt >= webhook.maxAttempts
                              ? "text-red-600 font-medium"
                              : ""
                          }
                        >
                          {webhook.attempt} / {webhook.maxAttempts}
                        </span>
                      </td>
                      <td className="py-3 text-sm text-neutral-600 max-w-xs truncate">
                        {webhook.error}
                      </td>
                      <td className="py-3 text-sm text-neutral-500">
                        {new Date(webhook.timestamp).toLocaleString()}
                      </td>
                      <td className="py-3">
                        <Button
                          size="sm"
                          onClick={() => retryWebhook(webhook.eventId)}
                          disabled={retrying === webhook.eventId}
                          variant="outline"
                        >
                          {retrying === webhook.eventId
                            ? "Retrying..."
                            : "Retry"}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
