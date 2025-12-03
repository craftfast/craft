"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export type SaveStatus = "idle" | "saving" | "saved";

interface ProjectSettingsState {
    name: string;
    description: string;
}

interface UseProjectSettingsOptions {
    projectId: string;
    debounceMs?: number;
}

interface UseProjectSettingsReturn {
    // State
    isLoading: boolean;
    isSaving: boolean;
    saveStatus: SaveStatus;
    projectName: string;
    projectDescription: string;

    // Setters
    setProjectName: (name: string) => void;
    setProjectDescription: (description: string) => void;

    // Actions
    handleDuplicateProject: () => Promise<void>;
    handleExportProject: () => Promise<void>;
    handleDeleteProject: () => Promise<void>;
}

const DEBOUNCE_MS = 800;
const SAVED_STATUS_DURATION_MS = 2000;

export function useProjectSettings({
    projectId,
    debounceMs = DEBOUNCE_MS,
}: UseProjectSettingsOptions): UseProjectSettingsReturn {
    const router = useRouter();

    // Loading and saving states
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");

    // Project settings
    const [projectName, setProjectName] = useState("");
    const [projectDescription, setProjectDescription] = useState("");

    // Refs for tracking changes and debouncing
    const initialValuesRef = useRef<ProjectSettingsState>({
        name: "",
        description: "",
    });
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isInitialLoadRef = useRef(true);

    // Load project settings
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
                    // Store initial values for change detection
                    initialValuesRef.current = {
                        name: project.name || "",
                        description: project.description || "",
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

    // Auto-save function
    const autoSave = useCallback(
        async (name: string, description: string) => {
            const { name: initialName, description: initialDescription } = initialValuesRef.current;

            // Skip save if values haven't changed
            if (
                name === initialName &&
                description === initialDescription
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
                    }),
                });

                if (response.ok) {
                    // Update initial values after successful save
                    initialValuesRef.current = { name, description };
                    setSaveStatus("saved");
                    // Reset to idle after showing "saved" status
                    setTimeout(() => setSaveStatus("idle"), SAVED_STATUS_DURATION_MS);
                } else {
                    toast.error("Failed to update settings");
                    setSaveStatus("idle");
                }
            } catch (error) {
                console.error("Failed to save project settings:", error);
                toast.error("Failed to update settings");
                setSaveStatus("idle");
            } finally {
                setIsSaving(false);
            }
        },
        [projectId]
    );

    // Load settings on mount
    useEffect(() => {
        loadProjectSettings();
    }, [loadProjectSettings]);

    // Debounced auto-save effect
    useEffect(() => {
        // Skip autosave during initial load
        if (isInitialLoadRef.current || isLoading) return;

        // Clear existing timeout
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        // Set new timeout for debounced save
        saveTimeoutRef.current = setTimeout(() => {
            autoSave(projectName, projectDescription);
        }, debounceMs);

        // Cleanup on unmount or value change
        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, [projectName, projectDescription, autoSave, isLoading, debounceMs]);

    // Action handlers
    const handleDuplicateProject = useCallback(async () => {
        try {
            const response = await fetch(`/api/projects/${projectId}/duplicate`, {
                method: "POST",
            });
            if (response.ok) {
                const data = await response.json();
                toast.success("Project duplicated successfully");
                // Navigate to the duplicated project
                if (data.project?.id) {
                    router.push(`/chat/${data.project.id}`);
                }
            } else {
                const error = await response.json();
                toast.error(error.error || "Failed to duplicate project");
            }
        } catch (error) {
            console.error("Failed to duplicate project:", error);
            toast.error("Failed to duplicate project");
        }
    }, [projectId, router]);

    const handleExportProject = useCallback(async () => {
        try {
            const response = await fetch(`/api/projects/${projectId}/export`);
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                // Sanitize filename
                const safeName = projectName.replace(/[^a-z0-9]/gi, "_") || "project";
                a.download = `${safeName}.zip`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
                toast.success("Project exported successfully");
            } else {
                const error = await response.json();
                toast.error(error.error || "Failed to export project");
            }
        } catch (error) {
            console.error("Failed to export project:", error);
            toast.error("Failed to export project");
        }
    }, [projectId, projectName]);

    const handleDeleteProject = useCallback(async () => {
        const confirmed = window.confirm(
            "Are you sure you want to delete this project? This action cannot be undone."
        );

        if (!confirmed) return;

        try {
            const response = await fetch(`/api/projects/${projectId}`, {
                method: "DELETE",
            });
            if (response.ok) {
                toast.success("Project deleted successfully");
                router.push("/projects");
            } else {
                const error = await response.json();
                toast.error(error.error || "Failed to delete project");
            }
        } catch (error) {
            console.error("Failed to delete project:", error);
            toast.error("Failed to delete project");
        }
    }, [projectId, router]);

    return {
        // State
        isLoading,
        isSaving,
        saveStatus,
        projectName,
        projectDescription,

        // Setters
        setProjectName,
        setProjectDescription,

        // Actions
        handleDuplicateProject,
        handleExportProject,
        handleDeleteProject,
    };
}
