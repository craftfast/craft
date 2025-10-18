"use client";

import { useState } from "react";

interface LogsPanelProps {
  projectId: string;
}

interface Log {
  id: string;
  timestamp: string;
  level: "info" | "warn" | "error";
  message: string;
  source: string;
}

export default function LogsPanel({ projectId }: LogsPanelProps) {
  const [filter, setFilter] = useState<"all" | "info" | "warn" | "error">(
    "all"
  );
  const [searchQuery, setSearchQuery] = useState("");
  console.log("LogsPanel projectId:", projectId);

  const logs: Log[] = [
    {
      id: "1",
      timestamp: "2025-01-20 14:32:15",
      level: "info",
      message: "Server started on port 3000",
      source: "server.js",
    },
    {
      id: "2",
      timestamp: "2025-01-20 14:32:18",
      level: "info",
      message: "Database connection established",
      source: "db.js",
    },
    {
      id: "3",
      timestamp: "2025-01-20 14:33:02",
      level: "warn",
      message: "Slow query detected: 2.3s",
      source: "api/users.js",
    },
    {
      id: "4",
      timestamp: "2025-01-20 14:35:44",
      level: "error",
      message: "Failed to process payment: Invalid card",
      source: "api/payment.js",
    },
    {
      id: "5",
      timestamp: "2025-01-20 14:36:12",
      level: "info",
      message: "User authentication successful",
      source: "auth.js",
    },
  ];

  const getLevelColor = (level: Log["level"]) => {
    switch (level) {
      case "info":
        return "text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800";
      case "warn":
        return "text-neutral-700 dark:text-neutral-300 bg-neutral-200 dark:bg-neutral-700";
      case "error":
        return "text-neutral-900 dark:text-neutral-100 bg-neutral-300 dark:bg-neutral-600";
      default:
        return "text-neutral-500 dark:text-neutral-500";
    }
  };

  const filteredLogs =
    filter === "all" ? logs : logs.filter((log) => log.level === filter);

  return (
    <div className="h-full flex flex-col bg-white dark:bg-neutral-900">
      {/* Header */}
      <div className="h-14 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between px-6">
        <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          Application Logs
        </h2>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {["all", "info", "warn", "error"].map((level) => (
              <button
                key={level}
                onClick={() => setFilter(level as typeof filter)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors capitalize ${
                  filter === level
                    ? "bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900"
                    : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                }`}
              >
                {level}
              </button>
            ))}
          </div>
          <button className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors">
            <svg
              className="w-4 h-4 text-neutral-600 dark:text-neutral-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="px-6 py-3 border-b border-neutral-200 dark:border-neutral-800">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search logs..."
          className="w-full px-4 py-2 text-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-full focus:outline-none focus:ring-2 focus:ring-neutral-500/20"
        />
      </div>

      {/* Logs List */}
      <div className="flex-1 overflow-auto">
        {filteredLogs.length > 0 ? (
          <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className="p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 text-xs font-medium rounded-full ${getLevelColor(
                        log.level
                      )}`}
                    >
                      {log.level.toUpperCase()}
                    </span>
                    <span className="text-xs text-neutral-500 dark:text-neutral-400">
                      {log.timestamp}
                    </span>
                  </div>
                  <span className="text-xs text-neutral-500 dark:text-neutral-400 font-mono">
                    {log.source}
                  </span>
                </div>
                <p className="text-sm text-neutral-900 dark:text-neutral-100 font-mono">
                  {log.message}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                <span className="text-2xl">📋</span>
              </div>
              <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-1">
                No Logs Found
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                No logs match your current filters
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
