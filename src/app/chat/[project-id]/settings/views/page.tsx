"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  Eye,
  Code2,
  Database,
  HardDrive,
  FileText,
  Lock,
  GitBranch,
  BarChart3,
  MessageCircle,
  Cloud,
} from "lucide-react";

interface CustomView {
  id: string;
  label: string;
  type: string;
  enabled: boolean;
  order: number;
}

const viewTypes = [
  { id: "database", label: "Database", icon: Database },
  { id: "storage", label: "Storage", icon: HardDrive },
  { id: "logs", label: "Logs", icon: FileText },
  { id: "auth", label: "Auth", icon: Lock },
  { id: "git", label: "Git", icon: GitBranch },
  { id: "dashboard", label: "Dashboard", icon: BarChart3 },
  { id: "chat", label: "Chat", icon: MessageCircle },
  { id: "deployment", label: "Deployment", icon: Cloud },
];

export default function ProjectViewsSettingsPage() {
  const params = useParams();
  const projectId = params["project-id"] as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [customViews, setCustomViews] = useState<CustomView[]>([]);

  // Load custom views
  useEffect(() => {
    loadCustomViews();
  }, [projectId]);

  const loadCustomViews = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/settings`);
      if (response.ok) {
        const data = await response.json();
        if (data.customViews) setCustomViews(data.customViews);
      }
    } catch (error) {
      console.error("Failed to load custom views:", error);
      toast.error("Failed to load custom views");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleCustomView = async (viewId: string, enabled: boolean) => {
    setIsSaving(true);
    try {
      const response = await fetch(
        `/api/projects/${projectId}/views/${viewId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ enabled }),
        }
      );

      if (response.ok) {
        setCustomViews((prev) =>
          prev.map((v) => (v.id === viewId ? { ...v, enabled } : v))
        );
        toast.success("View updated");
      } else {
        toast.error("Failed to update view");
      }
    } catch (error) {
      toast.error("Failed to update view");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="pb-4 border-b border-border">
          <h2 className="text-2xl font-semibold">Custom Views</h2>
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
        <h2 className="text-2xl font-semibold">Custom Views</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Configure which views appear in the preview dropdown
        </p>
      </div>

      {/* Default Views (always shown) */}
      <div className="p-4 rounded-xl border bg-muted/30">
        <h3 className="text-sm font-semibold mb-3 text-muted-foreground">
          Default Views (Always Visible)
        </h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 rounded-lg bg-background">
            <div className="flex items-center gap-3">
              <Eye className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">Preview</span>
            </div>
            <span className="text-xs text-muted-foreground">Required</span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-background">
            <div className="flex items-center gap-3">
              <Code2 className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">Code</span>
            </div>
            <span className="text-xs text-muted-foreground">Required</span>
          </div>
        </div>
      </div>

      {/* Custom/Optional Views */}
      <div>
        <h3 className="text-sm font-semibold mb-3 text-muted-foreground">
          Additional Views
        </h3>
        <div className="space-y-2">
          {viewTypes.map((viewType) => {
            const view = customViews.find((v) => v.id === viewType.id) || {
              id: viewType.id,
              label: viewType.label,
              type: viewType.id,
              enabled: false,
              order: 0,
            };
            const Icon = viewType.icon;

            return (
              <div
                key={viewType.id}
                className="flex items-center justify-between p-4 rounded-xl border"
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">{viewType.label}</span>
                </div>
                <Switch
                  checked={view.enabled}
                  onCheckedChange={(checked) =>
                    handleToggleCustomView(viewType.id, checked)
                  }
                  disabled={isSaving}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
