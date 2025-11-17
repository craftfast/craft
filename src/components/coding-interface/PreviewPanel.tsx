"use client";

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";
import {
  captureIframeScreenshot,
  uploadScreenshot,
} from "@/lib/utils/screenshot";

interface PreviewPanelProps {
  projectId: string;
  projectFiles?: Record<string, string>;
  isGeneratingFiles?: boolean; // New prop to indicate AI is generating files
  generationStatus?: string; // "template" | "generating" | "ready"
  version?: number; // Project version (0 = template, 1+ = has AI updates)
  previewImage?: string | null; // Existing preview image URL
  previewImageCapturedAtVersion?: number | null; // Version when preview image was last captured
  packages?: string[]; // Packages to install when creating/refreshing sandbox
  onPackagesInstalled?: () => void; // Callback when packages are installed
  onRefreshProject?: () => Promise<void>; // Callback to refresh project after version restore
  onScreenshotCaptured?: (data: {
    previewImage: string;
    previewImageCapturedAtVersion: number;
  }) => void; // Callback after screenshot upload
  deviceMode?: "desktop" | "mobile"; // Device mode from parent
  previewUrl?: string; // URL from parent
  onUrlChange?: (url: string) => void; // Callback when URL changes
}

export interface PreviewPanelRef {
  refresh: () => void;
  getPreviewUrl: () => string;
}

type SandboxStatus = "inactive" | "loading" | "running" | "error";

interface ProjectVersion {
  id: string;
  version: number;
  name: string | null;
  files: Record<string, string>;
  chatMessageId: string | null;
  isBookmarked: boolean;
  isPublished: boolean;
  createdAt: string;
}

