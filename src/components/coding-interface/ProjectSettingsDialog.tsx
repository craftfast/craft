"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useProjectSettings,
  ProjectNameField,
  ProjectDescriptionField,
  ProjectActions,
  SaveStatusIndicator,
} from "@/components/project-settings";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Settings,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Users,
  GitBranch,
  Github,
  Cloud,
  Clock,
  FolderOpen,
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
  ShieldCheck,
  Copy,
  Check,
  Code2,
  Database,
  FileText,
  BarChart3,
  Terminal,
  RotateCcw,
  Bookmark,
  BookmarkCheck,
  Loader2,
  Link2,
  ExternalLink,
  Upload,
  Download,
  CheckCircle2,
  AlertCircle,
  Unlink,
  RefreshCw,
  TriangleIcon,
  Rocket,
  Image as ImageIcon,
  FileCode,
  FileType,
  Sparkles,
  X,
} from "lucide-react";

type SettingsSection =
  | "general"
  | "environment"
  | "views"
  | "collaborators"
  | "versions"
  | "git"
  | "deployments"
  | "knowledge";

const menuItems: {
  id: SettingsSection;
  label: string;
  icon: React.ElementType;
}[] = [
  { id: "general", label: "General", icon: Settings },
  { id: "environment", label: "Environment", icon: Lock },
  { id: "views", label: "Views", icon: Eye },
  { id: "collaborators", label: "Collaborators", icon: Users },
  { id: "versions", label: "Versions", icon: Clock },
  { id: "git", label: "GitHub", icon: GitBranch },
  { id: "deployments", label: "Deployments", icon: Cloud },
  { id: "knowledge", label: "Knowledge", icon: FolderOpen },
];

// Types
interface EnvironmentVariable {
  id: string;
  key: string;
  value: string;
  isSecret: boolean;
  type?: string | null;
  description?: string | null;
  createdAt: string;
}

interface CustomView {
  id: string;
  label: string;
  type: string;
  enabled: boolean;
  order: number;
}

interface Version {
  id: string;
  version: number;
  name: string | null;
  isBookmarked: boolean;
  createdAt: string;
}

// GitHub integration types
interface IntegrationStatus {
  connected: boolean;
  installed?: boolean;
  login?: string;
  username?: string;
}

interface SyncStatus {
  synced: boolean;
  status: string;
  message: string;
  localCommit?: string;
  remoteCommit?: string;
  remoteCommitMessage?: string;
  remoteCommitDate?: string;
  lastSyncedAt?: string;
  repository?: {
    id: string;
    name: string;
    fullName: string;
    htmlUrl: string;
    defaultBranch: string;
    isPrivate: boolean;
  };
}

// Deployment types
interface Deployment {
  id: string;
  platform: string;
  status: string;
  vercelUrl?: string;
  vercelProjectId?: string;
  errorMessage?: string;
  createdAt: string;
  completedAt?: string;
  duration?: number;
}

interface VercelProject {
  id: string;
  name: string;
  url?: string;
}

// Knowledge types
interface KnowledgeFile {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  description?: string;
  r2Url?: string;
}

interface ProjectSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  onProjectDeleted?: () => void;
  onProjectDuplicated?: (newProjectId: string) => void;
  onVersionRestored?: () => void;
}

// View types for Views section
const viewTypes = [
  {
    id: "git",
    label: "Git Version History",
    icon: GitBranch,
    comingSoon: true,
  },
  { id: "database", label: "Database", icon: Database, comingSoon: true },
  { id: "logs", label: "Logs", icon: FileText, comingSoon: true },
  { id: "terminal", label: "Terminal", icon: Terminal, comingSoon: true },
  { id: "analytics", label: "Analytics", icon: BarChart3, comingSoon: true },
  { id: "deployment", label: "Deployment", icon: Cloud, comingSoon: true },
];

