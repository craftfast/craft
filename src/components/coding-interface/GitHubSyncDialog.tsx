"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Github,
  CheckCircle2,
  Loader2,
  Link2,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

interface GitHubSyncDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
}

interface IntegrationStatus {
  connected: boolean;
  login?: string;
  username?: string;
}

export default function GitHubSyncDialog({
  open,
  onOpenChange,
  projectId,
}: GitHubSyncDialogProps) {
  const [githubStatus, setGithubStatus] = useState<IntegrationStatus | null>(
    null
  );
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Check integration status when dialog opens
  useEffect(() => {
    if (open) {
      checkIntegrationStatus();
    }
  }, [open]);

  const checkIntegrationStatus = async () => {
    setIsCheckingStatus(true);
    try {
      const githubRes = await fetch("/api/integrations/github/status");

      if (githubRes.ok) {
        const githubData = await githubRes.json();
        setGithubStatus(githubData);
      }
    } catch (error) {
      console.error("Failed to check integration status:", error);
      toast.error("Failed to check GitHub connection status");
    } finally {
      setIsCheckingStatus(false);
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

  const handleSyncToGitHub = async () => {
    setIsSyncing(true);

    try {
      const res = await fetch("/api/integrations/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          platform: "github",
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "GitHub sync failed");
      }

      const result = await res.json();

      // Show success toast
      toast.success("Code pushed to GitHub successfully!", {
        description: result.repoUrl ? "Click to view repository" : undefined,
        action: result.repoUrl
          ? {
              label: "Open",
              onClick: () => window.open(result.repoUrl, "_blank"),
            }
          : undefined,
      });

      // Close dialog after successful sync
      onOpenChange(false);
    } catch (error) {
      console.error("GitHub sync error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "GitHub sync failed. Please try again."
      );
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Sync with Git</DialogTitle>
          <DialogDescription>
            Connect your GitHub account to sync your project code to a
            repository.
          </DialogDescription>
        </DialogHeader>

        <div className="pt-4">
          {/* GitHub Option */}
          <div className="border rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-neutral-900 dark:bg-white flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-white dark:text-neutral-900"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold">GitHub</h3>
                  <p className="text-xs text-muted-foreground">
                    {githubStatus?.connected
                      ? `Connected as ${githubStatus.login}`
                      : "Version control & collaboration"}
                  </p>
                </div>
              </div>
              {githubStatus?.connected && (
                <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-500" />
              )}
            </div>

            {githubStatus?.connected ? (
              <div className="space-y-2">
                <Button
                  onClick={handleSyncToGitHub}
                  disabled={isSyncing}
                  className="w-full rounded-lg"
                >
                  {isSyncing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Syncing to GitHub...
                    </>
                  ) : (
                    <>
                      <Github className="w-4 h-4 mr-2" />
                      Push to GitHub
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Button
                  onClick={handleConnectGitHub}
                  className="w-full rounded-lg"
                >
                  <Link2 className="w-4 h-4 mr-2" />
                  Connect GitHub Account
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  You&apos;ll be redirected to authorize GitHub access
                </p>
              </div>
            )}
          </div>

          {/* Features List */}
          <div className="mt-6 space-y-3">
            <p className="text-sm font-medium">What you get:</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 mt-0.5 text-green-600 dark:text-green-500 shrink-0" />
                <span>Automatic repository creation</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 mt-0.5 text-green-600 dark:text-green-500 shrink-0" />
                <span>Version history and rollback</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 mt-0.5 text-green-600 dark:text-green-500 shrink-0" />
                <span>Code collaboration with team</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 mt-0.5 text-green-600 dark:text-green-500 shrink-0" />
                <span>Pull requests and code review</span>
              </li>
            </ul>
          </div>

          {/* Documentation Link */}
          <div className="mt-4 pt-4 border-t">
            <Button
              onClick={() => window.open("https://docs.github.com", "_blank")}
              variant="ghost"
              className="w-full rounded-lg text-sm"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              View GitHub Documentation
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
