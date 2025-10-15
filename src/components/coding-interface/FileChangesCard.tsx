"use client";

import { useState } from "react";
import { FileCode, FilePlus, FileEdit, FileX, ChevronDown } from "lucide-react";

interface FileChange {
  path: string;
  type: "added" | "modified" | "deleted";
  language?: string;
}

interface FileChangesCardProps {
  title: string;
  version: string;
  files: FileChange[];
  isStreaming?: boolean;
  onFileClick?: (path: string) => void;
}

export default function FileChangesCard({
  title,
  version,
  files,
  isStreaming = false,
  onFileClick,
}: FileChangesCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const addedFiles = files.filter((f) => f.type === "added");
  const modifiedFiles = files.filter((f) => f.type === "modified");
  const deletedFiles = files.filter((f) => f.type === "deleted");

  const getFileInfo = (path: string) => {
    const ext = path.split(".").pop()?.toLowerCase();
    const iconMap: Record<
      string,
      { color: string; bgColor: string; label: string }
    > = {
      tsx: {
        color: "text-blue-600 dark:text-blue-400",
        bgColor: "bg-blue-50 dark:bg-blue-900/20",
        label: "React",
      },
      jsx: {
        color: "text-blue-500 dark:text-blue-400",
        bgColor: "bg-blue-50 dark:bg-blue-900/20",
        label: "React",
      },
      ts: {
        color: "text-blue-700 dark:text-blue-500",
        bgColor: "bg-blue-50 dark:bg-blue-900/20",
        label: "TS",
      },
      js: {
        color: "text-yellow-600 dark:text-yellow-400",
        bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
        label: "JS",
      },
      css: {
        color: "text-purple-600 dark:text-purple-400",
        bgColor: "bg-purple-50 dark:bg-purple-900/20",
        label: "CSS",
      },
      json: {
        color: "text-yellow-700 dark:text-yellow-500",
        bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
        label: "JSON",
      },
      md: {
        color: "text-neutral-600 dark:text-neutral-400",
        bgColor: "bg-neutral-50 dark:bg-neutral-900/20",
        label: "MD",
      },
      html: {
        color: "text-orange-600 dark:text-orange-400",
        bgColor: "bg-orange-50 dark:bg-orange-900/20",
        label: "HTML",
      },
    };
    return (
      iconMap[ext || ""] || {
        color: "text-neutral-500 dark:text-neutral-400",
        bgColor: "bg-neutral-50 dark:bg-neutral-900/20",
        label: ext?.toUpperCase() || "FILE",
      }
    );
  };

  const renderFileGroup = (
    groupFiles: FileChange[],
    type: "added" | "modified" | "deleted"
  ) => {
    if (groupFiles.length === 0) return null;
    const config = {
      added: {
        icon: FilePlus,
        color: "text-green-600 dark:text-green-400",
        bgColor: "bg-green-50 dark:bg-green-900/20",
        label: "Added",
      },
      modified: {
        icon: FileEdit,
        color: "text-amber-600 dark:text-amber-400",
        bgColor: "bg-amber-50 dark:bg-amber-900/20",
        label: "Modified",
      },
      deleted: {
        icon: FileX,
        color: "text-red-600 dark:text-red-400",
        bgColor: "bg-red-50 dark:bg-red-900/20",
        label: "Deleted",
      },
    }[type];
    const Icon = config.icon;
    return (
      <div className="space-y-1">
        <div className="flex items-center gap-2 mb-2">
          <Icon className={`w-3.5 h-3.5 ${config.color}`} />
          <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
            {config.label} ({groupFiles.length})
          </span>
        </div>
        <div className="space-y-1">
          {groupFiles.map((file, idx) => {
            const fileInfo = getFileInfo(file.path);
            const fileName = file.path.split("/").pop() || file.path;
            const filePath = file.path.substring(0, file.path.lastIndexOf("/"));
            return (
              <button
                key={idx}
                onClick={() => onFileClick?.(file.path)}
                className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left transition-all ${
                  onFileClick
                    ? "hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer hover:scale-[1.01]"
                    : "cursor-default"
                } ${
                  config.bgColor
                } border border-transparent hover:border-neutral-200 dark:hover:border-neutral-700`}
              >
                <div
                  className={`w-6 h-6 rounded-md ${fileInfo.bgColor} flex items-center justify-center flex-shrink-0`}
                >
                  <FileCode className={`w-3.5 h-3.5 ${fileInfo.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-neutral-900 dark:text-neutral-100 truncate">
                      {fileName}
                    </span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded ${fileInfo.bgColor} ${fileInfo.color} font-semibold`}
                    >
                      {fileInfo.label}
                    </span>
                  </div>
                  {filePath && (
                    <span className="text-[10px] text-neutral-500 dark:text-neutral-500 truncate block">
                      {filePath}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const totalFiles = files.length;

  return (
    <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden bg-gradient-to-br from-white to-neutral-50 dark:from-neutral-900 dark:to-neutral-900/50 shadow-sm">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3.5 flex items-center gap-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors border-b border-neutral-200 dark:border-neutral-800"
      >
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
            isStreaming
              ? "bg-gradient-to-br from-green-500 to-emerald-600 dark:from-green-600 dark:to-emerald-700"
              : "bg-gradient-to-br from-neutral-800 to-neutral-900 dark:from-neutral-100 dark:to-neutral-200"
          }`}
        >
          {isStreaming ? (
            <div className="flex gap-0.5">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" />
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:0.15s]" />
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:0.3s]" />
            </div>
          ) : (
            <svg
              className="w-5 h-5 text-white dark:text-neutral-900"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M5 13l4 4L19 7"
              />
            </svg>
          )}
        </div>
        <div className="flex-1 text-left">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              {title}
            </h3>
            {isStreaming && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500 text-white font-bold animate-pulse">
                LIVE
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
              {version}
            </span>
            <span className="text-neutral-300 dark:text-neutral-700"></span>
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              {totalFiles} file{totalFiles !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-neutral-400 transition-transform flex-shrink-0 ${
            isExpanded ? "rotate-180" : ""
          }`}
        />
      </button>
      {isExpanded && (
        <div className="px-4 py-3 space-y-3">
          {renderFileGroup(addedFiles, "added")}
          {renderFileGroup(modifiedFiles, "modified")}
          {renderFileGroup(deletedFiles, "deleted")}
        </div>
      )}
    </div>
  );
}
