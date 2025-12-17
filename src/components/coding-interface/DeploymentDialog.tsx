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
import {
  ExternalLink,
  CheckCircle2,
  Loader2,
  Copy,
  Rocket,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { INFRASTRUCTURE_COSTS } from "@/lib/pricing-constants";

interface DeploymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  onExportProject?: () => void;
}

interface DeploymentStatus {
  hasDeployments: boolean;
  latestDeployment?: {
    id: string;
    status: string;
    url?: string;
    createdAt: string;
    provider: string;
  };
  vercelProjectId?: string;
  vercelProjectName?: string;
  vercelUrl?: string;
}

interface DeploymentResult {
  id: string;
  status: string;
  url?: string;
  vercelProjectId?: string;
  vercelProjectName?: string;
  error?: string;
}

export default function DeploymentDialog({
  open,
  onOpenChange,
  projectId,
  onExportProject: _onExportProject,
}: DeploymentDialogProps) {
  const [status, setStatus] = useState<DeploymentStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentResult, setDeploymentResult] =
    useState<DeploymentResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check deployment status when dialog opens
  const checkStatus = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/deployments`);
      if (res.ok) {
        const data = await res.json();
        const vercelDeployments =
          data.deployments?.filter(
            (d: { provider: string }) => d.provider === "vercel"
          ) || [];

        // Get project info for Vercel details
        const projectRes = await fetch(`/api/projects/${projectId}`);
        const projectData = projectRes.ok ? await projectRes.json() : {};

        setStatus({
          hasDeployments: vercelDeployments.length > 0,
          latestDeployment: vercelDeployments[0],
          vercelProjectId: projectData.vercelProjectId,
          vercelProjectName: projectData.vercelProjectName,
          vercelUrl: projectData.vercelUrl,
        });
      }
    } catch (err) {
      console.error("Failed to check deployment status:", err);
      setError("Failed to check deployment status");
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (open) {
      checkStatus();
      setDeploymentResult(null);
    }
  }, [open, checkStatus]);

  const handleDeploy = async () => {
    setIsDeploying(true);
    setError(null);
    setDeploymentResult(null);

    try {
      const res = await fetch(`/api/projects/${projectId}/deployments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: "vercel",
          environment: "production",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Deployment failed");
        toast.error(data.error || "Deployment failed");
        return;
      }

      setDeploymentResult({
        id: data.deployment?.deploymentId || data.deployment?.id,
        status: data.deployment?.status || "building",
        url: data.deployment?.url,
        vercelProjectId: data.deployment?.metadata?.vercelProjectId,
        vercelProjectName: data.deployment?.metadata?.vercelProjectName,
      });

      if (data.deployment?.status === "active" || data.deployment?.url) {
        toast.success("Deployed successfully!");
      } else {
        toast.success("Deployment started!");
      }

      // Refresh status
      checkStatus();
    } catch (err) {
      console.error("Deployment error:", err);
      setError("Failed to start deployment");
      toast.error("Failed to start deployment");
    } finally {
      setIsDeploying(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("URL copied to clipboard!");
  };

  const getFullUrl = (url: string) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    return `https://${url}`;
  };

  const formatCost = (cost: number) => `$${cost.toFixed(3)}`;

  const liveUrl =
    deploymentResult?.url || status?.vercelUrl || status?.latestDeployment?.url;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Rocket className="w-5 h-5" />
            Deploy Project
          </DialogTitle>
          <DialogDescription>
            Deploy your project to production with Vercel.
          </DialogDescription>
        </DialogHeader>

        <div className="pt-4 space-y-4">
          {/* Error Alert */}
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Loading State */}
          {isLoading && !status && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {/* Vercel Deployment Card */}
          {!isLoading && (
            <div className="border rounded-xl p-4 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-neutral-900 dark:bg-white flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    className="fill-white dark:fill-neutral-900"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2L2 20h20L12 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold">Vercel</h3>
                  <p className="text-xs text-muted-foreground">
                    Production-ready hosting with global CDN
                  </p>
                </div>
              </div>

              {/* Pricing Info */}
              <div className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-900 space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Usage-Based Pricing
                </p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">CPU:</span>
                    <span className="ml-1 font-mono">
                      {formatCost(INFRASTRUCTURE_COSTS.vercel.activeCPUPerHour)}
                      /hr
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Memory:</span>
                    <span className="ml-1 font-mono">
                      {formatCost(
                        INFRASTRUCTURE_COSTS.vercel.provisionedMemoryPerGBHour
                      )}
                      /GB-hr
                    </span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Only charged for actual usage during function execution
                </p>
              </div>

              {/* Deployment Success */}
              {(deploymentResult?.url || (status?.vercelUrl && !isDeploying)) &&
                liveUrl && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900">
                      <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-green-800 dark:text-green-200">
                          {deploymentResult?.url ? "Deployed!" : "Live"}
                        </p>
                        <p className="text-xs text-green-600 dark:text-green-400">
                          {status?.vercelProjectName || "Your project is live"}
                        </p>
                      </div>
                    </div>

                    {/* Live URL */}
                    <div className="p-3 rounded-lg bg-muted/50 border">
                      <p className="text-xs text-muted-foreground mb-2">
                        Live URL
                      </p>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 text-sm font-mono truncate">
                          {liveUrl}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 shrink-0 rounded-lg"
                          onClick={() => copyToClipboard(getFullUrl(liveUrl))}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Button
                        onClick={() =>
                          window.open(getFullUrl(liveUrl), "_blank")
                        }
                        className="flex-1 rounded-lg"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View Live Site
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleDeploy}
                        disabled={isDeploying}
                        className="rounded-lg"
                      >
                        {isDeploying ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <RefreshCw className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                )}

              {/* Deploy Button (no previous deployment) */}
              {!liveUrl && !isDeploying && (
                <Button onClick={handleDeploy} className="w-full rounded-lg">
                  <Rocket className="w-4 h-4 mr-2" />
                  Deploy to Vercel
                </Button>
              )}

              {/* Deploying State */}
              {isDeploying && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-neutral-50 dark:bg-neutral-900 border">
                    <Loader2 className="w-5 h-5 animate-spin text-neutral-600" />
                    <div>
                      <p className="text-sm font-medium">Deploying...</p>
                      <p className="text-xs text-muted-foreground">
                        Building and deploying your project
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Features List */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Includes:</p>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-neutral-500" />
                Global CDN with edge functions
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-neutral-500" />
                Automatic HTTPS
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-neutral-500" />
                Instant rollbacks
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-neutral-500" />
                Analytics and monitoring
              </li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
