"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  History,
  Edit,
  Copy,
  Download,
  Eye,
  Globe,
  Link2,
  Lock,
  ChevronRight,
  Code2,
  Monitor,
  Settings,
  ExternalLink,
  RotateCw,
  Smartphone,
  Maximize,
  Minimize,
} from "lucide-react";
import Logo from "./Logo";
import UserMenu from "./UserMenu";
import TokenCounter from "./TokenCounter";
import PricingModal from "./PricingModal";
import ChatPanel from "./coding-interface/ChatPanel";
import PreviewPanel from "./coding-interface/PreviewPanel";
import CodeEditor from "./coding-interface/CodeEditor";
import DatabasePanel from "./coding-interface/DatabasePanel";
import AnalyticsPanel from "./coding-interface/AnalyticsPanel";
import LogsPanel from "./coding-interface/LogsPanel";
import ApiPanel from "./coding-interface/ApiPanel";
import SettingsPanel from "./coding-interface/SettingsPanel";
import AuthPanel from "./coding-interface/AuthPanel";

type TabType =
  | "preview"
  | "code"
  | "database"
  | "analytics"
  | "logs"
  | "api"
  | "settings"
  | "auth";

interface Project {
  id: string;
  name: string;
  description: string | null;
  version?: number; // v0 = template, v1+ = AI updates
  generationStatus?: string; // "template" | "generating" | "ready"
  lastCodeUpdateAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface User {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

interface CodingInterfaceProps {
  project: Project;
  user: User;
  planName: string;
}
export default function CodingInterface({
  project: initialProject,
  user,
  planName,
}: CodingInterfaceProps) {
  const router = useRouter();

  console.log("🎨 CodingInterface received planName:", planName);
  const [activeTab, setActiveTab] = useState<TabType>("preview");
  const [project, setProject] = useState(initialProject);
  const [projectFiles, setProjectFiles] = useState<Record<string, string>>({});
  const [isGeneratingFiles, setIsGeneratingFiles] = useState(false); // Track AI file generation
  const [isProjectMenuOpen, setIsProjectMenuOpen] = useState(false);
  const [isViewMenuOpen, setIsViewMenuOpen] = useState(false);
  const [isVisibilitySubmenuOpen, setIsVisibilitySubmenuOpen] = useState(false);
  const [projectVisibility, setProjectVisibility] = useState<
    "public" | "secret" | "private"
  >("private");
  const [previewUrl, setPreviewUrl] = useState("/");
  const [deviceMode, setDeviceMode] = useState<"desktop" | "mobile">("desktop");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const projectMenuRef = useRef<HTMLDivElement>(null);
  const viewMenuRef = useRef<HTMLDivElement>(null);
  const [streamingFiles, setStreamingFiles] = useState<Record<string, string>>(
    {}
  ); // Files being generated in real-time
  const [pendingPackages, setPendingPackages] = useState<string[]>([]); // Packages to install on next preview
  const chatWidth = 30; // Fixed at 30%

  // Auto-switch to code tab when AI starts generating files
  useEffect(() => {
    if (isGeneratingFiles) {
      setActiveTab("code");
    }
  }, [isGeneratingFiles]);

  // Close project menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        projectMenuRef.current &&
        !projectMenuRef.current.contains(event.target as Node)
      ) {
        setIsProjectMenuOpen(false);
      }
      if (
        viewMenuRef.current &&
        !viewMenuRef.current.contains(event.target as Node)
      ) {
        setIsViewMenuOpen(false);
      }
    };

