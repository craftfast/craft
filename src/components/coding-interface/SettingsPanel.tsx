"use client";

import { useState, useEffect } from "react";
import { Sparkles } from "lucide-react";

interface SettingsPanelProps {
  projectId: string;
  onProjectUpdate?: () => void;
}

export default function SettingsPanel({
  projectId,
  onProjectUpdate,
}: SettingsPanelProps) {
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [visibility, setVisibility] = useState<"public" | "private">("private");
  const [autoSave, setAutoSave] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingName, setIsGeneratingName] = useState(false);

  // Load project data
  useEffect(() => {
    const loadProject = async () => {
      try {
        const response = await fetch(`/api/projects/${projectId}`);
        if (response.ok) {
          const data = await response.json();
          setProjectName(data.project.name || "");
          setProjectDescription(data.project.description || "");
        }
      } catch (error) {
        console.error("Error loading project:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProject();
  }, [projectId]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: projectName,
          description: projectDescription,
        }),
      });

      if (response.ok) {
        console.log("Project updated successfully");
        // Notify parent component to refresh
        if (onProjectUpdate) {
          onProjectUpdate();
        }
      } else {
        console.error("Failed to update project");
      }
    } catch (error) {
      console.error("Error updating project:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateName = async () => {
    if (!projectDescription.trim()) {
      alert("Please add a description first to generate a name");
      return;
    }

    setIsGeneratingName(true);
    try {
      const response = await fetch("/api/projects/generate-name", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          description: projectDescription,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const newName = data.name;
        setProjectName(newName);

        // Auto-save the new name
        const saveResponse = await fetch(`/api/projects/${projectId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: newName,
            description: projectDescription,
          }),
        });

        if (saveResponse.ok && onProjectUpdate) {
          onProjectUpdate();
        }
      } else {
        console.error("Failed to generate name");
      }
    } catch (error) {
      console.error("Error generating name:", error);
    } finally {
      setIsGeneratingName(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-white dark:bg-neutral-900">
        <div className="text-sm text-neutral-600 dark:text-neutral-400">
          Loading settings...
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-neutral-900">
      {/* Header */}
      <div className="h-14 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between px-6">
        <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          App Settings
        </h2>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-4 py-1.5 text-xs font-medium bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-full hover:opacity-80 transition-opacity disabled:opacity-50"
        >
          {isSaving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-2xl space-y-6">
          {/* General Settings */}
          <section>
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
              General
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">
                    Project Name
                  </label>
                  <button
                    onClick={handleGenerateName}
                    disabled={isGeneratingName || !projectDescription.trim()}
                    className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Generate name using AI"
                  >
                    <Sparkles className="w-3 h-3" />
                    {isGeneratingName ? "Generating..." : "Generate with AI"}
                  </button>
                </div>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="Enter project name"
                  className="w-full px-4 py-2 text-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-full focus:outline-none focus:ring-2 focus:ring-neutral-500/20"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Description
                </label>
                <textarea
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  rows={3}
                  placeholder="Describe your project..."
                  className="w-full px-4 py-3 text-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-neutral-500/20 resize-none"
                />
                <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                  Add a description to generate an AI-powered project name
                </p>
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Visibility
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setVisibility("public")}
                    className={`flex-1 px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                      visibility === "public"
                        ? "bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900"
                        : "bg-neutral-50 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                    }`}
                  >
                    Public
                  </button>
                  <button
                    onClick={() => setVisibility("private")}
                    className={`flex-1 px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                      visibility === "private"
                        ? "bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900"
                        : "bg-neutral-50 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                    }`}
                  >
                    Private
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Editor Settings */}
          <section className="pt-6 border-t border-neutral-200 dark:border-neutral-800">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
              Editor
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                    Auto Save
                  </div>
                  <div className="text-xs text-neutral-600 dark:text-neutral-400">
                    Automatically save changes as you type
                  </div>
                </div>
                <button
                  onClick={() => setAutoSave(!autoSave)}
                  className={`w-12 h-6 rounded-full transition-colors relative ${
                    autoSave
                      ? "bg-neutral-900 dark:bg-neutral-100"
                      : "bg-neutral-300 dark:bg-neutral-700"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-5 h-5 rounded-full bg-white dark:bg-neutral-900 transition-transform ${
                      autoSave ? "right-0.5" : "left-0.5"
                    }`}
                  />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                    Dark Mode
                  </div>
                  <div className="text-xs text-neutral-600 dark:text-neutral-400">
                    Use dark theme in the editor
                  </div>
                </div>
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className={`w-12 h-6 rounded-full transition-colors relative ${
                    darkMode
                      ? "bg-neutral-900 dark:bg-neutral-100"
                      : "bg-neutral-300 dark:bg-neutral-700"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-5 h-5 rounded-full bg-white dark:bg-neutral-900 transition-transform ${
                      darkMode ? "right-0.5" : "left-0.5"
                    }`}
                  />
                </button>
              </div>
            </div>
          </section>

          {/* Environment Variables */}
          <section className="pt-6 border-t border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                Environment Variables
              </h3>
              <button className="px-3 py-1 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors">
                Add Variable
              </button>
            </div>
            <div className="space-y-2">
              {["DATABASE_URL", "API_KEY", "SECRET_KEY"].map((key) => (
                <div
                  key={key}
                  className="flex items-center gap-2 p-3 bg-neutral-50 dark:bg-neutral-800 rounded-xl"
                >
                  <code className="flex-1 text-xs font-mono text-neutral-700 dark:text-neutral-300">
                    {key}
                  </code>
                  <button className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors">
                    <svg
                      className="w-4 h-4 text-neutral-600 dark:text-neutral-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                      />
                    </svg>
                  </button>
                  <button className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors">
                    <svg
                      className="w-4 h-4 text-neutral-600 dark:text-neutral-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Danger Zone */}
          <section className="pt-6 border-t border-neutral-200 dark:border-neutral-800">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
              Danger Zone
            </h3>
            <div className="p-4 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-1">
                    Delete Project
                  </div>
                  <div className="text-xs text-neutral-600 dark:text-neutral-400">
                    Permanently delete this project and all its data
                  </div>
                </div>
                <button className="px-4 py-2 text-sm font-medium bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-full hover:opacity-80 transition-opacity">
                  Delete
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
