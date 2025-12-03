"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Cloud, Zap, Rocket, Server, Box, ExternalLink } from "lucide-react";

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

export default function ProjectDeploymentsSettingsPage() {
  const params = useParams();
  const projectId = params["project-id"] as string;

  const [isLoading, setIsLoading] = useState(true);

  // Deployments
  const [vercelConnected, setVercelConnected] = useState(false);
  const [netlifyConnected, setNetlifyConnected] = useState(false);
  const [railwayConnected, setRailwayConnected] = useState(false);
  const [renderConnected, setRenderConnected] = useState(false);
  const [awsConnected, setAwsConnected] = useState(false);
  const [digitalOceanConnected, setDigitalOceanConnected] = useState(false);
  const [herokuConnected, setHerokuConnected] = useState(false);

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

      if (deploymentsRes.ok) {
        const data = await deploymentsRes.json();
        if (data.deployments) setDeploymentHistory(data.deployments);
      }
    } catch (error) {
      console.error("Failed to load deployment settings:", error);
      toast.error("Failed to load deployment settings");
    } finally {
      setIsLoading(false);
    }
  };

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
          Deploy and sync your project with external services
        </p>
      </div>

      {/* Deployment History */}
      {deploymentHistory.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-medium mb-3">Recent Deployments</h3>
          <div className="space-y-2">
            {deploymentHistory.slice(0, 5).map((deployment) => (
              <div
                key={deployment.id}
                className="p-4 rounded-xl border flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      deployment.status === "ready"
                        ? "bg-green-500"
                        : deployment.status === "error"
                        ? "bg-red-500"
                        : deployment.status === "building"
                        ? "bg-yellow-500 animate-pulse"
                        : "bg-neutral-400"
                    }`}
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium capitalize">
                        {deployment.platform}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          deployment.status === "ready"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : deployment.status === "error"
                            ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                            : deployment.status === "building"
                            ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                            : "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-400"
                        }`}
                      >
                        {deployment.status}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(deployment.createdAt).toLocaleDateString()} at{" "}
                      {new Date(deployment.createdAt).toLocaleTimeString()}
                      {deployment.duration && ` • ${deployment.duration}s`}
                    </p>
                  </div>
                </div>
                {deployment.vercelUrl && deployment.status === "ready" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-lg"
                    onClick={() =>
                      window.open(`https://${deployment.vercelUrl}`, "_blank")
                    }
                  >
                    <ExternalLink className="w-4 h-4 mr-1" />
                    View
                  </Button>
                )}
                {deployment.status === "error" && deployment.errorMessage && (
                  <span className="text-xs text-red-500 max-w-[200px] truncate">
                    {deployment.errorMessage}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

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
                  Deploy to Vercel with automatic builds and preview deployments
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
                <span className="text-muted-foreground">Status</span>
                <span className="text-green-600 font-medium">Connected</span>
              </div>
              {deploymentHistory.find(
                (d) => d.platform === "vercel" && d.vercelUrl
              ) && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Latest URL</span>
                  <a
                    href={`https://${
                      deploymentHistory.find(
                        (d) => d.platform === "vercel" && d.vercelUrl
                      )?.vercelUrl
                    }`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline truncate max-w-[200px]"
                  >
                    {
                      deploymentHistory.find(
                        (d) => d.platform === "vercel" && d.vercelUrl
                      )?.vercelUrl
                    }
                  </a>
                </div>
              )}
              <Button variant="outline" size="sm" className="w-full rounded-lg">
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
                  Deploy with Netlify's global CDN and continuous deployment
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
                <span className="text-muted-foreground">Status</span>
                <span className="text-green-600 font-medium">Connected</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Site ID</span>
                <span>site-abc-123</span>
              </div>
              <Button variant="outline" size="sm" className="w-full rounded-lg">
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
                  Deploy full-stack apps with Railway's instant deployments
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
                <span className="text-muted-foreground">Status</span>
                <span className="text-green-600 font-medium">Connected</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Environment</span>
                <span>production</span>
              </div>
              <Button variant="outline" size="sm" className="w-full rounded-lg">
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
                <span className="text-muted-foreground">Status</span>
                <span className="text-green-600 font-medium">Connected</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Service Type</span>
                <span>Web Service</span>
              </div>
              <Button variant="outline" size="sm" className="w-full rounded-lg">
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
            <Switch checked={awsConnected} onCheckedChange={setAwsConnected} />
          </div>

          {awsConnected && (
            <div className="space-y-3 mt-4 pt-4 border-t">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Status</span>
                <span className="text-green-600 font-medium">Connected</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Region</span>
                <span>us-east-1</span>
              </div>
              <Button variant="outline" size="sm" className="w-full rounded-lg">
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
                <h3 className="font-semibold">DigitalOcean App Platform</h3>
                <p className="text-sm text-muted-foreground">
                  Deploy apps on DigitalOcean's App Platform with auto-scaling
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
                <span className="text-muted-foreground">Status</span>
                <span className="text-green-600 font-medium">Connected</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">App ID</span>
                <span>app-do-xyz</span>
              </div>
              <Button variant="outline" size="sm" className="w-full rounded-lg">
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
                  Deploy to Heroku with Git-based deployments and add-ons
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
                <span className="text-muted-foreground">Status</span>
                <span className="text-green-600 font-medium">Connected</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">App Name</span>
                <span>my-heroku-app</span>
              </div>
              <Button variant="outline" size="sm" className="w-full rounded-lg">
                Manage Heroku App
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
