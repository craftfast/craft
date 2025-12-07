/**
 * Open Page - Public Transparency Metrics
 *
 * Like cal.com's /open page - shows public metrics about the platform
 * Demonstrates transparency and builds trust with users
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Users,
  FolderKanban,
  Cpu,
  Calendar,
  ExternalLink,
  Github,
  Heart,
  Star,
  GitFork,
  FileCode,
  Zap,
  Shield,
  Code,
  BookOpen,
} from "lucide-react";
import SidebarLayout from "@/components/SidebarLayout";
import AppHeader from "@/components/AppHeader";
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

interface OpenStats {
  summary: {
    totalUsers: number;
    newUsers: number;
    userChange: number;
    totalProjects: number;
    newProjects: number;
    projectChange: number;
    totalAiCalls: number;
    aiCallsChange: number;
    totalTokens: number;
    totalFiles: number;
  };
  github: {
    stars: number;
    forks: number;
    openIssues: number;
  };
  modelUsage: Array<{
    model: string;
    calls: number;
    tokens: number;
  }>;
  userGrowth: Array<{
    date: string;
    count: number;
  }>;
  projectGrowth: Array<{
    date: string;
    count: number;
  }>;
  period: string;
  generatedAt: string;
}

export default function OpenPage() {
  const [data, setData] = useState<OpenStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState("30d");

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/open/stats?period=${period}`);
      const result = await response.json();
      if (response.ok) {
        setData(result);
      } else {
        setError(result.error || "Failed to load stats");
      }
    } catch (err) {
      console.error("Error fetching stats:", err);
      setError("Failed to connect to server");
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
  };

  const formatChange = (change: number) => {
    const isPositive = change >= 0;
    return (
      <div
        className={`flex items-center gap-1 ${
          isPositive
            ? "text-green-600 dark:text-green-400"
            : "text-red-600 dark:text-red-400"
        }`}
      >
        {isPositive ? (
          <TrendingUp className="h-4 w-4" />
        ) : (
          <TrendingDown className="h-4 w-4" />
        )}
        <span className="text-sm font-medium">
          {isPositive ? "+" : ""}
          {change.toFixed(1)}%
        </span>
      </div>
    );
  };

  return (
    <SidebarLayout>
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        {/* Header */}
        <AppHeader />

        {/* Main Content */}
        <main className="flex-1 pb-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Hero Section */}
            <div className="text-center py-12 sm:py-16">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-neutral-100 dark:bg-neutral-800 px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                <Heart className="h-4 w-4 text-red-500" />
                Open Source & Transparent
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 sm:text-5xl">
                The Most Transparent AI Builder
              </h1>
              <p className="mt-4 text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
                We believe in radical transparency. Craft is 100% open source
                and we share all our metrics publicly. No vanity metrics, just
                honest numbers about how we&apos;re growing.
              </p>
              <div className="mt-6 flex items-center justify-center gap-6 flex-wrap">
                <Link
                  href="https://github.com/craftfast/craft"
                  target="_blank"
                  className="inline-flex items-center gap-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
                >
                  <Github className="h-5 w-5" />
                  View Source
                  <ExternalLink className="h-4 w-4" />
                </Link>
                <Link
                  href="https://github.com/craftfast/craft/blob/main/LICENSE"
                  target="_blank"
                  className="inline-flex items-center gap-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
                >
                  <Shield className="h-5 w-5" />
                  MIT License
                </Link>
                <Link
                  href="/docs"
                  className="inline-flex items-center gap-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
                >
                  <BookOpen className="h-5 w-5" />
                  Documentation
                </Link>
              </div>
            </div>

            {/* GitHub Stats - Always visible */}
            {data?.github && (
              <div className="grid gap-4 md:grid-cols-3 mb-8">
                <Card className="rounded-2xl border-neutral-200 dark:border-neutral-800 bg-linear-to-br from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-800">
                  <CardContent className="p-6 flex items-center gap-4">
                    <div className="rounded-xl bg-yellow-100 dark:bg-yellow-900/30 p-3">
                      <Star className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <div>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">
                        GitHub Stars
                      </p>
                      <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                        {formatNumber(data.github.stars)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="rounded-2xl border-neutral-200 dark:border-neutral-800 bg-linear-to-br from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-800">
                  <CardContent className="p-6 flex items-center gap-4">
                    <div className="rounded-xl bg-neutral-200 dark:bg-neutral-700 p-3">
                      <GitFork className="h-6 w-6 text-neutral-600 dark:text-neutral-400" />
                    </div>
                    <div>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">
                        Forks
                      </p>
                      <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                        {formatNumber(data.github.forks)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="rounded-2xl border-neutral-200 dark:border-neutral-800 bg-linear-to-br from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-800">
                  <CardContent className="p-6 flex items-center gap-4">
                    <div className="rounded-xl bg-neutral-200 dark:bg-neutral-700 p-3">
                      <Code className="h-6 w-6 text-neutral-600 dark:text-neutral-400" />
                    </div>
                    <div>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">
                        Open Issues
                      </p>
                      <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                        {formatNumber(data.github.openIssues)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Period Selector */}
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                Platform Statistics
              </h2>
              <div className="flex items-center gap-3">
                <Select value={period} onValueChange={setPeriod}>
                  <SelectTrigger className="w-40 rounded-full">
                    <Calendar className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="7d">Last 7 days</SelectItem>
                    <SelectItem value="30d">Last 30 days</SelectItem>
                    <SelectItem value="90d">Last 90 days</SelectItem>
                    <SelectItem value="all">All time</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  onClick={fetchStats}
                  variant="outline"
                  size="icon"
                  className="rounded-full"
                  disabled={loading}
                >
                  <RefreshCw
                    className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                  />
                </Button>
              </div>
            </div>

            {/* Error State */}
            {error && (
              <Card className="rounded-2xl border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 mb-8">
                <CardContent className="p-6 text-center">
                  <p className="text-red-600 dark:text-red-400">{error}</p>
                  <Button
                    onClick={fetchStats}
                    variant="outline"
                    className="mt-4 rounded-full"
                  >
                    Try Again
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Loading State */}
            {loading && !data && !error && (
              <div className="grid gap-6 md:grid-cols-3">
                {[...Array(3)].map((_, i) => (
                  <Card
                    key={i}
                    className="rounded-2xl animate-pulse h-32 bg-neutral-100 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800"
                  />
                ))}
              </div>
            )}

            {/* Data Display */}
            {data && !error && (
              <>
                {/* Summary Cards */}
                <div className="grid gap-6 md:grid-cols-3 mb-8">
                  <Card className="rounded-2xl border-neutral-200 dark:border-neutral-800">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="rounded-xl bg-neutral-100 dark:bg-neutral-800 p-3">
                          <Users className="h-6 w-6 text-neutral-600 dark:text-neutral-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-neutral-500 dark:text-neutral-400">
                            Total Users
                          </p>
                          <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
                              {formatNumber(data.summary.totalUsers)}
                            </span>
                            {formatChange(data.summary.userChange)}
                          </div>
                          <p className="text-xs text-neutral-500 mt-1">
                            +{data.summary.newUsers} this period
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-2xl border-neutral-200 dark:border-neutral-800">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="rounded-xl bg-neutral-100 dark:bg-neutral-800 p-3">
                          <FolderKanban className="h-6 w-6 text-neutral-600 dark:text-neutral-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-neutral-500 dark:text-neutral-400">
                            Total Projects
                          </p>
                          <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
                              {formatNumber(data.summary.totalProjects)}
                            </span>
                            {formatChange(data.summary.projectChange)}
                          </div>
                          <p className="text-xs text-neutral-500 mt-1">
                            +{data.summary.newProjects} this period
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-2xl border-neutral-200 dark:border-neutral-800">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="rounded-xl bg-neutral-100 dark:bg-neutral-800 p-3">
                          <Cpu className="h-6 w-6 text-neutral-600 dark:text-neutral-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-neutral-500 dark:text-neutral-400">
                            AI Requests
                          </p>
                          <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
                              {formatNumber(data.summary.totalAiCalls)}
                            </span>
                            {formatChange(data.summary.aiCallsChange)}
                          </div>
                          <p className="text-xs text-neutral-500 mt-1">
                            This period
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Additional Stats Row */}
                <div className="grid gap-6 md:grid-cols-2 mb-8">
                  <Card className="rounded-2xl border-neutral-200 dark:border-neutral-800">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="rounded-xl bg-neutral-100 dark:bg-neutral-800 p-3">
                          <Zap className="h-6 w-6 text-neutral-600 dark:text-neutral-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-neutral-500 dark:text-neutral-400">
                            Total Tokens Processed
                          </p>
                          <span className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
                            {formatNumber(data.summary.totalTokens)}
                          </span>
                          <p className="text-xs text-neutral-500 mt-1">
                            All time across all models
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-2xl border-neutral-200 dark:border-neutral-800">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="rounded-xl bg-neutral-100 dark:bg-neutral-800 p-3">
                          <FileCode className="h-6 w-6 text-neutral-600 dark:text-neutral-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-neutral-500 dark:text-neutral-400">
                            Files Generated
                          </p>
                          <span className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
                            {formatNumber(data.summary.totalFiles)}
                          </span>
                          <p className="text-xs text-neutral-500 mt-1">
                            Code files created by AI
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Model Usage */}
                {data.modelUsage && data.modelUsage.length > 0 && (
                  <Card className="rounded-2xl border-neutral-200 dark:border-neutral-800 mb-8">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Cpu className="h-5 w-5" />
                        AI Models Usage
                      </CardTitle>
                      <CardDescription>
                        Which AI models are being used the most
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {data.modelUsage.slice(0, 5).map((model) => {
                          const maxCalls = Math.max(
                            ...data.modelUsage.map((m) => m.calls)
                          );
                          const percentage =
                            maxCalls > 0 ? (model.calls / maxCalls) * 100 : 0;

                          return (
                            <div key={model.model}>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                  {model.model}
                                </span>
                                <span className="text-sm text-neutral-500">
                                  {formatNumber(model.calls)} calls
                                </span>
                              </div>
                              <div className="h-2 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-neutral-900 dark:bg-neutral-100 transition-all duration-500"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Growth Charts */}
                <div className="grid gap-6 md:grid-cols-2">
                  {/* User Growth */}
                  <Card className="rounded-2xl border-neutral-200 dark:border-neutral-800">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        User Growth
                      </CardTitle>
                      <CardDescription>New signups over time</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {data.userGrowth && data.userGrowth.length > 0 ? (
                        <div className="h-48 flex items-end gap-1">
                          {data.userGrowth.slice(-30).map((day, i) => {
                            const maxCount = Math.max(
                              ...data.userGrowth.map((d) => d.count)
                            );
                            const height =
                              maxCount > 0 ? (day.count / maxCount) * 100 : 0;

                            return (
                              <div
                                key={i}
                                className="flex-1 bg-neutral-200 dark:bg-neutral-700 rounded-t-lg hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-colors"
                                style={{ height: `${Math.max(height, 4)}%` }}
                                title={`${day.date}: ${day.count} users`}
                              />
                            );
                          })}
                        </div>
                      ) : (
                        <div className="h-48 flex items-center justify-center text-neutral-500">
                          No data for this period
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Project Growth */}
                  <Card className="rounded-2xl border-neutral-200 dark:border-neutral-800">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FolderKanban className="h-5 w-5" />
                        Project Growth
                      </CardTitle>
                      <CardDescription>New projects over time</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {data.projectGrowth && data.projectGrowth.length > 0 ? (
                        <div className="h-48 flex items-end gap-1">
                          {data.projectGrowth.slice(-30).map((day, i) => {
                            const maxCount = Math.max(
                              ...data.projectGrowth.map((d) => d.count)
                            );
                            const height =
                              maxCount > 0 ? (day.count / maxCount) * 100 : 0;

                            return (
                              <div
                                key={i}
                                className="flex-1 bg-neutral-200 dark:bg-neutral-700 rounded-t-lg hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-colors"
                                style={{ height: `${Math.max(height, 4)}%` }}
                                title={`${day.date}: ${day.count} projects`}
                              />
                            );
                          })}
                        </div>
                      ) : (
                        <div className="h-48 flex items-center justify-center text-neutral-500">
                          No data for this period
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Footer */}
                <div className="mt-12 pt-8 border-t border-neutral-200 dark:border-neutral-800">
                  {/* Open Source Commitment */}
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4 text-center">
                      Our Open Source Commitment
                    </h3>
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="text-center p-4">
                        <Shield className="h-8 w-8 mx-auto mb-2 text-neutral-600 dark:text-neutral-400" />
                        <h4 className="font-medium text-neutral-900 dark:text-neutral-100">
                          MIT Licensed
                        </h4>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                          Free to use, modify, and distribute
                        </p>
                      </div>
                      <div className="text-center p-4">
                        <Code className="h-8 w-8 mx-auto mb-2 text-neutral-600 dark:text-neutral-400" />
                        <h4 className="font-medium text-neutral-900 dark:text-neutral-100">
                          Self-Hostable
                        </h4>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                          Run on your own infrastructure
                        </p>
                      </div>
                      <div className="text-center p-4">
                        <Heart className="h-8 w-8 mx-auto mb-2 text-neutral-600 dark:text-neutral-400" />
                        <h4 className="font-medium text-neutral-900 dark:text-neutral-100">
                          Community Driven
                        </h4>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                          Built with contributions from developers worldwide
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="text-center text-sm text-neutral-500 dark:text-neutral-400">
                    <p>
                      Last updated:{" "}
                      {new Date(data.generatedAt).toLocaleString()}
                    </p>
                    <p className="mt-2">
                      Stats are cached and update daily. All metrics are
                      aggregated and contain no personal information.
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </SidebarLayout>
  );
}
