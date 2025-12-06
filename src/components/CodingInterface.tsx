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
  Lock,
  Code2,
  Monitor,
  Settings,
  ExternalLink,
  RotateCw,
  Smartphone,
  Maximize,
  Minimize,
  Github,
  GitBranch,
} from "lucide-react";
import AppHeader from "./AppHeader";
import SidebarLayout from "./SidebarLayout";
import ChatPanel from "./coding-interface/ChatPanel";
import PreviewPanel, { PreviewPanelRef } from "./coding-interface/PreviewPanel";
import CodeEditor from "./coding-interface/CodeEditor";
import DeploymentDialog from "./coding-interface/DeploymentDialog";
import GitHubSyncDialog from "./coding-interface/GitHubSyncDialog";
import DatabaseConnectionDialog from "./coding-interface/DatabaseConnectionDialog";
import ProjectSettingsDialog from "./coding-interface/ProjectSettingsDialog";
import { useSandboxHeartbeat } from "@/hooks/useSandboxHeartbeat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useChatPosition } from "@/contexts/ChatPositionContext";

type TabType = "preview" | "code" | string;

interface Project {
  id: string;
  name: string;
  description: string | null;
  version?: number; // v0 = template, v1+ = AI updates
  generationStatus?: string; // "template" | "generating" | "ready"
  previewImage?: string | null; // Screenshot/preview image URL
  previewImageCapturedAtVersion?: number | null; // Version when preview image was captured
  lastCodeUpdateAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface User {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  enableCodeExecution?: boolean;
}

interface CodingInterfaceProps {
  project: Project;
  user: User;
}

interface CustomView {
  id: string;
  label: string;
  type: string;
  enabled: boolean;
  order: number;
}

export default function CodingInterface({
  project: initialProject,
  user,
}: CodingInterfaceProps) {
  return (
    <SidebarLayout>
      <CodingInterfaceContent project={initialProject} user={user} />
    </SidebarLayout>
  );
}

function CodingInterfaceContent({
  project: initialProject,
  user,
}: CodingInterfaceProps) {
  const router = useRouter();

  // Keep sandbox alive while user has project page open
  useSandboxHeartbeat(initialProject.id);

  const [activeTab, setActiveTab] = useState<TabType>("preview");
  const [project, setProject] = useState(initialProject);
  const [customViews, setCustomViews] = useState<CustomView[]>([]);
  const [projectFiles, setProjectFiles] = useState<Record<string, string>>({});
  const [isGeneratingFiles, setIsGeneratingFiles] = useState(false); // Track AI file generation
  const [isViewMenuOpen, setIsViewMenuOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("/");
  const [deviceMode, setDeviceMode] = useState<"desktop" | "mobile">("desktop");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [streamingFiles, setStreamingFiles] = useState<Record<string, string>>(
    {}
  ); // Files being generated in real-time
  const [pendingPackages, setPendingPackages] = useState<string[]>([]); // Packages to install on next preview
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [isVersionHistoryOpen, setIsVersionHistoryOpen] = useState(false);
  const [versions, setVersions] = useState<
    Array<{
      id: string;
      timestamp: string;
      description?: string;
      version?: number;
      name?: string;
      isBookmarked?: boolean;
      createdAt?: string;
    }>
  >([]);
  const [isLoadingVersions, setIsLoadingVersions] = useState(false);
  const [isDeployDialogOpen, setIsDeployDialogOpen] = useState(false);
  const [isSyncGitDialogOpen, setIsSyncGitDialogOpen] = useState(false);
  const [isDatabaseDialogOpen, setIsDatabaseDialogOpen] = useState(false);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const chatWidth = 30; // Fixed at 30%

  // Load custom views from project settings
  useEffect(() => {
    const loadCustomViews = async () => {
      try {
        const response = await fetch(
          `/api/projects/${initialProject.id}/settings`
        );
        if (response.ok) {
          const data = await response.json();
          if (data.customViews) {
            setCustomViews(data.customViews);
          }
        }
      } catch (error) {
        console.error("Failed to load custom views:", error);
      }
    };
    loadCustomViews();
  }, [initialProject.id]);

  // Auto-switch to code tab when AI starts generating files
  useEffect(() => {
    if (isGeneratingFiles) {
      setActiveTab("code");
    }
  }, [isGeneratingFiles]);

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

  // Function to refresh project files from backend
  const refreshProjectFiles = useCallback(async () => {
    try {
      const response = await fetch(`/api/files?projectId=${project.id}`);
      if (response.ok) {
        const data = await response.json();
        const loadedFiles = data.codeFiles || data.files || {};
        setProjectFiles(loadedFiles);
        console.log(
          `🔄 Refreshed ${Object.keys(loadedFiles).length} files for project`
        );
      }
    } catch (error) {
      console.error("Error refreshing project files:", error);
    }
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

  // Function to handle project rename
  const handleRenameProject = async () => {
    if (!newProjectName.trim() || newProjectName.trim() === project.name) {
      setIsRenameDialogOpen(false);
      return;
    }

    setIsRenaming(true);
    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: newProjectName.trim() }),
      });

      if (response.ok) {
        const data = await response.json();
        setProject(data.project);
        setIsRenameDialogOpen(false);
        setNewProjectName("");
      } else {
        console.error("Failed to rename project");
      }
    } catch (error) {
      console.error("Error renaming project:", error);
    } finally {
      setIsRenaming(false);
    }
  };

  // Function to handle project duplication
  const handleDuplicateProject = async () => {
    setIsDuplicating(true);
    try {
      const response = await fetch(`/api/projects/${project.id}/duplicate`, {
        method: "POST",
      });

      if (response.ok) {
        const data = await response.json();
        // Redirect to the duplicated project
        router.push(`/project/${data.project.id}`);
      } else {
        console.error("Failed to duplicate project");
      }
    } catch (error) {
      console.error("Error duplicating project:", error);
    } finally {
      setIsDuplicating(false);
    }
  };

  // Function to handle project export
  const handleExportProject = () => {
    // Create a simple text representation of the project files
    let exportContent = `# ${project.name}\n\n`;
    if (project.description) {
      exportContent += `${project.description}\n\n`;
    }
    exportContent += `## Files\n\n`;

    // Add each file with its content
    Object.entries(projectFiles).forEach(([path, content]) => {
      exportContent += `### ${path}\n\`\`\`\n${content}\n\`\`\`\n\n`;
    });

    // Create a blob and download it
    const blob = new Blob([exportContent], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project.name.replace(/[^a-z0-9]/gi, "-")}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Function to load version history
  const loadVersionHistory = async () => {
    setIsLoadingVersions(true);
    try {
      const response = await fetch(`/api/projects/${project.id}/versions`);
      if (response.ok) {
        const data = await response.json();
        setVersions(data.versions || []);
      }
    } catch (error) {
      console.error("Error loading versions:", error);
    } finally {
      setIsLoadingVersions(false);
    }
  };

  // Function to restore a version
  const handleRestoreVersion = async (versionId: string) => {
    try {
      const response = await fetch(
        `/api/projects/${project.id}/versions/${versionId}`,
        {
          method: "POST",
        }
      );

      if (response.ok) {
        // Reload the page to show restored version
        window.location.reload();
      } else {
        console.error("Failed to restore version");
      }
    } catch (error) {
      console.error("Error restoring version:", error);
    }
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
  const { chatPosition } = useChatPosition();

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

  // Ref to trigger PreviewPanel actions
  const previewPanelRef = useRef<PreviewPanelRef | null>(null);

  // View icon mapping - only include functional views
  const viewIconMap: Record<
    string,
    React.ComponentType<{ className?: string }>
  > = {
    git: GitBranch,
  };

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
    ...customViews
      .filter((view) => view.enabled)
      .sort((a, b) => a.order - b.order)
      .map((view) => ({
        id: view.id as TabType,
        label: view.label,
        icon: viewIconMap[view.type] || Eye,
      })),
  ];

  // Project name button that opens settings dialog
  const projectNameDisplay = (
    <Button
      variant="ghost"
      className="px-2 py-1 h-auto rounded-lg"
      onClick={() => setIsSettingsDialogOpen(true)}
    >
      <h1 className="text-sm font-semibold text-foreground truncate max-w-[200px]">
        {project.name}
      </h1>
    </Button>
  );

  // URL Bar with View Switcher content
  const urlBarContent = (
    <div className="flex items-center gap-2 max-w-xl w-full px-8">
      <div className="flex-1 flex items-center gap-2 bg-muted rounded-lg px-2 py-1">
        {/* View Switcher - Left side of URL bar */}
        <DropdownMenu open={isViewMenuOpen} onOpenChange={setIsViewMenuOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="px-2 py-1 text-xs font-medium h-auto rounded-md flex items-center gap-1.5"
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
              <span className="text-xs">
                {allViews.find((view) => view.id === activeTab)?.label ||
                  "View"}
              </span>
              <ChevronDown
                className={`w-3 h-3 transition-transform ${
                  isViewMenuOpen ? "rotate-180" : ""
                }`}
              />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="start" className="w-40 rounded-xl">
            {allViews.map((view) => (
              <div key={view.id}>
                <DropdownMenuItem
                  onClick={() => setActiveTab(view.id)}
                  className={`rounded-lg text-xs ${
                    activeTab === view.id ? "font-medium" : ""
                  }`}
                >
                  {view.icon && <view.icon className="w-3.5 h-3.5 mr-2" />}
                  <span>{view.label}</span>
                </DropdownMenuItem>
              </div>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Separator */}
        <Separator orientation="vertical" className="h-4" />

        <Input
          type="text"
          value={previewUrl}
          onChange={(e) => setPreviewUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && activeTab === "preview") {
              // Navigate to the new URL
              e.preventDefault();
            }
          }}
          placeholder="/"
          disabled={activeTab !== "preview"}
          className="flex-1 bg-transparent text-xs border-none shadow-none focus-visible:ring-0 min-w-0 h-auto p-0 disabled:opacity-50"
        />

        {/* Preview Controls - Inside URL Bar */}
        <div className="flex items-center gap-0.5 pl-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={() => {
                  if (previewPanelRef.current) {
                    previewPanelRef.current.refresh();
                  }
                }}
                disabled={activeTab !== "preview"}
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-md"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Reload</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={() => {
                  if (previewPanelRef.current) {
                    const url = previewPanelRef.current.getPreviewUrl();
                    if (url) {
                      window.open(url, "_blank", "noopener,noreferrer");
                    }
                  }
                }}
                disabled={activeTab !== "preview"}
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-md"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Open in new tab</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={() => {
                  setDeviceMode(
                    deviceMode === "desktop" ? "mobile" : "desktop"
                  );
                }}
                disabled={activeTab !== "preview"}
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-md"
              >
                {deviceMode === "desktop" ? (
                  <Monitor className="w-3.5 h-3.5" />
                ) : (
                  <Smartphone className="w-3.5 h-3.5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {deviceMode.charAt(0).toUpperCase() + deviceMode.slice(1)} -
                Click to switch
              </p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={() => {
                  setIsFullscreen(!isFullscreen);
                }}
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-md"
              >
                {isFullscreen ? (
                  <Minimize className="w-3.5 h-3.5" />
                ) : (
                  <Maximize className="w-3.5 h-3.5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isFullscreen ? "Exit fullscreen" : "Fullscreen"}</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  );

  return (
    <TooltipProvider>
      <div className="h-screen w-screen overflow-hidden flex flex-col bg-background">
        {/* Header */}
        <AppHeader
          afterLogo={projectNameDisplay}
          centerContent={urlBarContent}
          beforeCredits={
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="rounded-lg h-8"
                onClick={() => setIsSettingsDialogOpen(true)}
              >
                <Settings className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="rounded-lg h-8"
                onClick={() => setIsSyncGitDialogOpen(true)}
              >
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
                </svg>
              </Button>
              <Button
                variant="default"
                className="rounded-lg h-8"
                onClick={() => setIsDeployDialogOpen(true)}
              >
                Publish
              </Button>
            </div>
          }
        />

        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden bg-background px-2 pb-2 gap-2">
          {/* Chat Panel - Left Side - Hide in fullscreen */}
          {!isFullscreen && chatPosition === "left" && (
            <div
              className="flex overflow-hidden "
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
                  onRefreshProject={refreshProject}
                />
              </div>
            </div>
          )}

          {/* Content Panel */}
          <div className="flex-1 flex overflow-hidden bg-background">
            <div className="flex-1 flex overflow-hidden">
              {/* Main Panel */}
              <main className="flex-1 overflow-hidden bg-card border border-border rounded-2xl relative">
                {/* Keep PreviewPanel mounted to maintain sandbox across tab switches */}
                <div className={activeTab === "preview" ? "h-full" : "hidden"}>
                  <PreviewPanel
                    ref={previewPanelRef}
                    projectId={project.id}
                    projectFiles={projectFiles}
                    isGeneratingFiles={isGeneratingFiles}
                    generationStatus={project.generationStatus}
                    version={project.version}
                    previewImage={project.previewImage}
                    previewImageCapturedAtVersion={
                      project.previewImageCapturedAtVersion
                    }
                    packages={pendingPackages}
                    onPackagesInstalled={() => setPendingPackages([])}
                    deviceMode={deviceMode}
                    previewUrl={previewUrl}
                    onUrlChange={setPreviewUrl}
                    enableCodeExecution={user.enableCodeExecution ?? true}
                    onScreenshotCaptured={(data) => {
                      // Update local project state with new preview image data
                      setProject((prev) => ({
                        ...prev,
                        previewImage: data.previewImage,
                        previewImageCapturedAtVersion:
                          data.previewImageCapturedAtVersion,
                      }));
                    }}
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

                {/* Custom Views */}
                {activeTab !== "preview" &&
                  activeTab !== "code" &&
                  customViews.find((v) => v.id === activeTab && v.enabled) && (
                    <div className="h-full flex items-center justify-center bg-background p-8">
                      <div className="text-center">
                        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                          {(() => {
                            const view = customViews.find(
                              (v) => v.id === activeTab
                            );
                            const Icon = view ? viewIconMap[view.type] : Eye;
                            return (
                              <Icon className="w-8 h-8 text-muted-foreground" />
                            );
                          })()}
                        </div>
                        <h3 className="text-xl font-semibold mb-2">
                          {customViews.find((v) => v.id === activeTab)?.label}
                        </h3>
                        <p className="text-muted-foreground">
                          This view is coming soon
                        </p>
                      </div>
                    </div>
                  )}
              </main>
            </div>
          </div>

          {/* Chat Panel - Right Side - Hide in fullscreen */}
          {!isFullscreen && chatPosition === "right" && (
            <div
              className="flex overflow-hidden bg-background"
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
                  onRefreshProject={refreshProject}
                />
              </div>
            </div>
          )}
        </div>

        {/* Rename Project Dialog */}
        <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
          <DialogContent className="rounded-2xl sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Rename project</DialogTitle>
              <DialogDescription>
                Enter a new name for your project.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <Input
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="Project name"
                className="rounded-lg"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isRenaming) {
                    handleRenameProject();
                  }
                }}
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button
                variant="ghost"
                onClick={() => setIsRenameDialogOpen(false)}
                disabled={isRenaming}
                className="rounded-lg"
              >
                Cancel
              </Button>
              <Button
                onClick={handleRenameProject}
                disabled={
                  isRenaming ||
                  !newProjectName.trim() ||
                  newProjectName.trim() === project.name
                }
                className="rounded-lg"
              >
                {isRenaming ? "Renaming..." : "Rename"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Version History Dialog */}
        <Dialog
          open={isVersionHistoryOpen}
          onOpenChange={setIsVersionHistoryOpen}
        >
          <DialogContent className="rounded-2xl sm:max-w-[600px] max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>Version History</DialogTitle>
              <DialogDescription>
                View and restore previous versions of your project.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 max-h-[60vh] overflow-y-auto">
              {isLoadingVersions ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading versions...
                </div>
              ) : versions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No version history yet. Versions are created automatically as
                  you make changes.
                </div>
              ) : (
                <div className="space-y-2">
                  {versions.map((version) => (
                    <div
                      key={version.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            Version {version.version}
                          </span>
                          {version.name && (
                            <span className="text-sm text-muted-foreground">
                              - {version.name}
                            </span>
                          )}
                          {version.isBookmarked && (
                            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                              Bookmarked
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {version.createdAt
                            ? new Date(version.createdAt).toLocaleString()
                            : "No date"}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRestoreVersion(version.id)}
                        className="rounded-lg"
                      >
                        Restore
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                onClick={() => setIsVersionHistoryOpen(false)}
                className="rounded-lg"
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Deploy Dialog */}
        <DeploymentDialog
          open={isDeployDialogOpen}
          onOpenChange={setIsDeployDialogOpen}
          projectId={project.id}
          onExportProject={handleExportProject}
        />

        {/* GitHub Sync Dialog */}
        <GitHubSyncDialog
          open={isSyncGitDialogOpen}
          onOpenChange={setIsSyncGitDialogOpen}
          projectId={project.id}
          onFilesUpdated={refreshProjectFiles}
        />

        {/* Database Connection Dialog */}
        <DatabaseConnectionDialog
          open={isDatabaseDialogOpen}
          onOpenChange={setIsDatabaseDialogOpen}
          projectId={project.id}
        />

        {/* Project Settings Dialog */}
        <ProjectSettingsDialog
          open={isSettingsDialogOpen}
          onOpenChange={setIsSettingsDialogOpen}
          projectId={project.id}
          onProjectDeleted={() => router.push("/")}
          onVersionRestored={() => {
            refreshProject();
            refreshProjectFiles();
          }}
        />
      </div>
    </TooltipProvider>
  );
}
