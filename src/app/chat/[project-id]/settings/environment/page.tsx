"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Lock, Plus, Trash2 } from "lucide-react";

interface EnvironmentVariable {
  id: string;
  key: string;
  value: string;
  isSecret: boolean;
  type?: string | null;
  description?: string | null;
  createdAt: string;
  creator?: { name: string | null; email: string };
}

export default function ProjectEnvironmentSettingsPage() {
  const params = useParams();
  const projectId = params["project-id"] as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Environment Variables
  const [environmentVariables, setEnvironmentVariables] = useState<
    EnvironmentVariable[]
  >([]);
  const [newEnvKey, setNewEnvKey] = useState("");
  const [newEnvValue, setNewEnvValue] = useState("");
  const [newEnvIsSecret, setNewEnvIsSecret] = useState(true);
  const [newEnvType, setNewEnvType] = useState<string>("none");
  const [newEnvDescription, setNewEnvDescription] = useState("");

  // Load environment variables
  useEffect(() => {
    loadEnvironmentVariables();
  }, [projectId]);

  const loadEnvironmentVariables = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/environment`);
      if (response.ok) {
        const data = await response.json();
        if (data.environmentVariables)
          setEnvironmentVariables(data.environmentVariables);
      }
    } catch (error) {
      console.error("Failed to load environment variables:", error);
      toast.error("Failed to load environment variables");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddEnvironmentVariable = async () => {
    if (!newEnvKey || !newEnvValue) {
      toast.error("Key and value are required");
      return;
    }

    // Validate key format
    const keyRegex = /^[A-Z][A-Z0-9_]*$/;
    if (!keyRegex.test(newEnvKey)) {
      toast.error(
        "Invalid key format. Must start with a letter and contain only uppercase letters, numbers, and underscores."
      );
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/environment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: newEnvKey,
          value: newEnvValue,
          isSecret: newEnvIsSecret,
          type: newEnvType === "none" ? null : newEnvType,
          description: newEnvDescription || null,
        }),
      });

      if (response.ok) {
        const newVar = await response.json();
        setEnvironmentVariables((prev) => [...prev, newVar]);
        setNewEnvKey("");
        setNewEnvValue("");
        setNewEnvIsSecret(true);
        setNewEnvType("none");
        setNewEnvDescription("");
        toast.success("Environment variable added");
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to add environment variable");
      }
    } catch (error) {
      toast.error("Failed to add environment variable");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveEnvironmentVariable = async (id: string) => {
    try {
      const response = await fetch(
        `/api/projects/${projectId}/environment/${id}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        setEnvironmentVariables((prev) => prev.filter((v) => v.id !== id));
        toast.success("Environment variable removed");
      } else {
        toast.error("Failed to remove environment variable");
      }
    } catch (error) {
      toast.error("Failed to remove environment variable");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="pb-4 border-b border-border">
          <h2 className="text-2xl font-semibold">Environment Variables</h2>
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
        <h2 className="text-2xl font-semibold">Environment Variables</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Manage environment variables for your project
        </p>
      </div>

      {/* Add New Variable */}
      <div className="space-y-4 p-4 rounded-xl border">
        <div className="space-y-2">
          <Label htmlFor="env-key">
            Key <span className="text-red-500">*</span>
          </Label>
          <Input
            id="env-key"
            value={newEnvKey}
            onChange={(e) => setNewEnvKey(e.target.value.toUpperCase())}
            placeholder="DATABASE_URL"
            className="rounded-lg font-mono"
          />
          <p className="text-xs text-muted-foreground">
            Uppercase letters, numbers, and underscores only
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="env-value">
            Value <span className="text-red-500">*</span>
          </Label>
          <Input
            id="env-value"
            type="text"
            value={newEnvValue}
            onChange={(e) => setNewEnvValue(e.target.value)}
            placeholder="postgresql://..."
            className="rounded-lg font-mono"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="env-type">Type (Optional)</Label>
            <Select value={newEnvType} onValueChange={setNewEnvType}>
              <SelectTrigger className="rounded-lg">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="none" className="rounded-lg">
                  None
                </SelectItem>
                <SelectItem value="url" className="rounded-lg">
                  URL
                </SelectItem>
                <SelectItem value="email" className="rounded-lg">
                  Email
                </SelectItem>
                <SelectItem value="number" className="rounded-lg">
                  Number
                </SelectItem>
                <SelectItem value="port" className="rounded-lg">
                  Port
                </SelectItem>
                <SelectItem value="json" className="rounded-lg">
                  JSON
                </SelectItem>
                <SelectItem value="boolean" className="rounded-lg">
                  Boolean
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="env-description">Description (Optional)</Label>
            <Input
              id="env-description"
              value={newEnvDescription}
              onChange={(e) => setNewEnvDescription(e.target.value)}
              placeholder="Database connection string"
              className="rounded-lg"
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="env-secret"
            checked={!newEnvIsSecret}
            onCheckedChange={(checked) => setNewEnvIsSecret(!checked)}
          />
          <Label htmlFor="env-secret" className="cursor-pointer">
            Make public (accessible to UI)
          </Label>
          <span className="text-xs text-muted-foreground">
            (Secret by default)
          </span>
        </div>

        <Button
          onClick={handleAddEnvironmentVariable}
          disabled={isSaving || !newEnvKey || !newEnvValue}
          className="w-full rounded-full"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Variable
        </Button>
      </div>

      {/* Variables List */}
      <div className="space-y-3">
        {environmentVariables.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Lock className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No environment variables yet</p>
            <p className="text-sm mt-1">
              Add variables to configure your project
            </p>
          </div>
        ) : (
          environmentVariables.map((envVar) => (
            <div
              key={envVar.id}
              className="flex items-start justify-between p-4 rounded-xl border hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors"
            >
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold font-mono text-sm">
                    {envVar.key}
                  </span>
                  {envVar.isSecret && (
                    <Lock className="w-3 h-3 text-muted-foreground" />
                  )}
                  {envVar.type && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-muted-foreground">
                      {envVar.type}
                    </span>
                  )}
                </div>
                <div className="text-sm text-muted-foreground font-mono truncate">
                  {envVar.value}
                </div>
                {envVar.description && (
                  <p className="text-xs text-muted-foreground">
                    {envVar.description}
                  </p>
                )}
                <div className="text-xs text-muted-foreground">
                  Added {new Date(envVar.createdAt).toLocaleDateString()}
                  {envVar.creator?.name && ` by ${envVar.creator.name}`}
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveEnvironmentVariable(envVar.id)}
                className="rounded-lg flex-shrink-0"
                title="Delete variable"
              >
                <Trash2 className="w-4 h-4 text-red-600" />
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
