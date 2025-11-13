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
  Github,
} from "lucide-react";
import Logo from "./Logo";
import UserMenu from "./UserMenu";
import CreditCounter from "./CreditCounter";
import ChatPanel from "./coding-interface/ChatPanel";
import PreviewPanel, { PreviewPanelRef } from "./coding-interface/PreviewPanel";
import CodeEditor from "./coding-interface/CodeEditor";
import DeploymentDialog from "./coding-interface/DeploymentDialog";
import GitHubSyncDialog from "./coding-interface/GitHubSyncDialog";
import DatabaseConnectionDialog from "./coding-interface/DatabaseConnectionDialog";
import { useSandboxHeartbeat } from "@/hooks/useSandboxHeartbeat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
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

type TabType = "preview" | "code";

interface Project {
  id: string;
  name: string;
  description: string | null;
  visibility?: "public" | "secret" | "private";
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

  // Keep sandbox alive while user has project page open
  useSandboxHeartbeat(initialProject.id);

  const [activeTab, setActiveTab] = useState<TabType>("preview");
  const [project, setProject] = useState(initialProject);
  const [projectFiles, setProjectFiles] = useState<Record<string, string>>({});
  const [isGeneratingFiles, setIsGeneratingFiles] = useState(false); // Track AI file generation
  const [isProjectMenuOpen, setIsProjectMenuOpen] = useState(false);
  const [isViewMenuOpen, setIsViewMenuOpen] = useState(false);
  const [isVisibilitySubmenuOpen, setIsVisibilitySubmenuOpen] = useState(false);
  const [projectVisibility, setProjectVisibility] = useState<
    "public" | "secret" | "private"
  >(project.visibility || "private");
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
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [shareUrlCopied, setShareUrlCopied] = useState(false);
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
  const chatWidth = 30; // Fixed at 30%

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
        router.push(`/chat/${data.project.id}`);
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

