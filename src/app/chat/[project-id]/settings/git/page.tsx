"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { GitBranch, Github, Gitlab } from "lucide-react";

export default function ProjectGitSettingsPage() {
  const params = useParams();
  const projectId = params["project-id"] as string;

  const [isLoading, setIsLoading] = useState(true);

  // Git & Version Control
  const [githubConnected, setGithubConnected] = useState(false);
  const [gitlabConnected, setGitlabConnected] = useState(false);
  const [bitbucketConnected, setBitbucketConnected] = useState(false);

  // Load git settings
  useEffect(() => {
    loadGitSettings();
  }, [projectId]);

  const loadGitSettings = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/settings`);
      if (response.ok) {
        const data = await response.json();
        if (data.git) {
          setGithubConnected(data.git.github || false);
          setGitlabConnected(data.git.gitlab || false);
          setBitbucketConnected(data.git.bitbucket || false);
        }
      }
    } catch (error) {
      console.error("Failed to load git settings:", error);
      toast.error("Failed to load git settings");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="pb-4 border-b border-border">
          <h2 className="text-2xl font-semibold">Git & Version Control</h2>
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
        <h2 className="text-2xl font-semibold">Git & Version Control</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Connect your project to Git repositories for version control and
          collaboration
        </p>
      </div>

      <div className="space-y-4">
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
                  Sync code with GitHub repository for version control and CI/CD
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
                <span className="text-muted-foreground">Status</span>
                <span className="text-green-600 font-medium">Connected</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Repository</span>
                <span>username/repo-name</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Branch</span>
                <span>main</span>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <Button variant="outline" size="sm" className="rounded-lg">
                  <GitBranch className="w-4 h-4 mr-2" />
                  View Repo
                </Button>
                <Button variant="outline" size="sm" className="rounded-lg">
                  Configure
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* GitLab */}
        <div className="p-6 rounded-xl border">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <Gitlab className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold">GitLab</h3>
                <p className="text-sm text-muted-foreground">
                  Integrate with GitLab for DevOps and version control
                </p>
              </div>
            </div>
            <Switch
              checked={gitlabConnected}
              onCheckedChange={setGitlabConnected}
            />
          </div>

          {gitlabConnected && (
            <div className="space-y-3 mt-4 pt-4 border-t">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Status</span>
                <span className="text-green-600 font-medium">Connected</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Project</span>
                <span>group/project-name</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Branch</span>
                <span>main</span>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <Button variant="outline" size="sm" className="rounded-lg">
                  <GitBranch className="w-4 h-4 mr-2" />
                  View Project
                </Button>
                <Button variant="outline" size="sm" className="rounded-lg">
                  Configure
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Bitbucket */}
        <div className="p-6 rounded-xl border">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <GitBranch className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold">Bitbucket</h3>
                <p className="text-sm text-muted-foreground">
                  Connect to Bitbucket for Git repositories and pipelines
                </p>
              </div>
            </div>
            <Switch
              checked={bitbucketConnected}
              onCheckedChange={setBitbucketConnected}
            />
          </div>

          {bitbucketConnected && (
            <div className="space-y-3 mt-4 pt-4 border-t">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Status</span>
                <span className="text-green-600 font-medium">Connected</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Repository</span>
                <span>workspace/repo-name</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Branch</span>
                <span>main</span>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <Button variant="outline" size="sm" className="rounded-lg">
                  <GitBranch className="w-4 h-4 mr-2" />
                  View Repo
                </Button>
                <Button variant="outline" size="sm" className="rounded-lg">
                  Configure
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