    if (isProjectMenuOpen || isViewMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isProjectMenuOpen, isViewMenuOpen]);

  // Handle ESC key to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isFullscreen]);

  console.log(
    `🎯 CodingInterface mounted with project: "${project.name}" (ID: ${project.id})`
  );

  // Load existing project files on mount
  useEffect(() => {
    const loadProjectFiles = async () => {
      try {
        const response = await fetch(`/api/files?projectId=${project.id}`);
        if (response.ok) {
          const data = await response.json();
          const loadedFiles = data.codeFiles || data.files || {};
          setProjectFiles(loadedFiles);
          console.log(
            `📁 Loaded ${Object.keys(loadedFiles).length} files for project`
          );
          if (Object.keys(loadedFiles).length > 0) {
            console.log(`📋 Files loaded:`, Object.keys(loadedFiles));
          }
        }
      } catch (error) {
        console.error("Error loading project files:", error);
      }
    };

    loadProjectFiles();
  }, [project.id]);

  // Function to refresh project data
  const refreshProject = async () => {
    try {
      const response = await fetch(`/api/projects/${project.id}`);
      if (response.ok) {
        const data = await response.json();
        setProject(data.project);
        return data.project;
      }
    } catch (error) {
      console.error("Error refreshing project:", error);
    }
    return null;
  };

  // Function to handle files created from chat
  const handleFilesCreated = async (
    files: { path: string; content: string }[],
    packages?: string[]
  ) => {
    console.log(`📝 Handling ${files.length} files created from chat...`);

    // Store packages if provided
    if (packages && packages.length > 0) {
      console.log(
        `📦 Storing ${
          packages.length
        } packages for next preview: ${packages.join(", ")}`
      );
      setPendingPackages(packages);
    }

    // Update local state with new files
    const newFiles: Record<string, string> = { ...projectFiles };
    files.forEach((file) => {
      newFiles[file.path] = file.content;
    });
    setProjectFiles(newFiles);

    // Clear streaming files after they're saved
    setStreamingFiles({});

    console.log(`📋 Total files in state:`, Object.keys(newFiles).length);

    // Refresh project to get updated generationStatus from database
    const updatedProject = await refreshProject();

    if (updatedProject) {
      console.log(
        `🔄 Project refreshed, generationStatus: ${updatedProject.generationStatus}`
      );
    }

    // Switch to preview tab to show the new files
    setActiveTab("preview");
  };

  // Function to handle streaming files (files being generated in real-time)
  // Use ref to avoid creating new function references that cause re-renders
  const streamingFilesRef = useRef<Record<string, string>>({});
  const streamingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleStreamingFiles = useCallback((files: Record<string, string>) => {
    // Merge new files with existing streaming files
    streamingFilesRef.current = { ...streamingFilesRef.current, ...files };

    // Debounce state updates to reduce re-renders
    if (streamingTimeoutRef.current) {
      clearTimeout(streamingTimeoutRef.current);
    }

    streamingTimeoutRef.current = setTimeout(() => {
      setStreamingFiles(streamingFilesRef.current);
    }, 50); // Update every 50ms max
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (streamingTimeoutRef.current) {
        clearTimeout(streamingTimeoutRef.current);
      }
    };
  }, []);

  // Function to handle file clicks from FileChangesCard
  const handleFileClick = (filePath: string) => {
    // Switch to code tab and pass the file path to CodeEditor
    setActiveTab("code");
    // Trigger file selection in CodeEditor by setting a ref or state
    // We'll use a callback ref pattern through CodeEditor props
    setSelectedFileFromChat(filePath);
  };

  const [selectedFileFromChat, setSelectedFileFromChat] = useState<
    string | null
  >(null);

  const allViews = [
    {
      id: "preview" as const,
      label: "Preview",
      icon: Eye,
    },
    {
      id: "code" as const,
      label: "Code",
      icon: Code2,
    },
    {
      id: "database" as const,
      label: "Database",
      svg: (
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
          />
        </svg>
      ),
    },
    {
      id: "analytics" as const,
      label: "Analytics",
      svg: (
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
    },
    {
      id: "logs" as const,
      label: "Logs",
      svg: (
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      ),
    },
    {
      id: "api" as const,
      label: "API",
      svg: (
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      ),
    },
    {
      id: "settings" as const,
      label: "Settings",
      svg: (
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      ),
    },
    {
      id: "auth" as const,
      label: "Auth",
      svg: (
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
      ),
    },
  ];

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-neutral-50 dark:bg-neutral-950">
      {/* Header */}
      <header className="h-12 bg-white dark:bg-neutral-900 grid grid-cols-3 items-center px-4 flex-shrink-0">
        {/* Left Side - Logo and Project Name */}
        <div className="flex items-center justify-start">
          <button
            onClick={() => router.push("/dashboard")}
            className="hover:opacity-70 transition-opacity flex-shrink-0 flex items-center"
          >
            <Logo
              variant="extended"
              className="text-neutral-900 dark:text-neutral-100 !h-5"
            />
          </button>
          <div className="h-6 w-px bg-neutral-200 dark:bg-neutral-700 flex-shrink-0 mx-1 ml-3" />

          {/* Project Name with Dropdown */}
          <div className="relative" ref={projectMenuRef}>
            <button
              onClick={() => setIsProjectMenuOpen(!isProjectMenuOpen)}
              className="flex items-center gap-2 px-2 py-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
            >
              <h1 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate max-w-[200px]">
                {project.name}
              </h1>
              {/* Visibility Icon */}
              {projectVisibility === "private" && (
                <Lock className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400 flex-shrink-0" />
              )}
              {projectVisibility === "secret" && (
                <Link2 className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400 flex-shrink-0" />
              )}
              {projectVisibility === "public" && (
                <Globe className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400 flex-shrink-0" />
              )}
              <ChevronDown
                className={`w-4 h-4 text-neutral-600 dark:text-neutral-400 flex-shrink-0 transition-transform ${
                  isProjectMenuOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Dropdown Menu */}
            {isProjectMenuOpen && (
              <div className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-lg z-50 py-1">
                <button
                  onClick={() => {
                    setIsProjectMenuOpen(false);
                    // TODO: Implement version history
                  }}
                  className="w-full px-4 py-2.5 text-left text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors flex items-center gap-3"
                >
                  <History className="w-4 h-4" />
                  <span>Version history</span>
                </button>

                <button
                  onClick={() => {
                    setIsProjectMenuOpen(false);
                    // TODO: Implement rename
                  }}
                  className="w-full px-4 py-2.5 text-left text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors flex items-center gap-3"
                >
                  <Edit className="w-4 h-4" />
                  <span>Rename...</span>
                </button>

                <button
                  onClick={() => {
                    setIsProjectMenuOpen(false);
                    // TODO: Implement duplicate
                  }}
                  className="w-full px-4 py-2.5 text-left text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors flex items-center gap-3"
                >
                  <Copy className="w-4 h-4" />
                  <span>Duplicate</span>
                </button>

                <button
                  onClick={() => {
                    setIsProjectMenuOpen(false);
                    // TODO: Implement export
                  }}
                  className="w-full px-4 py-2.5 text-left text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors flex items-center gap-3"
                >
                  <Download className="w-4 h-4" />
                  <span>Export</span>
                </button>

                <div className="border-t border-neutral-200 dark:border-neutral-800 my-1" />

                <div className="relative">
                  <button
                    onMouseEnter={() => setIsVisibilitySubmenuOpen(true)}
                    onMouseLeave={() => setIsVisibilitySubmenuOpen(false)}
                    onClick={() =>
                      setIsVisibilitySubmenuOpen(!isVisibilitySubmenuOpen)
                    }
                    className="w-full px-4 py-2.5 text-left text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors flex items-center gap-3"
                  >
                    <Eye className="w-4 h-4" />
                    <div className="flex-1 flex items-center justify-between">
                      <span>Visibility</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-neutral-500 dark:text-neutral-400 capitalize">
                          {projectVisibility}
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
                      </div>
                    </div>
                  </button>

                  {/* Visibility Submenu */}
                  {isVisibilitySubmenuOpen && (
                    <div
                      onMouseEnter={() => setIsVisibilitySubmenuOpen(true)}
                      onMouseLeave={() => setIsVisibilitySubmenuOpen(false)}
                      className="absolute left-full top-0 ml-1 w-64 bg-neutral-800 dark:bg-neutral-900 border border-neutral-700 dark:border-neutral-800 rounded-xl shadow-xl z-50 py-1"
                    >
                      <button
                        onClick={() => {
                          setProjectVisibility("public");
                          setIsVisibilitySubmenuOpen(false);
                          setIsProjectMenuOpen(false);
                          // TODO: Update project visibility to public
                        }}
                        className="w-full px-4 py-2.5 text-left hover:bg-neutral-700 dark:hover:bg-neutral-800 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Globe className="w-4 h-4 text-neutral-300 dark:text-neutral-400" />
                          <div className="flex-1">
                            <div className="text-sm font-medium text-neutral-100 dark:text-neutral-200">
                              Public
                            </div>
                            <div className="text-xs text-neutral-400 dark:text-neutral-500">
                              Everyone can view
                            </div>
                          </div>
                        </div>
                      </button>

                      <button
                        onClick={() => {
                          setProjectVisibility("secret");
                          setIsVisibilitySubmenuOpen(false);
                          setIsProjectMenuOpen(false);
                          // TODO: Update project visibility to secret
                        }}
                        className="w-full px-4 py-2.5 text-left hover:bg-neutral-700 dark:hover:bg-neutral-800 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Link2 className="w-4 h-4 text-neutral-300 dark:text-neutral-400" />
                          <div className="flex-1">
                            <div className="text-sm font-medium text-neutral-100 dark:text-neutral-200">
                              Secret
                            </div>
                            <div className="text-xs text-neutral-400 dark:text-neutral-500">
                              Accessible via shared URL
                            </div>
                          </div>
                        </div>
                      </button>

                      <button
                        onClick={() => {
                          setProjectVisibility("private");
                          setIsVisibilitySubmenuOpen(false);
                          setIsProjectMenuOpen(false);
                          // TODO: Update project visibility to private
                        }}
                        className="w-full px-4 py-2.5 text-left hover:bg-neutral-700 dark:hover:bg-neutral-800 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Lock className="w-4 h-4 text-neutral-300 dark:text-neutral-400" />
                          <div className="flex-1">
                            <div className="text-sm font-medium text-neutral-100 dark:text-neutral-200">
                              Private
                            </div>
                            <div className="text-xs text-neutral-400 dark:text-neutral-500">
                              Only owner can access
                            </div>
                          </div>
                        </div>
                      </button>
                    </div>
                  )}
                </div>

                <div className="border-t border-neutral-200 dark:border-neutral-800 my-1" />

                <button
                  onClick={() => {
                    setIsProjectMenuOpen(false);
                    // TODO: Implement share
                  }}
                  className="w-full px-4 py-2.5 text-left text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors flex items-center gap-3"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                    />
                  </svg>
                  <span>Share</span>
                </button>

                <button
                  onClick={() => {
                    setIsProjectMenuOpen(false);
                    // TODO: Implement deploy
                  }}
                  className="w-full px-4 py-2.5 text-left text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors flex items-center gap-3"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  <span>Deploy</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Center - URL Bar with View Switcher */}
        <div className="flex items-center justify-center px-8">
          {/* URL Bar - Always visible */}
          <div className="flex items-center gap-2 max-w-xl w-full">
            <div className="flex-1 flex items-center gap-2 bg-neutral-100 dark:bg-neutral-800 rounded-lg px-3 py-1.5">
              {/* View Switcher - Left side of URL bar */}
              <div className="relative flex-shrink-0" ref={viewMenuRef}>
                <button
                  onClick={() => setIsViewMenuOpen(!isViewMenuOpen)}
                  className="px-2 py-1 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded transition-colors flex items-center gap-1.5"
                >
                  {/* Show current view icon */}
                  {allViews.find((view) => view.id === activeTab)?.icon && (
                    <>
                      {(() => {
                        const Icon = allViews.find(
                          (view) => view.id === activeTab
                        )?.icon;
                        return Icon ? <Icon className="w-3 h-3" /> : null;
                      })()}
                    </>
                  )}
                  {allViews.find((view) => view.id === activeTab)?.svg && (
                    <div className="w-3 h-3">
                      {allViews.find((view) => view.id === activeTab)?.svg}
                    </div>
                  )}
                  <span className="text-xs">
                    {allViews.find((view) => view.id === activeTab)?.label ||
                      "View"}
                  </span>
                  <ChevronDown
                    className={`w-3 h-3 transition-transform ${
                      isViewMenuOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {isViewMenuOpen && (
                  <div className="absolute top-full left-0 mt-1 w-40 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-lg z-50 py-1">
                    {allViews.map((view, index) => (
                      <div key={view.id}>
                        {index === 2 && (
                          <div className="border-t border-neutral-200 dark:border-neutral-800 my-1" />
                        )}
                        <button
                          onClick={() => {
                            setActiveTab(view.id);
                            setIsViewMenuOpen(false);
                          }}
                          className={`w-full px-3 py-2 text-left text-xs hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors flex items-center gap-2 ${
                            activeTab === view.id
                              ? "text-neutral-900 dark:text-neutral-100 font-medium"
                              : "text-neutral-700 dark:text-neutral-300"
                          }`}
                        >
                          {view.icon && <view.icon className="w-3.5 h-3.5" />}
                          {view.svg && (
                            <div className="w-3.5 h-3.5">{view.svg}</div>
                          )}
                          <span>{view.label}</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Separator */}
              <div className="h-4 w-px bg-neutral-200 dark:bg-neutral-700 flex-shrink-0" />

              <input
                type="text"
                value={previewUrl}
                onChange={(e) => setPreviewUrl(e.target.value)}
                placeholder="/"
                disabled={activeTab !== "preview"}
                className="flex-1 bg-transparent text-xs text-neutral-900 dark:text-neutral-100 outline-none min-w-0 disabled:opacity-50 disabled:cursor-not-allowed"
              />

              {/* Preview Controls - Inside URL Bar */}
              <div className="flex items-center gap-0.5 border-l border-neutral-200 dark:border-neutral-700 pl-2">
                <button
                  onClick={() => {
                    /* TODO: Implement reload */
                  }}
                  disabled={activeTab !== "preview"}
                  className="p-1 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                  title="Reload"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => {
                    /* TODO: Implement open in new tab */
                  }}
                  disabled={activeTab !== "preview"}
                  className="p-1 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                  title="Open in new tab"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => {
                    setDeviceMode(
                      deviceMode === "desktop" ? "mobile" : "desktop"
                    );
                  }}
                  disabled={activeTab !== "preview"}
                  className="p-1 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                  title={`Current: ${
                    deviceMode.charAt(0).toUpperCase() + deviceMode.slice(1)
                  } - Click to switch`}
                >
                  {deviceMode === "desktop" ? (
                    <Monitor className="w-3.5 h-3.5" />
                  ) : (
                    <Smartphone className="w-3.5 h-3.5" />
                  )}
                </button>

                <button
                  onClick={() => {
                    setIsFullscreen(!isFullscreen);
                  }}
                  className="p-1 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded transition-colors"
                  title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
                >
                  {isFullscreen ? (
                    <Minimize className="w-3.5 h-3.5" />
                  ) : (
                    <Maximize className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Spacer removed - URL bar always visible */}
        </div>

        {/* Right Side - Token Counter and User Profile */}
        <div className="flex items-center justify-end gap-2">
          {/* Token Counter */}
          <TokenCounter onClickAction={() => setIsPricingModalOpen(true)} />

          {/* User Profile Menu */}
          {user && <UserMenu user={user} />}
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat Panel - Left Side - Hide in fullscreen */}
        {!isFullscreen && (
          <div
            className="flex overflow-hidden bg-white dark:bg-neutral-900"
            style={{ width: `${chatWidth}%` }}
          >
            {/* Chat Panel - Always Mounted */}
            <div className="flex-1 overflow-hidden">
              <ChatPanel
                projectId={project.id}
                projectDescription={project.description}
                projectVersion={project.version}
                projectFiles={projectFiles}
                onFilesCreated={handleFilesCreated}
                onStreamingFiles={handleStreamingFiles}
                onGeneratingStatusChange={setIsGeneratingFiles}
                onFileClick={handleFileClick}
              />
            </div>
          </div>
        )}

        {/* Right Side - Content Panel */}
        <div className="flex-1 flex overflow-hidden bg-white dark:bg-neutral-900 px-2 pb-2">
          <div className="flex-1 flex overflow-hidden">
            {/* Main Panel */}
            <main className="flex-1 overflow-hidden bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl relative">
              {/* Keep PreviewPanel mounted to maintain sandbox across tab switches */}
              <div className={activeTab === "preview" ? "h-full" : "hidden"}>
                <PreviewPanel
                  projectId={project.id}
                  projectFiles={projectFiles}
                  isGeneratingFiles={isGeneratingFiles}
                  generationStatus={project.generationStatus}
                  version={project.version}
                  packages={pendingPackages}
                  onPackagesInstalled={() => setPendingPackages([])}
                  deviceMode={deviceMode}
                  previewUrl={previewUrl}
                  onRefreshProject={async () => {
                    // Reload project files after restore
                    const response = await fetch(
                      `/api/files?projectId=${project.id}`
                    );
                    if (response.ok) {
                      const data = await response.json();
                      setProjectFiles(data.codeFiles || data.files || {});
                    }
                    // Refresh project data
                    await refreshProject();
                  }}
                />
              </div>

              {activeTab === "code" && (
                <CodeEditor
                  projectId={project.id}
                  projectFiles={projectFiles}
                  streamingFiles={streamingFiles}
                  isGenerating={isGeneratingFiles}
                  onFileClick={handleFileClick}
                  selectedFileFromChat={selectedFileFromChat}
                  onFileSelected={() => setSelectedFileFromChat(null)}
                />
              )}

              {activeTab === "database" && (
                <div className="h-full overflow-auto p-6">
                  <DatabasePanel projectId={project.id} />
                </div>
              )}

              {activeTab === "analytics" && (
                <div className="h-full overflow-auto p-6">
                  <AnalyticsPanel projectId={project.id} />
                </div>
              )}

              {activeTab === "logs" && (
                <div className="h-full overflow-auto p-6">
                  <LogsPanel projectId={project.id} />
                </div>
              )}

              {activeTab === "api" && (
                <div className="h-full overflow-auto p-6">
                  <ApiPanel projectId={project.id} />
                </div>
              )}

              {activeTab === "settings" && (
                <div className="h-full overflow-auto p-6">
                  <SettingsPanel
                    projectId={project.id}
                    onProjectUpdate={refreshProject}
                  />
                </div>
              )}

              {activeTab === "auth" && (
                <div className="h-full overflow-auto p-6">
                  <AuthPanel projectId={project.id} />
                </div>
              )}
            </main>
          </div>
        </div>
      </div>

      {/* Pricing Modal */}
      <PricingModal
        isOpen={isPricingModalOpen}
        onClose={() => setIsPricingModalOpen(false)}
        currentPlan={planName}
        showTokensOnly={true}
      />
    </div>
  );
}
