"use client";

import { CheckCircle, XCircle, Loader2 } from "lucide-react";

export type ToolCallStatus = "running" | "success" | "error";

export interface ToolCallData {
  id: string;
  name: string;
  status: ToolCallStatus;
  args?: Record<string, string | number | boolean>;
  result?: string | Record<string, unknown>;
  error?: string;
  startedAt: number;
  completedAt?: number;
}

interface ToolCallDisplayProps {
  toolCall: ToolCallData;
}

/**
 * Simple, clean tool execution display
 * Shows live execution status with minimal UI
 */
export default function ToolCallDisplay({ toolCall }: ToolCallDisplayProps) {
  const getStatusIcon = () => {
    switch (toolCall.status) {
      case "running":
        return (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-neutral-500 dark:text-neutral-400" />
        );
      case "success":
        return (
          <CheckCircle className="h-3.5 w-3.5 text-neutral-600 dark:text-neutral-400" />
        );
      case "error":
        return (
          <XCircle className="h-3.5 w-3.5 text-red-500 dark:text-red-400" />
        );
    }
  };

  const getExecutionTime = () => {
    if (!toolCall.completedAt) return null;
    const duration = toolCall.completedAt - toolCall.startedAt;
    if (duration < 1000) return `${duration}ms`;
    return `${(duration / 1000).toFixed(1)}s`;
  };

  // Format tool name to be more readable
  const formatToolName = (name: string) => {
    return name
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  };

  return (
    <div className="flex items-center gap-2 py-1.5 px-2 rounded-lg bg-neutral-50 dark:bg-neutral-900/30 border border-neutral-200 dark:border-neutral-800">
      {/* Status icon */}
      <div className="flex-shrink-0">{getStatusIcon()}</div>

      {/* Tool name */}
      <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
        {formatToolName(toolCall.name)}
      </span>

      {/* Execution time or status */}
      {toolCall.status === "running" ? (
        <span className="text-xs text-neutral-500 dark:text-neutral-500 ml-auto">
          running...
        </span>
      ) : getExecutionTime() ? (
        <span className="text-xs text-neutral-500 dark:text-neutral-500 ml-auto">
          {getExecutionTime()}
        </span>
      ) : null}
    </div>
  );
}
