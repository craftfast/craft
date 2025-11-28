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
  ExternalLink,
  CheckCircle2,
  Loader2,
  Link2,
  Copy,
  Rocket,
} from "lucide-react";
import { toast } from "sonner";

interface DeploymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  onExportProject: () => void;
}

interface IntegrationStatus {
  connected: boolean;
  email?: string;
  username?: string;
  login?: string;
}

interface DeploymentResult {
  id: string;
  status: string;
  vercelUrl?: string;
  vercelProjectId?: string;
}

export default function DeploymentDialog({
  open,
  onOpenChange,
  projectId,
  onExportProject: _onExportProject,
}: DeploymentDialogProps) {
  const [vercelStatus, setVercelStatus] = useState<IntegrationStatus | null>(
    null
  );
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentPlatform, setDeploymentPlatform] = useState<string | null>(
    null
  );
  const [deploymentResult, setDeploymentResult] =
    useState<DeploymentResult | null>(null);

  // Check integration status when dialog opens
  useEffect(() => {
    if (open) {
      checkIntegrationStatus();
      // Reset deployment result when dialog opens
      setDeploymentResult(null);
    }
  }, [open]);

  const checkIntegrationStatus = async () => {
    setIsCheckingStatus(true);
    try {
      const vercelRes = await fetch("/api/integrations/vercel/status");

      if (vercelRes.ok) {
        const vercelData = await vercelRes.json();
        setVercelStatus(vercelData);
      }
    } catch (error) {
      console.error("Failed to check integration status:", error);
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const handleConnectVercel = async () => {
    try {
      const res = await fetch("/api/integrations/vercel/connect");
      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Failed to connect Vercel:", error);
    }
  };

  const handleDeployToVercel = async () => {
    setIsDeploying(true);
    setDeploymentPlatform("vercel");
    setDeploymentResult(null);

    try {
      const res = await fetch("/api/integrations/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          platform: "vercel",
        }),
      });

      if (!res.ok) {
        throw new Error("Deployment failed");
      }

      const deployment = await res.json();

      // Set the deployment result to show success UI
      setDeploymentResult({
        id: deployment.id,
        status: deployment.status,
        vercelUrl: deployment.vercelUrl,
        vercelProjectId: deployment.vercelProjectId,
      });

      toast.success("Project deployed successfully!");
    } catch (error) {
      console.error("Deployment error:", error);
      toast.error("Deployment failed. Please try again.");
    } finally {
      setIsDeploying(false);
      setDeploymentPlatform(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("URL copied to clipboard!");
  };

  const getFullUrl = (url: string) => {
    if (url.startsWith("http")) return url;
    return `https://${url}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Deploy Project</DialogTitle>
          <DialogDescription>
            Deploy your project to Vercel for instant global hosting with
            automatic CI/CD.
          </DialogDescription>
        </DialogHeader>

        <div className="pt-4">
          {/* Vercel Option */}
          <div className="border rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-neutral-900 dark:bg-neutral-900 flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    fill="white"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2L2 20h20L12 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold">Vercel</h3>
                  <p className="text-xs text-muted-foreground">
                    {vercelStatus?.connected
                      ? `Connected as ${vercelStatus.email}`
                      : "Production-ready hosting"}
                  </p>
                </div>
              </div>
              {vercelStatus?.connected && (
                <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-500" />
              )}
            </div>

            {vercelStatus?.connected ? (
              <div className="space-y-3">
                {/* Show success state after deployment */}
                {deploymentResult?.vercelUrl ? (
                  <div className="space-y-4">
                    {/* Success Banner */}
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900">
                      <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                        <Rocket className="w-4 h-4 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-green-800 dark:text-green-200">
                          Deployed Successfully!
                        </p>
                        <p className="text-xs text-green-600 dark:text-green-400">
                          Your project is now live
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
                          {deploymentResult.vercelUrl}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 shrink-0"
                          onClick={() =>
                            copyToClipboard(
                              getFullUrl(deploymentResult.vercelUrl!)
                            )
                          }
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Button
                        onClick={() =>
                          window.open(
                            getFullUrl(deploymentResult.vercelUrl!),
                            "_blank"
                          )
                        }
                        className="flex-1 rounded-lg"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View Live Site
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setDeploymentResult(null)}
                        className="rounded-lg"
                      >
                        Deploy Again
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* Deploy button */
                  <Button
                    onClick={handleDeployToVercel}
                    disabled={isDeploying}
                    className="w-full rounded-lg"
                  >
                    {isDeploying && deploymentPlatform === "vercel" ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Deploying...
                      </>
                    ) : (
                      <>
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Deploy Now
                      </>
                    )}
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <Button
                  onClick={handleConnectVercel}
                  className="w-full rounded-lg"
                >
                  <Link2 className="w-4 h-4 mr-2" />
                  Connect Vercel Account
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  You&apos;ll be redirected to authorize Vercel access
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
                <span>Global CDN with edge functions</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 mt-0.5 text-green-600 dark:text-green-500 shrink-0" />
                <span>Automatic HTTPS and custom domains</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 mt-0.5 text-green-600 dark:text-green-500 shrink-0" />
                <span>Instant rollbacks and previews</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 mt-0.5 text-green-600 dark:text-green-500 shrink-0" />
                <span>Built-in analytics and monitoring</span>
              </li>
            </ul>
          </div>

          {/* Documentation Link */}
          <div className="mt-4 pt-4 border-t">
            <Button
              onClick={() => window.open("https://vercel.com/docs", "_blank")}
              variant="ghost"
              className="w-full rounded-lg text-sm"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              View Vercel Documentation
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
