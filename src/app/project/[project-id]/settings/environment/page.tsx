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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Lock,
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
  ShieldCheck,
  Eye,
  EyeOff,
  Copy,
  Check,
} from "lucide-react";

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

  // Show/hide value for non-secret variables
  const [visibleValues, setVisibleValues] = useState<Set<string>>(new Set());

  // Copied state for copy button
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingVar, setEditingVar] = useState<EnvironmentVariable | null>(
    null
  );
  const [editValue, setEditValue] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

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

  const handleEditClick = (envVar: EnvironmentVariable) => {
    setEditingVar(envVar);
    setEditValue(""); // Never pre-fill with the current value for security
    setEditDescription(envVar.description || "");
    setEditDialogOpen(true);
  };

  const handleUpdateVariable = async () => {
    if (!editingVar) return;

    setIsUpdating(true);
    try {
      const updateData: { value?: string; description?: string | null } = {};

      // Only include value if user provided a new one
      if (editValue) {
        updateData.value = editValue;
      }

      // Always include description (can be empty)
      updateData.description = editDescription || null;

      const response = await fetch(
        `/api/projects/${projectId}/environment/${editingVar.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updateData),
        }
      );

      if (response.ok) {
        const updatedVar = await response.json();
        setEnvironmentVariables((prev) =>
          prev.map((v) => (v.id === editingVar.id ? updatedVar : v))
        );
        setEditDialogOpen(false);
        setEditingVar(null);
        toast.success("Environment variable updated");
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to update environment variable");
      }
    } catch (error) {
      toast.error("Failed to update environment variable");
    } finally {
      setIsUpdating(false);
    }
  };

  const toggleValueVisibility = (id: string) => {
    setVisibleValues((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleCopyValue = async (envVar: EnvironmentVariable) => {
    // For sensitive values, we can only copy the masked display
    // For non-sensitive values, copy the actual value
    const valueToCopy = envVar.isSecret ? envVar.value : envVar.value;

    try {
      await navigator.clipboard.writeText(valueToCopy);
      setCopiedId(envVar.id);
      setTimeout(() => setCopiedId(null), 2000);
      toast.success(
        envVar.isSecret ? "Masked value copied" : "Value copied to clipboard"
      );
    } catch (error) {
      toast.error("Failed to copy to clipboard");
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
          Securely store configuration and secrets for your project. Sensitive
          values are encrypted and cannot be viewed after creation.
        </p>
      </div>

      {/* Add New Variable */}
      <div className="space-y-4 p-4 rounded-xl border bg-neutral-50/50 dark:bg-neutral-900/50">
        <h3 className="font-medium text-sm">Add New Variable</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="env-value">
              Value <span className="text-red-500">*</span>
            </Label>
            <Input
              id="env-value"
              type={newEnvIsSecret ? "password" : "text"}
              value={newEnvValue}
              onChange={(e) => setNewEnvValue(e.target.value)}
              placeholder="postgresql://..."
              className="rounded-lg font-mono"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Switch
              id="env-secret"
              checked={newEnvIsSecret}
              onCheckedChange={setNewEnvIsSecret}
            />
            <div className="flex flex-col">
              <Label
                htmlFor="env-secret"
                className="cursor-pointer font-medium"
              >
                Sensitive
              </Label>
              <span className="text-xs text-muted-foreground">
                {newEnvIsSecret
                  ? "Value will be encrypted and hidden after creation"
                  : "Value will be visible to project members"}
              </span>
            </div>
          </div>

          <Button
            onClick={handleAddEnvironmentVariable}
            disabled={isSaving || !newEnvKey || !newEnvValue}
            className="rounded-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add
          </Button>
        </div>
      </div>

      {/* Variables List */}
      <div className="space-y-1">
        {environmentVariables.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground border rounded-xl">
            <ShieldCheck className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">No environment variables yet</p>
            <p className="text-sm mt-1">
              Add variables to configure your project securely
            </p>
          </div>
        ) : (
          <div className="border rounded-xl overflow-hidden divide-y">
            {environmentVariables.map((envVar) => (
              <div
                key={envVar.id}
                className="flex items-center justify-between px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors"
              >
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-medium">
                      {envVar.key}
                    </span>
                    {envVar.isSecret && (
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 font-medium">
                        <Lock className="w-3 h-3" />
                        Sensitive
                      </span>
                    )}
                    {envVar.type && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-muted-foreground">
                        {envVar.type}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <code className="text-sm text-muted-foreground font-mono truncate max-w-md">
                      {envVar.isSecret
                        ? // Sensitive values are NEVER shown - like Vercel
                          "••••••••••••••••"
                        : // Non-sensitive values can be shown/hidden
                        visibleValues.has(envVar.id)
                        ? envVar.value
                        : "••••••••••••••••"}
                    </code>

                    {/* Only show visibility toggle for non-sensitive variables */}
                    {!envVar.isSecret && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 rounded-lg"
                        onClick={() => toggleValueVisibility(envVar.id)}
                        title={
                          visibleValues.has(envVar.id)
                            ? "Hide value"
                            : "Show value"
                        }
                      >
                        {visibleValues.has(envVar.id) ? (
                          <EyeOff className="w-3.5 h-3.5 text-muted-foreground" />
                        ) : (
                          <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                        )}
                      </Button>
                    )}

                    {/* Copy button - only for non-sensitive or visible values */}
                    {!envVar.isSecret && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 rounded-lg"
                        onClick={() => handleCopyValue(envVar)}
                        title="Copy value"
                      >
                        {copiedId === envVar.id ? (
                          <Check className="w-3.5 h-3.5 text-green-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                        )}
                      </Button>
                    )}
                  </div>

                  {envVar.description && (
                    <p className="text-xs text-muted-foreground">
                      {envVar.description}
                    </p>
                  )}
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-lg h-8 w-8 p-0"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="rounded-xl">
                    <DropdownMenuItem
                      onClick={() => handleEditClick(envVar)}
                      className="rounded-lg cursor-pointer"
                    >
                      <Pencil className="w-4 h-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleRemoveEnvironmentVariable(envVar.id)}
                      className="rounded-lg cursor-pointer text-red-600 focus:text-red-600"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Security Notice */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900">
        <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
            Security Notice
          </p>
          <p className="text-xs text-blue-700 dark:text-blue-300">
            Sensitive environment variables are encrypted at rest and their
            values cannot be viewed after creation. They are securely injected
            into your sandbox at runtime. Environment variables are never
            included in exports, GitHub sync, or backups.
          </p>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Edit Environment Variable</DialogTitle>
            <DialogDescription>
              {editingVar?.isSecret
                ? "Enter a new value to update. The current value is hidden for security."
                : "Update the value and description for this variable."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Key</Label>
              <Input
                value={editingVar?.key || ""}
                disabled
                className="rounded-lg font-mono bg-neutral-100 dark:bg-neutral-800"
              />
              <p className="text-xs text-muted-foreground">
                Environment variable keys cannot be changed
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-value">
                New Value {editingVar?.isSecret && "(Current value is hidden)"}
              </Label>
              <Input
                id="edit-value"
                type={editingVar?.isSecret ? "password" : "text"}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                placeholder={
                  editingVar?.isSecret ? "Enter new value..." : "Enter value..."
                }
                className="rounded-lg font-mono"
              />
              {editingVar?.isSecret && (
                <p className="text-xs text-muted-foreground">
                  Leave empty to keep the current value unchanged
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description (Optional)</Label>
              <Input
                id="edit-description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Description..."
                className="rounded-lg"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
              className="rounded-full"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateVariable}
              disabled={isUpdating || (!editValue && !editDescription)}
              className="rounded-full"
            >
              {isUpdating ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
