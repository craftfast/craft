"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Users, Plus, X } from "lucide-react";

interface Collaborator {
  id: string;
  email: string;
  role: "owner" | "editor" | "viewer";
  addedAt: string;
}

export default function ProjectCollaboratorsSettingsPage() {
  const params = useParams();
  const projectId = params["project-id"] as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Collaborators
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [newCollaboratorEmail, setNewCollaboratorEmail] = useState("");

  // Load collaborators
  useEffect(() => {
    loadCollaborators();
  }, [projectId]);

  const loadCollaborators = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/collaborators`);
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) setCollaborators(data);
      }
    } catch (error) {
      console.error("Failed to load collaborators:", error);
      toast.error("Failed to load collaborators");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCollaborator = async () => {
    if (!newCollaboratorEmail) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/collaborators`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newCollaboratorEmail, role: "viewer" }),
      });

      if (response.ok) {
        const newCollaborator = await response.json();
        setCollaborators((prev) => [...prev, newCollaborator]);
        setNewCollaboratorEmail("");
        toast.success("Collaborator added");
      } else {
        toast.error("Failed to add collaborator");
      }
    } catch (error) {
      toast.error("Failed to add collaborator");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveCollaborator = async (collaboratorId: string) => {
    try {
      const response = await fetch(
        `/api/projects/${projectId}/collaborators/${collaboratorId}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        setCollaborators((prev) => prev.filter((c) => c.id !== collaboratorId));
        toast.success("Collaborator removed");
      } else {
        toast.error("Failed to remove collaborator");
      }
    } catch (error) {
      toast.error("Failed to remove collaborator");
    }
  };

  const handleUpdateCollaboratorRole = async (
    collaboratorId: string,
    role: "editor" | "viewer"
  ) => {
    try {
      const response = await fetch(
        `/api/projects/${projectId}/collaborators/${collaboratorId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role }),
        }
      );

      if (response.ok) {
        setCollaborators((prev) =>
          prev.map((c) => (c.id === collaboratorId ? { ...c, role } : c))
        );
        toast.success("Role updated");
      } else {
        toast.error("Failed to update role");
      }
    } catch (error) {
      toast.error("Failed to update role");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="pb-4 border-b border-border">
          <h2 className="text-2xl font-semibold">Collaborators</h2>
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
        <h2 className="text-2xl font-semibold">Collaborators</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Manage who can access and edit this project
        </p>
      </div>

      {/* Add Collaborator */}
      <div className="flex gap-2">
        <Input
          type="email"
          placeholder="Email address"
          value={newCollaboratorEmail}
          onChange={(e) => setNewCollaboratorEmail(e.target.value)}
          className="rounded-lg"
        />
        <Button
          onClick={handleAddCollaborator}
          disabled={isSaving || !newCollaboratorEmail}
          className="rounded-full"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add
        </Button>
      </div>

      {/* Collaborators List */}
      <div className="space-y-3">
        {collaborators.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No collaborators yet</p>
            <p className="text-sm mt-1">Add team members to work together</p>
          </div>
        ) : (
          collaborators.map((collaborator) => (
            <div
              key={collaborator.id}
              className="flex items-center justify-between p-4 rounded-xl border"
            >
              <div className="flex-1">
                <div className="font-medium">{collaborator.email}</div>
                <div className="text-sm text-muted-foreground">
                  Added {new Date(collaborator.addedAt).toLocaleDateString()}
                </div>
              </div>

              <div className="flex items-center gap-3">
                {collaborator.role !== "owner" && (
                  <>
                    <Select
                      value={collaborator.role}
                      onValueChange={(value) =>
                        handleUpdateCollaboratorRole(
                          collaborator.id,
                          value as "editor" | "viewer"
                        )
                      }
                    >
                      <SelectTrigger className="w-32 rounded-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="editor" className="rounded-lg">
                          Editor
                        </SelectItem>
                        <SelectItem value="viewer" className="rounded-lg">
                          Viewer
                        </SelectItem>
                      </SelectContent>
                    </Select>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveCollaborator(collaborator.id)}
                      className="rounded-lg"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </>
                )}
                {collaborator.role === "owner" && (
                  <span className="text-sm text-muted-foreground px-3">
                    Owner
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
