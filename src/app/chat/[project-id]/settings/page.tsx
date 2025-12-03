"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Globe,
  Link2,
  Lock,
  Copy,
  Download,
  Trash2,
  Check,
  Loader2,
} from "lucide-react";

type Visibility = "public" | "secret" | "private";

export default function ProjectGeneralSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params["project-id"] as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">(
    "idle"
  );

  // General settings
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("private");

  // Track initial values to detect changes
  const initialValuesRef = useRef({
    name: "",
    description: "",
    visibility: "private" as Visibility,
  });
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialLoadRef = useRef(true);

  const loadProjectSettings = useCallback(async () => {
    if (!projectId) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/projects/${projectId}`);
      if (response.ok) {
        const data = await response.json();
        const project = data.project;
        if (project) {
          setProjectName(project.name || "");
          setProjectDescription(project.description || "");
          setVisibility(project.visibility || "private");
          // Store initial values
          initialValuesRef.current = {
            name: project.name || "",
            description: project.description || "",
            visibility: project.visibility || "private",
          };
          isInitialLoadRef.current = false;
        }
      } else {
        toast.error("Failed to load project settings");
      }
    } catch (error) {
      console.error("Failed to load project settings:", error);
      toast.error("Failed to load project settings");
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  // Load project settings
  useEffect(() => {
    loadProjectSettings();
  }, [loadProjectSettings]);

  // Autosave function
  const autoSave = useCallback(
    async (name: string, description: string, vis: Visibility) => {
      // Don't save if values haven't changed from initial
      if (
        name === initialValuesRef.current.name &&
        description === initialValuesRef.current.description &&
        vis === initialValuesRef.current.visibility
      ) {
        return;
      }

      setSaveStatus("saving");
      setIsSaving(true);
      try {
        const response = await fetch(`/api/projects/${projectId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            description,
            visibility: vis,
          }),
        });

        if (response.ok) {
          // Update initial values after successful save
          initialValuesRef.current = { name, description, visibility: vis };
          setSaveStatus("saved");
          // Reset to idle after showing "saved" for a moment
          setTimeout(() => setSaveStatus("idle"), 2000);
        } else {
          toast.error("Failed to update settings");
          setSaveStatus("idle");
        }
      } catch (error) {
        toast.error("Failed to update settings");
        setSaveStatus("idle");
      } finally {
        setIsSaving(false);
      }
    },
    [projectId]
  );

  // Debounced autosave effect
  useEffect(() => {
    // Skip autosave during initial load
    if (isInitialLoadRef.current || isLoading) return;

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout for debounced save (800ms delay)
    saveTimeoutRef.current = setTimeout(() => {
      autoSave(projectName, projectDescription, visibility);
    }, 800);

    // Cleanup
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [projectName, projectDescription, visibility, autoSave, isLoading]);

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
      <div className="pb-4 border-b border-border flex items-center justify-between">
        <h2 className="text-2xl font-semibold">General</h2>
        {/* Autosave Status Indicator */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {saveStatus === "saving" && (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Saving...</span>
            </>
          )}
          {saveStatus === "saved" && (
            <>
              <Check className="w-4 h-4 text-green-600" />
              <span className="text-green-600">Saved</span>
            </>
          )}
        </div>
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
      </div>
    </div>
  );
}
