"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Globe, Link2, Lock, Copy, Download, Trash2 } from "lucide-react";

type Visibility = "public" | "secret" | "private";

export default function ProjectGeneralSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params["project-id"] as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // General settings
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("private");

  // Load project settings
  useEffect(() => {
    loadProjectSettings();
  }, [projectId]);

  const loadProjectSettings = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/projects/${projectId}`);
      if (response.ok) {
        const data = await response.json();
        setProjectName(data.name || "");
        setProjectDescription(data.description || "");
        setVisibility(data.visibility || "private");
      }
    } catch (error) {
      console.error("Failed to load project settings:", error);
      toast.error("Failed to load project settings");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveGeneral = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: projectName,
          description: projectDescription,
          visibility,
        }),
      });

      if (response.ok) {
        toast.success("Project settings updated");
      } else {
        toast.error("Failed to update settings");
      }
    } catch (error) {
      toast.error("Failed to update settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDuplicateProject = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/duplicate`, {
        method: "POST",
      });
      if (response.ok) {
        toast.success("Project duplicated successfully");
      } else {
        toast.error("Failed to duplicate project");
      }
    } catch (error) {
      toast.error("Failed to duplicate project");
    }
  };

  const handleExportProject = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/export`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${projectName}.zip`;
        a.click();
        toast.success("Project exported successfully");
      } else {
        toast.error("Failed to export project");
      }
    } catch (error) {
      toast.error("Failed to export project");
    }
  };

  const handleDeleteProject = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this project? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        toast.success("Project deleted");
        router.push("/");
      } else {
        toast.error("Failed to delete project");
      }
    } catch (error) {
      toast.error("Failed to delete project");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="pb-4 border-b border-border">
          <h2 className="text-2xl font-semibold">General Settings</h2>
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
        <h2 className="text-2xl font-semibold">General Settings</h2>
      </div>

      <div className="space-y-6">
        {/* Project Name */}
        <div className="space-y-2">
          <Label htmlFor="project-name">Project Name</Label>
          <Input
            id="project-name"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="My Awesome Project"
            className="rounded-lg"
          />
        </div>

        {/* Project Description */}
        <div className="space-y-2">
          <Label htmlFor="project-description">Description</Label>
          <Textarea
            id="project-description"
            value={projectDescription}
            onChange={(e) => setProjectDescription(e.target.value)}
            placeholder="Describe your project..."
            className="rounded-lg min-h-[100px]"
          />
        </div>

        {/* Visibility */}
        <div className="space-y-2">
          <Label>Visibility</Label>
          <div className="grid gap-3">
            <button
              onClick={() => setVisibility("public")}
              className={`flex items-start gap-3 p-4 rounded-xl border-2 transition-colors ${
                visibility === "public"
                  ? "border-foreground bg-muted"
                  : "border-border hover:border-muted-foreground"
              }`}
            >
              <Globe className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div className="flex-1 text-left">
                <div className="font-medium">Public</div>
                <div className="text-sm text-muted-foreground">
                  Everyone can view this project
                </div>
              </div>
            </button>

            <button
              onClick={() => setVisibility("secret")}
              className={`flex items-start gap-3 p-4 rounded-xl border-2 transition-colors ${
                visibility === "secret"
                  ? "border-foreground bg-muted"
                  : "border-border hover:border-muted-foreground"
              }`}
            >
              <Link2 className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div className="flex-1 text-left">
                <div className="font-medium">Secret</div>
                <div className="text-sm text-muted-foreground">
                  Accessible via shared URL only
                </div>
              </div>
            </button>

            <button
              onClick={() => setVisibility("private")}
              className={`flex items-start gap-3 p-4 rounded-xl border-2 transition-colors ${
                visibility === "private"
                  ? "border-foreground bg-muted"
                  : "border-border hover:border-muted-foreground"
              }`}
            >
              <Lock className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div className="flex-1 text-left">
                <div className="font-medium">Private</div>
                <div className="text-sm text-muted-foreground">
                  Only you can access this project
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3 pt-4 border-t">
          <h3 className="text-sm font-medium text-muted-foreground">Actions</h3>

          <div className="grid gap-2">
            <Button
              variant="outline"
              className="w-full justify-start rounded-lg"
              onClick={handleDuplicateProject}
            >
              <Copy className="w-4 h-4 mr-2" />
              Duplicate Project
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start rounded-lg"
              onClick={handleExportProject}
            >
              <Download className="w-4 h-4 mr-2" />
              Export Project
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
              onClick={handleDeleteProject}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Project
            </Button>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-4">
          <Button
            onClick={handleSaveGeneral}
            disabled={isSaving}
            className="rounded-full"
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}
