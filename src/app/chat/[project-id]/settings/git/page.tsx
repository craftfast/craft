"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  GitBranch,
  Github,
  Link2,
  ExternalLink,
  Upload,
  Download,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Unlink,
  Lock,
  Unlock,
  Plus,
  RefreshCw,
} from "lucide-react";

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

export default function ProjectGitSettingsPage() {
  const params = useParams();
  const projectId = params["project-id"] as string;

  const [isLoading, setIsLoading] = useState(true);
  const [githubStatus, setGithubStatus] = useState<IntegrationStatus | null>(
    null
  );
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
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

  const checkIntegrationStatus = useCallback(async () => {
    setIsLoading(true);
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
      setIsLoading(false);
    }
  }, [checkSyncStatus]);

  useEffect(() => {
    checkIntegrationStatus();
  }, [checkIntegrationStatus]);

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

      if (!res.ok) {
        throw new Error("Failed to disconnect");
      }

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

  const hasLinkedRepo = syncStatus?.repository != null;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="pb-4 border-b border-border">
          <h2 className="text-2xl font-semibold">GitHub Integration</h2>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-border">
        <h2 className="text-2xl font-semibold">GitHub Integration</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Connect your project to GitHub for version control, collaboration, and
          CI/CD
        </p>
      </div>

      <div className="space-y-4">
        {/* GitHub Connection Status */}
        <div className="p-6 rounded-xl border">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-neutral-900 dark:bg-white">
                <Github className="w-5 h-5 text-white dark:text-neutral-900" />
              </div>
              <div>
                <h3 className="font-semibold">GitHub Account</h3>
                <p className="text-sm text-muted-foreground">
                  {githubStatus?.connected
                    ? `Connected as @${
                        githubStatus.login || githubStatus.username
                      }`
                    : "Connect your GitHub account to sync code"}
                </p>
              </div>
            </div>
            {githubStatus?.connected && (
              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-500" />
            )}
          </div>

          {!githubStatus?.connected ? (
            <Button onClick={handleConnectGitHub} className="w-full rounded-lg">
              <Link2 className="w-4 h-4 mr-2" />
              Connect GitHub Account
            </Button>
          ) : !githubStatus?.installed ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>
                  GitHub App not installed. Install to manage repositories.
                </span>
              </div>
              <Button
                onClick={handleConnectGitHub}
                className="w-full rounded-lg"
              >
                <Github className="w-4 h-4 mr-2" />
                Install GitHub App
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              onClick={handleDisconnectGitHub}
              disabled={isDisconnecting}
              className="w-full rounded-lg text-destructive hover:text-destructive"
            >
              {isDisconnecting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Unlink className="w-4 h-4 mr-2" />
              )}
              Disconnect GitHub
            </Button>
          )}
        </div>

        {/* Repository Management - Only show when connected and app installed */}
        {githubStatus?.connected && githubStatus?.installed && (
          <>
            {hasLinkedRepo ? (
              /* Linked Repository Card */
              <div className="p-6 rounded-xl border space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Linked Repository</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive rounded-lg"
                    onClick={handleUnlink}
                    disabled={isUnlinking}
                  >
                    {isUnlinking ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Unlink className="w-4 h-4 mr-1" />
                        Unlink
                      </>
                    )}
                  </Button>
                </div>

                {/* Repo Info */}
                <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                  <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                    {syncStatus.repository?.isPrivate ? (
                      <Lock className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <Unlock className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm truncate">
                      {syncStatus.repository?.fullName}
                    </h4>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <GitBranch className="w-3 h-3" />
                      {syncStatus.repository?.defaultBranch}
                      <span>•</span>
                      <span>
                        {syncStatus.repository?.isPrivate
                          ? "Private"
                          : "Public"}
                      </span>
                    </div>
                  </div>
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
                </div>

                {/* Sync Status */}
                <div
                  className={cn(
                    "flex items-center gap-2 p-3 rounded-lg text-sm",
                    syncStatus.status === "synced" &&
                      "bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400",
                    syncStatus.status === "out_of_sync" &&
                      "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400",
                    syncStatus.status === "never_pushed" &&
                      "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-400",
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

                {/* Refresh Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={checkSyncStatus}
                  className="w-full rounded-lg"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh Status
                </Button>
              </div>
            ) : showCreateForm ? (
              /* Create Repository Form */
              <div className="p-6 rounded-xl border space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Create New Repository
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs rounded-lg"
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
                      {newRepoName.trim().toLowerCase().replace(/\s+/g, "-") ||
                        "repository-name"}
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
              /* No Repository Linked */
              <div className="p-6 rounded-xl border text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto">
                  <GitBranch className="w-6 h-6 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold">No Repository Linked</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Create a new GitHub repository to sync your project code.
                  </p>
                </div>
                <Button
                  onClick={() => setShowCreateForm(true)}
                  className="w-full rounded-lg"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Repository
                </Button>
              </div>
            )}

            {/* Features List */}
            <div className="p-6 rounded-xl border bg-muted/30 space-y-3">
              <p className="text-sm font-medium">
                With GitHub integration you can:
              </p>
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
                  <span>Version history and rollback support</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 text-green-600 dark:text-green-500 shrink-0" />
                  <span>Collaborate with your team</span>
                </li>
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
