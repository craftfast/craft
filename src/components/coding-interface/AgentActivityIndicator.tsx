"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle2,
  XCircle,
  Terminal,
  FileCode,
  Wrench,
  Package,
  FolderOpen,
  Search,
  Eye,
  Play,
  RefreshCw,
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
  runCommand: Terminal,
  generateFiles: FileCode,
  editFile: FileCode,
  readFile: FileCode,
  writeFile: FileCode,
  writeSandboxFile: FileCode,
  readSandboxFile: FileCode,
  installPackages: Package,
  listFiles: FolderOpen,
  listDirectory: FolderOpen,
  getProjectStructure: FolderOpen,
  searchFiles: Search,
  triggerPreview: Eye,
  initializeNextApp: Play,
  createProjectSandbox: Play,
  validateProject: RefreshCw,
  syncFilesToDB: RefreshCw,
  checkProjectEmpty: Search,
  deleteFile: FileCode,
  getLogs: Terminal,
  default: Wrench,
};

const TOOL_LABELS: Record<string, string> = {
  runSandboxCommand: "Running command",
  runCommand: "Running command",
  generateFiles: "Generating files",
  editFile: "Editing file",
  readFile: "Reading file",
  writeFile: "Writing file",
  writeSandboxFile: "Writing file",
  readSandboxFile: "Reading file",
  searchFiles: "Searching files",
  listFiles: "Listing files",
  listDirectory: "Listing directory",
  getProjectStructure: "Getting project structure",
  installPackages: "Installing packages",
  triggerPreview: "Starting preview",
  initializeNextApp: "Initializing Next.js app",
  createProjectSandbox: "Creating sandbox",
  validateProject: "Validating project",
  syncFilesToDB: "Syncing files",
  checkProjectEmpty: "Checking project",
  deleteFile: "Deleting file",
  getLogs: "Getting logs",
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
      .slice(0, 5); // Keep last 5 activities

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

  // Calculate elapsed time for running activities
  const [, forceUpdate] = useState(0);
  useEffect(() => {
    if (currentActivity) {
      const interval = setInterval(() => forceUpdate((n) => n + 1), 100);
      return () => clearInterval(interval);
    }
  }, [currentActivity]);

  return (
    <div className="space-y-1.5">
      {/* Current Activity - Highlighted */}
      {currentActivity && (
        <div className="flex items-center gap-2 py-1.5 px-3 rounded-lg bg-neutral-100 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700">
          {/* Spinning loader */}
          <RefreshCw className="w-3.5 h-3.5 text-neutral-600 dark:text-neutral-400 animate-spin flex-shrink-0" />
          {/* Tool icon */}
          {(() => {
            const Icon = getToolIcon(currentActivity.name);
            return (
              <Icon className="w-3.5 h-3.5 text-neutral-600 dark:text-neutral-400 flex-shrink-0" />
            );
          })()}
          {/* Tool name */}
          <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
            {getToolLabel(currentActivity.name)}
          </span>
          {/* Running time */}
          <span className="text-xs text-neutral-500 dark:text-neutral-500 ml-auto tabular-nums">
            Running for {formatDuration(currentActivity.startedAt)}
          </span>
        </div>
      )}

      {/* Recent Activities - Collapsed view */}
      {recentActivities.length > 0 && (
        <div className="space-y-1">
          {recentActivities.map((activity) => {
            const Icon = getToolIcon(activity.name);
            const isSuccess = activity.status === "success";

            return (
              <div
                key={activity.id}
                className="flex items-center gap-2 py-1 px-3 rounded-lg"
              >
                {/* Status icon */}
                {isSuccess ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-500 flex-shrink-0" />
                ) : (
                  <XCircle className="w-3.5 h-3.5 text-red-500 dark:text-red-400 flex-shrink-0" />
                )}
                {/* Tool icon */}
                <Icon className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500 flex-shrink-0" />
                {/* Tool name */}
                <span className="text-xs text-neutral-500 dark:text-neutral-500">
                  {getToolLabel(activity.name)}
                </span>
                {/* Duration */}
                <span className="text-xs text-neutral-400 dark:text-neutral-600 ml-auto tabular-nums">
                  {formatDuration(activity.startedAt, activity.completedAt)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
