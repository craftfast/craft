/**
 * Admin Usage Page
 *
 * System usage statistics and analytics
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import {
  RefreshCw,
  Cpu,
  Server,
  HardDrive,
  Users,
  FolderKanban,
  Activity,
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
import { toast } from "sonner";

interface UsageData {
  ai: {
    totalCalls: number;
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    cost: number;
    byModel: Array<{
      model: string;
      _sum: {
        inputTokens: number;
        outputTokens: number;
        providerCostUsd: number;
      };
      _count: number;
    }>;
  };
  sandbox: {
    totalSessions: number;
    totalMinutes: number;
    cost: number;
  };
  storage: {
    totalOperations: number;
    cost: number;
  };
  users: {
    active: number;
    new: number;
  };
  projects: {
    active: number;
    new: number;
  };
  sessions: {
    active: number;
  };
}

export default function AdminUsagePage() {
  const [data, setData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("30d");

  const fetchUsage = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/usage?period=${period}`);
      const result = await response.json();

      if (response.ok) {
        setData(result);
      } else {
        toast.error(result.error || "Failed to fetch usage data");
      }
    } catch (error) {
      console.error("Error fetching usage:", error);
      toast.error("Failed to fetch usage data");
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  const formatNumber = (num: number) => {
    if (num >= 1000000000) return `${(num / 1000000000).toFixed(1)}B`;
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
            System Usage
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1">
            Platform usage statistics and analytics
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[140px] rounded-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="1d">Last 24 hours</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={fetchUsage}
            variant="outline"
            className="rounded-full"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card
              key={i}
              className="rounded-2xl animate-pulse h-40 bg-neutral-100 dark:bg-neutral-900"
            />
          ))}
        </div>
      ) : data ? (
        <>
          {/* Overview Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* AI Usage */}
            <Card className="rounded-2xl border-neutral-200 dark:border-neutral-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-neutral-500 flex items-center gap-2">
                  <Cpu className="h-4 w-4" />
                  AI Usage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-2">
                  {formatNumber(data.ai.totalCalls)}
                </div>
                <div className="space-y-1 text-sm text-neutral-500">
                  <div className="flex justify-between">
                    <span>Input tokens</span>
                    <span>{formatNumber(data.ai.inputTokens)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Output tokens</span>
                    <span>{formatNumber(data.ai.outputTokens)}</span>
                  </div>
                  <div className="flex justify-between font-medium text-neutral-700 dark:text-neutral-300">
                    <span>Cost</span>
                    <span>${data.ai.cost.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sandbox Usage */}
            <Card className="rounded-2xl border-neutral-200 dark:border-neutral-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-neutral-500 flex items-center gap-2">
                  <Server className="h-4 w-4" />
                  Sandbox Usage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-2">
                  {data.sandbox.totalSessions}
                </div>
                <div className="space-y-1 text-sm text-neutral-500">
                  <div className="flex justify-between">
                    <span>Sessions</span>
                    <span>{data.sandbox.totalSessions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total minutes</span>
                    <span>{formatNumber(data.sandbox.totalMinutes)}</span>
                  </div>
                  <div className="flex justify-between font-medium text-neutral-700 dark:text-neutral-300">
                    <span>Cost</span>
                    <span>${data.sandbox.cost.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Storage Usage */}
            <Card className="rounded-2xl border-neutral-200 dark:border-neutral-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-neutral-500 flex items-center gap-2">
                  <HardDrive className="h-4 w-4" />
                  Storage Usage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-2">
                  {formatNumber(data.storage.totalOperations)}
                </div>
                <div className="space-y-1 text-sm text-neutral-500">
                  <div className="flex justify-between">
                    <span>Operations</span>
                    <span>{formatNumber(data.storage.totalOperations)}</span>
                  </div>
                  <div className="flex justify-between font-medium text-neutral-700 dark:text-neutral-300">
                    <span>Cost</span>
                    <span>${data.storage.cost.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* User Activity */}
            <Card className="rounded-2xl border-neutral-200 dark:border-neutral-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-neutral-500 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  User Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-2">
                  {data.users.active}
                </div>
                <div className="space-y-1 text-sm text-neutral-500">
                  <div className="flex justify-between">
                    <span>Active users</span>
                    <span>{data.users.active}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>New users</span>
                    <span className="text-green-600 dark:text-green-400">
                      +{data.users.new}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Project Activity */}
            <Card className="rounded-2xl border-neutral-200 dark:border-neutral-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-neutral-500 flex items-center gap-2">
                  <FolderKanban className="h-4 w-4" />
                  Project Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-2">
                  {data.projects.active}
                </div>
                <div className="space-y-1 text-sm text-neutral-500">
                  <div className="flex justify-between">
                    <span>Active projects</span>
                    <span>{data.projects.active}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>New projects</span>
                    <span className="text-green-600 dark:text-green-400">
                      +{data.projects.new}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sessions */}
            <Card className="rounded-2xl border-neutral-200 dark:border-neutral-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-neutral-500 flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Active Sessions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-2">
                  {data.sessions.active}
                </div>
                <div className="text-sm text-neutral-500">
                  Currently active user sessions
                </div>
              </CardContent>
            </Card>
          </div>

          {/* AI Usage by Model */}
          <Card className="rounded-2xl border-neutral-200 dark:border-neutral-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cpu className="h-5 w-5" />
                AI Usage by Model
              </CardTitle>
              <CardDescription>Breakdown of API calls by model</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-neutral-50 dark:bg-neutral-900">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                        Model
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-medium uppercase tracking-wider text-neutral-500">
                        Calls
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-medium uppercase tracking-wider text-neutral-500">
                        Input Tokens
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-medium uppercase tracking-wider text-neutral-500">
                        Output Tokens
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-medium uppercase tracking-wider text-neutral-500">
                        Cost
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                    {data.ai.byModel.map((model) => (
                      <tr key={model.model}>
                        <td className="px-4 py-3 text-sm font-medium text-neutral-900 dark:text-neutral-100">
                          {model.model}
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-neutral-500">
                          {formatNumber(model._count)}
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-neutral-500">
                          {formatNumber(model._sum.inputTokens || 0)}
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-neutral-500">
                          {formatNumber(model._sum.outputTokens || 0)}
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-medium text-neutral-900 dark:text-neutral-100">
                          ${(model._sum.providerCostUsd || 0).toFixed(4)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Total Cost Summary */}
          <Card className="rounded-2xl border-neutral-200 dark:border-neutral-800">
            <CardHeader>
              <CardTitle>Total Infrastructure Costs</CardTitle>
              <CardDescription>
                Sum of all infrastructure costs for the selected period
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="rounded-xl bg-neutral-50 dark:bg-neutral-900 p-4">
                  <p className="text-sm text-neutral-500 mb-1">AI Costs</p>
                  <p className="text-2xl font-bold">
                    ${data.ai.cost.toFixed(2)}
                  </p>
                </div>
                <div className="rounded-xl bg-neutral-50 dark:bg-neutral-900 p-4">
                  <p className="text-sm text-neutral-500 mb-1">Sandbox Costs</p>
                  <p className="text-2xl font-bold">
                    ${data.sandbox.cost.toFixed(2)}
                  </p>
                </div>
                <div className="rounded-xl bg-neutral-50 dark:bg-neutral-900 p-4">
                  <p className="text-sm text-neutral-500 mb-1">Storage Costs</p>
                  <p className="text-2xl font-bold">
                    ${data.storage.cost.toFixed(2)}
                  </p>
                </div>
                <div className="rounded-xl bg-neutral-900 dark:bg-neutral-100 p-4 text-white dark:text-neutral-900">
                  <p className="text-sm opacity-80 mb-1">Total Costs</p>
                  <p className="text-2xl font-bold">
                    $
                    {(
                      data.ai.cost +
                      data.sandbox.cost +
                      data.storage.cost
                    ).toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
