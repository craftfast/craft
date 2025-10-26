"use client";

import { useState } from "react";

interface AnalyticsPanelProps {
  projectId: string;
}

export default function AnalyticsPanel({ projectId }: AnalyticsPanelProps) {
  const [timeRange, setTimeRange] = useState("7d");
  console.log("AnalyticsPanel projectId:", projectId);

  const metrics = [
    { label: "Total Visits", value: "12,345", change: "+12.5%", trend: "up" },
    { label: "Unique Users", value: "8,234", change: "+8.2%", trend: "up" },
    { label: "Avg. Session", value: "4m 32s", change: "-2.1%", trend: "down" },
    { label: "Bounce Rate", value: "42.3%", change: "-5.4%", trend: "up" },
  ];

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="h-14 border-b border-border flex items-center justify-between px-6">
        <h2 className="text-sm font-semibold text-foreground">
          Analytics Overview
        </h2>
        <div className="flex items-center gap-2">
          {["24h", "7d", "30d", "90d"].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                timeRange === range
                  ? "bg-primary text-primary-foreground"
                  : "text-neutral-700 dark:text-neutral-300 hover:bg-accent/10"
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {metrics.map((metric) => (
            <div
              key={metric.label}
              className="p-4 bg-muted rounded-2xl border border-border"
            >
              <div className="text-xs text-muted-foreground mb-1">
                {metric.label}
              </div>
              <div className="flex items-end justify-between">
                <div className="text-2xl font-semibold text-foreground">
                  {metric.value}
                </div>
                <div
                  className={`text-xs font-medium ${
                    metric.trend === "up"
                      ? "text-neutral-700 dark:text-neutral-300"
                      : "text-neutral-500 dark:text-neutral-500"
                  }`}
                >
                  {metric.change}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Chart Placeholder */}
        <div className="bg-muted rounded-2xl border border-border p-6 mb-8">
          <h3 className="text-sm font-semibold text-foreground mb-4">
            Traffic Over Time
          </h3>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center">
                <span className="text-2xl">📊</span>
              </div>
              <p className="text-sm">Chart visualization coming soon</p>
            </div>
          </div>
        </div>

        {/* Top Pages */}
        <div className="bg-muted rounded-2xl border border-border p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">
            Top Pages
          </h3>
          <div className="space-y-3">
            {[
              { path: "/", views: 4234, percentage: 34 },
              { path: "/dashboard", views: 2156, percentage: 17 },
              { path: "/pricing", views: 1892, percentage: 15 },
              { path: "/docs", views: 1456, percentage: 12 },
            ].map((page) => (
              <div
                key={page.path}
                className="flex items-center justify-between p-3 bg-background rounded-xl"
              >
                <div className="flex-1">
                  <div className="text-sm font-medium text-foreground">
                    {page.path}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {page.views.toLocaleString()} views
                  </div>
                </div>
                <div className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  {page.percentage}%
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