export default function ProjectSettingsDialog({
  open,
  onOpenChange,
  projectId,
  onProjectDeleted,
  onProjectDuplicated,
  onVersionRestored,
}: ProjectSettingsDialogProps) {
  const [activeSection, setActiveSection] =
    useState<SettingsSection>("general");

  // General settings
  const {
    isLoading: isLoadingGeneral,
    saveStatus,
    projectName,
    projectDescription,
    setProjectName,
    setProjectDescription,
    handleDuplicateProject,
    handleExportProject,
    handleDeleteProject,
  } = useProjectSettings({ projectId });

  // Environment variables state
  const [envVars, setEnvVars] = useState<EnvironmentVariable[]>([]);
  const [isLoadingEnv, setIsLoadingEnv] = useState(false);
  const [newEnvKey, setNewEnvKey] = useState("");
  const [newEnvValue, setNewEnvValue] = useState("");
  const [newEnvIsSecret, setNewEnvIsSecret] = useState(true);
  const [isSavingEnv, setIsSavingEnv] = useState(false);
  const [visibleValues, setVisibleValues] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editEnvDialogOpen, setEditEnvDialogOpen] = useState(false);
  const [editingEnvVar, setEditingEnvVar] =
    useState<EnvironmentVariable | null>(null);
  const [editEnvValue, setEditEnvValue] = useState("");
  const [isUpdatingEnv, setIsUpdatingEnv] = useState(false);

  // Views state
  const [customViews, setCustomViews] = useState<CustomView[]>([]);
  const [isLoadingViews, setIsLoadingViews] = useState(false);
  const [isSavingViews, setIsSavingViews] = useState(false);

  // Versions state
  const [versions, setVersions] = useState<Version[]>([]);
  const [isLoadingVersions, setIsLoadingVersions] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [bookmarkingId, setBookmarkingId] = useState<string | null>(null);

  // GitHub state
  const [githubStatus, setGithubStatus] = useState<IntegrationStatus | null>(
    null
  );
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [isLoadingGit, setIsLoadingGit] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [isUnlinking, setIsUnlinking] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [commitMessage, setCommitMessage] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newRepoName, setNewRepoName] = useState("");
  const [newRepoDescription, setNewRepoDescription] = useState("");
  const [newRepoPrivate, setNewRepoPrivate] = useState(true);

  // Deployments state
  const [isLoadingDeployments, setIsLoadingDeployments] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [isDisconnectingVercel, setIsDisconnectingVercel] = useState(false);
  const [vercelConnected, setVercelConnected] = useState(false);
  const [vercelProject, setVercelProject] = useState<VercelProject | null>(
    null
  );
  const [deploymentHistory, setDeploymentHistory] = useState<Deployment[]>([]);

  // Knowledge state
  const [isLoadingKnowledge, setIsLoadingKnowledge] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [knowledgeFiles, setKnowledgeFiles] = useState<KnowledgeFile[]>([]);

  // Load data when section changes
  useEffect(() => {
    if (!open) return;

    if (activeSection === "environment" && envVars.length === 0) {
      loadEnvironmentVariables();
    } else if (activeSection === "views" && customViews.length === 0) {
      loadCustomViews();
    } else if (activeSection === "versions" && versions.length === 0) {
      loadVersions();
    } else if (activeSection === "git" && !githubStatus) {
      loadGitHubStatus();
    } else if (
      activeSection === "deployments" &&
      !vercelConnected &&
      deploymentHistory.length === 0
    ) {
      loadDeploymentSettings();
    } else if (activeSection === "knowledge" && knowledgeFiles.length === 0) {
      loadKnowledgeFiles();
    }
  }, [activeSection, open]);

  // Environment Variables Functions
  const loadEnvironmentVariables = async () => {
    setIsLoadingEnv(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/environment`);
      if (response.ok) {
        const data = await response.json();
        setEnvVars(data.environmentVariables || []);
      }
    } catch {
      toast.error("Failed to load environment variables");
    } finally {
      setIsLoadingEnv(false);
    }
  };

  const handleAddEnvVar = async () => {
    if (!newEnvKey || !newEnvValue) {
      toast.error("Key and value are required");
      return;
    }

    const keyRegex = /^[A-Z][A-Z0-9_]*$/;
    if (!keyRegex.test(newEnvKey)) {
      toast.error("Key must be uppercase with underscores only");
      return;
    }

    setIsSavingEnv(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/environment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: newEnvKey,
          value: newEnvValue,
          isSecret: newEnvIsSecret,
        }),
      });

      if (response.ok) {
        const newVar = await response.json();
        setEnvVars((prev) => [...prev, newVar]);
        setNewEnvKey("");
        setNewEnvValue("");
        setNewEnvIsSecret(true);
        toast.success("Environment variable added");
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to add variable");
      }
    } catch {
      toast.error("Failed to add variable");
    } finally {
      setIsSavingEnv(false);
    }
  };

  const handleDeleteEnvVar = async (id: string) => {
    try {
      const response = await fetch(
        `/api/projects/${projectId}/environment/${id}`,
        {
          method: "DELETE",
        }
      );
      if (response.ok) {
        setEnvVars((prev) => prev.filter((v) => v.id !== id));
        toast.success("Variable deleted");
      }
    } catch {
      toast.error("Failed to delete variable");
    }
  };

  const handleEditEnvVar = (envVar: EnvironmentVariable) => {
    setEditingEnvVar(envVar);
    setEditEnvValue("");
    setEditEnvDialogOpen(true);
  };

  const handleUpdateEnvVar = async () => {
    if (!editingEnvVar || !editEnvValue) return;

    setIsUpdatingEnv(true);
    try {
      const response = await fetch(
        `/api/projects/${projectId}/environment/${editingEnvVar.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ value: editEnvValue }),
        }
      );

      if (response.ok) {
        const updatedVar = await response.json();
        setEnvVars((prev) =>
          prev.map((v) => (v.id === editingEnvVar.id ? updatedVar : v))
        );
        setEditEnvDialogOpen(false);
        setEditingEnvVar(null);
        toast.success("Variable updated");
      }
    } catch {
      toast.error("Failed to update variable");
    } finally {
      setIsUpdatingEnv(false);
    }
  };

  const toggleValueVisibility = (id: string) => {
    setVisibleValues((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const handleCopyValue = async (envVar: EnvironmentVariable) => {
    try {
      await navigator.clipboard.writeText(envVar.value);
      setCopiedId(envVar.id);
      setTimeout(() => setCopiedId(null), 2000);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Failed to copy");
    }
  };

  // Views Functions
  const loadCustomViews = async () => {
    setIsLoadingViews(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/settings`);
      if (response.ok) {
        const data = await response.json();
        setCustomViews(data.customViews || []);
      }
    } catch {
      toast.error("Failed to load views");
    } finally {
      setIsLoadingViews(false);
    }
  };

  const handleToggleView = async (viewId: string, enabled: boolean) => {
    setIsSavingViews(true);
    try {
      const response = await fetch(
        `/api/projects/${projectId}/views/${viewId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ enabled }),
        }
      );

      if (response.ok) {
        setCustomViews((prev) =>
          prev.map((v) => (v.id === viewId ? { ...v, enabled } : v))
        );
        toast.success("View updated");
      }
    } catch {
      toast.error("Failed to update view");
    } finally {
      setIsSavingViews(false);
    }
  };

  // Versions Functions
  const loadVersions = async () => {
    setIsLoadingVersions(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/versions`);
      if (response.ok) {
        const data = await response.json();
        setVersions(data.versions || []);
      }
    } catch {
      toast.error("Failed to load versions");
    } finally {
      setIsLoadingVersions(false);
    }
  };

  const handleRestoreVersion = async (versionId: string) => {
    setRestoringId(versionId);
    try {
      const response = await fetch(
        `/api/projects/${projectId}/versions/${versionId}/restore`,
        {
          method: "POST",
        }
      );

      if (response.ok) {
        toast.success("Version restored");
        onVersionRestored?.();
        onOpenChange(false);
      }
    } catch {
      toast.error("Failed to restore version");
    } finally {
      setRestoringId(null);
    }
  };

  const handleToggleBookmark = async (
    versionId: string,
    isBookmarked: boolean
  ) => {
    setBookmarkingId(versionId);
    try {
      const response = await fetch(
        `/api/projects/${projectId}/versions/${versionId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isBookmarked: !isBookmarked }),
        }
      );

      if (response.ok) {
        setVersions((prev) =>
          prev.map((v) =>
            v.id === versionId ? { ...v, isBookmarked: !isBookmarked } : v
          )
        );
      }
    } catch {
      toast.error("Failed to update bookmark");
    } finally {
      setBookmarkingId(null);
    }
  };

  // GitHub Functions
  const checkSyncStatus = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/integrations/github/sync-status?projectId=${projectId}`
      );
      if (res.ok) {
        const data = await res.json();
        setSyncStatus(data);
      }
    } catch (error) {
      console.error("Failed to check sync status:", error);
    }
  }, [projectId]);

  const loadGitHubStatus = async () => {
    setIsLoadingGit(true);
    try {
      const res = await fetch("/api/integrations/github/status");
      if (res.ok) {
        const data = await res.json();
        setGithubStatus(data);
        if (data.connected) {
          await checkSyncStatus();
        }
      }
    } catch (error) {
      console.error("Failed to check integration status:", error);
      toast.error("Failed to load GitHub status");
    } finally {
      setIsLoadingGit(false);
    }
  };

  const handleConnectGitHub = async () => {
    try {
      const res = await fetch("/api/integrations/github/connect");
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error("Failed to initiate GitHub connection");
      }
    } catch (error) {
      console.error("Failed to connect GitHub:", error);
      toast.error("Failed to connect to GitHub");
    }
  };

  const handleDisconnectGitHub = async () => {
    setIsDisconnecting(true);
    try {
      const res = await fetch("/api/integrations/github/disconnect", {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to disconnect");
      toast.success("GitHub disconnected");
      setGithubStatus(null);
      setSyncStatus(null);
    } catch (error) {
      console.error("Disconnect error:", error);
      toast.error("Failed to disconnect GitHub");
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handlePush = async () => {
    setIsPushing(true);
    try {
      const res = await fetch("/api/integrations/github/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          commitMessage: commitMessage || undefined,
        }),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error || "Push failed");
      }
      const result = await res.json();
      toast.success("Pushed to GitHub successfully!", {
        description: `Commit: ${result.commitSha?.substring(0, 7)}`,
      });
      setCommitMessage("");
      checkSyncStatus();
    } catch (error) {
      console.error("Push error:", error);
      toast.error(error instanceof Error ? error.message : "Push failed");
    } finally {
      setIsPushing(false);
    }
  };

  const handlePull = async () => {
    if (!syncStatus?.repository) {
      toast.error("No repository linked");
      return;
    }
    setIsPulling(true);
    try {
      const res = await fetch("/api/integrations/github/pull", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repoFullName: syncStatus.repository.fullName,
          projectId,
        }),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error || "Pull failed");
      }
      const result = await res.json();
      toast.success(`Pulled ${result.filesCount} files from GitHub`);
      checkSyncStatus();
    } catch (error) {
      console.error("Pull error:", error);
      toast.error(error instanceof Error ? error.message : "Pull failed");
    } finally {
      setIsPulling(false);
    }
  };

  const handleUnlinkRepo = async () => {
    if (!syncStatus?.repository) return;
    setIsUnlinking(true);
    try {
      const res = await fetch(
        `/api/integrations/github/link?projectId=${projectId}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error || "Failed to unlink repository");
      }
      toast.success("Repository unlinked");
      setSyncStatus(null);
      checkSyncStatus();
    } catch (error) {
      console.error("Unlink error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to unlink");
    } finally {
      setIsUnlinking(false);
    }
  };

  const handleCreateRepo = async () => {
    if (!newRepoName.trim()) {
      toast.error("Repository name is required");
      return;
    }
    setIsCreating(true);
    try {
      const res = await fetch("/api/integrations/github/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          repositoryName: newRepoName.trim().toLowerCase().replace(/\s+/g, "-"),
          description: newRepoDescription.trim() || undefined,
          isPrivate: newRepoPrivate,
        }),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error || "Failed to create repository");
      }
      const result = await res.json();
      toast.success(`Repository created: ${result.repository.fullName}`);
      setNewRepoName("");
      setNewRepoDescription("");
      setNewRepoPrivate(true);
      setShowCreateForm(false);
      checkSyncStatus();
    } catch (error) {
      console.error("Create repo error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create repository"
      );
    } finally {
      setIsCreating(false);
    }
  };

  // Deployments Functions
  const loadDeploymentSettings = async () => {
    setIsLoadingDeployments(true);
    try {
      const [settingsRes, deploymentsRes] = await Promise.all([
        fetch(`/api/projects/${projectId}/settings`),
        fetch(`/api/integrations/deploy?projectId=${projectId}`),
      ]);
      if (settingsRes.ok) {
        const data = await settingsRes.json();
        if (data.deployments?.vercel) {
          setVercelConnected(true);
          setVercelProject(data.deployments.vercelProject || null);
        }
      }
      if (deploymentsRes.ok) {
        const data = await deploymentsRes.json();
        if (data.deployments) {
          setDeploymentHistory(
            data.deployments.filter((d: Deployment) => d.platform === "vercel")
          );
        }
      }
    } catch (error) {
      console.error("Failed to load deployment settings:", error);
      toast.error("Failed to load deployment settings");
    } finally {
      setIsLoadingDeployments(false);
    }
  };

  const handleConnectVercel = async () => {
    toast.info("Connecting to Vercel...");
    window.open(
      `/api/integrations/vercel/connect?projectId=${projectId}`,
      "_blank"
    );
  };

  const handleDisconnectVercel = async () => {
    setIsDisconnectingVercel(true);
    try {
      const res = await fetch(
        `/api/integrations/vercel/disconnect?projectId=${projectId}`,
        {
          method: "POST",
        }
      );
      if (res.ok) {
        setVercelConnected(false);
        setVercelProject(null);
        toast.success("Disconnected from Vercel");
      } else {
        toast.error("Failed to disconnect from Vercel");
      }
    } catch (error) {
      console.error("Failed to disconnect:", error);
      toast.error("Failed to disconnect from Vercel");
    } finally {
      setIsDisconnectingVercel(false);
    }
  };

  const handleDeploy = async () => {
    setIsDeploying(true);
    try {
      const res = await fetch(`/api/integrations/deploy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, platform: "vercel" }),
      });
      if (res.ok) {
        toast.success("Deployment started!");
        loadDeploymentSettings();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to start deployment");
      }
    } catch (error) {
      console.error("Failed to deploy:", error);
      toast.error("Failed to start deployment");
    } finally {
      setIsDeploying(false);
    }
  };

  const getDeploymentStatusIcon = (status: string) => {
    switch (status) {
      case "ready":
        return (
          <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-500" />
        );
      case "error":
        return <X className="w-4 h-4 text-red-600 dark:text-red-500" />;
      case "building":
        return (
          <Loader2 className="w-4 h-4 text-amber-600 dark:text-amber-500 animate-spin" />
        );
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  // Knowledge Functions
  const loadKnowledgeFiles = async () => {
    setIsLoadingKnowledge(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/knowledge`);
      if (response.ok) {
        const data = await response.json();
        if (data.files) setKnowledgeFiles(data.files);
      }
    } catch (error) {
      console.error("Failed to load knowledge files:", error);
      toast.error("Failed to load knowledge files");
    } finally {
      setIsLoadingKnowledge(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploading(true);
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append("file", file);
      try {
        const response = await fetch(`/api/projects/${projectId}/knowledge`, {
          method: "POST",
          body: formData,
        });
        if (response.ok) {
          const data = await response.json();
          if (data.file) {
            setKnowledgeFiles((prev) => [data.file, ...prev]);
          }
        } else {
          const error = await response.json();
          toast.error(error.error || `Failed to upload ${file.name}`);
        }
      } catch {
        toast.error(`Failed to upload ${file.name}`);
      }
    }
    setIsUploading(false);
    toast.success(
      files.length === 1 ? "File uploaded" : `${files.length} files uploaded`
    );
    e.target.value = "";
  };

  const handleDeleteKnowledgeFile = async (
    fileId: string,
    fileName: string
  ) => {
    try {
      const response = await fetch(
        `/api/projects/${projectId}/knowledge/${fileId}`,
        {
          method: "DELETE",
        }
      );
      if (response.ok) {
        setKnowledgeFiles((prev) => prev.filter((f) => f.id !== fileId));
        toast.success(`Deleted ${fileName}`);
      } else {
        toast.error("Failed to delete file");
      }
    } catch {
      toast.error("Failed to delete file");
    }
  };

  const getFileCategory = (mimeType: string, name: string) => {
    if (mimeType.startsWith("image/")) return "image";
    if (
      mimeType === "text/markdown" ||
      name.endsWith(".md") ||
      mimeType === "text/plain" ||
      name.endsWith(".txt")
    )
      return "document";
    if (mimeType === "application/pdf") return "pdf";
    if (mimeType === "application/json" || name.endsWith(".json"))
      return "code";
    return "other";
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "image":
        return ImageIcon;
      case "document":
        return FileText;
      case "pdf":
        return FileType;
      case "code":
        return FileCode;
      default:
        return FileText;
    }
  };

  // Handlers
  const handleDelete = async () => {
    await handleDeleteProject();
    onOpenChange(false);
    onProjectDeleted?.();
  };

  const handleDuplicate = async () => {
    await handleDuplicateProject();
    onProjectDuplicated?.(projectId);
  };

  // Render content based on section
  const renderContent = () => {
    switch (activeSection) {
      case "general":
        if (isLoadingGeneral) {
          return <LoadingSpinner />;
        }
        return (
          <div className="space-y-6">
            <ProjectNameField value={projectName} onChange={setProjectName} />
            <ProjectDescriptionField
              value={projectDescription}
              onChange={setProjectDescription}
            />
            <ProjectActions
              onDuplicate={handleDuplicate}
              onExport={handleExportProject}
              onDelete={handleDelete}
            />
          </div>
        );

      case "environment":
        if (isLoadingEnv) {
          return <LoadingSpinner />;
        }
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Securely store configuration and secrets for your project.
            </p>

            {/* Add New Variable */}
            <div className="space-y-3 p-4 rounded-xl border bg-muted/30">
              <h3 className="font-medium text-sm">Add New Variable</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Key</Label>
                  <Input
                    value={newEnvKey}
                    onChange={(e) => setNewEnvKey(e.target.value.toUpperCase())}
                    placeholder="DATABASE_URL"
                    className="rounded-lg font-mono text-sm h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Value</Label>
                  <Input
                    type={newEnvIsSecret ? "password" : "text"}
                    value={newEnvValue}
                    onChange={(e) => setNewEnvValue(e.target.value)}
                    placeholder="postgresql://..."
                    className="rounded-lg font-mono text-sm h-9"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={newEnvIsSecret}
                    onCheckedChange={setNewEnvIsSecret}
                    className="scale-90"
                  />
                  <span className="text-xs text-muted-foreground">
                    Sensitive
                  </span>
                </div>
                <Button
                  size="sm"
                  onClick={handleAddEnvVar}
                  disabled={isSavingEnv || !newEnvKey || !newEnvValue}
                  className="rounded-lg h-8"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Add
                </Button>
              </div>
            </div>

            {/* Variables List */}
            {envVars.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground border rounded-xl">
                <ShieldCheck className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No environment variables yet</p>
              </div>
            ) : (
              <div className="border rounded-xl divide-y max-h-[200px] overflow-y-auto">
                {envVars.map((envVar) => (
                  <div
                    key={envVar.id}
                    className="flex items-center justify-between px-3 py-2 text-sm"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-medium truncate">
                          {envVar.key}
                        </span>
                        {envVar.isSecret && (
                          <Lock className="w-3 h-3 text-amber-500 flex-shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <code className="text-xs text-muted-foreground font-mono truncate">
                          {envVar.isSecret
                            ? "••••••••••••"
                            : visibleValues.has(envVar.id)
                            ? envVar.value
                            : "••••••••••••"}
                        </code>
                        {!envVar.isSecret && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-5 w-5 p-0"
                              onClick={() => toggleValueVisibility(envVar.id)}
                            >
                              {visibleValues.has(envVar.id) ? (
                                <EyeOff className="w-3 h-3" />
                              ) : (
                                <Eye className="w-3 h-3" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-5 w-5 p-0"
                              onClick={() => handleCopyValue(envVar)}
                            >
                              {copiedId === envVar.id ? (
                                <Check className="w-3 h-3 text-green-500" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-xl">
                        <DropdownMenuItem
                          onClick={() => handleEditEnvVar(envVar)}
                          className="rounded-lg"
                        >
                          <Pencil className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteEnvVar(envVar.id)}
                          className="rounded-lg text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case "views":
        if (isLoadingViews) {
          return <LoadingSpinner />;
        }
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Configure which views appear in the preview dropdown.
            </p>

            {/* Default Views */}
            <div className="p-3 rounded-xl border bg-muted/30">
              <h3 className="text-xs font-semibold mb-2 text-muted-foreground">
                Default Views
              </h3>
              <div className="space-y-1">
                <div className="flex items-center justify-between p-2 rounded-lg bg-background">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">Preview</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Required
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-background">
                  <div className="flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">Code</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Required
                  </span>
                </div>
              </div>
            </div>

            {/* Additional Views */}
            <div>
              <h3 className="text-xs font-semibold mb-2 text-muted-foreground">
                Additional Views
              </h3>
              <div className="space-y-1">
                {viewTypes.map((viewType) => {
                  const view = customViews.find((v) => v.id === viewType.id);
                  const Icon = viewType.icon;
                  return (
                    <div
                      key={viewType.id}
                      className={`flex items-center justify-between p-3 rounded-xl border ${
                        viewType.comingSoon ? "opacity-60" : ""
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{viewType.label}</span>
                        {viewType.comingSoon && (
                          <span className="px-1.5 py-0.5 text-xs bg-muted rounded-full">
                            Soon
                          </span>
                        )}
                      </div>
                      <Switch
                        checked={view?.enabled || false}
                        onCheckedChange={(checked) =>
                          handleToggleView(viewType.id, checked)
                        }
                        disabled={isSavingViews || viewType.comingSoon}
                        className="scale-90"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );

      case "versions":
        if (isLoadingVersions) {
          return <LoadingSpinner />;
        }
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              View and restore previous versions of your project.
            </p>

            {versions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground border rounded-xl">
                <Clock className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No versions yet</p>
              </div>
            ) : (
              <div className="border rounded-xl divide-y max-h-[280px] overflow-y-auto">
                {versions.map((version) => (
                  <div
                    key={version.id}
                    className="flex items-center justify-between px-3 py-2"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          Version {version.version}
                        </span>
                        {version.name && (
                          <span className="text-xs text-muted-foreground">
                            - {version.name}
                          </span>
                        )}
                        {version.isBookmarked && (
                          <BookmarkCheck className="w-3.5 h-3.5 text-primary" />
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(version.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() =>
                          handleToggleBookmark(version.id, version.isBookmarked)
                        }
                        disabled={bookmarkingId === version.id}
                      >
                        {version.isBookmarked ? (
                          <BookmarkCheck className="w-4 h-4" />
                        ) : (
                          <Bookmark className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 rounded-lg text-xs"
                        onClick={() => handleRestoreVersion(version.id)}
                        disabled={restoringId === version.id}
                      >
                        {restoringId === version.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <>
                            <RotateCcw className="w-3 h-3 mr-1" />
                            Restore
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case "collaborators":
        return (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
              <Users className="w-6 h-6 text-muted-foreground" />
            </div>
            <h3 className="text-sm font-medium mb-1">Coming Soon</h3>
            <p className="text-xs text-muted-foreground max-w-xs">
              Team collaboration features are on our roadmap.
            </p>
          </div>
        );

      case "git":
        if (isLoadingGit) {
          return <LoadingSpinner />;
        }

        const hasLinkedRepo = syncStatus?.repository != null;

        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Connect your project to GitHub for version control and
              collaboration.
            </p>

            {/* GitHub Connection Status */}
            <div className="p-4 rounded-xl border">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-neutral-900 dark:bg-white">
                    <Github className="w-4 h-4 text-white dark:text-neutral-900" />
                  </div>
                  <div>
                    <h3 className="font-medium text-sm">GitHub Account</h3>
                    <p className="text-xs text-muted-foreground">
                      {githubStatus?.connected
                        ? `Connected as @${
                            githubStatus.login || githubStatus.username
                          }`
                        : "Connect to sync code"}
                    </p>
                  </div>
                </div>
                {githubStatus?.connected && (
                  <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-500" />
                )}
              </div>

              {!githubStatus?.connected ? (
                <Button
                  onClick={handleConnectGitHub}
                  className="w-full rounded-lg"
                  size="sm"
                >
                  <Link2 className="w-3.5 h-3.5 mr-2" />
                  Connect GitHub Account
                </Button>
              ) : !githubStatus?.installed ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 text-xs">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>GitHub App not installed.</span>
                  </div>
                  <Button
                    onClick={handleConnectGitHub}
                    className="w-full rounded-lg"
                    size="sm"
                  >
                    <Github className="w-3.5 h-3.5 mr-2" />
                    Install GitHub App
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  onClick={handleDisconnectGitHub}
                  disabled={isDisconnecting}
                  className="w-full rounded-lg text-destructive hover:text-destructive"
                  size="sm"
                >
                  {isDisconnecting ? (
                    <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                  ) : (
                    <Unlink className="w-3.5 h-3.5 mr-2" />
                  )}
                  Disconnect GitHub
                </Button>
              )}
            </div>

            {/* Repository Management */}
            {githubStatus?.connected && githubStatus?.installed && (
              <>
                {hasLinkedRepo ? (
                  <div className="p-4 rounded-xl border space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-sm">Linked Repository</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive rounded-lg h-7 text-xs"
                        onClick={handleUnlinkRepo}
                        disabled={isUnlinking}
                      >
                        {isUnlinking ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <>
                            <Unlink className="w-3 h-3 mr-1" />
                            Unlink
                          </>
                        )}
                      </Button>
                    </div>

                    {/* Repo Info */}
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                      <div className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                        {syncStatus.repository?.isPrivate ? (
                          <Lock className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <Unlock className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-xs truncate">
                          {syncStatus.repository?.fullName}
                        </h4>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <GitBranch className="w-3 h-3" />
                          {syncStatus.repository?.defaultBranch}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 rounded-lg"
                        onClick={() =>
                          window.open(syncStatus.repository?.htmlUrl, "_blank")
                        }
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Button>
                    </div>

                    {/* Sync Status */}
                    <div
                      className={cn(
                        "flex items-center gap-2 p-2 rounded-lg text-xs",
                        syncStatus.status === "synced" &&
                          "bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400",
                        syncStatus.status === "out_of_sync" &&
                          "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400",
                        syncStatus.status === "never_pushed" &&
                          "bg-neutral-100 dark:bg-neutral-800",
                        !["synced", "out_of_sync", "never_pushed"].includes(
                          syncStatus.status
                        ) && "bg-neutral-100 dark:bg-neutral-800"
                      )}
                    >
                      {syncStatus.status === "synced" ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : (
                        <AlertCircle className="w-3.5 h-3.5" />
                      )}
                      <span>{syncStatus.message}</span>
                    </div>

                    {/* Commit Message */}
                    <Input
                      placeholder="Commit message (optional)"
                      value={commitMessage}
                      onChange={(e) => setCommitMessage(e.target.value)}
                      className="rounded-lg h-8 text-sm"
                    />

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        onClick={handlePush}
                        disabled={isPushing}
                        className="flex-1 rounded-lg"
                        size="sm"
                      >
                        {isPushing ? (
                          <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                        ) : (
                          <Upload className="w-3.5 h-3.5 mr-1" />
                        )}
                        Push
                      </Button>
                      <Button
                        onClick={handlePull}
                        disabled={isPulling}
                        variant="outline"
                        className="flex-1 rounded-lg"
                        size="sm"
                      >
                        {isPulling ? (
                          <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                        ) : (
                          <Download className="w-3.5 h-3.5 mr-1" />
                        )}
                        Pull
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={checkSyncStatus}
                        className="h-8 w-8 rounded-lg"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ) : showCreateForm ? (
                  <div className="p-4 rounded-xl border space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-sm flex items-center gap-1.5">
                        <Plus className="w-3.5 h-3.5" />
                        Create Repository
                      </h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs rounded-lg h-6"
                        onClick={() => setShowCreateForm(false)}
                      >
                        Cancel
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <Input
                        placeholder="Repository name"
                        value={newRepoName}
                        onChange={(e) => setNewRepoName(e.target.value)}
                        className="rounded-lg h-8 text-sm"
                      />
                      <p className="text-xs text-muted-foreground">
                        {githubStatus?.username || githubStatus?.login}/
                        {newRepoName
                          .trim()
                          .toLowerCase()
                          .replace(/\s+/g, "-") || "repo-name"}
                      </p>
                      <Input
                        placeholder="Description (optional)"
                        value={newRepoDescription}
                        onChange={(e) => setNewRepoDescription(e.target.value)}
                        className="rounded-lg h-8 text-sm"
                      />
                      <div className="flex items-center justify-between p-2 border rounded-lg">
                        <div className="flex items-center gap-2">
                          {newRepoPrivate ? (
                            <Lock className="w-3.5 h-3.5" />
                          ) : (
                            <Unlock className="w-3.5 h-3.5" />
                          )}
                          <span className="text-xs">
                            {newRepoPrivate ? "Private" : "Public"}
                          </span>
                        </div>
                        <Switch
                          checked={newRepoPrivate}
                          onCheckedChange={setNewRepoPrivate}
                          className="scale-90"
                        />
                      </div>
                    </div>

                    <Button
                      onClick={handleCreateRepo}
                      disabled={isCreating || !newRepoName.trim()}
                      className="w-full rounded-lg"
                      size="sm"
                    >
                      {isCreating ? (
                        <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                      ) : (
                        <Plus className="w-3.5 h-3.5 mr-1" />
                      )}
                      Create & Push Code
                    </Button>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl border text-center space-y-3">
                    <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto">
                      <GitBranch className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="font-medium text-sm">
                        No Repository Linked
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        Create a new repository to sync your project.
                      </p>
                    </div>
                    <Button
                      onClick={() => setShowCreateForm(true)}
                      className="w-full rounded-lg"
                      size="sm"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" />
                      Create New Repository
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        );

      case "deployments":
        if (isLoadingDeployments) {
          return <LoadingSpinner />;
        }

        const latestDeployment = deploymentHistory[0];
        const latestSuccessfulDeployment = deploymentHistory.find(
          (d) => d.status === "ready" && d.vercelUrl
        );

        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Deploy your project to production with Vercel.
            </p>

            {/* Vercel Connection */}
            <div className="p-4 rounded-xl border">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-neutral-900 dark:bg-white">
                    <TriangleIcon className="w-4 h-4 text-white dark:text-neutral-900 fill-current" />
                  </div>
                  <div>
                    <h3 className="font-medium text-sm">Vercel</h3>
                    <p className="text-xs text-muted-foreground">
                      {vercelConnected
                        ? "Deploy with automatic builds"
                        : "Connect to deploy"}
                    </p>
                  </div>
                </div>
                {vercelConnected && (
                  <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-500" />
                )}
              </div>

              {!vercelConnected ? (
                <Button
                  onClick={handleConnectVercel}
                  className="w-full rounded-lg"
                  size="sm"
                >
                  <Rocket className="w-3.5 h-3.5 mr-2" />
                  Connect Vercel Account
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={handleDisconnectVercel}
                  disabled={isDisconnectingVercel}
                  className="w-full rounded-lg text-destructive hover:text-destructive"
                  size="sm"
                >
                  {isDisconnectingVercel ? (
                    <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                  ) : (
                    <Unlink className="w-3.5 h-3.5 mr-2" />
                  )}
                  Disconnect Vercel
                </Button>
              )}
            </div>

            {vercelConnected && (
              <div className="p-4 rounded-xl border space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-sm">Deployment</h3>
                  {latestSuccessfulDeployment?.vercelUrl && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-lg h-7 text-xs"
                      onClick={() =>
                        window.open(
                          `https://${latestSuccessfulDeployment.vercelUrl}`,
                          "_blank"
                        )
                      }
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      View Site
                    </Button>
                  )}
                </div>

                {/* Project Info */}
                {(vercelProject || latestSuccessfulDeployment?.vercelUrl) && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                    <div className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                      <TriangleIcon className="w-4 h-4 text-muted-foreground fill-current" />
                    </div>
                    <div className="flex-1 min-w-0">
                      {vercelProject && (
                        <h4 className="font-medium text-xs truncate">
                          {vercelProject.name}
                        </h4>
                      )}
                      {latestSuccessfulDeployment?.vercelUrl && (
                        <p className="text-xs text-muted-foreground truncate">
                          {latestSuccessfulDeployment.vercelUrl}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Latest Status */}
                {latestDeployment && (
                  <div
                    className={cn(
                      "flex items-center gap-2 p-2 rounded-lg text-xs",
                      latestDeployment.status === "ready" &&
                        "bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400",
                      latestDeployment.status === "error" &&
                        "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400",
                      latestDeployment.status === "building" &&
                        "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400",
                      !["ready", "error", "building"].includes(
                        latestDeployment.status
                      ) && "bg-neutral-100 dark:bg-neutral-800"
                    )}
                  >
                    {getDeploymentStatusIcon(latestDeployment.status)}
                    <span>
                      {latestDeployment.status === "ready"
                        ? "Deployment ready"
                        : latestDeployment.status === "building"
                        ? "Building..."
                        : latestDeployment.status === "error"
                        ? latestDeployment.errorMessage || "Failed"
                        : latestDeployment.status}
                    </span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    onClick={handleDeploy}
                    disabled={isDeploying}
                    className="flex-1 rounded-lg"
                    size="sm"
                  >
                    {isDeploying ? (
                      <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                    ) : (
                      <Rocket className="w-3.5 h-3.5 mr-1" />
                    )}
                    Deploy Now
                  </Button>
                  <Button
                    onClick={loadDeploymentSettings}
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-lg"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            )}

            {/* Deployment History */}
            {vercelConnected && deploymentHistory.length > 1 && (
              <div className="p-4 rounded-xl border space-y-2">
                <h3 className="font-medium text-sm">History</h3>
                <div className="space-y-1 max-h-[120px] overflow-y-auto">
                  {deploymentHistory.slice(1, 5).map((deployment) => (
                    <div
                      key={deployment.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-muted/50 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        {getDeploymentStatusIcon(deployment.status)}
                        <span>
                          {deployment.status === "ready"
                            ? "Ready"
                            : deployment.status === "building"
                            ? "Building"
                            : deployment.status === "error"
                            ? "Failed"
                            : deployment.status}
                        </span>
                      </div>
                      <span className="text-muted-foreground">
                        {new Date(deployment.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case "knowledge":
        if (isLoadingKnowledge) {
          return <LoadingSpinner />;
        }

        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Add reference files to help AI understand your project better.
            </p>

            {/* How it works */}
            <div className="rounded-xl bg-muted/50 p-3 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-medium">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                How it works
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                <div className="flex items-start gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 mt-0.5 text-purple-500" />
                  <div>
                    <span className="font-medium text-foreground">Designs</span>
                    <p className="text-[10px]">
                      Share in chat for AI to implement
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-1.5">
                  <FileText className="w-3.5 h-3.5 mt-0.5 text-blue-500" />
                  <div>
                    <span className="font-medium text-foreground">Docs</span>
                    <p className="text-[10px]">Auto-included in AI context</p>
                  </div>
                </div>
                <div className="flex items-start gap-1.5">
                  <FileCode className="w-3.5 h-3.5 mt-0.5 text-green-500" />
                  <div>
                    <span className="font-medium text-foreground">Data</span>
                    <p className="text-[10px]">JSON configs, sample data</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Upload Area */}
            <label
              className={cn(
                "border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer block",
                isUploading
                  ? "border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900/50"
                  : "border-border hover:border-neutral-400 dark:hover:border-neutral-600"
              )}
            >
              <input
                type="file"
                multiple
                onChange={handleFileUpload}
                className="hidden"
                accept="image/*,.pdf,.txt,.md,.doc,.docx,.json,.csv"
                disabled={isUploading}
              />
              {isUploading ? (
                <>
                  <Loader2 className="w-8 h-8 mx-auto mb-2 text-muted-foreground animate-spin" />
                  <p className="font-medium text-sm">Uploading...</p>
                </>
              ) : (
                <>
                  <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="font-medium text-sm">
                    Drop files here or click to upload
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Images, PDFs, Markdown, Text, JSON (max 10MB)
                  </p>
                </>
              )}
            </label>

            {/* Files List */}
            {knowledgeFiles.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground border rounded-xl">
                <FolderOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm font-medium">No knowledge files yet</p>
                <p className="text-xs mt-1">
                  Upload PRDs, design files, or docs
                </p>
              </div>
            ) : (
              <div className="border rounded-xl divide-y max-h-[180px] overflow-y-auto">
                {knowledgeFiles.map((file) => {
                  const category = getFileCategory(file.mimeType, file.name);
                  const Icon = getCategoryIcon(category);
                  return (
                    <div
                      key={file.id}
                      className="flex items-center justify-between px-3 py-2"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {file.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {(file.size / 1024).toFixed(0)} KB
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {file.r2Url && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => window.open(file.r2Url, "_blank")}
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-red-500 hover:text-red-600"
                          onClick={() =>
                            handleDeleteKnowledgeFile(file.id, file.name)
                          }
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="rounded-2xl sm:max-w-[900px] p-0 gap-0 overflow-hidden">
          <div className="flex h-[650px]">
            {/* Sidebar */}
            <div className="w-52 border-r bg-muted/30 p-3 flex-shrink-0">
              <DialogHeader className="px-2 pb-2">
                <DialogTitle className="text-sm">Project Settings</DialogTitle>
              </DialogHeader>
              <nav className="space-y-0.5">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveSection(item.id)}
                      className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-colors text-sm ${
                        activeSection === item.id
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:bg-background/50 hover:text-foreground"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-xs font-medium">{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto scrollbar-minimal">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-semibold">
                    {menuItems.find((m) => m.id === activeSection)?.label}
                  </h2>
                  {activeSection === "general" && (
                    <SaveStatusIndicator status={saveStatus} />
                  )}
                </div>
                {renderContent()}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Environment Variable Dialog */}
      <Dialog open={editEnvDialogOpen} onOpenChange={setEditEnvDialogOpen}>
        <DialogContent className="rounded-2xl sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Edit Variable</DialogTitle>
            <DialogDescription>
              Enter a new value for {editingEnvVar?.key}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label className="text-sm">New Value</Label>
            <Input
              type={editingEnvVar?.isSecret ? "password" : "text"}
              value={editEnvValue}
              onChange={(e) => setEditEnvValue(e.target.value)}
              placeholder="Enter new value..."
              className="rounded-lg font-mono mt-1"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditEnvDialogOpen(false)}
              className="rounded-lg"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateEnvVar}
              disabled={isUpdatingEnv || !editEnvValue}
              className="rounded-lg"
            >
              {isUpdatingEnv ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
    </div>
  );
}
