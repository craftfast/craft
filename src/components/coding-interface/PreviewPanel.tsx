"use client";

import { useState } from "react";

interface PreviewPanelProps {
  projectId: string;
}

export default function PreviewPanel({ projectId }: PreviewPanelProps) {
  const [previewUrl, setPreviewUrl] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-neutral-900">
      {/* Preview Toolbar */}
      <div className="h-12 border-neutral-200 dark:border-neutral-800 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-neutral-300 dark:bg-neutral-600" />
            <div className="w-3 h-3 rounded-full bg-neutral-300 dark:bg-neutral-600" />
            <div className="w-3 h-3 rounded-full bg-neutral-300 dark:bg-neutral-600" />
          </div>
          <div className="ml-4 flex-1 flex items-center gap-2">
            <input
              type="text"
              value={previewUrl}
              onChange={(e) => setPreviewUrl(e.target.value)}
              placeholder="localhost:3000"
              className="px-3 py-1 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-full focus:outline-none focus:ring-2 focus:ring-neutral-500/20 w-64"
            />
            <button
              onClick={handleRefresh}
              className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors"
            >
              <svg
                className={`w-4 h-4 text-neutral-600 dark:text-neutral-400 ${
                  isRefreshing ? "animate-spin" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-3 py-1 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors">
            Mobile
          </button>
          <button className="px-3 py-1 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors">
            Tablet
          </button>
          <button className="px-3 py-1 text-xs font-medium bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-full">
            Desktop
          </button>
        </div>
      </div>

      {/* Preview Frame */}
      <div className="flex-1 bg-white dark:bg-neutral-900 px-2 pb-2 overflow-hidden">
        <div className="h-full bg-white dark:bg-neutral-900 rounded-2xl shadow-lg overflow-hidden border border-neutral-200 dark:border-neutral-800">
          {/* Placeholder content */}
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-neutral-400 dark:text-neutral-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              </div>
              <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-1">
                No Preview Available
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Start building in the chat to see a live preview
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
