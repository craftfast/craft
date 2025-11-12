"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";

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
 * Display a single tool execution with expandable details
 * Shows tool name, status, execution time, and collapsible args/results
 */
export default function ToolCallDisplay({ toolCall }: ToolCallDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusIcon = () => {
    switch (toolCall.status) {
      case "running":
        return <Loader2 className="h-4 w-4 animate-spin text-neutral-400" />;
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getExecutionTime = () => {
    if (!toolCall.completedAt) return null;
    const duration = toolCall.completedAt - toolCall.startedAt;
    return `${duration}ms`;
  };

  // Format tool name to be more readable
  const formatToolName = (name: string) => {
    // Convert camelCase to Title Case with spaces
    return name
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  };

  return (
    <div className="mb-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 overflow-hidden">
      {/* Header - always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-800/50 transition-colors"
      >
        {/* Expand/collapse icon */}
        {isExpanded ? (
          <ChevronDown className="h-3 w-3 text-neutral-500 flex-shrink-0" />
        ) : (
          <ChevronRight className="h-3 w-3 text-neutral-500 flex-shrink-0" />
        )}

        {/* Status icon */}
        <div className="flex-shrink-0">{getStatusIcon()}</div>

        {/* Tool name */}
        <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
          {formatToolName(toolCall.name)}
        </span>

        {/* Execution time */}
        {getExecutionTime() && (
          <span className="text-xs text-neutral-500 ml-auto">
            {getExecutionTime()}
          </span>
        )}
      </button>

      {/* Expandable details */}
      {isExpanded && (
        <div className="px-3 pb-3 space-y-2 border-t border-neutral-200 dark:border-neutral-800">
          {/* Arguments */}
          {toolCall.args && Object.keys(toolCall.args).length > 0 && (
            <div className="mt-2">
              <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">
                Arguments:
              </div>
              <pre className="text-xs bg-neutral-100 dark:bg-neutral-800 rounded-lg p-2 overflow-x-auto">
                {JSON.stringify(toolCall.args, null, 2)}
              </pre>
            </div>
          )}

          {/* Result */}
          {toolCall.status === "success" && toolCall.result && (
            <div>
              <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">
                Result:
              </div>
              <pre className="text-xs bg-neutral-100 dark:bg-neutral-800 rounded-lg p-2 overflow-x-auto max-h-64">
                {typeof toolCall.result === "string"
                  ? toolCall.result
                  : JSON.stringify(toolCall.result, null, 2)}
              </pre>
            </div>
          )}

          {/* Error */}
          {toolCall.status === "error" && toolCall.error && (
            <div>
              <div className="text-xs font-medium text-red-500 dark:text-red-400 mb-1">
                Error:
              </div>
              <pre className="text-xs bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg p-2 overflow-x-auto">
                {toolCall.error}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
