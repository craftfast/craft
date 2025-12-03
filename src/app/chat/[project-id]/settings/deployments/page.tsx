"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  ExternalLink,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  TriangleIcon,
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
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case "error":
        return <XCircle className="w-4 h-4 text-red-600" />;
      case "building":
        return <Loader2 className="w-4 h-4 text-amber-600 animate-spin" />;
      default:
        return <Clock className="w-4 h-4 text-neutral-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "text-xs px-2 py-0.5 rounded-full font-medium";
    switch (status) {
      case "ready":
        return `${baseClasses} bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400`;
      case "error":
        return `${baseClasses} bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400`;
      case "building":
        return `${baseClasses} bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400`;
      default:
        return `${baseClasses} bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-400`;
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground" />
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

      {/* Vercel Connection Card */}
      <div className="p-6 rounded-xl border bg-card">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-black dark:bg-white">
              <TriangleIcon className="w-5 h-5 text-white dark:text-black fill-current" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Vercel</h3>
              <p className="text-sm text-muted-foreground">
                Deploy with automatic builds, preview deployments, and global
                CDN
              </p>
            </div>
          </div>
          {vercelConnected && (
            <span className="flex items-center gap-1.5 text-sm text-green-600 dark:text-green-400 font-medium">
              <CheckCircle2 className="w-4 h-4" />
              Connected
            </span>
          )}
        </div>

        {!vercelConnected ? (
          <div className="mt-6">
            <Button
              onClick={handleConnectVercel}
              className="rounded-full"
              size="lg"
            >
              Connect to Vercel
            </Button>
            <p className="text-xs text-muted-foreground mt-3">
              Connect your Vercel account to deploy this project
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {/* Project Info */}
            {vercelProject && (
              <div className="p-4 rounded-xl bg-muted/50 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Project</span>
                  <span className="font-medium">{vercelProject.name}</span>
                </div>
                {latestSuccessfulDeployment?.vercelUrl && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Production URL
                    </span>
                    <a
                      href={`https://${latestSuccessfulDeployment.vercelUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-foreground hover:underline flex items-center gap-1"
                    >
                      {latestSuccessfulDeployment.vercelUrl}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Latest Deployment Status */}
            {latestDeployment && (
              <div className="p-4 rounded-xl border space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Latest Deployment</span>
                  <span className={getStatusBadge(latestDeployment.status)}>
                    {latestDeployment.status === "ready"
                      ? "Ready"
                      : latestDeployment.status === "building"
                      ? "Building..."
                      : latestDeployment.status === "error"
                      ? "Failed"
                      : latestDeployment.status}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>
                    {new Date(latestDeployment.createdAt).toLocaleDateString()}{" "}
                    at{" "}
                    {new Date(latestDeployment.createdAt).toLocaleTimeString()}
                  </span>
                  {latestDeployment.duration && (
                    <>
                      <span>•</span>
                      <span>{latestDeployment.duration}s</span>
                    </>
                  )}
                </div>
                {latestDeployment.status === "error" &&
                  latestDeployment.errorMessage && (
                    <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded-lg">
                      {latestDeployment.errorMessage}
                    </p>
                  )}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3">
              <Button
                onClick={handleDeploy}
                disabled={isDeploying}
                className="rounded-full flex-1"
              >
                {isDeploying ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Deploying...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Deploy Now
                  </>
                )}
              </Button>
              {latestSuccessfulDeployment?.vercelUrl && (
                <Button
                  variant="outline"
                  className="rounded-full"
                  onClick={() =>
                    window.open(
                      `https://${latestSuccessfulDeployment.vercelUrl}`,
                      "_blank"
                    )
                  }
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Site
                </Button>
              )}
            </div>

            {/* Disconnect */}
            <div className="pt-4 border-t">
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-red-600 rounded-lg"
                onClick={handleDisconnect}
                disabled={isDisconnecting}
              >
                {isDisconnecting
                  ? "Disconnecting..."
                  : "Disconnect from Vercel"}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Deployment History */}
      {vercelConnected && deploymentHistory.length > 0 && (
        <div>
          <h3 className="text-sm font-medium mb-3">Deployment History</h3>
          <div className="space-y-2">
            {deploymentHistory.slice(0, 10).map((deployment) => (
              <div
                key={deployment.id}
                className="p-4 rounded-xl border flex items-center justify-between hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {getStatusIcon(deployment.status)}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={getStatusBadge(deployment.status)}>
                        {deployment.status === "ready"
                          ? "Ready"
                          : deployment.status === "building"
                          ? "Building"
                          : deployment.status === "error"
                          ? "Failed"
                          : deployment.status}
                      </span>
                      {deployment.vercelUrl && (
                        <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {deployment.vercelUrl}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(deployment.createdAt).toLocaleDateString()} at{" "}
                      {new Date(deployment.createdAt).toLocaleTimeString()}
                      {deployment.duration && ` • ${deployment.duration}s`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {deployment.vercelUrl && deployment.status === "ready" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-lg"
                      onClick={() =>
                        window.open(`https://${deployment.vercelUrl}`, "_blank")
                      }
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {vercelConnected && deploymentHistory.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>
            No deployments yet. Click "Deploy Now" to create your first
            deployment.
          </p>
        </div>
      )}
    </div>
  );
}
