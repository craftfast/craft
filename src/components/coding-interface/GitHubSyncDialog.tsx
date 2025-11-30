"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Github,
  CheckCircle2,
  Loader2,
  Link2,
  ExternalLink,
  GitBranch,
  Upload,
  Download,
  RefreshCw,
  Search,
  Lock,
  Unlock,
  AlertCircle,
  Unlink,
  FolderGit2,
  Plus,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface GitHubSyncDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  onFilesUpdated?: () => void;
}

interface IntegrationStatus {
  connected: boolean;
  installed?: boolean;
  login?: string;
  username?: string;
}

interface GitHubRepo {
  id: number;
  name: string;
  fullName: string;
  private: boolean;
  defaultBranch: string;
  htmlUrl: string;
  description: string | null;
  updatedAt: string;
  language: string | null;
  stars: number;
  owner: {
    login: string;
    avatarUrl: string;
  };
  linkedProjectId: string | null;
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

export default function GitHubSyncDialog({
  open,
  onOpenChange,
  projectId,
  onFilesUpdated,
}: GitHubSyncDialogProps) {
  const [githubStatus, setGithubStatus] = useState<IntegrationStatus | null>(
    null
  );
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [isLoadingRepos, setIsLoadingRepos] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepo | null>(null);
  const [isPushing, setIsPushing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const [isUnlinking, setIsUnlinking] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newRepoName, setNewRepoName] = useState("");
  const [newRepoDescription, setNewRepoDescription] = useState("");
  const [newRepoPrivate, setNewRepoPrivate] = useState(true);
  const [commitMessage, setCommitMessage] = useState("");
  const [activeTab, setActiveTab] = useState("sync");

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

  const fetchRepos = useCallback(async () => {
    setIsLoadingRepos(true);
    try {
      const res = await fetch(
        "/api/integrations/github/repos?sort=updated&per_page=50"
      );
      if (res.ok) {
        const data = await res.json();
        setRepos(data.repos);
      }
    } catch (error) {
      console.error("Failed to fetch repos:", error);
      toast.error("Failed to fetch repositories");
    } finally {
      setIsLoadingRepos(false);
    }
  }, []);

  const checkIntegrationStatus = useCallback(async () => {
    setIsCheckingStatus(true);
    try {
      const res = await fetch("/api/integrations/github/status");
      if (res.ok) {
        const data = await res.json();
        setGithubStatus(data);

        if (data.connected) {
          fetchRepos();
        }
      }
    } catch (error) {
      console.error("Failed to check integration status:", error);
    } finally {
      setIsCheckingStatus(false);
    }
  }, [fetchRepos]);

  // Check integration and sync status when dialog opens
  useEffect(() => {
    if (open) {
      checkIntegrationStatus();
      checkSyncStatus();
    }
  }, [open, projectId, checkIntegrationStatus, checkSyncStatus]);

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
        action: result.repository?.htmlUrl
          ? {
              label: "View",
              onClick: () => window.open(result.repository.htmlUrl, "_blank"),
            }
          : undefined,
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

      toast.success(`Pulled ${result.filesCount} files from GitHub`, {
        description: result.warning || undefined,
      });

      onFilesUpdated?.();
      checkSyncStatus();
    } catch (error) {
      console.error("Pull error:", error);
      toast.error(error instanceof Error ? error.message : "Pull failed");
    } finally {
      setIsPulling(false);
    }
  };

  const handleLinkRepo = async (repo: GitHubRepo) => {
    setIsLinking(true);
    setSelectedRepo(repo);
    try {
      const res = await fetch("/api/integrations/github/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          repoFullName: repo.fullName,
        }),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error || "Failed to link repository");
      }

      toast.success(`Linked to ${repo.fullName}`);
      checkSyncStatus();
      fetchRepos();
      setActiveTab("sync");
    } catch (error) {
      console.error("Link error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to link repository"
      );
    } finally {
      setIsLinking(false);
      setSelectedRepo(null);
    }
  };

  const handleUnlink = async () => {
    if (!syncStatus?.repository) return;

    setIsUnlinking(true);
    try {
      const res = await fetch(
        `/api/integrations/github/link?projectId=${projectId}`,
        {
          method: "DELETE",
        }
      );

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error || "Failed to unlink repository");
      }

      toast.success("Repository unlinked");
      setSyncStatus(null);
      fetchRepos();
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

      toast.success(`Repository created: ${result.repository.fullName}`, {
        action: result.repository.htmlUrl
          ? {
              label: "View on GitHub",
              onClick: () => window.open(result.repository.htmlUrl, "_blank"),
            }
          : undefined,
      });

      // Reset form
      setNewRepoName("");
      setNewRepoDescription("");
      setNewRepoPrivate(true);
      setShowCreateForm(false);

      // Refresh data
      checkSyncStatus();
      fetchRepos();
      setActiveTab("sync");
    } catch (error) {
      console.error("Create repo error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create repository"
      );
    } finally {
      setIsCreating(false);
    }
  };

  const filteredRepos = repos.filter(
    (repo) =>
      repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      repo.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      repo.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const hasLinkedRepo = syncStatus?.repository != null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl sm:max-w-[600px] max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Github className="w-5 h-5" />
            GitHub Sync
          </DialogTitle>
          <DialogDescription>
            Sync your project with GitHub to version control your code.
          </DialogDescription>
        </DialogHeader>

        {isCheckingStatus ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : !githubStatus?.connected ? (
          // Not connected state
          <div className="space-y-4 py-4">
            <div className="border rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-neutral-900 dark:bg-white flex items-center justify-center">
                  <Github className="w-6 h-6 text-white dark:text-neutral-900" />
                </div>
                <div>
                  <h3 className="font-semibold">Connect GitHub</h3>
                  <p className="text-xs text-muted-foreground">
                    Link your GitHub account to sync code
                  </p>
                </div>
              </div>
              <Button
                onClick={handleConnectGitHub}
                className="w-full rounded-lg"
              >
                <Link2 className="w-4 h-4 mr-2" />
                Connect GitHub Account
              </Button>
            </div>
          </div>
        ) : !githubStatus?.installed ? (
          // Connected but app not installed
          <div className="space-y-4 py-4">
            <div className="border rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h3 className="font-semibold">Install GitHub App</h3>
                  <p className="text-xs text-muted-foreground">
                    Connected as{" "}
                    <span className="font-medium">{githubStatus.login}</span>,
                    but app not installed
                  </p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                To create and manage repositories, you need to install the Craft
                Code Sync app on your GitHub account.
              </p>
              <Button
                onClick={handleConnectGitHub}
                className="w-full rounded-lg"
              >
                <Github className="w-4 h-4 mr-2" />
                Install GitHub App
              </Button>
            </div>
          </div>
        ) : (
          // Connected state
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex-1 flex flex-col overflow-hidden"
          >
            <TabsList className="grid w-full grid-cols-2 rounded-xl">
              <TabsTrigger value="sync" className="rounded-lg">
                <RefreshCw className="w-4 h-4 mr-2" />
                Sync
              </TabsTrigger>
              <TabsTrigger value="repos" className="rounded-lg">
                <FolderGit2 className="w-4 h-4 mr-2" />
                Repositories
              </TabsTrigger>
            </TabsList>

            <TabsContent
              value="sync"
              className="flex-1 overflow-auto space-y-4 mt-4"
            >
              {/* Sync Status Card */}
              {hasLinkedRepo ? (
                <div className="border rounded-xl p-4 space-y-4">
                  {/* Linked Repo Info */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                        {syncStatus.repository?.isPrivate ? (
                          <Lock className="w-5 h-5 text-muted-foreground" />
                        ) : (
                          <Unlock className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm">
                          {syncStatus.repository?.fullName}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <GitBranch className="w-3 h-3" />
                          {syncStatus.repository?.defaultBranch}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg"
                        onClick={() =>
                          window.open(syncStatus.repository?.htmlUrl, "_blank")
                        }
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg text-destructive hover:text-destructive"
                        onClick={handleUnlink}
                        disabled={isUnlinking}
                      >
                        {isUnlinking ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Unlink className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Sync Status Indicator */}
                  <div
                    className={cn(
                      "flex items-center gap-2 p-3 rounded-lg text-sm",
                      syncStatus.status === "synced" &&
                        "bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400",
                      syncStatus.status === "out_of_sync" &&
                        "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400",
                      syncStatus.status === "never_pushed" &&
                        "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400",
                      !["synced", "out_of_sync", "never_pushed"].includes(
                        syncStatus.status
                      ) && "bg-neutral-100 dark:bg-neutral-800"
                    )}
                  >
                    {syncStatus.status === "synced" ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <AlertCircle className="w-4 h-4" />
                    )}
                    <span>{syncStatus.message}</span>
                  </div>

                  {/* Commit Message Input */}
                  <div className="space-y-2">
                    <Label htmlFor="commit-message" className="text-xs">
                      Commit Message (optional)
                    </Label>
                    <Input
                      id="commit-message"
                      placeholder="Update from Craft"
                      value={commitMessage}
                      onChange={(e) => setCommitMessage(e.target.value)}
                      className="rounded-lg"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button
                      onClick={handlePush}
                      disabled={isPushing}
                      className="flex-1 rounded-lg"
                    >
                      {isPushing ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4 mr-2" />
                      )}
                      Push to GitHub
                    </Button>
                    <Button
                      onClick={handlePull}
                      disabled={isPulling}
                      variant="outline"
                      className="flex-1 rounded-lg"
                    >
                      {isPulling ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4 mr-2" />
                      )}
                      Pull from GitHub
                    </Button>
                  </div>

                  {/* Last Sync Info */}
                  {syncStatus.lastSyncedAt && (
                    <p className="text-xs text-muted-foreground text-center">
                      Last synced:{" "}
                      {new Date(syncStatus.lastSyncedAt).toLocaleString()}
                    </p>
                  )}
                </div>
              ) : showCreateForm ? (
                // Create new repository form
                <div className="border rounded-xl p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      Create New Repository
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs"
                      onClick={() => setShowCreateForm(false)}
                    >
                      Cancel
                    </Button>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="repo-name" className="text-xs">
                        Repository Name *
                      </Label>
                      <Input
                        id="repo-name"
                        placeholder="my-awesome-project"
                        value={newRepoName}
                        onChange={(e) => setNewRepoName(e.target.value)}
                        className="rounded-lg"
                      />
                      <p className="text-xs text-muted-foreground">
                        Will be created as:{" "}
                        {githubStatus?.username ||
                          githubStatus?.login ||
                          "username"}
                        /
                        {newRepoName
                          .trim()
                          .toLowerCase()
                          .replace(/\s+/g, "-") || "repository-name"}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="repo-description" className="text-xs">
                        Description (optional)
                      </Label>
                      <Input
                        id="repo-description"
                        placeholder="A brief description of your project"
                        value={newRepoDescription}
                        onChange={(e) => setNewRepoDescription(e.target.value)}
                        className="rounded-lg"
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        {newRepoPrivate ? (
                          <Lock className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <Unlock className="w-4 h-4 text-muted-foreground" />
                        )}
                        <div>
                          <p className="text-sm font-medium">
                            {newRepoPrivate ? "Private" : "Public"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {newRepoPrivate
                              ? "Only you can see this repository"
                              : "Anyone can see this repository"}
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={newRepoPrivate}
                        onCheckedChange={setNewRepoPrivate}
                      />
                    </div>
                  </div>

                  <Button
                    onClick={handleCreateRepo}
                    disabled={isCreating || !newRepoName.trim()}
                    className="w-full rounded-lg"
                  >
                    {isCreating ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4 mr-2" />
                    )}
                    Create Repository & Push Code
                  </Button>
                </div>
              ) : (
                // No linked repo - show options
                <div className="border rounded-xl p-6 text-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto">
                    <FolderGit2 className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold">No Repository Linked</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Create a new repository or link an existing one to sync
                      your code.
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button
                      onClick={() => setShowCreateForm(true)}
                      className="rounded-lg"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create New Repository
                    </Button>
                    <Button
                      onClick={() => setActiveTab("repos")}
                      variant="outline"
                      className="rounded-lg"
                    >
                      <Link2 className="w-4 h-4 mr-2" />
                      Link Existing Repository
                    </Button>
                  </div>
                </div>
              )}

              {/* Features List */}
              <div className="space-y-3 pt-2">
                <p className="text-sm font-medium">What you can do:</p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 mt-0.5 text-green-600 dark:text-green-500 shrink-0" />
                    <span>Push your project code to GitHub</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 mt-0.5 text-green-600 dark:text-green-500 shrink-0" />
                    <span>Pull updates from your repository</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 mt-0.5 text-green-600 dark:text-green-500 shrink-0" />
                    <span>Version history and rollback</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 mt-0.5 text-green-600 dark:text-green-500 shrink-0" />
                    <span>Collaborate with your team</span>
                  </li>
                </ul>
              </div>
            </TabsContent>

            <TabsContent
              value="repos"
              className="flex-1 overflow-hidden flex flex-col mt-4"
            >
              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search repositories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 rounded-lg"
                />
              </div>

              {/* Repos List */}
              <ScrollArea className="flex-1 -mx-6 px-6">
                {isLoadingRepos ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredRepos.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {searchQuery
                      ? "No repositories match your search"
                      : "No repositories found"}
                  </div>
                ) : (
                  <div className="space-y-2 pb-4">
                    {filteredRepos.map((repo) => {
                      const isLinkedToThis = repo.linkedProjectId === projectId;
                      const isLinkedToOther =
                        repo.linkedProjectId &&
                        repo.linkedProjectId !== projectId;

                      return (
                        <div
                          key={repo.id}
                          className={cn(
                            "border rounded-xl p-3 transition-colors",
                            isLinkedToThis && "border-primary bg-primary/5",
                            !isLinkedToOther &&
                              "hover:bg-neutral-50 dark:hover:bg-neutral-900 cursor-pointer"
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center shrink-0">
                                {repo.private ? (
                                  <Lock className="w-4 h-4 text-muted-foreground" />
                                ) : (
                                  <Unlock className="w-4 h-4 text-muted-foreground" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <h4 className="font-medium text-sm truncate">
                                  {repo.fullName}
                                </h4>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <GitBranch className="w-3 h-3 shrink-0" />
                                  <span>{repo.defaultBranch}</span>
                                  {repo.language && (
                                    <>
                                      <span>•</span>
                                      <span>{repo.language}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {isLinkedToThis ? (
                                <span className="text-xs text-primary font-medium flex items-center gap-1">
                                  <CheckCircle2 className="w-4 h-4" />
                                  Linked
                                </span>
                              ) : isLinkedToOther ? (
                                <span className="text-xs text-muted-foreground">
                                  Linked to another project
                                </span>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="rounded-lg h-8"
                                  onClick={() => handleLinkRepo(repo)}
                                  disabled={
                                    isLinking && selectedRepo?.id === repo.id
                                  }
                                >
                                  {isLinking && selectedRepo?.id === repo.id ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <>
                                      <Link2 className="w-3 h-3 mr-1" />
                                      Link
                                    </>
                                  )}
                                </Button>
                              )}
                            </div>
                          </div>
                          {repo.description && (
                            <p className="text-xs text-muted-foreground mt-2 line-clamp-2 pl-11">
                              {repo.description}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>

              {/* Refresh Button */}
              <div className="pt-4 border-t mt-auto">
                <Button
                  variant="outline"
                  className="w-full rounded-lg"
                  onClick={fetchRepos}
                  disabled={isLoadingRepos}
                >
                  <RefreshCw
                    className={cn(
                      "w-4 h-4 mr-2",
                      isLoadingRepos && "animate-spin"
                    )}
                  />
                  Refresh Repositories
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
