"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  FileText,
  Edit3,
  Search,
  Code,
  Terminal,
} from "lucide-react";

export interface ToolUsageData {
  id: string;
  name: string;
  status: "running" | "success" | "error";
  args?: Record<string, string | number | boolean>;
  result?: string | Record<string, unknown>;
  error?: string;
  startedAt: number;
  completedAt?: number;
}

interface ToolUsageIndicatorProps {
  toolCalls: ToolUsageData[];
}

/**
 * GitHub Copilot-style tool usage display
 * Shows compact, collapsible indicators for file operations
 */
export default function ToolUsageIndicator({
  toolCalls,
}: ToolUsageIndicatorProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getToolCategory = (toolName: string): string => {
    const name = toolName.toLowerCase();
    if (
      name.includes("read") ||
      (name.includes("file") && !name.includes("edit"))
    )
      return "read";
    if (
      name.includes("edit") ||
      name.includes("replace") ||
      name.includes("create")
    )
      return "edit";
    if (
      name.includes("search") ||
      name.includes("grep") ||
      name.includes("semantic")
    )
      return "search";
    if (name.includes("terminal") || name.includes("run")) return "terminal";
    return "other";
  };

  const getToolIcon = (category: string) => {
    switch (category) {
      case "read":
        return <FileText className="h-3 w-3" />;
      case "edit":
        return <Edit3 className="h-3 w-3" />;
      case "search":
        return <Search className="h-3 w-3" />;
      case "terminal":
        return <Terminal className="h-3 w-3" />;
      default:
        return <Code className="h-3 w-3" />;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "read":
        return "Reading files";
      case "edit":
        return "Editing files";
      case "search":
        return "Searching";
      case "terminal":
        return "Running commands";
      default:
        return "Using tools";
    }
  };

  // Group tools by category
  const groupedTools = toolCalls.reduce((acc, tool) => {
    const category = getToolCategory(tool.name);
    if (!acc[category]) acc[category] = [];
    acc[category].push(tool);
    return acc;
  }, {} as Record<string, ToolUsageData[]>);

  const getFilePath = (tool: ToolUsageData): string | null => {
    const args = tool.args;
    if (!args) return null;

    // Check common file path argument names
    const pathKeys = ["filePath", "path", "file"];
    for (const key of pathKeys) {
      if (args[key] && typeof args[key] === "string") {
        const fullPath = args[key] as string;
        // Extract just the filename or last part of path
        const parts = fullPath.split(/[/\\]/);
        return parts[parts.length - 1];
      }
    }
    return null;
  };

  const runningCount = toolCalls.filter((t) => t.status === "running").length;
  const hasRunning = runningCount > 0;

  if (toolCalls.length === 0) return null;

  return (
    <div className="mb-3">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 transition-colors"
      >
        {isExpanded ? (
          <ChevronDown className="h-3 w-3" />
        ) : (
          <ChevronRight className="h-3 w-3" />
        )}
        <span className="font-medium">
          {hasRunning ? (
            <>
              <span className="inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                Using {runningCount} tool{runningCount !== 1 ? "s" : ""}
              </span>
            </>
          ) : (
            <>
              Used {toolCalls.length} reference
              {toolCalls.length !== 1 ? "s" : ""}
            </>
          )}
        </span>
      </button>

      {isExpanded && (
        <div className="mt-2 ml-5 space-y-1">
          {Object.entries(groupedTools).map(([category, tools]) => (
            <div key={category} className="space-y-0.5">
              {tools.map((tool) => {
                const filePath = getFilePath(tool);
                const isRunning = tool.status === "running";

                return (
                  <div
                    key={tool.id}
                    className="flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-400"
                  >
                    <div className="flex-shrink-0 text-neutral-500 dark:text-neutral-500">
                      {getToolIcon(category)}
                    </div>
                    <span>
                      {getCategoryLabel(category)}
                      {filePath && (
                        <span className="text-neutral-900 dark:text-neutral-100 font-mono ml-1">
                          {filePath}
                        </span>
                      )}
                      {!filePath && tool.args?.query && (
                        <span className="text-neutral-900 dark:text-neutral-100 ml-1">
                          &quot;{String(tool.args.query).slice(0, 30)}
                          {String(tool.args.query).length > 30 ? "..." : ""}
                          &quot;
                        </span>
                      )}
                    </span>
                    {isRunning && (
                      <span className="ml-auto text-neutral-500 dark:text-neutral-500">
                        <span className="inline-flex items-center gap-1">
                          <span className="w-1 h-1 bg-blue-500 rounded-full animate-pulse" />
                          running
                        </span>
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