  // Function to handle visibility change
  const handleVisibilityChange = async (
    newVisibility: "public" | "secret" | "private"
  ) => {
    const previousVisibility = projectVisibility;
    setProjectVisibility(newVisibility);

    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ visibility: newVisibility }),
      });

      if (!response.ok) {
        // Revert on error
        setProjectVisibility(previousVisibility);
        console.error("Failed to update visibility");
      }
    } catch (error) {
      // Revert on error
      setProjectVisibility(previousVisibility);
      console.error("Error updating visibility:", error);
    }
  };

  // Function to copy share URL
  const handleCopyShareUrl = () => {
    const shareUrl = `${window.location.origin}/project/${project.id}`;
    navigator.clipboard.writeText(shareUrl);
    setShareUrlCopied(true);
    setTimeout(() => setShareUrlCopied(false), 2000);
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
  ];

  return (
    <TooltipProvider>
      <div className="h-screen w-screen overflow-hidden flex flex-col bg-background">
        {/* Header */}
        <header className="h-12 bg-background grid grid-cols-3 items-center px-4 flex-shrink-0">
          {/* Left Side - Logo and Project Name */}
          <div className="flex items-center justify-start">
            <Logo variant="extended" className="!h-5" href="/" />
            <Separator orientation="vertical" className="h-6 mx-1 ml-3" />

            {/* Project Name with Dropdown */}
            <DropdownMenu
              open={isProjectMenuOpen}
              onOpenChange={setIsProjectMenuOpen}
            >
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 px-2 py-1 h-auto rounded-lg"
                >
                  <h1 className="text-sm font-semibold text-foreground truncate max-w-[200px]">
                    {project.name}
                  </h1>
                  {/* Visibility Icon */}
                  {projectVisibility === "private" && (
                    <Lock className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                  )}
                  {projectVisibility === "secret" && (
                    <Link2 className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                  )}
                  {projectVisibility === "public" && (
                    <Globe className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                  )}
                  <ChevronDown
                    className={`w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform ${
                      isProjectMenuOpen ? "rotate-180" : ""
                    }`}
                  />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="start" className="w-64 rounded-xl">
                <DropdownMenuItem
                  className="rounded-lg"
                  onClick={() => {
                    loadVersionHistory();
                    setIsVersionHistoryOpen(true);
                    setIsProjectMenuOpen(false);
                  }}
                >
                  <History className="w-4 h-4 mr-3" />
                  <span>Version history</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  className="rounded-lg"
                  onClick={() => {
                    setNewProjectName(project.name);
                    setIsRenameDialogOpen(true);
                    setIsProjectMenuOpen(false);
                  }}
                >
                  <Edit className="w-4 h-4 mr-3" />
                  <span>Rename...</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  className="rounded-lg"
                  onClick={() => {
                    handleDuplicateProject();
                    setIsProjectMenuOpen(false);
                  }}
                  disabled={isDuplicating}
                >
                  <Copy className="w-4 h-4 mr-3" />
                  <span>{isDuplicating ? "Duplicating..." : "Duplicate"}</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  className="rounded-lg"
                  onClick={() => {
                    handleExportProject();
                    setIsProjectMenuOpen(false);
                  }}
                >
                  <Download className="w-4 h-4 mr-3" />
                  <span>Export</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="rounded-lg">
                    <Eye className="w-4 h-4 mr-3" />
                    <div className="flex-1 flex items-center justify-between">
                      <span>Visibility</span>
                      <span className="text-xs text-muted-foreground capitalize ml-2">
                        {projectVisibility}
                      </span>
                    </div>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="w-64 rounded-xl">
                    <DropdownMenuItem
                      onClick={() => handleVisibilityChange("public")}
                      className="rounded-lg flex-col items-start gap-1"
                    >
                      <div className="flex items-center gap-3 w-full">
                        <Globe className="w-4 h-4 text-muted-foreground" />
                        <div className="text-sm font-medium">Public</div>
                      </div>
                      <div className="text-xs text-muted-foreground ml-7">
                        Everyone can view
                      </div>
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={() => handleVisibilityChange("secret")}
                      className="rounded-lg flex-col items-start gap-1"
                    >
                      <div className="flex items-center gap-3 w-full">
                        <Link2 className="w-4 h-4 text-muted-foreground" />
                        <div className="text-sm font-medium">Secret</div>
                      </div>
                      <div className="text-xs text-muted-foreground ml-7">
                        Accessible via shared URL
                      </div>
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={() => handleVisibilityChange("private")}
                      className="rounded-lg flex-col items-start gap-1"
                    >
                      <div className="flex items-center gap-3 w-full">
                        <Lock className="w-4 h-4 text-muted-foreground" />
                        <div className="text-sm font-medium">Private</div>
                      </div>
                      <div className="text-xs text-muted-foreground ml-7">
                        Only owner can access
                      </div>
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  className="rounded-lg"
                  onClick={() => {
                    setIsDatabaseDialogOpen(true);
                    setIsProjectMenuOpen(false);
                  }}
                >
                  <svg
                    className="w-4 h-4 mr-3"
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
                  <span>Connect Database</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  className="rounded-lg"
                  onClick={() => {
                    setIsShareDialogOpen(true);
                    setIsProjectMenuOpen(false);
                  }}
                >
                  <svg
                    className="w-4 h-4 mr-3"
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
                </DropdownMenuItem>

                <DropdownMenuItem
                  className="rounded-lg"
                  onClick={() => {
                    setIsSyncGitDialogOpen(true);
                    setIsProjectMenuOpen(false);
                  }}
                >
                  <Github className="w-4 h-4 mr-3" />
                  <span>Sync with Git</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  className="rounded-lg"
                  onClick={() => {
                    setIsDeployDialogOpen(true);
                    setIsProjectMenuOpen(false);
                  }}
                >
                  <svg
                    className="w-4 h-4 mr-3"
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
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Center - URL Bar with View Switcher */}
          <div className="flex items-center justify-center px-8">
            {/* URL Bar - Always visible */}
            <div className="flex items-center gap-2 max-w-xl w-full">
              <div className="flex-1 flex items-center gap-2 bg-muted rounded-lg px-2 py-1">
                {/* View Switcher - Left side of URL bar */}
                <DropdownMenu
                  open={isViewMenuOpen}
                  onOpenChange={setIsViewMenuOpen}
                >
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
                        {allViews.find((view) => view.id === activeTab)
                          ?.label || "View"}
                      </span>
                      <ChevronDown
                        className={`w-3 h-3 transition-transform ${
                          isViewMenuOpen ? "rotate-180" : ""
                        }`}
                      />
                    </Button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent
                    align="start"
                    className="w-40 rounded-xl"
                  >
                    {allViews.map((view, index) => (
                      <div key={view.id}>
                        <DropdownMenuItem
                          onClick={() => setActiveTab(view.id)}
                          className={`rounded-lg text-xs ${
                            activeTab === view.id ? "font-medium" : ""
                          }`}
                        >
                          {view.icon && (
                            <view.icon className="w-3.5 h-3.5 mr-2" />
                          )}
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
                        {deviceMode.charAt(0).toUpperCase() +
                          deviceMode.slice(1)}{" "}
                        - Click to switch
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

            {/* Spacer removed - URL bar always visible */}
          </div>

          {/* Right Side - Credit Counter and User Profile */}
          <div className="flex items-center justify-end gap-2">
            {/* Credit Counter */}
            <CreditCounter onClickAction={() => setIsPricingModalOpen(true)} />

            {/* User Profile Menu */}
            {user && <UserMenu user={user} />}
          </div>
        </header>

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
                    packages={pendingPackages}
                    onPackagesInstalled={() => setPendingPackages([])}
                    deviceMode={deviceMode}
                    previewUrl={previewUrl}
                    onUrlChange={setPreviewUrl}
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

        {/* Token Purchase Modal */}
        {/* <TokenPurchaseModal
          isOpen={isPricingModalOpen}
          onClose={() => setIsPricingModalOpen(false)}
          currentPlan={planName}
        /> */}

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

        {/* Share Project Dialog */}
        <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
          <DialogContent className="rounded-2xl sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Share project</DialogTitle>
              <DialogDescription>
                Anyone with this link can view your project.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="flex items-center gap-2">
                <Input
                  value={`${
                    typeof window !== "undefined" ? window.location.origin : ""
                  }/project/${project.id}`}
                  readOnly
                  className="rounded-lg flex-1"
                />
                <Button
                  onClick={handleCopyShareUrl}
                  className="rounded-lg"
                  variant={shareUrlCopied ? "secondary" : "default"}
                >
                  {shareUrlCopied ? "Copied!" : "Copy"}
                </Button>
              </div>
              <div className="text-xs text-muted-foreground">
                Current visibility:{" "}
                <span className="capitalize font-medium">
                  {projectVisibility}
                </span>
                {projectVisibility === "private" && (
                  <span className="block mt-1">
                    This project is private. Change visibility to share it.
                  </span>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={() => setIsShareDialogOpen(false)}
                className="rounded-lg"
              >
                Done
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
        />

        {/* Database Connection Dialog */}
        <DatabaseConnectionDialog
          open={isDatabaseDialogOpen}
          onOpenChange={setIsDatabaseDialogOpen}
          projectId={project.id}
        />
      </div>
    </TooltipProvider>
  );
}
