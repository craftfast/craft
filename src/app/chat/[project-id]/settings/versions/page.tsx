"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Clock } from "lucide-react";

interface Version {
  id: string;
  name: string;
  createdAt: string;
  isCurrent: boolean;
}

export default function ProjectVersionsSettingsPage() {
  const params = useParams();
  const projectId = params["project-id"] as string;

  const [isLoading, setIsLoading] = useState(true);
  const [versions, setVersions] = useState<Version[]>([]);

  // Load versions
  useEffect(() => {
    loadVersions();
  }, [projectId]);

  const loadVersions = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/versions`);
      if (response.ok) {
        const data = await response.json();
        if (data.versions) {
          setVersions(
            data.versions.map((v: any) => ({
              id: v.id,
              name: v.name || `Version ${v.version}`,
              createdAt: v.createdAt,
              isCurrent: v.version === data.currentVersion,
            }))
          );
        }
      }
    } catch (error) {
      console.error("Failed to load versions:", error);
      toast.error("Failed to load versions");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestoreVersion = async (versionId: string) => {
    try {
      const response = await fetch(
        `/api/projects/${projectId}/versions/${versionId}/restore`,
        {
          method: "POST",
        }
      );

      if (response.ok) {
        toast.success("Version restored");
        loadVersions();
      } else {
        toast.error("Failed to restore version");
      }
    } catch (error) {
      toast.error("Failed to restore version");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="pb-4 border-b border-border">
          <h2 className="text-2xl font-semibold">Versions</h2>
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
        <h2 className="text-2xl font-semibold">Versions</h2>
        <p className="text-muted-foreground text-sm mt-1">
          View and restore previous versions of your project
        </p>
      </div>

      <div className="space-y-3">
        {versions.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No versions yet</p>
            <p className="text-sm mt-1">Versions are created automatically</p>
          </div>
        ) : (
          versions.map((version) => (
            <div
              key={version.id}
              className="flex items-center justify-between p-4 rounded-xl border"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{version.name}</span>
                  {version.isCurrent && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                      Current
                    </span>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  {new Date(version.createdAt).toLocaleString()}
                </div>
              </div>

              {!version.isCurrent && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRestoreVersion(version.id)}
                  className="rounded-lg"
                >
                  Restore
                </Button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
