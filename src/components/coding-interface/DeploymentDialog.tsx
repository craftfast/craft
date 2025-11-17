"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Download,
  ExternalLink,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Link2,
} from "lucide-react";

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

export default function DeploymentDialog({
  open,
  onOpenChange,
  projectId,
  onExportProject,
}: DeploymentDialogProps) {
  const [vercelStatus, setVercelStatus] = useState<IntegrationStatus | null>(
    null
  );
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentPlatform, setDeploymentPlatform] = useState<string | null>(
    null
  );

  // Check integration status when dialog opens
  useEffect(() => {
    if (open) {
      checkIntegrationStatus();
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

      // Show success and redirect
      alert(`Deployed successfully! URL: ${deployment.vercelUrl}`);
      if (deployment.vercelUrl) {
        window.open(`https://${deployment.vercelUrl}`, "_blank");
      }
    } catch (error) {
      console.error("Deployment error:", error);
      alert("Deployment failed. Please try again.");
    } finally {
      setIsDeploying(false);
      setDeploymentPlatform(null);
    }
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
              <div className="space-y-2">
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
