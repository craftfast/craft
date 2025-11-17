"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Settings,
  Blocks,
  Users,
  GitBranch,
  FolderOpen,
  Globe,
  Lock,
  Link2,
  Copy,
  Download,
  Share2,
  Trash2,
  Database,
  HardDrive,
  CreditCard,
  BarChart3,
  Mail,
  MessageCircle,
  Sparkles,
  Cloud,
  Github,
  Gitlab,
  Plus,
  X,
  Eye,
  EyeOff,
  Clock,
  FileText,
  Image as ImageIcon,
  Code2,
  Server,
  Zap,
  Rocket,
  Box,
} from "lucide-react";

interface ProjectSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
  projectDescription?: string | null;
  projectVisibility?: "public" | "secret" | "private";
}

type SettingsTab =
  | "general"
  | "collaborators"
  | "git"
  | "deployments"
  | "versions"
  | "knowledge"
  | "environment"
  | "views"
  | "usage-billing";

// IntegrationConfig moved to IntegrationsModal.tsx

interface Collaborator {
  id: string;
  email: string;
  role: "owner" | "editor" | "viewer";
  addedAt: string;
}

interface Version {
  id: string;
  name: string;
  createdAt: string;
  isCurrent: boolean;
}

export default function ProjectSettingsModal({
  isOpen,
  onClose,
  projectId,
  projectName: initialProjectName,
  projectDescription: initialProjectDescription,
  projectVisibility: initialProjectVisibility = "private",
}: ProjectSettingsModalProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");
  const [isSaving, setIsSaving] = useState(false);

  // General settings
  const [projectName, setProjectName] = useState(initialProjectName);
  const [projectDescription, setProjectDescription] = useState(
    initialProjectDescription || ""
  );
  const [visibility, setVisibility] = useState(initialProjectVisibility);

  // Note: Integrations have been moved to a separate IntegrationsModal

  // Git & Version Control
  const [githubConnected, setGithubConnected] = useState(false);
  const [gitlabConnected, setGitlabConnected] = useState(false);
  const [bitbucketConnected, setBitbucketConnected] = useState(false);

  // Deployments
  const [vercelConnected, setVercelConnected] = useState(false);
  const [netlifyConnected, setNetlifyConnected] = useState(false);
  const [railwayConnected, setRailwayConnected] = useState(false);
  const [renderConnected, setRenderConnected] = useState(false);
  const [awsConnected, setAwsConnected] = useState(false);
  const [digitalOceanConnected, setDigitalOceanConnected] = useState(false);
  const [herokuConnected, setHerokuConnected] = useState(false);

  // Collaborators
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [newCollaboratorEmail, setNewCollaboratorEmail] = useState("");

  // Versions
  const [versions, setVersions] = useState<Version[]>([]);

  // Knowledge
  const [knowledgeFiles, setKnowledgeFiles] = useState<
    Array<{ id: string; name: string; type: string; size: number }>
  >([]);

  // Environment Variables
  const [environmentVariables, setEnvironmentVariables] = useState<
    Array<{ id: string; key: string; value: string; isSecret: boolean }>
  >([]);
  const [newEnvKey, setNewEnvKey] = useState("");
  const [newEnvValue, setNewEnvValue] = useState("");
  const [newEnvIsSecret, setNewEnvIsSecret] = useState(true);

  // Custom Views
  const [customViews, setCustomViews] = useState<
    Array<{
      id: string;
      label: string;
      type: string;
      enabled: boolean;
      order: number;
    }>
  >([]);

  // Usage Tracking
  const [usageData, setUsageData] = useState({
    apiCalls: { current: 0, limit: 10000, percentage: 0 },
    aiTokens: { current: 0, limit: 1000000, percentage: 0 },
    storage: { current: 0, limit: 5000, percentage: 0 },
    bandwidth: { current: 0, limit: 100000, percentage: 0 },
    builds: { current: 0, limit: 100, percentage: 0 },
  });

  // Billing Integration
  const [billingIntegrations, setBillingIntegrations] = useState({
    stripe: { enabled: false, publicKey: "", secretKey: "" },
    paypal: { enabled: false, clientId: "", clientSecret: "" },
    paddle: { enabled: false, vendorId: "", apiKey: "" },
    lemonsqueezy: { enabled: false, storeId: "", apiKey: "" },
  });

  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  // Load project settings
  useEffect(() => {
    if (isOpen) {
      loadProjectSettings();
    }
  }, [isOpen, projectId]);

  const loadProjectSettings = async () => {
    try {
      // Load all data in parallel
      const [
        settingsRes,
        collaboratorsRes,
        versionsRes,
        knowledgeRes,
        envVarsRes,
        usageRes,
      ] = await Promise.all([
        fetch(`/api/projects/${projectId}/settings`),
        fetch(`/api/projects/${projectId}/collaborators`),
        fetch(`/api/projects/${projectId}/versions`),
        fetch(`/api/projects/${projectId}/knowledge`),
        fetch(`/api/projects/${projectId}/environment`),
        fetch(`/api/projects/${projectId}/usage`),
      ]);

      if (settingsRes.ok) {
        const data = await settingsRes.json();
        if (data.customViews) setCustomViews(data.customViews);
        if (data.git) {
          setGithubConnected(data.git.github || false);
          setGitlabConnected(data.git.gitlab || false);
          setBitbucketConnected(data.git.bitbucket || false);
        }
        if (data.deployments) {
          setVercelConnected(data.deployments.vercel || false);
          setNetlifyConnected(data.deployments.netlify || false);
          setRailwayConnected(data.deployments.railway || false);
          setRenderConnected(data.deployments.render || false);
          setAwsConnected(data.deployments.aws || false);
          setDigitalOceanConnected(data.deployments.digitalOcean || false);
          setHerokuConnected(data.deployments.heroku || false);
        }
      }

      if (collaboratorsRes.ok) {
        const data = await collaboratorsRes.json();
        if (Array.isArray(data)) setCollaborators(data);
      }

      if (versionsRes.ok) {
        const data = await versionsRes.json();
        if (data.versions) {
          setVersions(
            data.versions.map((v: any) => ({
              id: v.id,
              name: v.name || `Version ${v.version}`,
              createdAt: v.createdAt,
              isCurrent: v.version === data.currentVersion,
            }))
          );
        }
      }

      if (knowledgeRes.ok) {
        const data = await knowledgeRes.json();
        if (data.files) setKnowledgeFiles(data.files);
      }

      if (envVarsRes.ok) {
        const data = await envVarsRes.json();
        if (data.environmentVariables)
          setEnvironmentVariables(data.environmentVariables);
      }

      if (usageRes.ok) {
        const data = await usageRes.json();
        if (data.usage) setUsageData(data.usage);
        if (data.costs) {
          // Update billing integrations with real cost data
          // This would need to be properly structured based on your needs
        }
      }
    } catch (error) {
      console.error("Failed to load project settings:", error);
    }
  };

  const handleSaveGeneral = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: projectName,
          description: projectDescription,
          visibility,
        }),
      });

      if (response.ok) {
        toast.success("Project settings updated");
        onClose();
      } else {
        toast.error("Failed to update settings");
      }
    } catch (error) {
      toast.error("Failed to update settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDuplicateProject = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/duplicate`, {
        method: "POST",
      });
      if (response.ok) {
        toast.success("Project duplicated successfully");
      } else {
        toast.error("Failed to duplicate project");
      }
    } catch (error) {
      toast.error("Failed to duplicate project");
    }
  };

  const handleExportProject = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/export`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${projectName}.zip`;
        a.click();
        toast.success("Project exported successfully");
      } else {
        toast.error("Failed to export project");
      }
    } catch (error) {
      toast.error("Failed to export project");
    }
  };

  const handleDeleteProject = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this project? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        toast.success("Project deleted");
        window.location.href = "/";
      } else {
        toast.error("Failed to delete project");
      }
    } catch (error) {
      toast.error("Failed to delete project");
    }
  };

  // Note: Integration handling moved to separate IntegrationsModal

  const handleAddCollaborator = async () => {
    if (!newCollaboratorEmail) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/collaborators`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newCollaboratorEmail, role: "viewer" }),
      });

      if (response.ok) {
        const newCollaborator = await response.json();
        setCollaborators((prev) => [...prev, newCollaborator]);
        setNewCollaboratorEmail("");
        toast.success("Collaborator added");
      } else {
        toast.error("Failed to add collaborator");
      }
    } catch (error) {
      toast.error("Failed to add collaborator");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveCollaborator = async (collaboratorId: string) => {
    try {
      const response = await fetch(
        `/api/projects/${projectId}/collaborators/${collaboratorId}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        setCollaborators((prev) => prev.filter((c) => c.id !== collaboratorId));
        toast.success("Collaborator removed");
      } else {
        toast.error("Failed to remove collaborator");
      }
    } catch (error) {
      toast.error("Failed to remove collaborator");
    }
  };

  const handleUpdateCollaboratorRole = async (
    collaboratorId: string,
    role: "editor" | "viewer"
  ) => {
    try {
      const response = await fetch(
        `/api/projects/${projectId}/collaborators/${collaboratorId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role }),
        }
      );

      if (response.ok) {
        setCollaborators((prev) =>
          prev.map((c) => (c.id === collaboratorId ? { ...c, role } : c))
        );
        toast.success("Role updated");
      } else {
        toast.error("Failed to update role");
      }
    } catch (error) {
      toast.error("Failed to update role");
    }
  };

  const handleRestoreVersion = async (versionId: string) => {
    try {
      const response = await fetch(
        `/api/projects/${projectId}/versions/${versionId}/restore`,
        {
          method: "POST",
        }
      );

      if (response.ok) {
        toast.success("Version restored");
        loadProjectSettings();
      } else {
        toast.error("Failed to restore version");
      }
    } catch (error) {
      toast.error("Failed to restore version");
    }
  };

  const handleAddEnvironmentVariable = async () => {
    if (!newEnvKey || !newEnvValue) {
      toast.error("Key and value are required");
      return;
    }

    const newVar = {
      id: Date.now().toString(),
      key: newEnvKey,
      value: newEnvValue,
      isSecret: newEnvIsSecret,
    };

    setIsSaving(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/environment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newVar),
      });

      if (response.ok) {
        setEnvironmentVariables((prev) => [...prev, newVar]);
        setNewEnvKey("");
        setNewEnvValue("");
        setNewEnvIsSecret(false);
        toast.success("Environment variable added");
      } else {
        toast.error("Failed to add environment variable");
      }
    } catch (error) {
      toast.error("Failed to add environment variable");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveEnvironmentVariable = async (id: string) => {
    try {
      const response = await fetch(
        `/api/projects/${projectId}/environment/${id}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        setEnvironmentVariables((prev) => prev.filter((v) => v.id !== id));
        toast.success("Environment variable removed");
      } else {
        toast.error("Failed to remove environment variable");
      }
    } catch (error) {
      toast.error("Failed to remove environment variable");
    }
  };

  const handleToggleCustomView = async (viewId: string, enabled: boolean) => {
    setIsSaving(true);
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
      } else {
        toast.error("Failed to update view");
      }
    } catch (error) {
      toast.error("Failed to update view");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const tabs = [
    { id: "general", label: "General", icon: Settings },
    { id: "environment", label: "Environment", icon: Lock },
    { id: "views", label: "Views", icon: Eye },
    { id: "collaborators", label: "Collaborators", icon: Users },
    { id: "git", label: "Git & Version Control", icon: GitBranch },
    { id: "deployments", label: "Deployments", icon: Cloud },
    { id: "versions", label: "Versions", icon: Clock },
    { id: "knowledge", label: "Knowledge", icon: FolderOpen },
    { id: "usage-billing", label: "Usage & Billing", icon: BarChart3 },
  ];

  const modalContent = (
    <div
      className="fixed inset-0 bg-background animate-in fade-in duration-200 flex flex-col"
      onClick={(e) => e.stopPropagation()}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 99999,
        backgroundColor: "inherit",
      }}
    >
      {/* Top Header Bar */}
      <div className="flex-shrink-0 h-16 flex items-center justify-between px-6 bg-background border-b">
        <h1 className="text-xl font-semibold text-foreground">
          Project Settings
        </h1>
        <button
          onClick={onClose}
          className="p-2 rounded-full hover:bg-muted transition-colors"
        >
          <svg
            className="w-5 h-5 text-muted-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Modal Content */}
      <div className="flex-1 flex overflow-hidden bg-background">
        {/* Left Sidebar - Menu */}
        <div className="w-64 flex-shrink-0 overflow-y-auto bg-background border-r [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-muted-foreground/30 [&::-webkit-scrollbar-thumb]:rounded-full">
          <div className="p-4 space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as SettingsTab)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors ${
                    activeTab === tab.id
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:bg-muted/50"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-muted-foreground/30 [&::-webkit-scrollbar-thumb]:rounded-full">
          <div className="max-w-3xl mx-auto p-8">
            {/* General Tab */}
            {activeTab === "general" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-semibold mb-6">
                    General Settings
                  </h2>

                  <div className="space-y-6">
                    {/* Project Name */}
                    <div className="space-y-2">
                      <Label htmlFor="project-name">Project Name</Label>
                      <Input
                        id="project-name"
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                        placeholder="My Awesome Project"
                        className="rounded-lg"
                      />
                    </div>

                    {/* Project Description */}
                    <div className="space-y-2">
                      <Label htmlFor="project-description">Description</Label>
                      <Textarea
                        id="project-description"
                        value={projectDescription}
                        onChange={(e) => setProjectDescription(e.target.value)}
                        placeholder="Describe your project..."
                        className="rounded-lg min-h-[100px]"
                      />
                    </div>

                    {/* Visibility */}
                    <div className="space-y-2">
                      <Label>Visibility</Label>
                      <div className="grid gap-3">
                        <button
                          onClick={() => setVisibility("public")}
                          className={`flex items-start gap-3 p-4 rounded-xl border-2 transition-colors ${
                            visibility === "public"
                              ? "border-foreground bg-muted"
                              : "border-border hover:border-muted-foreground"
                          }`}
                        >
                          <Globe className="w-5 h-5 text-muted-foreground mt-0.5" />
                          <div className="flex-1 text-left">
                            <div className="font-medium">Public</div>
                            <div className="text-sm text-muted-foreground">
                              Everyone can view this project
                            </div>
                          </div>
                        </button>

                        <button
                          onClick={() => setVisibility("secret")}
                          className={`flex items-start gap-3 p-4 rounded-xl border-2 transition-colors ${
                            visibility === "secret"
                              ? "border-foreground bg-muted"
                              : "border-border hover:border-muted-foreground"
                          }`}
                        >
                          <Link2 className="w-5 h-5 text-muted-foreground mt-0.5" />
                          <div className="flex-1 text-left">
                            <div className="font-medium">Secret</div>
                            <div className="text-sm text-muted-foreground">
                              Accessible via shared URL only
                            </div>
                          </div>
                        </button>

                        <button
                          onClick={() => setVisibility("private")}
                          className={`flex items-start gap-3 p-4 rounded-xl border-2 transition-colors ${
                            visibility === "private"
                              ? "border-foreground bg-muted"
                              : "border-border hover:border-muted-foreground"
                          }`}
                        >
                          <Lock className="w-5 h-5 text-muted-foreground mt-0.5" />
                          <div className="flex-1 text-left">
                            <div className="font-medium">Private</div>
                            <div className="text-sm text-muted-foreground">
                              Only you can access this project
                            </div>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="space-y-3 pt-4 border-t">
                      <h3 className="text-sm font-medium text-muted-foreground">
                        Actions
                      </h3>

                      <div className="grid gap-2">
                        <Button
                          variant="outline"
                          className="w-full justify-start rounded-lg"
                          onClick={handleDuplicateProject}
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          Duplicate Project
                        </Button>

                        <Button
                          variant="outline"
                          className="w-full justify-start rounded-lg"
                          onClick={handleExportProject}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Export Project
                        </Button>

                        <Button
                          variant="outline"
                          className="w-full justify-start rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                          onClick={handleDeleteProject}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Project
                        </Button>
                      </div>
                    </div>

                    {/* Save Button */}
                    <div className="flex justify-end pt-4">
                      <Button
                        onClick={handleSaveGeneral}
                        disabled={isSaving}
                        className="rounded-full"
                      >
                        {isSaving ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Note: Integrations tab moved to separate IntegrationsModal */}

            {/* Collaborators Tab */}
            {activeTab === "collaborators" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-semibold mb-2">Collaborators</h2>
                  <p className="text-muted-foreground text-sm mb-6">
                    Manage who can access and edit this project
                  </p>

                  {/* Add Collaborator */}
                  <div className="flex gap-2 mb-6">
                    <Input
                      type="email"
                      placeholder="Email address"
                      value={newCollaboratorEmail}
                      onChange={(e) => setNewCollaboratorEmail(e.target.value)}
                      className="rounded-lg"
                    />
                    <Button
                      onClick={handleAddCollaborator}
                      disabled={isSaving || !newCollaboratorEmail}
                      className="rounded-full"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add
                    </Button>
                  </div>

                  {/* Collaborators List */}
                  <div className="space-y-3">
                    {collaborators.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>No collaborators yet</p>
                        <p className="text-sm mt-1">
                          Add team members to work together
                        </p>
                      </div>
                    ) : (
                      collaborators.map((collaborator) => (
                        <div
                          key={collaborator.id}
                          className="flex items-center justify-between p-4 rounded-xl border"
                        >
                          <div className="flex-1">
                            <div className="font-medium">
                              {collaborator.email}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Added{" "}
                              {new Date(
                                collaborator.addedAt
                              ).toLocaleDateString()}
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            {collaborator.role !== "owner" && (
                              <>
                                <Select
                                  value={collaborator.role}
                                  onValueChange={(value) =>
                                    handleUpdateCollaboratorRole(
                                      collaborator.id,
                                      value as "editor" | "viewer"
                                    )
                                  }
                                >
                                  <SelectTrigger className="w-32 rounded-lg">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="rounded-xl">
                                    <SelectItem
                                      value="editor"
                                      className="rounded-lg"
                                    >
                                      Editor
                                    </SelectItem>
                                    <SelectItem
                                      value="viewer"
                                      className="rounded-lg"
                                    >
                                      Viewer
                                    </SelectItem>
                                  </SelectContent>
                                </Select>

                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleRemoveCollaborator(collaborator.id)
                                  }
                                  className="rounded-lg"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                            {collaborator.role === "owner" && (
                              <span className="text-sm text-muted-foreground px-3">
                                Owner
                              </span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Deployments Tab */}
            {activeTab === "deployments" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-semibold mb-2">Deployments</h2>
                  <p className="text-muted-foreground text-sm mb-6">
                    Deploy and sync your project with external services
                  </p>

                  <div className="space-y-4">
                    {/* Vercel */}
                    <div className="p-6 rounded-xl border">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-muted">
                            <Cloud className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-semibold">Vercel</h3>
                            <p className="text-sm text-muted-foreground">
                              Deploy to Vercel with automatic builds and preview
                              deployments
                            </p>
                          </div>
                        </div>
                        <Switch
                          checked={vercelConnected}
                          onCheckedChange={setVercelConnected}
                        />
                      </div>

                      {vercelConnected && (
                        <div className="space-y-3 mt-4 pt-4 border-t">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              Status
                            </span>
                            <span className="text-green-600 font-medium">
                              Connected
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              Project
                            </span>
                            <span>my-project-xyz</span>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full rounded-lg"
                          >
                            Configure Deployment
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Netlify */}
                    <div className="p-6 rounded-xl border">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-muted">
                            <Zap className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-semibold">Netlify</h3>
                            <p className="text-sm text-muted-foreground">
                              Deploy with Netlify's global CDN and continuous
                              deployment
                            </p>
                          </div>
                        </div>
                        <Switch
                          checked={netlifyConnected}
                          onCheckedChange={setNetlifyConnected}
                        />
                      </div>

                      {netlifyConnected && (
                        <div className="space-y-3 mt-4 pt-4 border-t">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              Status
                            </span>
                            <span className="text-green-600 font-medium">
                              Connected
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              Site ID
                            </span>
                            <span>site-abc-123</span>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full rounded-lg"
                          >
                            View Site Dashboard
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Railway */}
                    <div className="p-6 rounded-xl border">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-muted">
                            <Rocket className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-semibold">Railway</h3>
                            <p className="text-sm text-muted-foreground">
                              Deploy full-stack apps with Railway's instant
                              deployments
                            </p>
                          </div>
                        </div>
                        <Switch
                          checked={railwayConnected}
                          onCheckedChange={setRailwayConnected}
                        />
                      </div>

                      {railwayConnected && (
                        <div className="space-y-3 mt-4 pt-4 border-t">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              Status
                            </span>
                            <span className="text-green-600 font-medium">
                              Connected
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              Environment
                            </span>
                            <span>production</span>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full rounded-lg"
                          >
                            Open Railway Dashboard
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Render */}
                    <div className="p-6 rounded-xl border">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-muted">
                            <Server className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-semibold">Render</h3>
                            <p className="text-sm text-muted-foreground">
                              Deploy web services and static sites on Render's
                              infrastructure
                            </p>
                          </div>
                        </div>
                        <Switch
                          checked={renderConnected}
                          onCheckedChange={setRenderConnected}
                        />
                      </div>

                      {renderConnected && (
                        <div className="space-y-3 mt-4 pt-4 border-t">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              Status
                            </span>
                            <span className="text-green-600 font-medium">
                              Connected
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              Service Type
                            </span>
                            <span>Web Service</span>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full rounded-lg"
                          >
                            Manage Service
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* AWS */}
                    <div className="p-6 rounded-xl border">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-muted">
                            <Box className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-semibold">AWS Amplify</h3>
                            <p className="text-sm text-muted-foreground">
                              Deploy to AWS Amplify with CI/CD and hosting
                            </p>
                          </div>
                        </div>
                        <Switch
                          checked={awsConnected}
                          onCheckedChange={setAwsConnected}
                        />
                      </div>

                      {awsConnected && (
                        <div className="space-y-3 mt-4 pt-4 border-t">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              Status
                            </span>
                            <span className="text-green-600 font-medium">
                              Connected
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              Region
                            </span>
                            <span>us-east-1</span>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full rounded-lg"
                          >
                            View AWS Console
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* DigitalOcean */}
                    <div className="p-6 rounded-xl border">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-muted">
                            <Cloud className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-semibold">
                              DigitalOcean App Platform
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              Deploy apps on DigitalOcean's App Platform with
                              auto-scaling
                            </p>
                          </div>
                        </div>
                        <Switch
                          checked={digitalOceanConnected}
                          onCheckedChange={setDigitalOceanConnected}
                        />
                      </div>

                      {digitalOceanConnected && (
                        <div className="space-y-3 mt-4 pt-4 border-t">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              Status
                            </span>
                            <span className="text-green-600 font-medium">
                              Connected
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              App ID
                            </span>
                            <span>app-do-xyz</span>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full rounded-lg"
                          >
                            Open App Console
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Heroku */}
                    <div className="p-6 rounded-xl border">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-muted">
                            <Server className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-semibold">Heroku</h3>
                            <p className="text-sm text-muted-foreground">
                              Deploy to Heroku with Git-based deployments and
                              add-ons
                            </p>
                          </div>
                        </div>
                        <Switch
                          checked={herokuConnected}
                          onCheckedChange={setHerokuConnected}
                        />
                      </div>

                      {herokuConnected && (
                        <div className="space-y-3 mt-4 pt-4 border-t">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              Status
                            </span>
                            <span className="text-green-600 font-medium">
                              Connected
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              App Name
                            </span>
                            <span>my-heroku-app</span>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full rounded-lg"
                          >
                            Manage Heroku App
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Git & Version Control Tab */}
            {activeTab === "git" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-semibold mb-2">
                    Git & Version Control
                  </h2>
                  <p className="text-muted-foreground text-sm mb-6">
                    Connect your project to Git repositories for version control
                    and collaboration
                  </p>

                  <div className="space-y-4">
                    {/* GitHub */}
                    <div className="p-6 rounded-xl border">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-muted">
                            <Github className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-semibold">GitHub</h3>
                            <p className="text-sm text-muted-foreground">
                              Sync code with GitHub repository for version
                              control and CI/CD
                            </p>
                          </div>
                        </div>
                        <Switch
                          checked={githubConnected}
                          onCheckedChange={setGithubConnected}
                        />
                      </div>

                      {githubConnected && (
                        <div className="space-y-3 mt-4 pt-4 border-t">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              Status
                            </span>
                            <span className="text-green-600 font-medium">
                              Connected
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              Repository
                            </span>
                            <span>username/repo-name</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              Branch
                            </span>
                            <span>main</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 mt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="rounded-lg"
                            >
                              <GitBranch className="w-4 h-4 mr-2" />
                              View Repo
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="rounded-lg"
                            >
                              Configure
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* GitLab */}
                    <div className="p-6 rounded-xl border">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-muted">
                            <Gitlab className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-semibold">GitLab</h3>
                            <p className="text-sm text-muted-foreground">
                              Integrate with GitLab for DevOps and version
                              control
                            </p>
                          </div>
                        </div>
                        <Switch
                          checked={gitlabConnected}
                          onCheckedChange={setGitlabConnected}
                        />
                      </div>

                      {gitlabConnected && (
                        <div className="space-y-3 mt-4 pt-4 border-t">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              Status
                            </span>
                            <span className="text-green-600 font-medium">
                              Connected
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              Project
                            </span>
                            <span>group/project-name</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              Branch
                            </span>
                            <span>main</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 mt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="rounded-lg"
                            >
                              <GitBranch className="w-4 h-4 mr-2" />
                              View Project
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="rounded-lg"
                            >
                              Configure
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Bitbucket */}
                    <div className="p-6 rounded-xl border">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-muted">
                            <GitBranch className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-semibold">Bitbucket</h3>
                            <p className="text-sm text-muted-foreground">
                              Connect to Bitbucket for Git repositories and
                              pipelines
                            </p>
                          </div>
                        </div>
                        <Switch
                          checked={bitbucketConnected}
                          onCheckedChange={setBitbucketConnected}
                        />
                      </div>

                      {bitbucketConnected && (
                        <div className="space-y-3 mt-4 pt-4 border-t">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              Status
                            </span>
                            <span className="text-green-600 font-medium">
                              Connected
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              Repository
                            </span>
                            <span>workspace/repo-name</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              Branch
                            </span>
                            <span>main</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 mt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="rounded-lg"
                            >
                              <GitBranch className="w-4 h-4 mr-2" />
                              View Repo
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="rounded-lg"
                            >
                              Configure
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Versions Tab */}
            {activeTab === "versions" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-semibold mb-2">Versions</h2>
                  <p className="text-muted-foreground text-sm mb-6">
                    View and restore previous versions of your project
                  </p>

                  <div className="space-y-3">
                    {versions.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>No versions yet</p>
                        <p className="text-sm mt-1">
                          Versions are created automatically
                        </p>
                      </div>
                    ) : (
                      versions.map((version) => (
                        <div
                          key={version.id}
                          className="flex items-center justify-between p-4 rounded-xl border"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {version.name}
                              </span>
                              {version.isCurrent && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                                  Current
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {new Date(version.createdAt).toLocaleString()}
                            </div>
                          </div>

                          {!version.isCurrent && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRestoreVersion(version.id)}
                              className="rounded-lg"
                            >
                              Restore
                            </Button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Knowledge Tab */}
            {activeTab === "knowledge" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-semibold mb-2">Knowledge</h2>
                  <p className="text-muted-foreground text-sm mb-6">
                    Add design files, documentation, and context for AI
                  </p>

                  {/* Upload Area */}
                  <div className="border-2 border-dashed border-border rounded-xl p-8 text-center mb-6 hover:border-muted-foreground transition-colors cursor-pointer">
                    <FileText className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                    <p className="font-medium mb-1">
                      Drop files here or click to upload
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Supports images, PDFs, and text files
                    </p>
                  </div>

                  {/* Files List */}
                  <div className="space-y-3">
                    {knowledgeFiles.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <p className="text-sm">No files uploaded yet</p>
                      </div>
                    ) : (
                      knowledgeFiles.map((file) => (
                        <div
                          key={file.id}
                          className="flex items-center justify-between p-4 rounded-xl border"
                        >
                          <div className="flex items-center gap-3">
                            {file.type.startsWith("image/") ? (
                              <ImageIcon className="w-5 h-5 text-muted-foreground" />
                            ) : (
                              <FileText className="w-5 h-5 text-muted-foreground" />
                            )}
                            <div>
                              <div className="font-medium">{file.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {(file.size / 1024).toFixed(2)} KB
                              </div>
                            </div>
                          </div>

                          <Button
                            variant="ghost"
                            size="sm"
                            className="rounded-lg"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Environment Variables Tab */}
            {activeTab === "environment" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-semibold mb-2">
                    Environment Variables
                  </h2>
                  <p className="text-muted-foreground text-sm mb-6">
                    Manage environment variables for your project
                  </p>

                  {/* Add New Variable */}
                  <div className="space-y-4 mb-6 p-4 rounded-xl border">
                    <div className="space-y-2">
                      <Label htmlFor="env-key">Key</Label>
                      <Input
                        id="env-key"
                        value={newEnvKey}
                        onChange={(e) => setNewEnvKey(e.target.value)}
                        placeholder="DATABASE_URL"
                        className="rounded-lg"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="env-value">Value</Label>
                      <Input
                        id="env-value"
                        type={newEnvIsSecret ? "password" : "text"}
                        value={newEnvValue}
                        onChange={(e) => setNewEnvValue(e.target.value)}
                        placeholder="postgresql://..."
                        className="rounded-lg"
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="env-secret"
                        checked={!newEnvIsSecret}
                        onCheckedChange={(checked) =>
                          setNewEnvIsSecret(!checked)
                        }
                      />
                      <Label htmlFor="env-secret" className="cursor-pointer">
                        Make public (accessible to UI)
                      </Label>
                      <span className="text-xs text-muted-foreground">
                        (Secret by default)
                      </span>
                    </div>

                    <Button
                      onClick={handleAddEnvironmentVariable}
                      disabled={isSaving || !newEnvKey || !newEnvValue}
                      className="w-full rounded-full"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Variable
                    </Button>
                  </div>

                  {/* Variables List */}
                  <div className="space-y-3">
                    {environmentVariables.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <Lock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>No environment variables yet</p>
                        <p className="text-sm mt-1">
                          Add variables to configure your project
                        </p>
                      </div>
                    ) : (
                      environmentVariables.map((envVar) => (
                        <div
                          key={envVar.id}
                          className="flex items-center justify-between p-4 rounded-xl border"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium font-mono text-sm">
                                {envVar.key}
                              </span>
                              {envVar.isSecret && (
                                <Lock className="w-3 h-3 text-muted-foreground" />
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground font-mono truncate mt-1">
                              {envVar.isSecret ? "••••••••" : envVar.value}
                            </div>
                          </div>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleRemoveEnvironmentVariable(envVar.id)
                            }
                            className="rounded-lg flex-shrink-0"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Usage & Billing Tab */}
            {activeTab === "usage-billing" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-semibold mb-2">
                    Usage & Billing
                  </h2>
                  <p className="text-muted-foreground text-sm mb-6">
                    Track usage metrics and costs for enabled services and
                    integrations
                  </p>

                  {/* Usage Overview Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {/* API Calls */}
                    <div className="p-5 rounded-xl border bg-gradient-to-br from-background to-muted/20">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Zap className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
                          <h3 className="font-semibold">API Calls</h3>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          This month
                        </span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-bold">
                            {usageData.apiCalls.current.toLocaleString()}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            / {usageData.apiCalls.limit.toLocaleString()}
                          </span>
                        </div>
                        <div className="w-full bg-neutral-200 dark:bg-neutral-800 rounded-full h-2">
                          <div
                            className="bg-neutral-600 dark:bg-neutral-400 h-2 rounded-full transition-all"
                            style={{
                              width: `${usageData.apiCalls.percentage}%`,
                            }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {usageData.apiCalls.percentage}% used
                        </p>
                      </div>
                    </div>

                    {/* AI Tokens */}
                    <div className="p-5 rounded-xl border bg-gradient-to-br from-background to-muted/20">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
                          <h3 className="font-semibold">AI Tokens</h3>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          This month
                        </span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-bold">
                            {(usageData.aiTokens.current / 1000).toFixed(1)}K
                          </span>
                          <span className="text-sm text-muted-foreground">
                            / {(usageData.aiTokens.limit / 1000).toFixed(0)}K
                          </span>
                        </div>
                        <div className="w-full bg-neutral-200 dark:bg-neutral-800 rounded-full h-2">
                          <div
                            className="bg-neutral-600 dark:bg-neutral-400 h-2 rounded-full transition-all"
                            style={{
                              width: `${usageData.aiTokens.percentage}%`,
                            }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {usageData.aiTokens.percentage}% used
                        </p>
                      </div>
                    </div>

                    {/* Storage */}
                    <div className="p-5 rounded-xl border bg-gradient-to-br from-background to-muted/20">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <HardDrive className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
                          <h3 className="font-semibold">Storage</h3>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          Current
                        </span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-bold">
                            {(usageData.storage.current / 1000).toFixed(2)}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            GB / {(usageData.storage.limit / 1000).toFixed(0)}{" "}
                            GB
                          </span>
                        </div>
                        <div className="w-full bg-neutral-200 dark:bg-neutral-800 rounded-full h-2">
                          <div
                            className="bg-neutral-600 dark:bg-neutral-400 h-2 rounded-full transition-all"
                            style={{
                              width: `${usageData.storage.percentage}%`,
                            }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {usageData.storage.percentage}% used
                        </p>
                      </div>
                    </div>

                    {/* Bandwidth */}
                    <div className="p-5 rounded-xl border bg-gradient-to-br from-background to-muted/20">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Globe className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
                          <h3 className="font-semibold">Bandwidth</h3>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          This month
                        </span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-bold">
                            {(usageData.bandwidth.current / 1000).toFixed(1)}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            GB / {(usageData.bandwidth.limit / 1000).toFixed(0)}{" "}
                            GB
                          </span>
                        </div>
                        <div className="w-full bg-neutral-200 dark:bg-neutral-800 rounded-full h-2">
                          <div
                            className="bg-neutral-600 dark:bg-neutral-400 h-2 rounded-full transition-all"
                            style={{
                              width: `${usageData.bandwidth.percentage}%`,
                            }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {usageData.bandwidth.percentage}% used
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Usage Details */}
                  <div className="p-5 rounded-xl border">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <BarChart3 className="w-5 h-5" />
                      Usage Breakdown
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between py-3 border-b last:border-0">
                        <div className="flex items-center gap-3">
                          <Rocket className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">Builds & Deployments</p>
                            <p className="text-xs text-muted-foreground">
                              Total builds this month
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">
                            {usageData.builds.current} /{" "}
                            {usageData.builds.limit}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {usageData.builds.percentage}% used
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between py-3 border-b last:border-0">
                        <div className="flex items-center gap-3">
                          <Server className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">Function Invocations</p>
                            <p className="text-xs text-muted-foreground">
                              Serverless function calls
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">0 / ∞</p>
                          <p className="text-xs text-muted-foreground">
                            Unlimited
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between py-3">
                        <div className="flex items-center gap-3">
                          <Database className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">Database Queries</p>
                            <p className="text-xs text-muted-foreground">
                              Total DB operations
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">0 / ∞</p>
                          <p className="text-xs text-muted-foreground">
                            Unlimited
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Service Costs Section */}
                <div className="mb-6">
                  <h3 className="font-semibold text-lg mb-4">Service Costs</h3>

                  {/* Current Billing Period */}
                  <div className="p-6 rounded-xl border bg-gradient-to-br from-background to-muted/30 mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold">
                          Current Billing Period
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Nov 1 - Nov 30, 2025
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-bold">$24.67</p>
                        <p className="text-xs text-muted-foreground">
                          Total charges
                        </p>
                      </div>
                    </div>
                    <div className="w-full bg-neutral-200 dark:bg-neutral-800 rounded-full h-2">
                      <div
                        className="bg-neutral-600 dark:bg-neutral-400 h-2 rounded-full transition-all"
                        style={{ width: "45%" }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      45% through billing period
                    </p>
                  </div>

                  {/* Service Costs Breakdown */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                      <Database className="w-5 h-5" />
                      Active Services & Costs
                    </h3>

                    {/* Neon Database */}
                    <div className="p-5 rounded-xl border bg-gradient-to-br from-background to-muted/20">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-neutral-600 to-neutral-800 flex items-center justify-center">
                            <Database className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h3 className="font-semibold flex items-center gap-2">
                              Neon Database
                              <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                                Active
                              </span>
                            </h3>
                            <p className="text-xs text-muted-foreground">
                              PostgreSQL serverless database
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold">$12.50</p>
                          <p className="text-xs text-muted-foreground">
                            This month
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Storage</span>
                          <span className="font-medium">2.4 GB / 10 GB</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            Compute hours
                          </span>
                          <span className="font-medium">145 hrs</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            Data transfer
                          </span>
                          <span className="font-medium">3.2 GB</span>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-4 rounded-full"
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Manage Neon Integration
                      </Button>
                    </div>

                    {/* Vercel Hosting */}
                    <div className="p-5 rounded-xl border bg-gradient-to-br from-background to-muted/20">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-neutral-700 to-neutral-900 flex items-center justify-center">
                            <Cloud className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h3 className="font-semibold flex items-center gap-2">
                              Vercel Hosting
                              <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                                Active
                              </span>
                            </h3>
                            <p className="text-xs text-muted-foreground">
                              Deployment and edge functions
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold">$8.00</p>
                          <p className="text-xs text-muted-foreground">
                            This month
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            Deployments
                          </span>
                          <span className="font-medium">47 builds</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            Bandwidth
                          </span>
                          <span className="font-medium">12.8 GB</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            Function invocations
                          </span>
                          <span className="font-medium">1.2M calls</span>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-4 rounded-full"
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Manage Vercel Integration
                      </Button>
                    </div>

                    {/* Anthropic AI */}
                    <div className="p-5 rounded-xl border bg-gradient-to-br from-background to-muted/20">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-neutral-500 to-neutral-700 flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h3 className="font-semibold flex items-center gap-2">
                              Anthropic (Claude)
                              <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                                Active
                              </span>
                            </h3>
                            <p className="text-xs text-muted-foreground">
                              AI model API usage
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold">$3.45</p>
                          <p className="text-xs text-muted-foreground">
                            This month
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            Input tokens
                          </span>
                          <span className="font-medium">245K tokens</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            Output tokens
                          </span>
                          <span className="font-medium">89K tokens</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            API calls
                          </span>
                          <span className="font-medium">1,247 requests</span>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-4 rounded-full"
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Manage AI Integration
                      </Button>
                    </div>

                    {/* Uploadthing Storage */}
                    <div className="p-5 rounded-xl border bg-gradient-to-br from-background to-muted/20">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-neutral-600 to-neutral-800 flex items-center justify-center">
                            <HardDrive className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h3 className="font-semibold flex items-center gap-2">
                              UploadThing
                              <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                                Active
                              </span>
                            </h3>
                            <p className="text-xs text-muted-foreground">
                              File storage and CDN
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold">$0.72</p>
                          <p className="text-xs text-muted-foreground">
                            This month
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            Storage used
                          </span>
                          <span className="font-medium">1.2 GB</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            Files uploaded
                          </span>
                          <span className="font-medium">324 files</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            Bandwidth
                          </span>
                          <span className="font-medium">4.1 GB</span>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-4 rounded-full"
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Manage Storage Integration
                      </Button>
                    </div>

                    {/* Inactive/Available Services */}
                    <div className="p-5 rounded-xl border border-dashed">
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        Available Integrations
                      </h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                          <div className="flex items-center gap-3">
                            <Server className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium text-sm">Supabase</p>
                              <p className="text-xs text-muted-foreground">
                                Auth & Database
                              </p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-full"
                          >
                            Enable
                          </Button>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                          <div className="flex items-center gap-3">
                            <Mail className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium text-sm">Resend</p>
                              <p className="text-xs text-muted-foreground">
                                Email service
                              </p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-full"
                          >
                            Enable
                          </Button>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                          <div className="flex items-center gap-3">
                            <Zap className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium text-sm">Stripe</p>
                              <p className="text-xs text-muted-foreground">
                                Payment processing
                              </p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-full"
                          >
                            Enable
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Cost Summary & Actions */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                    <div className="p-5 rounded-xl border bg-muted/30">
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5" />
                        Cost Breakdown
                      </h3>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            Database (Neon)
                          </span>
                          <span className="font-medium">$12.50</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            Hosting (Vercel)
                          </span>
                          <span className="font-medium">$8.00</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            AI (Anthropic)
                          </span>
                          <span className="font-medium">$3.45</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            Storage (UploadThing)
                          </span>
                          <span className="font-medium">$0.72</span>
                        </div>
                        <div className="flex justify-between text-sm pt-2 border-t font-semibold">
                          <span>Total</span>
                          <span>$24.67</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-5 rounded-xl border bg-muted/30">
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <Clock className="w-5 h-5" />
                        Billing Settings
                      </h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Cost alerts</span>
                          <Switch defaultChecked />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Auto-pay</span>
                          <Switch defaultChecked />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Monthly reports</span>
                          <Switch defaultChecked />
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-4 rounded-full"
                      >
                        <CreditCard className="w-4 h-4 mr-2" />
                        Payment Methods
                      </Button>
                    </div>
                  </div>

                  {/* Export & History */}
                  <div className="flex gap-3 mt-6">
                    <Button variant="outline" className="rounded-full flex-1">
                      <Download className="w-4 h-4 mr-2" />
                      Download Invoice
                    </Button>
                    <Button variant="outline" className="rounded-full flex-1">
                      <FileText className="w-4 h-4 mr-2" />
                      View History
                    </Button>
                    <Button variant="outline" className="rounded-full flex-1">
                      <Mail className="w-4 h-4 mr-2" />
                      Email Report
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Custom Views Tab */}
            {activeTab === "views" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-semibold mb-2">Custom Views</h2>
                  <p className="text-muted-foreground text-sm mb-6">
                    Configure which views appear in the preview dropdown
                  </p>

                  <div className="space-y-3">
                    {/* Default Views (always shown) */}
                    <div className="p-4 rounded-xl border bg-muted/30">
                      <h3 className="text-sm font-semibold mb-3 text-muted-foreground">
                        Default Views (Always Visible)
                      </h3>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-3 rounded-lg bg-background">
                          <div className="flex items-center gap-3">
                            <Eye className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium">Preview</span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            Required
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-background">
                          <div className="flex items-center gap-3">
                            <Code2 className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium">Code</span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            Required
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Custom/Optional Views */}
                    <div>
                      <h3 className="text-sm font-semibold mb-3 text-muted-foreground">
                        Additional Views
                      </h3>
                      <div className="space-y-2">
                        {[
                          { id: "database", label: "Database", icon: Database },
                          {
                            id: "storage",
                            label: "Storage",
                            icon: HardDrive,
                          },
                          { id: "logs", label: "Logs", icon: FileText },
                          { id: "auth", label: "Auth", icon: Lock },
                          { id: "git", label: "Git", icon: GitBranch },
                          {
                            id: "dashboard",
                            label: "Dashboard",
                            icon: BarChart3,
                          },
                          { id: "chat", label: "Chat", icon: MessageCircle },
                          {
                            id: "deployment",
                            label: "Deployment",
                            icon: Cloud,
                          },
                        ].map((viewType) => {
                          const view = customViews.find(
                            (v) => v.id === viewType.id
                          ) || {
                            id: viewType.id,
                            label: viewType.label,
                            type: viewType.id,
                            enabled: false,
                            order: 0,
                          };

                          return (
                            <div
                              key={viewType.id}
                              className="flex items-center justify-between p-4 rounded-xl border"
                            >
                              <div className="flex items-center gap-3">
                                <viewType.icon className="w-4 h-4 text-muted-foreground" />
                                <div>
                                  <div className="font-medium">
                                    {viewType.label}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {viewType.id === "database" &&
                                      "View and manage database tables"}
                                    {viewType.id === "storage" &&
                                      "Browse file storage"}
                                    {viewType.id === "logs" &&
                                      "Real-time application logs"}
                                    {viewType.id === "auth" &&
                                      "User authentication management"}
                                    {viewType.id === "git" &&
                                      "Git history, branches, and commits"}
                                    {viewType.id === "dashboard" &&
                                      "Analytics and metrics"}
                                    {viewType.id === "chat" &&
                                      "In-app chat interface"}
                                    {viewType.id === "deployment" &&
                                      "Deployment status and history"}
                                  </div>
                                </div>
                              </div>

                              <Switch
                                checked={view.enabled}
                                onCheckedChange={(enabled) =>
                                  handleToggleCustomView(viewType.id, enabled)
                                }
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return typeof document !== "undefined"
    ? createPortal(modalContent, document.body)
    : null;
}

// Integration Card Component
// IntegrationCard component moved to IntegrationsModal.tsx
