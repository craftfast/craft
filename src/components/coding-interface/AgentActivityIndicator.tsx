"use client";

import { useEffect, useState } from "react";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Terminal,
  FileCode,
  Wrench,
} from "lucide-react";

interface ToolCall {
  id: string;
  name: string;
  status: "running" | "success" | "error";
  startedAt: number;
  completedAt?: number;
}

interface AgentActivityIndicatorProps {
  toolCalls: Map<string, ToolCall>;
  isStreaming?: boolean;
}

const TOOL_ICONS: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  runSandboxCommand: Terminal,
  generateFiles: FileCode,
  editFile: FileCode,
  readFile: FileCode,
  default: Wrench,
};

const TOOL_LABELS: Record<string, string> = {
  runSandboxCommand: "Running command",
  generateFiles: "Generating files",
  editFile: "Editing file",
  readFile: "Reading file",
  searchFiles: "Searching files",
  listDirectory: "Listing directory",
};

export function AgentActivityIndicator({
  toolCalls,
  isStreaming,
}: AgentActivityIndicatorProps) {
  const [currentActivity, setCurrentActivity] = useState<ToolCall | null>(null);
  const [recentActivities, setRecentActivities] = useState<ToolCall[]>([]);

  useEffect(() => {
    // Find currently running tool
    const running = Array.from(toolCalls.values()).find(
      (tc) => tc.status === "running"
    );

    if (running) {
      setCurrentActivity(running);
    } else {
      setCurrentActivity(null);
    }

    // Update recent activities (completed tools)
    const completed = Array.from(toolCalls.values())
      .filter((tc) => tc.status !== "running")
      .sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0))
      .slice(0, 3); // Keep last 3 activities

    setRecentActivities(completed);
  }, [toolCalls]);

  // Don't show anything if not streaming and no activities
  if (!isStreaming && toolCalls.size === 0) {
    return null;
  }

  const getToolIcon = (toolName: string) => {
    const Icon = TOOL_ICONS[toolName] || TOOL_ICONS.default;
    return Icon;
  };

  const getToolLabel = (toolName: string) => {
    return TOOL_LABELS[toolName] || toolName.replace(/([A-Z])/g, " $1").trim();
  };

  const formatDuration = (startedAt: number, completedAt?: number) => {
    const end = completedAt || Date.now();
    const duration = end - startedAt;
    if (duration < 1000) return `${duration}ms`;
    return `${(duration / 1000).toFixed(1)}s`;
  };

  return (
    <div className="border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 px-4 py-3">
      {/* Current Activity */}
      {currentActivity && (
        <div className="flex items-center gap-3 mb-3">
          <Loader2 className="w-4 h-4 text-neutral-600 dark:text-neutral-400 animate-spin" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {(() => {
                const Icon = getToolIcon(currentActivity.name);
                return (
                  <Icon className="w-4 h-4 text-neutral-600 dark:text-neutral-400 flex-shrink-0" />
                );
              })()}
              <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
                {getToolLabel(currentActivity.name)}
              </span>
            </div>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">
              Running for {formatDuration(currentActivity.startedAt)}
            </p>
          </div>
        </div>
      )}

      {/* Recent Activities */}
      {recentActivities.length > 0 && (
        <div className="space-y-2">
          {recentActivities.map((activity) => {
            const Icon = getToolIcon(activity.name);
            const StatusIcon =
              activity.status === "success" ? CheckCircle2 : XCircle;
            const statusColor =
              activity.status === "success"
                ? "text-green-600 dark:text-green-400"
                : "text-red-600 dark:text-red-400";

            return (
              <div
                key={activity.id}
                className="flex items-center gap-3 opacity-60"
              >
                <StatusIcon
                  className={`w-3.5 h-3.5 ${statusColor} flex-shrink-0`}
                />
                <div className="flex-1 min-w-0 flex items-center gap-2">
                  <Icon className="w-3.5 h-3.5 text-neutral-600 dark:text-neutral-400 flex-shrink-0" />
                  <span className="text-xs text-neutral-700 dark:text-neutral-300 truncate">
                    {getToolLabel(activity.name)}
                  </span>
                  <span className="text-xs text-neutral-500 dark:text-neutral-500 flex-shrink-0">
                    {formatDuration(activity.startedAt, activity.completedAt)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Idle state - only show when streaming but no active tools */}
      {isStreaming && !currentActivity && recentActivities.length === 0 && (
        <div className="flex items-center gap-3 text-neutral-600 dark:text-neutral-400">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Agent is thinking...</span>
        </div>
      )}
    </div>
  );
}
