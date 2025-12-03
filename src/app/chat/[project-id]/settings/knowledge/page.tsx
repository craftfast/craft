"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { FileText, Image as ImageIcon, Trash2 } from "lucide-react";

interface KnowledgeFile {
  id: string;
  name: string;
  type: string;
  size: number;
}

export default function ProjectKnowledgeSettingsPage() {
  const params = useParams();
  const projectId = params["project-id"] as string;

  const [isLoading, setIsLoading] = useState(true);
  const [knowledgeFiles, setKnowledgeFiles] = useState<KnowledgeFile[]>([]);

  // Load knowledge files
  useEffect(() => {
    loadKnowledgeFiles();
  }, [projectId]);

  const loadKnowledgeFiles = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/knowledge`);
      if (response.ok) {
        const data = await response.json();
        if (data.files) setKnowledgeFiles(data.files);
      }
    } catch (error) {
      console.error("Failed to load knowledge files:", error);
      toast.error("Failed to load knowledge files");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append("files", files[i]);
    }

    try {
      const response = await fetch(`/api/projects/${projectId}/knowledge`, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setKnowledgeFiles((prev) => [...prev, ...data.files]);
        toast.success("Files uploaded successfully");
      } else {
        toast.error("Failed to upload files");
      }
    } catch (error) {
      toast.error("Failed to upload files");
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    try {
      const response = await fetch(
        `/api/projects/${projectId}/knowledge/${fileId}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        setKnowledgeFiles((prev) => prev.filter((f) => f.id !== fileId));
        toast.success("File deleted");
      } else {
        toast.error("Failed to delete file");
      }
    } catch (error) {
      toast.error("Failed to delete file");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="pb-4 border-b border-border">
          <h2 className="text-2xl font-semibold">Knowledge</h2>
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
        <h2 className="text-2xl font-semibold">Knowledge</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Add design files, documentation, and context for AI
        </p>
      </div>

      {/* Upload Area */}
      <label className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-muted-foreground transition-colors cursor-pointer block">
        <input
          type="file"
          multiple
          onChange={handleFileUpload}
          className="hidden"
          accept="image/*,.pdf,.txt,.md,.doc,.docx"
        />
        <FileText className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
        <p className="font-medium mb-1">Drop files here or click to upload</p>
        <p className="text-sm text-muted-foreground">
          Supports images, PDFs, and text files
        </p>
      </label>

      {/* Files List */}
      <div className="space-y-3">
        {knowledgeFiles.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">No files uploaded yet</p>
          </div>
        ) : (
          knowledgeFiles.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between p-4 rounded-xl border"
            >
              <div className="flex items-center gap-3">
                {file.type.startsWith("image/") ? (
                  <ImageIcon className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <FileText className="w-5 h-5 text-muted-foreground" />
                )}
                <div>
                  <div className="font-medium">{file.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {(file.size / 1024).toFixed(2)} KB
                  </div>
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="rounded-lg"
                onClick={() => handleDeleteFile(file.id)}
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
