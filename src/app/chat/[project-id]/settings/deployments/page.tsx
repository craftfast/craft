"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  ExternalLink,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  TriangleIcon,
  Unlink,
  Rocket,
} from "lucide-react";

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

export default function ProjectDeploymentsSettingsPage() {
  const params = useParams();
  const projectId = params["project-id"] as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isDeploying, setIsDeploying] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  // Vercel connection state
  const [vercelConnected, setVercelConnected] = useState(false);
  const [vercelProject, setVercelProject] = useState<VercelProject | null>(
    null
  );

  // Deployment History
  const [deploymentHistory, setDeploymentHistory] = useState<Deployment[]>([]);

  // Load deployment settings
  useEffect(() => {
    loadDeploymentSettings();
  }, [projectId]);

  const loadDeploymentSettings = async () => {
    setIsLoading(true);
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
      setIsLoading(false);
    }
  };

  const handleConnectVercel = async () => {
    // Redirect to Vercel OAuth or show connection modal
    toast.info("Connecting to Vercel...");
    // TODO: Implement Vercel OAuth connection
    window.open(
      `/api/integrations/vercel/connect?projectId=${projectId}`,
      "_blank"
    );
  };

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
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
      setIsDisconnecting(false);
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
        // Refresh deployment history
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ready":
        return (
          <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-500" />
        );
      case "error":
        return <XCircle className="w-4 h-4 text-red-600 dark:text-red-500" />;
      case "building":
        return (
          <Loader2 className="w-4 h-4 text-amber-600 dark:text-amber-500 animate-spin" />
        );
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const latestDeployment = deploymentHistory[0];
  const latestSuccessfulDeployment = deploymentHistory.find(
    (d) => d.status === "ready" && d.vercelUrl
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="pb-4 border-b border-border">
          <h2 className="text-2xl font-semibold">Deployments</h2>
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
        <h2 className="text-2xl font-semibold">Deployments</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Deploy your project to production with Vercel
        </p>
      </div>

      <div className="space-y-4">
        {/* Vercel Connection Status */}
        <div className="p-6 rounded-xl border">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-neutral-900 dark:bg-white">
                <TriangleIcon className="w-5 h-5 text-white dark:text-neutral-900 fill-current" />
              </div>
              <div>
                <h3 className="font-semibold">Vercel</h3>
                <p className="text-sm text-muted-foreground">
                  {vercelConnected
                    ? "Deploy with automatic builds and preview deployments"
                    : "Connect your Vercel account to deploy"}
                </p>
              </div>
            </div>
            {vercelConnected && (
              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-500" />
            )}
          </div>

          {!vercelConnected ? (
            <Button onClick={handleConnectVercel} className="w-full rounded-lg">
              <Rocket className="w-4 h-4 mr-2" />
              Connect Vercel Account
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={handleDisconnect}
              disabled={isDisconnecting}
              className="w-full rounded-lg text-destructive hover:text-destructive"
            >
              {isDisconnecting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Unlink className="w-4 h-4 mr-2" />
              )}
              Disconnect Vercel
            </Button>
          )}
        </div>

        {/* Deployment Management - Only show when connected */}
        {vercelConnected && (
          <>
            {/* Project Info & Deploy */}
            <div className="p-6 rounded-xl border space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Deployment</h3>
                {latestSuccessfulDeployment?.vercelUrl && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-lg"
                    onClick={() =>
                      window.open(
                        `https://${latestSuccessfulDeployment.vercelUrl}`,
                        "_blank"
                      )
                    }
                  >
                    <ExternalLink className="w-4 h-4 mr-1" />
                    View Site
                  </Button>
                )}
              </div>

              {/* Project Info */}
              {(vercelProject || latestSuccessfulDeployment?.vercelUrl) && (
                <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                  <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                    <TriangleIcon className="w-5 h-5 text-muted-foreground fill-current" />
                  </div>
                  <div className="flex-1 min-w-0">
                    {vercelProject && (
                      <h4 className="font-medium text-sm truncate">
                        {vercelProject.name}
                      </h4>
                    )}
                    {latestSuccessfulDeployment?.vercelUrl && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="truncate">
                          {latestSuccessfulDeployment.vercelUrl}
                        </span>
                      </div>
                    )}
                  </div>
                  {latestSuccessfulDeployment?.vercelUrl && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-lg"
                      onClick={() =>
                        window.open(
                          `https://${latestSuccessfulDeployment.vercelUrl}`,
                          "_blank"
                        )
                      }
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              )}

              {/* Latest Deployment Status */}
              {latestDeployment && (
                <div
                  className={cn(
                    "flex items-center gap-2 p-3 rounded-lg text-sm",
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
                  {getStatusIcon(latestDeployment.status)}
                  <span>
                    {latestDeployment.status === "ready"
                      ? "Deployment ready"
                      : latestDeployment.status === "building"
                      ? "Building deployment..."
                      : latestDeployment.status === "error"
                      ? latestDeployment.errorMessage || "Deployment failed"
                      : latestDeployment.status}
                  </span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  onClick={handleDeploy}
                  disabled={isDeploying}
                  className="flex-1 rounded-lg"
                >
                  {isDeploying ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Rocket className="w-4 h-4 mr-2" />
                  )}
                  Deploy Now
                </Button>
                <Button
                  onClick={loadDeploymentSettings}
                  variant="outline"
                  className="rounded-lg"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>

              {/* Last Deployment Info */}
              {latestDeployment && (
                <p className="text-xs text-muted-foreground text-center">
                  Last deployment:{" "}
                  {new Date(latestDeployment.createdAt).toLocaleString()}
                  {latestDeployment.duration &&
                    ` • ${latestDeployment.duration}s`}
                </p>
              )}
            </div>

            {/* Deployment History */}
            {deploymentHistory.length > 1 && (
              <div className="p-6 rounded-xl border space-y-4">
                <h3 className="font-semibold">Deployment History</h3>
                <div className="space-y-2">
                  {deploymentHistory.slice(1, 6).map((deployment) => (
                    <div
                      key={deployment.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        {getStatusIcon(deployment.status)}
                        <div>
                          <p className="text-sm font-medium">
                            {deployment.status === "ready"
                              ? "Ready"
                              : deployment.status === "building"
                              ? "Building"
                              : deployment.status === "error"
                              ? "Failed"
                              : deployment.status}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(
                              deployment.createdAt
                            ).toLocaleDateString()}{" "}
                            at{" "}
                            {new Date(
                              deployment.createdAt
                            ).toLocaleTimeString()}
                            {deployment.duration &&
                              ` • ${deployment.duration}s`}
                          </p>
                        </div>
                      </div>
                      {deployment.vercelUrl &&
                        deployment.status === "ready" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg"
                            onClick={() =>
                              window.open(
                                `https://${deployment.vercelUrl}`,
                                "_blank"
                              )
                            }
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Features List */}
            <div className="p-6 rounded-xl border bg-muted/30 space-y-3">
              <p className="text-sm font-medium">
                With Vercel deployment you get:
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 text-green-600 dark:text-green-500 shrink-0" />
                  <span>Automatic builds on every push</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 text-green-600 dark:text-green-500 shrink-0" />
                  <span>Preview deployments for branches</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 text-green-600 dark:text-green-500 shrink-0" />
                  <span>Global CDN with edge functions</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 text-green-600 dark:text-green-500 shrink-0" />
                  <span>Automatic HTTPS and custom domains</span>
                </li>
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