const PreviewPanel = forwardRef<PreviewPanelRef, PreviewPanelProps>(
  (
    {
      projectId,
      projectFiles = {},
      isGeneratingFiles = false,
      generationStatus = "template",
      version = 0,
      previewImage: existingPreviewImage,
      previewImageCapturedAtVersion,
      packages = [],
      onPackagesInstalled,
      onRefreshProject,
      onScreenshotCaptured,
      deviceMode: parentDeviceMode,
      previewUrl: parentPreviewUrl,
      onUrlChange,
    },
    ref
  ) => {
    const [previewUrl, setPreviewUrl] = useState("");
    const [iframeUrl, setIframeUrl] = useState("");
    const [currentRoute, setCurrentRoute] = useState("/");
    const [inputRoute, setInputRoute] = useState("/");
    const [navigationHistory, setNavigationHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [sandboxStatus, setSandboxStatus] =
      useState<SandboxStatus>("inactive");
    const [error, setError] = useState<string | null>(null);
    const [deviceMode, setDeviceMode] = useState<
      "mobile" | "tablet" | "desktop"
    >("desktop");

    // Sync device mode with parent
    useEffect(() => {
      if (parentDeviceMode) {
        setDeviceMode(parentDeviceMode);
      }
    }, [parentDeviceMode]);

    // Sync preview URL with parent - navigate when Enter is pressed
    useEffect(() => {
      if (
        parentPreviewUrl !== undefined &&
        parentPreviewUrl !== currentRoute &&
        previewUrl
      ) {
        // Update iframe URL when parent changes the route
        let route = parentPreviewUrl;
        if (!route.startsWith("/")) {
          route = "/" + route;
        }
        const newUrl = previewUrl + route;
        setIframeUrl(newUrl);
        setCurrentRoute(route);
        setInputRoute(route);
      }
    }, [parentPreviewUrl, currentRoute, previewUrl]);

    const [loadingMessage, setLoadingMessage] = useState("Starting preview...");
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showVersionDropdown, setShowVersionDropdown] = useState(false);
    const [versions, setVersions] = useState<ProjectVersion[]>([]);
    const [isLoadingVersions, setIsLoadingVersions] = useState(false);
    const [restoringVersionId, setRestoringVersionId] = useState<string | null>(
      null
    );
    const dropdownRef = useRef<HTMLDivElement>(null);
    const iframeRef = useRef<HTMLIFrameElement>(null);

    // Capture screenshot when preview loads successfully
    // Only capture if: 1) No existing preview image, OR 2) Project version changed from last captured version
    const captureScreenshot = useCallback(async () => {
      if (!iframeRef.current || !previewUrl) {
        console.log("⏭️ Skipping screenshot - no iframe or preview URL");
        return;
      }

      const hasNoImage = !existingPreviewImage;

      // Compare current version with the version stored in database when image was captured
      // If capturedAtVersion is null, it means we have an image but never recorded the version - should recapture
      const versionChanged =
        version !== undefined &&
        (previewImageCapturedAtVersion === null ||
          version !== previewImageCapturedAtVersion);

      const shouldCapture = hasNoImage || versionChanged;

      if (!shouldCapture) {
        console.log(
          `⏭️ Skipping screenshot - hasImage: ${!hasNoImage}, currentVersion: ${version}, capturedAtVersion: ${previewImageCapturedAtVersion}`
        );
        return;
      }

      try {
        console.log(
          `📸 Capturing screenshot (reason: ${
            hasNoImage
              ? "no image"
              : `version changed (${previewImageCapturedAtVersion} → ${version})`
          })...`
        );

        // Wait a bit for the page to fully render
        await new Promise((resolve) => setTimeout(resolve, 3000));

        // Use server-side Puppeteer capture with the sandbox URL and current version
        const result = await uploadScreenshot(
          projectId,
          undefined,
          previewUrl,
          version
        );

        if (result.success) {
          console.log("✅ Screenshot uploaded:", result.previewImage);

          // Notify parent component to update project state with new preview data
          if (onScreenshotCaptured && result.previewImage) {
            onScreenshotCaptured({
              previewImage: result.previewImage,
              previewImageCapturedAtVersion: version ?? 0,
            });
          }
        } else {
          console.error("❌ Failed to upload screenshot:", result.error);
        }
      } catch (error) {
        // Screenshot capture failed
        console.warn(
          "⚠️ Screenshot capture failed:",
          error instanceof Error ? error.message : error
        );
      }
    }, [
      projectId,
      previewUrl,
      existingPreviewImage,
      version,
      previewImageCapturedAtVersion,
      onScreenshotCaptured,
    ]);

    // Utility function to format relative time
    const getRelativeTime = (dateString: string): string => {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffSeconds = Math.floor(diffMs / 1000);
      const diffMinutes = Math.floor(diffSeconds / 60);
      const diffHours = Math.floor(diffMinutes / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffSeconds < 60) {
        return diffSeconds === 1
          ? "1 second ago"
          : `${diffSeconds} seconds ago`;
      } else if (diffMinutes < 60) {
        return diffMinutes === 1
          ? "1 minute ago"
          : `${diffMinutes} minutes ago`;
      } else if (diffHours < 24) {
        return diffHours === 1 ? "1 hour ago" : `${diffHours} hours ago`;
      } else {
        return diffDays === 1 ? "1 day ago" : `${diffDays} days ago`;
      }
    };

    // Expose methods to parent via ref
    useImperativeHandle(ref, () => ({
      refresh: () => {
        handleRefresh();
      },
      getPreviewUrl: () => {
        return previewUrl + currentRoute;
      },
    }));

    // 🔄 NOTE: We do NOT delete/kill sandboxes on unmount
    // Sandboxes contain the source of truth for all code files.
    // E2B manages sandbox lifecycle automatically.
    // Database files are backup only for when sandboxes are unavailable.

    // 🔄 INITIALIZATION: On mount, check if project has files and auto-start preview
    // This handles page reloads where sandbox may have been paused
    const hasInitialized = useRef(false);

    useEffect(() => {
      const initializePreview = async () => {
        // Only run once on mount
        if (hasInitialized.current) return;

        // Wait a bit for props to load from parent
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Check if project has files (version > 0 means AI has generated code)
        if (
          version > 0 &&
          Object.keys(projectFiles).length > 0 &&
          sandboxStatus === "inactive"
        ) {
          console.log(
            `🔄 Initializing preview on mount (version: ${version}, ${
              Object.keys(projectFiles).length
            } files)`
          );
          hasInitialized.current = true;
          startSandbox();
        } else {
          console.log(
            `⏭️ Skipping auto-start on mount - no files yet or sandbox active`
          );
        }
      };

      initializePreview();
    }, [projectId]); // Only run when projectId changes (component mount)

    // Handle AI generation completion - auto-start OR auto-update preview
    // Use ref to track last processed version to avoid duplicate operations
    const lastProcessedVersionRef = useRef<number>(-1);

    useEffect(() => {
      console.log(`🔍 PreviewPanel effect triggered:`, {
        isGeneratingFiles,
        generationStatus,
        version,
        fileCount: Object.keys(projectFiles).length,
        sandboxStatus,
      });

      // Skip if we've already processed this version
      if (lastProcessedVersionRef.current === version) {
        console.log(`⏭️  Already processed version ${version}, skipping...`);
        return;
      }

      // Only auto-start when:
      // 1. AI has finished generating (isGeneratingFiles = false)
      // 2. Generation status is "ready" (not "template" or "generating")
      // 3. Version > 0 (has AI updates, not just template)
      // 4. There are files to preview
      // 5. Sandbox is not already running
      if (
        !isGeneratingFiles &&
        generationStatus === "ready" &&
        version > 0 &&
        Object.keys(projectFiles).length > 0 &&
        sandboxStatus === "inactive"
      ) {
        // First time AI generates/modifies code - auto-start preview
        console.log(
          `🚀 AI finished generating (status: ${generationStatus}, version: ${version}) - auto-starting preview with ${
            Object.keys(projectFiles).length
          } files...`
        );
        lastProcessedVersionRef.current = version;
        setTimeout(() => startSandbox(), 800);
      } else if (
        !isGeneratingFiles &&
        generationStatus === "ready" &&
        version > 0 &&
        sandboxStatus === "running" &&
        Object.keys(projectFiles).length > 0
      ) {
        // Preview already running - just update the files
        console.log(
          `📝 AI finished updating (version: ${version}) - refreshing preview with ${
            Object.keys(projectFiles).length
          } files...`
        );
        lastProcessedVersionRef.current = version;
        setTimeout(() => updateSandboxFiles(), 500);
      } else {
        console.log(`⏭️  Skipping preview update - conditions not met`);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
      isGeneratingFiles,
      generationStatus,
      version,
      projectFiles,
      sandboxStatus,
    ]);

    const startSandbox = async () => {
      // Prevent duplicate sandbox starts
      if (sandboxStatus === "loading" || sandboxStatus === "running") {
        console.log(`⏭️  Sandbox already ${sandboxStatus}, skipping start...`);
        return;
      }

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
          filesToSend = filesData.codeFiles || filesData.files || {};
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
          `📤 Sending ${
            Object.keys(filesToSend).length
          } files to sandbox API...`
        );

        setLoadingMessage("Setting up Next.js project...");

        const response = await fetch(`/api/sandbox/${projectId}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            files: filesToSend,
            packages: packages.length > 0 ? packages : undefined,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to start sandbox");
        }

        const data = await response.json();

        console.log("📦 Sandbox created:", data);
        console.log("🔗 Preview URL:", data.url);

        // Call callback if packages were installed
        if (data.depsInstalled && onPackagesInstalled) {
          console.log("✅ Dependencies installed, clearing pending packages");
          onPackagesInstalled();
        }

        // Log if there was an error installing dependencies (non-blocking)
        if (data.depsError) {
          console.warn(
            "⚠️ Failed to install some dependencies:",
            data.depsError
          );
        }

        // ✅ SIMPLIFIED: Just set the URL and show iframe immediately
        // Next.js will handle its own loading states in the browser
        console.log("🎉 Setting preview URL:", data.url);
        setPreviewUrl(data.url);
        setIframeUrl(data.url);
        setCurrentRoute("/");
        setInputRoute("/");
        setNavigationHistory(["/"]);
        setHistoryIndex(0);
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
          filesToUpdate =
            filesData.codeFiles || filesData.files || projectFiles;
          console.log(
            `📁 Fetched ${
              Object.keys(filesToUpdate).length
            } files from database`
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
            packages: packages.length > 0 ? packages : undefined,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          console.log(`✅ Files updated successfully`, data);

          // Call callback if packages were installed
          if (data.depsInstalled && onPackagesInstalled) {
            console.log("✅ Dependencies installed, clearing pending packages");
            onPackagesInstalled();
          }

          // Log if there was an error installing dependencies (non-blocking)
          if (data.depsError) {
            console.warn(
              "⚠️ Failed to install some dependencies:",
              data.depsError
            );
          }

          // ✅ NO RELOAD: Let Next.js HMR handle the updates automatically
          // The iframe stays connected, Next.js dev server detects file changes and hot-reloads
          console.log(`✅ Files updated - Next.js HMR will auto-refresh`);
          setIsRefreshing(false);
        } else {
          const errorText = await response.text();
          console.error(`❌ Failed to update files:`, errorText);

          // If sandbox timed out, try to recreate it
          if (
            errorText.includes("timeout") ||
            errorText.includes("not found")
          ) {
            console.log("� Sandbox closed to save costs, recreating...");
            setLoadingMessage("Restarting preview (was idle to save costs)...");
            setSandboxStatus("inactive");
            setIsRefreshing(false);
            // Trigger recreation
            setTimeout(() => startSandbox(), 1000);
          } else {
            setIsRefreshing(false);
          }
        }
      } catch (error) {
        console.error("Error updating sandbox files:", error);
        // Assume sandbox might be gone, try to recreate
        console.log("💰 Sandbox closed to save costs, recreating...");
        setLoadingMessage("Restarting preview (was idle to save costs)...");
        setSandboxStatus("inactive");
        setIsRefreshing(false);
      }
    };

    const handleRefresh = () => {
      // Simple iframe refresh - just reload the webpage
      setIsRefreshing(true);
      setIframeUrl("");
      setTimeout(() => {
        setIframeUrl(previewUrl + currentRoute);
        setIsRefreshing(false);
      }, 100);
    };

    const navigateToRoute = useCallback(
      (route: string) => {
        if (!route.startsWith("/")) {
          route = "/" + route;
        }
        const newUrl = previewUrl + route;
        setIframeUrl(newUrl);
        setCurrentRoute(route);
        setInputRoute(route);

        // Notify parent of URL change
        if (onUrlChange) {
          onUrlChange(route);
        }

        // Add to history
        const newHistory = navigationHistory.slice(0, historyIndex + 1);
        newHistory.push(route);
        setNavigationHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
      },
      [previewUrl, onUrlChange, navigationHistory, historyIndex]
    );

    const handleRouteSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (sandboxStatus === "running" && inputRoute) {
        navigateToRoute(inputRoute);
      }
    };

    const handleBack = () => {
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        const route = navigationHistory[newIndex];
        setHistoryIndex(newIndex);
        setCurrentRoute(route);
        setInputRoute(route);
        setIframeUrl(previewUrl + route);
      }
    };

    const handleForward = () => {
      if (historyIndex < navigationHistory.length - 1) {
        const newIndex = historyIndex + 1;
        const route = navigationHistory[newIndex];
        setHistoryIndex(newIndex);
        setCurrentRoute(route);
        setInputRoute(route);
        setIframeUrl(previewUrl + route);
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

    // Load versions when dropdown is opened
    const loadVersions = useCallback(async () => {
      if (versions.length > 0) return; // Already loaded
      try {
        setIsLoadingVersions(true);
        const response = await fetch(`/api/projects/${projectId}/versions`);
        if (response.ok) {
          const data = await response.json();
          setVersions(data.versions);
        }
      } catch (error) {
        console.error("Error loading versions:", error);
      } finally {
        setIsLoadingVersions(false);
      }
    }, [projectId, versions.length]);

    // Handle version dropdown toggle
    const handleVersionDropdownToggle = () => {
      if (!showVersionDropdown) {
        loadVersions();
      }
      setShowVersionDropdown(!showVersionDropdown);
    };

    // Handle version restore
    const handleRestoreVersion = async (
      versionId: string,
      versionNumber: number
    ) => {
      if (
        !confirm(
          `Restore to Version ${versionNumber}? Your current work will be saved as a new version before restoring.`
        )
      ) {
        return;
      }

      try {
        setRestoringVersionId(versionId);
        const response = await fetch(
          `/api/projects/${projectId}/versions/${versionId}/restore`,
          {
            method: "POST",
          }
        );

        if (response.ok) {
          console.log(`✅ Successfully restored to version ${versionNumber}`);
          // Reload versions
          setVersions([]);
          await loadVersions();
          // Refresh project files
          if (onRefreshProject) {
            await onRefreshProject();
          }
          // Close dropdown
          setShowVersionDropdown(false);
        } else {
          alert("Failed to restore version. Please try again.");
        }
      } catch (error) {
        console.error("Error restoring version:", error);
        alert("Failed to restore version. Please try again.");
      } finally {
        setRestoringVersionId(null);
      }
    };

    // Close dropdown when clicking outside
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          dropdownRef.current &&
          !dropdownRef.current.contains(event.target as Node)
        ) {
          setShowVersionDropdown(false);
        }
      };

      if (showVersionDropdown) {
        document.addEventListener("mousedown", handleClickOutside);
      }

      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, [showVersionDropdown]);

    return (
      <div
        className={`h-full flex flex-col bg-background ${
          isFullscreen ? "fixed inset-0 z-[60]" : ""
        }`}
      >
        {/* Preview Toolbar - Hidden since controls moved to main header */}
        {false && (
          <div className="h-12 border-b border-border flex items-center justify-between px-4">
            <div className="flex items-center gap-2 flex-1">
              {/* Navigation Controls */}
              <div className="flex items-center gap-1">
                <button
                  onClick={handleBack}
                  disabled={sandboxStatus !== "running" || historyIndex <= 0}
                  className="p-1.5 hover:bg-accent/10 rounded-full transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Go back"
                >
                  <svg
                    className="w-4 h-4 text-muted-foreground"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
                <button
                  onClick={handleForward}
                  disabled={
                    sandboxStatus !== "running" ||
                    historyIndex >= navigationHistory.length - 1
                  }
                  className="p-1.5 hover:bg-accent/10 rounded-full transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Go forward"
                >
                  <svg
                    className="w-4 h-4 text-muted-foreground"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
                <button
                  onClick={handleRefresh}
                  disabled={sandboxStatus !== "running" || isRefreshing}
                  className="p-1.5 hover:bg-accent/10 rounded-full transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Refresh preview"
                >
                  <svg
                    className={`w-4 h-4 text-muted-foreground ${
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

              {/* URL Bar */}
              <form
                onSubmit={handleRouteSubmit}
                className="flex-1 flex items-center gap-2 mx-2"
              >
                <input
                  type="text"
                  value={inputRoute}
                  onChange={(e) => setInputRoute(e.target.value)}
                  onBlur={() => setInputRoute(currentRoute)}
                  placeholder="Enter route (e.g., /about)"
                  disabled={sandboxStatus !== "running"}
                  className="flex-1 px-3 py-1 text-xs bg-muted border border-border rounded-full focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                  type="button"
                  onClick={() =>
                    previewUrl &&
                    window.open(previewUrl + currentRoute, "_blank")
                  }
                  disabled={sandboxStatus !== "running"}
                  className="p-1.5 hover:bg-accent/10 rounded-full transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Open in new tab"
                >
                  <svg
                    className="w-4 h-4 text-muted-foreground"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </button>
              </form>
            </div>
            <div className="flex items-center gap-1">
              {/* Version History Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={handleVersionDropdownToggle}
                  className="p-1.5 hover:bg-accent/10 rounded-full transition-colors"
                  title="Version History"
                >
                  <svg
                    className="w-4 h-4 text-muted-foreground"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {showVersionDropdown && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-popover border border-border rounded-xl shadow-lg z-50 max-h-96 overflow-hidden flex flex-col">
                    <div className="overflow-y-auto flex-1">
                      {isLoadingVersions ? (
                        <div className="p-6 text-center">
                          <div className="inline-block w-5 h-5 border-2 border-neutral-300 dark:border-neutral-600 border-t-neutral-900 dark:border-t-neutral-100 rounded-full animate-spin"></div>
                        </div>
                      ) : versions.length === 0 ? (
                        <div className="p-6 text-center">
                          <p className="text-sm text-muted-foreground">
                            No versions yet
                          </p>
                        </div>
                      ) : (
                        <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                          {versions.map((v) => (
                            <button
                              key={v.id}
                              onClick={() => {
                                if (v.version !== version) {
                                  handleRestoreVersion(v.id, v.version);
                                }
                              }}
                              disabled={
                                restoringVersionId === v.id ||
                                v.version === version
                              }
                              className={`w-full p-3 text-left transition-colors disabled:cursor-default ${
                                v.version === version
                                  ? "bg-muted"
                                  : "hover:bg-accent/5"
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-sm font-medium text-foreground">
                                      Version {v.version}
                                    </span>
                                    {v.version === version && (
                                      <span className="px-1.5 py-0.5 text-[10px] font-medium bg-primary text-primary-foreground rounded-full">
                                        Current
                                      </span>
                                    )}
                                    {v.isPublished && (
                                      <span className="px-1.5 py-0.5 text-[10px] font-medium bg-neutral-700 dark:bg-neutral-300 text-primary-foreground rounded-full">
                                        Published
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-muted-foreground">
                                    {getRelativeTime(v.createdAt)}
                                  </p>
                                </div>
                                {restoringVersionId === v.id && (
                                  <div className="w-4 h-4 border-2 border-neutral-400 border-t-transparent rounded-full animate-spin flex-shrink-0"></div>
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => {
                  const modes: Array<"mobile" | "tablet" | "desktop"> = [
                    "desktop",
                    "tablet",
                    "mobile",
                  ];
                  const currentIndex = modes.indexOf(deviceMode);
                  const nextIndex = (currentIndex + 1) % modes.length;
                  setDeviceMode(modes[nextIndex]);
                }}
                className="p-1.5 hover:bg-accent/10 rounded-full transition-colors"
                title={`Current: ${
                  deviceMode.charAt(0).toUpperCase() + deviceMode.slice(1)
                } - Click to switch`}
              >
                {deviceMode === "mobile" && (
                  <svg
                    className="w-4 h-4 text-muted-foreground"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                  </svg>
                )}
                {deviceMode === "tablet" && (
                  <svg
                    className="w-4 h-4 text-muted-foreground"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                  </svg>
                )}
                {deviceMode === "desktop" && (
                  <svg
                    className="w-4 h-4 text-muted-foreground"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                )}
              </button>
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-1.5 hover:bg-accent/10 rounded-full transition-colors"
                title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              >
                {isFullscreen ? (
                  <svg
                    className="w-4 h-4 text-muted-foreground"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M15 9h4.5M15 9V4.5M15 9l5.25-5.25M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-4 h-4 text-muted-foreground"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Preview Frame */}
        <div className="flex-1 bg-background overflow-auto">
          <div className="h-full flex items-center justify-center">
            {/* Show state when preview is not running */}
            {sandboxStatus === "inactive" && (
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                  {isGeneratingFiles ? (
                    <svg
                      className="w-8 h-8 text-muted-foreground animate-pulse"
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
                  ) : (
                    <svg
                      className="w-8 h-8 text-muted-foreground"
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
                  )}
                </div>
                <h3 className="text-sm font-medium text-foreground mb-1">
                  {isGeneratingFiles
                    ? "AI is generating your code..."
                    : version > 0
                    ? "Ready to preview"
                    : "No code generated yet"}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {isGeneratingFiles
                    ? "Preview will start automatically when complete"
                    : version > 0
                    ? "Click 'Start Preview' to view your project"
                    : "Start chatting to generate your project"}
                </p>
                {isGeneratingFiles && (
                  <div className="mt-4 flex items-center justify-center gap-1">
                    <span className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" />
                    <span className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                )}
                {!isGeneratingFiles && version > 0 && (
                  <button
                    onClick={startSandbox}
                    className="mt-4 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-full hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
                  >
                    Start Preview
                  </button>
                )}
              </div>
            )}

            {sandboxStatus === "loading" && (
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-muted-foreground animate-spin"
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
                <h3 className="text-sm font-medium text-foreground mb-1">
                  {loadingMessage}
                </h3>
                <p className="text-xs text-muted-foreground">
                  Setting up Next.js (this may take 20-30 seconds)...
                </p>
              </div>
            )}

            {sandboxStatus === "error" && (
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-neutral-700 dark:text-neutral-300"
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
                <h3 className="text-sm font-medium text-foreground mb-1">
                  Preview Failed
                </h3>
                <p className="text-xs text-muted-foreground mb-4">
                  {error || "Something went wrong"}
                </p>
                <button
                  onClick={startSandbox}
                  className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-full hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
                >
                  Try Again
                </button>
              </div>
            )}

            {sandboxStatus === "running" && iframeUrl && (
              <div
                className="h-full bg-background transition-all duration-300 mx-auto"
                style={{ width: getDeviceWidth() }}
              >
                <div className="relative h-full border-l border-r border-border">
                  <iframe
                    ref={iframeRef}
                    src={iframeUrl}
                    className="w-full h-full border-none"
                    title="Preview"
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
                    onLoad={() => {
                      console.log("✅ Iframe loaded successfully!");
                      // Capture screenshot on first successful load
                      captureScreenshot();
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
);

PreviewPanel.displayName = "PreviewPanel";

export default PreviewPanel;
