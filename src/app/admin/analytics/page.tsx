/**
 * Admin Analytics Page
 *
 * Detailed analytics with charts and trends
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import {
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Users,
  FolderKanban,
  DollarSign,
  Cpu,
  Calendar,
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

interface AnalyticsData {
  userGrowth: {
    date: string;
    count: number;
    cumulative: number;
  }[];
  projectGrowth: {
    date: string;
    count: number;
    cumulative: number;
  }[];
  revenue: {
    date: string;
    amount: number;
    transactions: number;
  }[];
  aiUsage: {
    date: string;
    calls: number;
    cost: number;
    tokens: number;
  }[];
  topModels: {
    model: string;
    calls: number;
    cost: number;
  }[];
  summary: {
    totalUsers: number;
    newUsersChange: number;
    totalProjects: number;
    newProjectsChange: number;
    totalRevenue: number;
    revenueChange: number;
    totalAiCalls: number;
    aiCallsChange: number;
  };
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("30d");

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/analytics?period=${period}`);
      const result = await response.json();

      if (response.ok) {
        setData(result);
      } else {
        toast.error(result.error || "Failed to fetch analytics");
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
      toast.error("Failed to fetch analytics");
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const formatChange = (change: number) => {
    const isPositive = change >= 0;
    return (
      <div className={`flex items-center gap-1 ${isPositive ? "text-green-600" : "text-red-600"}`}>
        {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
        <span className="text-sm font-medium">{isPositive ? "+" : ""}{change.toFixed(1)}%</span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
            Analytics
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1">
            Detailed platform metrics and trends
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[140px] rounded-full">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="365d">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={fetchAnalytics} variant="outline" className="rounded-full">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="rounded-2xl animate-pulse h-32 bg-neutral-100 dark:bg-neutral-900" />
          ))}
        </div>
      ) : data ? (
        <>
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="rounded-2xl border-neutral-200 dark:border-neutral-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                  Total Users
                </CardTitle>
                <Users className="h-5 w-5 text-neutral-400" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
                  {data.summary.totalUsers.toLocaleString()}
                </div>
                {formatChange(data.summary.newUsersChange)}
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-neutral-200 dark:border-neutral-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                  Total Projects
                </CardTitle>
                <FolderKanban className="h-5 w-5 text-neutral-400" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
                  {data.summary.totalProjects.toLocaleString()}
                </div>
                {formatChange(data.summary.newProjectsChange)}
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-neutral-200 dark:border-neutral-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                  Total Revenue
                </CardTitle>
                <DollarSign className="h-5 w-5 text-neutral-400" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
                  ${data.summary.totalRevenue.toLocaleString()}
                </div>
                {formatChange(data.summary.revenueChange)}
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-neutral-200 dark:border-neutral-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                  AI API Calls
                </CardTitle>
                <Cpu className="h-5 w-5 text-neutral-400" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
                  {data.summary.totalAiCalls.toLocaleString()}
                </div>
                {formatChange(data.summary.aiCallsChange)}
              </CardContent>
            </Card>
          </div>

          {/* User Growth Chart (Simple Bar Chart) */}
          <Card className="rounded-2xl border-neutral-200 dark:border-neutral-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Growth
              </CardTitle>
              <CardDescription>New user registrations over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-end gap-1">
                {data.userGrowth.map((day, index) => {
                  const maxCount = Math.max(...data.userGrowth.map(d => d.count), 1);
                  const height = (day.count / maxCount) * 100;
                  return (
                    <div
                      key={index}
                      className="flex-1 group relative"
                    >
                      <div
                        className="bg-neutral-900 dark:bg-neutral-100 rounded-t-lg transition-all hover:bg-neutral-700 dark:hover:bg-neutral-300"
                        style={{ height: `${Math.max(height, 2)}%` }}
                      />
                      <div className="opacity-0 group-hover:opacity-100 absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-xs rounded-lg whitespace-nowrap z-10">
                        {new Date(day.date).toLocaleDateString()}: {day.count} users
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between mt-2 text-xs text-neutral-500">
                <span>{data.userGrowth[0]?.date ? new Date(data.userGrowth[0].date).toLocaleDateString() : ''}</span>
                <span>{data.userGrowth[data.userGrowth.length - 1]?.date ? new Date(data.userGrowth[data.userGrowth.length - 1].date).toLocaleDateString() : ''}</span>
              </div>
            </CardContent>
          </Card>

          {/* Revenue Chart */}
          <Card className="rounded-2xl border-neutral-200 dark:border-neutral-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Revenue
              </CardTitle>
              <CardDescription>Daily revenue over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-end gap-1">
                {data.revenue.map((day, index) => {
                  const maxAmount = Math.max(...data.revenue.map(d => d.amount), 1);
                  const height = (day.amount / maxAmount) * 100;
                  return (
                    <div
                      key={index}
                      className="flex-1 group relative"
                    >
                      <div
                        className="bg-green-600 dark:bg-green-400 rounded-t-lg transition-all hover:bg-green-500"
                        style={{ height: `${Math.max(height, 2)}%` }}
                      />
                      <div className="opacity-0 group-hover:opacity-100 absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-xs rounded-lg whitespace-nowrap z-10">
                        {new Date(day.date).toLocaleDateString()}: ${day.amount.toFixed(2)}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between mt-2 text-xs text-neutral-500">
                <span>{data.revenue[0]?.date ? new Date(data.revenue[0].date).toLocaleDateString() : ''}</span>
                <span>{data.revenue[data.revenue.length - 1]?.date ? new Date(data.revenue[data.revenue.length - 1].date).toLocaleDateString() : ''}</span>
              </div>
            </CardContent>
          </Card>

          {/* AI Usage Chart */}
          <Card className="rounded-2xl border-neutral-200 dark:border-neutral-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cpu className="h-5 w-5" />
                AI Usage
              </CardTitle>
              <CardDescription>Daily AI API calls and costs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-end gap-1">
                {data.aiUsage.map((day, index) => {
                  const maxCalls = Math.max(...data.aiUsage.map(d => d.calls), 1);
                  const height = (day.calls / maxCalls) * 100;
                  return (
                    <div
                      key={index}
                      className="flex-1 group relative"
                    >
                      <div
                        className="bg-orange-500 dark:bg-orange-400 rounded-t-lg transition-all hover:bg-orange-400"
                        style={{ height: `${Math.max(height, 2)}%` }}
                      />
                      <div className="opacity-0 group-hover:opacity-100 absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-xs rounded-lg whitespace-nowrap z-10">
                        {new Date(day.date).toLocaleDateString()}: {day.calls} calls (${day.cost.toFixed(4)})
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between mt-2 text-xs text-neutral-500">
                <span>{data.aiUsage[0]?.date ? new Date(data.aiUsage[0].date).toLocaleDateString() : ''}</span>
                <span>{data.aiUsage[data.aiUsage.length - 1]?.date ? new Date(data.aiUsage[data.aiUsage.length - 1].date).toLocaleDateString() : ''}</span>
              </div>
            </CardContent>
          </Card>

          {/* Top Models */}
          <Card className="rounded-2xl border-neutral-200 dark:border-neutral-800">
            <CardHeader>
              <CardTitle>Top AI Models</CardTitle>
              <CardDescription>Most used models by API calls</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.topModels.map((model, index) => {
                  const maxCalls = data.topModels[0]?.calls || 1;
                  const width = (model.calls / maxCalls) * 100;
                  return (
                    <div key={model.model} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                            #{index + 1}
                          </span>
                          <span className="font-medium text-neutral-900 dark:text-neutral-100">
                            {model.model}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            {model.calls.toLocaleString()} calls
                          </div>
                          <div className="text-xs text-neutral-500">
                            ${model.cost.toFixed(2)}
                          </div>
                        </div>
                      </div>
                      <div className="h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-neutral-900 dark:bg-neutral-100 rounded-full transition-all"
                          style={{ width: `${width}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
