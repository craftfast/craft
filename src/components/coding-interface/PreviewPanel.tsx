"use client";

import { useState, useEffect } from "react";

interface PreviewPanelProps {
  projectId: string;
  projectFiles?: Record<string, string>;
}

type SandboxStatus = "inactive" | "loading" | "running" | "error";

export default function PreviewPanel({
  projectId,
  projectFiles = {},
}: PreviewPanelProps) {
  const [previewUrl, setPreviewUrl] = useState("");
  const [iframeUrl, setIframeUrl] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sandboxStatus, setSandboxStatus] = useState<SandboxStatus>("inactive");
  const [error, setError] = useState<string | null>(null);
  const [deviceMode, setDeviceMode] = useState<"mobile" | "tablet" | "desktop">(
    "desktop"
  );
  const [loadingMessage, setLoadingMessage] = useState("Starting preview...");

  // Check if sandbox is already running
  useEffect(() => {
    const checkSandboxStatus = async () => {
      try {
        const response = await fetch(`/api/sandbox/${projectId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.status === "running" && data.url) {
            setPreviewUrl(data.url);
            setIframeUrl(data.url);
            setSandboxStatus("running");
          }
        }
      } catch (error) {
        console.error("Error checking sandbox status:", error);
      }
    };

    checkSandboxStatus();
  }, [projectId]);

  const startSandbox = async () => {
    try {
      setSandboxStatus("loading");
      setError(null);
      setLoadingMessage("Creating sandbox environment...");

      const response = await fetch(`/api/sandbox/${projectId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          files: projectFiles,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to start sandbox");
      }

      const data = await response.json();

      setLoadingMessage("Installing dependencies...");

      // Wait a bit more for the server to fully start
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setLoadingMessage("Starting development server...");

      // Try to access the URL to verify it's ready
      let retries = 0;
      const maxRetries = 10;
      let isReady = false;

      while (retries < maxRetries && !isReady) {
        try {
          await fetch(data.url, { mode: "no-cors" });
          isReady = true;
        } catch {
          retries++;
          await new Promise((resolve) => setTimeout(resolve, 1000));
          setLoadingMessage(`Waiting for server... (${retries}/${maxRetries})`);
        }
      }

      setPreviewUrl(data.url);
      setIframeUrl(data.url);
      setSandboxStatus("running");
    } catch (error) {
      console.error("Error starting sandbox:", error);
      setError("Failed to start preview. Please try again.");
      setSandboxStatus("error");
    }
  };

  const stopSandbox = async () => {
    try {
      await fetch(`/api/sandbox/${projectId}`, {
        method: "DELETE",
      });
      setSandboxStatus("inactive");
      setPreviewUrl("");
      setIframeUrl("");
    } catch (error) {
      console.error("Error stopping sandbox:", error);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Force iframe reload
    if (iframeUrl) {
      setIframeUrl("");
      setTimeout(() => {
        setIframeUrl(previewUrl);
        setIsRefreshing(false);
      }, 100);
    } else {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  const getDeviceWidth = () => {
    switch (deviceMode) {
      case "mobile":
        return "375px";
      case "tablet":
        return "768px";
      case "desktop":
      default:
        return "100%";
    }
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-neutral-900">
      {/* Preview Toolbar */}
      <div className="h-12 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between px-4">
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
              placeholder="No preview running"
              disabled={sandboxStatus !== "running"}
              className="px-3 py-1 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-full focus:outline-none focus:ring-2 focus:ring-neutral-500/20 w-64 disabled:opacity-50"
            />
            <button
              onClick={handleRefresh}
              disabled={sandboxStatus !== "running"}
              className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
          <button
            onClick={() => setDeviceMode("mobile")}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
              deviceMode === "mobile"
                ? "bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900"
                : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            }`}
          >
            Mobile
          </button>
          <button
            onClick={() => setDeviceMode("tablet")}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
              deviceMode === "tablet"
                ? "bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900"
                : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            }`}
          >
            Tablet
          </button>
          <button
            onClick={() => setDeviceMode("desktop")}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
              deviceMode === "desktop"
                ? "bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900"
                : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            }`}
          >
            Desktop
          </button>
        </div>
      </div>

      {/* Preview Frame */}
      <div className="flex-1 bg-neutral-50 dark:bg-neutral-900 overflow-auto">
        <div className="h-full flex items-center justify-center">
          {sandboxStatus === "inactive" && (
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
                No Preview Running
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4">
                Start the preview to see your app live
              </p>
              <button
                onClick={startSandbox}
                className="px-4 py-2 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-sm font-medium rounded-full hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
              >
                Start Preview
              </button>
            </div>
          )}

          {sandboxStatus === "loading" && (
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-neutral-600 dark:text-neutral-400 animate-spin"
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
              </div>
              <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-1">
                {loadingMessage}
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                This may take up to 10 seconds...
              </p>
            </div>
          )}

          {sandboxStatus === "error" && (
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-red-600 dark:text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-1">
                Preview Failed
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4">
                {error || "Something went wrong"}
              </p>
              <button
                onClick={startSandbox}
                className="px-4 py-2 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-sm font-medium rounded-full hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {sandboxStatus === "running" && iframeUrl && (
            <div
              className="h-full bg-white dark:bg-neutral-900 transition-all duration-300 mx-auto"
              style={{ width: getDeviceWidth() }}
            >
              <div className="relative h-full border-l border-r border-neutral-200 dark:border-neutral-800">
                <iframe
                  src={iframeUrl}
                  className="w-full h-full border-none"
                  title="Preview"
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
                />
                <button
                  onClick={stopSandbox}
                  className="absolute top-4 right-4 px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-full hover:bg-red-700 transition-colors shadow-lg"
                >
                  Stop Preview
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
