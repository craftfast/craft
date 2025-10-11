"use client";

import { useState, useEffect } from "react";

interface PreviewPanelProps {
  projectId: string;
  projectFiles?: Record<string, string>;
  isGeneratingFiles?: boolean; // New prop to indicate AI is generating files
}

type SandboxStatus = "inactive" | "loading" | "running" | "error";

export default function PreviewPanel({
  projectId,
  projectFiles = {},
  isGeneratingFiles = false,
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

  // Check if sandbox is already running on mount
  useEffect(() => {
    const checkSandboxStatus = async () => {
      try {
        const response = await fetch(`/api/sandbox/${projectId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.status === "running" && data.url) {
            console.log("📌 Found existing sandbox running:", data.url);
            setPreviewUrl(data.url);
            setIframeUrl(data.url);
            setSandboxStatus("running");
            return true; // Sandbox is already running
          }
        }
      } catch (error) {
        console.error("Error checking sandbox status:", error);
      }
      return false; // No sandbox running
    };

    checkSandboxStatus();
  }, [projectId]);

  // Auto-start sandbox when files are ready after AI generation
  useEffect(() => {
    let autoStartTimer: NodeJS.Timeout;

    // Only auto-start if:
    // 1. Sandbox is inactive
    // 2. We have files (not empty project)
    // 3. AI is NOT currently generating files (wait for generation to complete)
    // 4. Files actually exist (prevent starting on initial empty state)
    const hasActualFiles = Object.keys(projectFiles).length > 0;
    const shouldAutoStart =
      sandboxStatus === "inactive" && hasActualFiles && !isGeneratingFiles;

    if (shouldAutoStart) {
      console.log(
        `🚀 Preview panel ready - auto-starting sandbox with ${
          Object.keys(projectFiles).length
        } files...`
      );
      // Small delay to ensure smooth transition after AI completes
      autoStartTimer = setTimeout(() => {
        startSandbox();
      }, 1000); // Slightly longer delay to ensure files are fully saved
    } else if (sandboxStatus === "inactive" && isGeneratingFiles) {
      console.log(
        `⏳ AI is generating code... (current: ${
          Object.keys(projectFiles).length
        } files)`
      );
    } else if (sandboxStatus === "inactive" && !hasActualFiles) {
      console.log(`⏳ Waiting for AI to generate initial code...`);
    }

    return () => {
      if (autoStartTimer) {
        clearTimeout(autoStartTimer);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, projectFiles, sandboxStatus, isGeneratingFiles]);

  // Cleanup on unmount (when closing project)
  useEffect(() => {
    return () => {
      console.log("🧹 Preview panel unmounting - cleaning up sandbox...");
      fetch(`/api/sandbox/${projectId}`, {
        method: "DELETE",
      }).catch((err) => console.error("Cleanup error:", err));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-refresh preview when project files change
  useEffect(() => {
    const updatePreview = async () => {
      if (sandboxStatus === "running" && Object.keys(projectFiles).length > 0) {
        console.log(
          `📝 Project files updated (${
            Object.keys(projectFiles).length
          } files), auto-updating preview...`
        );
        await updateSandboxFiles();
      } else if (
        sandboxStatus === "inactive" &&
        Object.keys(projectFiles).length > 0
      ) {
        console.log(
          `📝 Project has ${
            Object.keys(projectFiles).length
          } files, but sandbox not started yet`
        );
      }
    };

    updatePreview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectFiles]);

  const startSandbox = async () => {
    try {
      setSandboxStatus("loading");
      setError(null);
      setLoadingMessage("Initializing Next.js environment...");

      console.log("🚀 Starting Next.js sandbox for project:", projectId);

      // Fetch the latest files from the database before starting
      const filesResponse = await fetch(`/api/files?projectId=${projectId}`);
      let filesToSend = projectFiles;

      if (filesResponse.ok) {
        const filesData = await filesResponse.json();
        filesToSend = filesData.files || {};
        console.log(
          `📁 Loaded ${Object.keys(filesToSend).length} files from API`
        );
        console.log(`📋 Files:`, Object.keys(filesToSend));
      } else {
        console.log(`⚠️ Could not fetch from API, using props`);
      }

      // If no files from API, use the projectFiles prop
      if (
        Object.keys(filesToSend).length === 0 &&
        Object.keys(projectFiles).length > 0
      ) {
        filesToSend = projectFiles;
        console.log(
          `📁 Using ${Object.keys(filesToSend).length} files from props`
        );
        console.log(`📋 Files:`, Object.keys(filesToSend));
      }

      console.log(
        `📤 Sending ${Object.keys(filesToSend).length} files to sandbox API...`
      );

      setLoadingMessage("Setting up Next.js project...");

      const response = await fetch(`/api/sandbox/${projectId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          files: filesToSend,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to start sandbox");
      }

      const data = await response.json();

      console.log("📦 Sandbox created:", data);
      console.log("🔗 Preview URL:", data.url);

      // The server is already running thanks to the API!
      // Just give it a moment to be fully ready
      setLoadingMessage("Verifying server is ready...");

      // Wait a bit for the server to be accessible
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Try to access the URL to verify it's ready
      let retries = 0;
      const maxRetries = 5;
      let isReady = false;

      setLoadingMessage("Connecting to preview...");

      while (retries < maxRetries && !isReady) {
        try {
          console.log(
            `🔍 Attempt ${retries + 1}/${maxRetries}: Testing ${data.url}`
          );
          await fetch(data.url, { mode: "no-cors" });
          console.log("✅ Server responded!");
          isReady = true;
        } catch (err) {
          console.warn(`⚠️  Attempt ${retries + 1} failed:`, err);
          retries++;
          await new Promise((resolve) => setTimeout(resolve, 1500));
          setLoadingMessage(`Waiting for server... (${retries}/${maxRetries})`);
        }
      }

      if (!isReady) {
        console.error("❌ Server did not respond after retries");
        throw new Error("Server not responding");
      }

      console.log("🎉 Setting preview URL:", data.url);
      setPreviewUrl(data.url);
      setIframeUrl(data.url);
      setSandboxStatus("running");
    } catch (error) {
      console.error("Error starting sandbox:", error);
      setError("Failed to start preview. Please try again.");
      setSandboxStatus("error");
    }
  };

  const updateSandboxFiles = async () => {
    if (sandboxStatus !== "running") return;

    try {
      console.log("🔄 Updating sandbox files...");
      setIsRefreshing(true);

      // Fetch the latest files from the database
      const filesResponse = await fetch(`/api/files?projectId=${projectId}`);
      let filesToUpdate = projectFiles;

      if (filesResponse.ok) {
        const filesData = await filesResponse.json();
        filesToUpdate = filesData.files || projectFiles;
        console.log(
          `📁 Fetched ${Object.keys(filesToUpdate).length} files from database`
        );
        console.log(`📋 File list:`, Object.keys(filesToUpdate));
      } else {
        console.log(
          `⚠️ Could not fetch files from API, using props (${
            Object.keys(projectFiles).length
          } files)`
        );
      }

      console.log(
        `📤 Sending ${Object.keys(filesToUpdate).length} files to sandbox...`
      );

      // Update sandbox with new files (without fully recreating it)
      const response = await fetch(`/api/sandbox/${projectId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          files: filesToUpdate,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Files updated successfully`, data);

        // Wait a moment for files to be written
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Force refresh the iframe to show updated content
        setIframeUrl("");
        setTimeout(() => {
          setIframeUrl(previewUrl);
          setIsRefreshing(false);
        }, 100);
      } else {
        console.error(`❌ Failed to update files:`, await response.text());
        setIsRefreshing(false);
      }
    } catch (error) {
      console.error("Error updating sandbox files:", error);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    // Simple iframe refresh - just reload the webpage
    setIsRefreshing(true);
    setIframeUrl("");
    setTimeout(() => {
      setIframeUrl(previewUrl);
      setIsRefreshing(false);
    }, 100);
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
              disabled={sandboxStatus !== "running" || isRefreshing}
              className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Refresh preview"
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
          {/* Show generating state when AI is creating files */}
          {isGeneratingFiles && sandboxStatus === "inactive" && (
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-neutral-600 dark:text-neutral-400 animate-pulse"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                  />
                </svg>
              </div>
              <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-1">
                AI is generating your code...
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Creating project files based on your description
              </p>
              <div className="mt-4 flex items-center justify-center gap-1">
                <span className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" />
                <span className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          )}

          {!isGeneratingFiles && sandboxStatus === "inactive" && (
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
                {isGeneratingFiles
                  ? "AI is generating your code..."
                  : Object.keys(projectFiles).length > 0
                  ? "Starting Preview..."
                  : "Waiting for code..."}
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {isGeneratingFiles
                  ? "Creating project files based on your description"
                  : Object.keys(projectFiles).length > 0
                  ? "Your Next.js preview will load automatically"
                  : "Start chatting to generate your project files"}
              </p>
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
                Setting up Next.js (this may take 20-30 seconds)...
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
                  onLoad={() => {
                    console.log("✅ Iframe loaded successfully!");
                  }}
                  onError={(e) => {
                    console.error("❌ Iframe error:", e);
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
