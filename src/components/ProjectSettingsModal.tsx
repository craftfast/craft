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
  Plus,
  X,
  Eye,
  EyeOff,
  Clock,
  FileText,
  Image as ImageIcon,
  Code2,
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
  | "integrations"
  | "collaborators"
  | "deployments"
  | "versions"
  | "knowledge"
  | "environment"
  | "views";

interface IntegrationConfig {
  enabled: boolean;
  apiKey?: string;
  config?: Record<string, string>;
}

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

  // Integrations
  const [integrations, setIntegrations] = useState<
    Record<string, IntegrationConfig>
  >({
    supabase: { enabled: false },
    supabaseStorage: { enabled: false },
    polar: { enabled: false },
    openpanel: { enabled: false },
    resend: { enabled: false },
    tawkto: { enabled: false },
    openrouter: { enabled: false },
    upstash: { enabled: false },
  });

  // Deployments
  const [vercelConnected, setVercelConnected] = useState(false);
  const [githubConnected, setGithubConnected] = useState(false);

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
      const response = await fetch(`/api/projects/${projectId}/settings`);
      if (response.ok) {
        const data = await response.json();
        if (data.integrations) setIntegrations(data.integrations);
        if (data.collaborators) setCollaborators(data.collaborators);
        if (data.versions) setVersions(data.versions);
        if (data.knowledgeFiles) setKnowledgeFiles(data.knowledgeFiles);
        if (data.environmentVariables)
          setEnvironmentVariables(data.environmentVariables);
        if (data.customViews) setCustomViews(data.customViews);
        if (data.deployments) {
          setVercelConnected(data.deployments.vercel || false);
          setGithubConnected(data.deployments.github || false);
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

  const handleSaveIntegration = async (
    integration: string,
    config: IntegrationConfig
  ) => {
    setIsSaving(true);
    try {
      const response = await fetch(
        `/api/projects/${projectId}/integrations/${integration}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(config),
        }
      );

      if (response.ok) {
        toast.success(`${integration} integration updated`);
        setIntegrations((prev) => ({ ...prev, [integration]: config }));
      } else {
        toast.error("Failed to update integration");
      }
    } catch (error) {
      toast.error("Failed to update integration");
    } finally {
      setIsSaving(false);
    }
  };

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
    { id: "integrations", label: "Integrations", icon: Blocks },
    { id: "environment", label: "Environment", icon: Lock },
    { id: "views", label: "Views", icon: Eye },
    { id: "collaborators", label: "Collaborators", icon: Users },
    { id: "deployments", label: "Deployments", icon: Cloud },
    { id: "versions", label: "Versions", icon: Clock },
    { id: "knowledge", label: "Knowledge", icon: FolderOpen },
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

            {/* Integrations Tab */}
            {activeTab === "integrations" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-semibold mb-2">Integrations</h2>
                  <p className="text-muted-foreground text-sm mb-6">
                    Connect external services to enhance your project
                  </p>

                  <div className="space-y-4">
                    {/* Supabase Database */}
                    <IntegrationCard
                      title="Supabase Database"
                      description="PostgreSQL database for your application"
                      icon={Database}
                      enabled={integrations.supabase.enabled}
                      onToggle={(enabled) => {
                        const config = { ...integrations.supabase, enabled };
                        handleSaveIntegration("supabase", config);
                      }}
                      fields={[
                        {
                          label: "Project URL",
                          placeholder: "https://xxxxx.supabase.co",
                          type: "text",
                        },
                        {
                          label: "Anon Key",
                          placeholder:
                            "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                          type: "password",
                        },
                      ]}
                    />

                    {/* Supabase Storage */}
                    <IntegrationCard
                      title="Supabase Storage"
                      description="File storage for images, documents, and more"
                      icon={HardDrive}
                      enabled={integrations.supabaseStorage.enabled}
                      onToggle={(enabled) => {
                        const config = {
                          ...integrations.supabaseStorage,
                          enabled,
                        };
                        handleSaveIntegration("supabaseStorage", config);
                      }}
                      fields={[
                        {
                          label: "Bucket Name",
                          placeholder: "my-bucket",
                          type: "text",
                        },
                      ]}
                    />

                    {/* Polar Payments */}
                    <IntegrationCard
                      title="Polar"
                      description="Accept payments and manage subscriptions"
                      icon={CreditCard}
                      enabled={integrations.polar.enabled}
                      onToggle={(enabled) => {
                        const config = { ...integrations.polar, enabled };
                        handleSaveIntegration("polar", config);
                      }}
                      fields={[
                        {
                          label: "Access Token",
                          placeholder: "polar_at_...",
                          type: "password",
                        },
                      ]}
                    />

                    {/* OpenPanel Analytics */}
                    <IntegrationCard
                      title="OpenPanel"
                      description="Privacy-friendly analytics for your app"
                      icon={BarChart3}
                      enabled={integrations.openpanel.enabled}
                      onToggle={(enabled) => {
                        const config = { ...integrations.openpanel, enabled };
                        handleSaveIntegration("openpanel", config);
                      }}
                      fields={[
                        {
                          label: "Client ID",
                          placeholder: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
                          type: "text",
                        },
                        {
                          label: "Client Secret",
                          placeholder: "secret_xxxxx",
                          type: "password",
                        },
                      ]}
                    />

                    {/* Resend Email */}
                    <IntegrationCard
                      title="Resend"
                      description="Send transactional emails"
                      icon={Mail}
                      enabled={integrations.resend.enabled}
                      onToggle={(enabled) => {
                        const config = { ...integrations.resend, enabled };
                        handleSaveIntegration("resend", config);
                      }}
                      fields={[
                        {
                          label: "API Key",
                          placeholder: "re_xxxxxxxxxxxx",
                          type: "password",
                        },
                      ]}
                    />

                    {/* Tawk.to Support */}
                    <IntegrationCard
                      title="Tawk.to"
                      description="Live chat support for your users"
                      icon={MessageCircle}
                      enabled={integrations.tawkto.enabled}
                      onToggle={(enabled) => {
                        const config = { ...integrations.tawkto, enabled };
                        handleSaveIntegration("tawkto", config);
                      }}
                      fields={[
                        {
                          label: "Property ID",
                          placeholder: "xxxxxxxxxxxxxxxx",
                          type: "text",
                        },
                        {
                          label: "Widget ID",
                          placeholder: "default",
                          type: "text",
                        },
                      ]}
                    />

                    {/* OpenRouter AI */}
                    <IntegrationCard
                      title="OpenRouter"
                      description="Access multiple AI models"
                      icon={Sparkles}
                      enabled={integrations.openrouter.enabled}
                      onToggle={(enabled) => {
                        const config = { ...integrations.openrouter, enabled };
                        handleSaveIntegration("openrouter", config);
                      }}
                      fields={[
                        {
                          label: "API Key",
                          placeholder: "sk-or-v1-xxxx",
                          type: "password",
                        },
                      ]}
                    />

                    {/* Upstash Redis */}
                    <IntegrationCard
                      title="Upstash Redis"
                      description="Serverless Redis for caching and rate limiting"
                      icon={Database}
                      enabled={integrations.upstash.enabled}
                      onToggle={(enabled) => {
                        const config = { ...integrations.upstash, enabled };
                        handleSaveIntegration("upstash", config);
                      }}
                      fields={[
                        {
                          label: "REST URL",
                          placeholder: "https://xxxxx.upstash.io",
                          type: "text",
                        },
                        {
                          label: "REST Token",
                          placeholder: "AXXXxxxx",
                          type: "password",
                        },
                      ]}
                    />
                  </div>
                </div>
              </div>
            )}

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
                              Deploy to Vercel with automatic builds
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
                              Sync code with GitHub repository
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
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full rounded-lg"
                          >
                            <GitBranch className="w-4 h-4 mr-2" />
                            View Repository
                          </Button>
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
interface IntegrationCardProps {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  fields?: Array<{
    label: string;
    placeholder: string;
    type: "text" | "password";
  }>;
}

function IntegrationCard({
  title,
  description,
  icon: Icon,
  enabled,
  onToggle,
  fields = [],
}: IntegrationCardProps) {
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});

  return (
    <div className="p-6 rounded-xl border">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-muted">
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        <Switch checked={enabled} onCheckedChange={onToggle} />
      </div>

      {enabled && fields.length > 0 && (
        <div className="space-y-3 mt-4 pt-4 border-t">
          {fields.map((field, index) => (
            <div key={index} className="space-y-1.5">
              <Label className="text-sm">{field.label}</Label>
              <div className="relative">
                <Input
                  type={
                    field.type === "password" && !showPassword[field.label]
                      ? "password"
                      : "text"
                  }
                  placeholder={field.placeholder}
                  value={fieldValues[field.label] || ""}
                  onChange={(e) =>
                    setFieldValues((prev) => ({
                      ...prev,
                      [field.label]: e.target.value,
                    }))
                  }
                  className="rounded-lg pr-10"
                />
                {field.type === "password" && (
                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword((prev) => ({
                        ...prev,
                        [field.label]: !prev[field.label],
                      }))
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword[field.label] ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            className="w-full rounded-lg mt-2"
          >
            Save Configuration
          </Button>
        </div>
      )}
    </div>
  );
}
