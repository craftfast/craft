"use client";

import { useState, useMemo } from "react";
import {
  ChevronDown,
  FileText,
  Edit3,
  Search,
  FilePlus,
  FileEdit,
  BookOpen,
} from "lucide-react";

export interface ToolCall {
  id: string;
  name: string;
  status: "running" | "success" | "error";
  args?: Record<string, string | number | boolean>;
  result?: string | Record<string, unknown>;
  error?: string;
  startedAt: number;
  completedAt?: number;
}

interface FileReference {
  path: string;
  type: "read" | "write";
  operation?: "created" | "modified";
  lineRange?: string;
  toolName: string;
}

interface SearchReference {
  type: "grep" | "semantic" | "file";
  query: string;
  resultCount?: number;
}

interface GroupedReferences {
  reads: FileReference[];
  writes: FileReference[];
  searches: SearchReference[];
}

interface InlineReferencesProps {
  toolCalls: ToolCall[];
  onFileClick?: (path: string) => void;
}

/**
 * Professional inline references display (GitHub Copilot style)
 * Shows compact summary of files read/written during AI response
 * Hides internal/system tools to reduce noise
 */
export function InlineReferences({
  toolCalls,
  onFileClick,
}: InlineReferencesProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Smart grouping and filtering
  const references = useMemo(() => {
    return groupReferences(toolCalls);
  }, [toolCalls]);

  const totalReferences =
    references.reads.length +
    references.writes.length +
    references.searches.length;

  // Check if any tools are currently running
  const runningTools = toolCalls.filter((t) => t.status === "running");
  const hasRunningTools = runningTools.length > 0;

  // Hide if no visible references and no running tools
  if (totalReferences === 0 && !hasRunningTools) return null;

  return (
    <div className="mb-3">
      {/* Collapsed Summary Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/30 hover:bg-neutral-100 dark:hover:bg-neutral-900/50 transition-colors w-fit"
      >
        <BookOpen className="h-3.5 w-3.5 text-neutral-600 dark:text-neutral-400" />
        <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
          {hasRunningTools ? (
            <>
              Working
              {totalReferences > 0 &&
                ` · ${totalReferences} reference${
                  totalReferences !== 1 ? "s" : ""
                }`}
            </>
          ) : (
            <>
              Used {totalReferences} reference{totalReferences !== 1 ? "s" : ""}
            </>
          )}
        </span>
        {hasRunningTools && (
          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
        )}
        <ChevronDown
          className={`h-3.5 w-3.5 text-neutral-500 transition-transform ${
            isExpanded ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="mt-3 ml-3 pl-4 border-l-2 border-neutral-200 dark:border-neutral-800 space-y-3">
          {/* Read References (Context) */}
          {references.reads.length > 0 && (
            <ReferenceGroup
              title="Context"
              count={references.reads.length}
              icon={FileText}
              references={references.reads}
              onFileClick={onFileClick}
              variant="read"
            />
          )}

          {/* Write References (Changes) */}
          {references.writes.length > 0 && (
            <ReferenceGroup
              title="Changes"
              count={references.writes.length}
              icon={Edit3}
              references={references.writes}
              onFileClick={onFileClick}
              variant="write"
            />
          )}

          {/* Search References */}
          {references.searches.length > 0 && (
            <SearchGroup searches={references.searches} />
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Reference Group Component
 * Shows grouped list of files (reads or writes)
 */
interface ReferenceGroupProps {
  title: string;
  count: number;
  icon: React.ElementType;
  references: FileReference[];
  onFileClick?: (path: string) => void;
  variant: "read" | "write";
}

function ReferenceGroup({
  title,
  count,
  icon: Icon,
  references,
  onFileClick,
  variant,
}: ReferenceGroupProps) {
  return (
    <div className="space-y-1.5">
      {/* Group Header */}
      <div className="flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 text-neutral-500 dark:text-neutral-400" />
        <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wide">
          {title} ({count} {count === 1 ? "file" : "files"})
        </span>
      </div>

      {/* File List */}
      <div className="space-y-1">
        {references.map((ref, index) => (
          <button
            key={`${ref.path}-${index}`}
            onClick={() => onFileClick?.(ref.path)}
            className={`flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800/50 transition-colors w-full text-left group ${
              variant === "write"
                ? "border border-neutral-200 dark:border-neutral-800"
                : ""
            }`}
          >
            {/* Icon based on operation */}
            {variant === "write" && (
              <>
                {ref.operation === "created" ? (
                  <FilePlus className="h-3 w-3 text-neutral-600 dark:text-neutral-400 flex-shrink-0" />
                ) : (
                  <FileEdit className="h-3 w-3 text-neutral-600 dark:text-neutral-400 flex-shrink-0" />
                )}
              </>
            )}

            {/* File path */}
            <span className="text-xs font-mono text-neutral-900 dark:text-neutral-100 truncate flex-1 group-hover:text-neutral-700 dark:group-hover:text-neutral-300">
              {extractFileName(ref.path)}
            </span>

            {/* Operation label */}
            {ref.operation && (
              <span
                className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                  ref.operation === "created"
                    ? "bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
                    : "bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400"
                }`}
              >
                {ref.operation}
              </span>
            )}

            {/* Line range if available */}
            {ref.lineRange && variant === "read" && (
              <span className="text-[10px] text-neutral-500 dark:text-neutral-500 font-mono">
                {ref.lineRange}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Search Group Component
 * Shows list of searches performed
 */
interface SearchGroupProps {
  searches: SearchReference[];
}

function SearchGroup({ searches }: SearchGroupProps) {
  return (
    <div className="space-y-1.5">
      {/* Group Header */}
      <div className="flex items-center gap-2">
        <Search className="h-3.5 w-3.5 text-neutral-500 dark:text-neutral-400" />
        <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wide">
          Searches ({searches.length})
        </span>
      </div>

      {/* Search List */}
      <div className="space-y-1">
        {searches.map((search, index) => (
          <div
            key={index}
            className="flex items-start gap-2 px-2 py-1.5 rounded-lg bg-neutral-50 dark:bg-neutral-900/30"
          >
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 uppercase flex-shrink-0">
              {search.type}
            </span>
            <span className="text-xs text-neutral-700 dark:text-neutral-300 truncate flex-1">
              "{search.query.slice(0, 50)}
              {search.query.length > 50 ? "..." : ""}"
            </span>
            {search.resultCount !== undefined && (
              <span className="text-[10px] text-neutral-500 dark:text-neutral-500 flex-shrink-0">
                {search.resultCount} results
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Smart tool filtering and grouping
 * Filters out internal/system tools and groups by operation type
 */
function groupReferences(toolCalls: ToolCall[]): GroupedReferences {
  const reads: FileReference[] = [];
  const writes: FileReference[] = [];
  const searches: SearchReference[] = [];

  for (const tool of toolCalls) {
    // Skip failed tools, but include running and success
    if (tool.status === "error") continue;

    const toolName = tool.name.toLowerCase();
    const args = tool.args || {};

    // READ OPERATIONS
    if (
      toolName === "read_file" ||
      toolName === "list_dir" ||
      toolName === "copilot_getnotebooksummary"
    ) {
      const filePath = extractFilePath(args);
      if (filePath) {
        reads.push({
          path: filePath,
          type: "read",
          lineRange: extractLineRange(args),
          toolName: tool.name,
        });
      }
    }
    // WRITE OPERATIONS
    else if (
      toolName === "create_file" ||
      toolName === "replace_string_in_file" ||
      toolName === "multi_replace_string_in_file" ||
      toolName === "edit_notebook_file"
    ) {
      const filePath = extractFilePath(args);
      if (filePath) {
        writes.push({
          path: filePath,
          type: "write",
          operation: toolName === "create_file" ? "created" : "modified",
          toolName: tool.name,
        });
      }
    }
    // SEARCH OPERATIONS
    else if (
      toolName === "grep_search" ||
      toolName === "semantic_search" ||
      toolName === "file_search"
    ) {
      const query = String(args.query || "");
      if (query) {
        searches.push({
          type: toolName.includes("grep")
            ? "grep"
            : toolName.includes("semantic")
            ? "semantic"
            : "file",
          query,
        });
      }
    }
    // SKIP: Internal/system tools
    // - get_errors, get_task_output, get_terminal_output
    // - run_in_terminal, run_task, run_notebook_cell
    // - manage_todo_list, test_failure
    // - tool context management
    // - orchestrator tools
  }

  // Deduplicate files (keep last occurrence)
  const deduplicatedReads = deduplicateByPath(reads);
  const deduplicatedWrites = deduplicateByPath(writes);

  return {
    reads: deduplicatedReads,
    writes: deduplicatedWrites,
    searches,
  };
}

/**
 * Extract file path from tool arguments
 */
function extractFilePath(
  args: Record<string, string | number | boolean>
): string | null {
  const pathKeys = ["filePath", "path", "file"];
  for (const key of pathKeys) {
    if (args[key] && typeof args[key] === "string") {
      return args[key] as string;
    }
  }
  return null;
}

/**
 * Extract line range from read_file arguments
 */
function extractLineRange(
  args: Record<string, string | number | boolean>
): string | undefined {
  const start = args.startLine;
  const end = args.endLine;
  if (start && end) {
    return `L${start}-${end}`;
  }
  return undefined;
}

/**
 * Extract filename from full path
 */
function extractFileName(path: string): string {
  // Handle both Windows and Unix paths
  const parts = path.split(/[/\\]/);
  return parts[parts.length - 1] || path;
}

/**
 * Deduplicate file references by path (keep last)
 */
function deduplicateByPath(refs: FileReference[]): FileReference[] {
  const map = new Map<string, FileReference>();
  for (const ref of refs) {
    map.set(ref.path, ref);
  }
  return Array.from(map.values());
}
