"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  FileText,
  Image as ImageIcon,
  Trash2,
  Upload,
  FileCode,
  FileType,
  Sparkles,
  Eye,
  Loader2,
  Link2,
  Check,
  X,
  ExternalLink,
} from "lucide-react";

interface KnowledgeFile {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  description?: string;
  r2Url?: string;
}

interface FigmaFrame {
  id: string;
  name: string;
  type: string;
}

interface FigmaFileInfo {
  fileKey: string;
  name: string;
  thumbnailUrl?: string;
  frames: FigmaFrame[];
}

// File type categories
const getFileCategory = (mimeType: string, name: string) => {
  if (mimeType.startsWith("image/")) return "image";
  if (
    mimeType === "text/markdown" ||
    name.endsWith(".md") ||
    mimeType === "text/plain" ||
    name.endsWith(".txt")
  )
    return "document";
  if (mimeType === "application/pdf") return "pdf";
  if (mimeType === "application/json" || name.endsWith(".json")) return "code";
  return "other";
};

const getCategoryIcon = (category: string) => {
  switch (category) {
    case "image":
      return ImageIcon;
    case "document":
      return FileText;
    case "pdf":
      return FileType;
    case "code":
      return FileCode;
    default:
      return FileText;
  }
};

const getCategoryLabel = (category: string) => {
  switch (category) {
    case "image":
      return "Design";
    case "document":
      return "Document";
    case "pdf":
      return "PDF";
    case "code":
      return "Data";
    default:
      return "File";
  }
};

const getCategoryColor = (category: string) => {
  switch (category) {
    case "image":
      return "text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30";
    case "document":
      return "text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30";
    case "pdf":
      return "text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30";
    case "code":
      return "text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30";
    default:
      return "text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-900/30";
  }
};

export default function ProjectKnowledgeSettingsPage() {
  const params = useParams();
  const projectId = params["project-id"] as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [knowledgeFiles, setKnowledgeFiles] = useState<KnowledgeFile[]>([]);

  // Figma import state
  const [figmaConnected, setFigmaConnected] = useState(false);
  const [showFigmaImport, setShowFigmaImport] = useState(false);
  const [figmaUrl, setFigmaUrl] = useState("");
  const [figmaLoading, setFigmaLoading] = useState(false);
  const [figmaFile, setFigmaFile] = useState<FigmaFileInfo | null>(null);
  const [selectedFrames, setSelectedFrames] = useState<Set<string>>(new Set());
  const [importingFrames, setImportingFrames] = useState(false);

  // Check Figma connection status
  const checkFigmaStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/integrations/figma/status");
      if (res.ok) {
        const data = await res.json();
        setFigmaConnected(data.connected);
      }
    } catch {
      // Ignore errors
    }
  }, []);

  // Load knowledge files
  useEffect(() => {
    loadKnowledgeFiles();
    checkFigmaStatus();
  }, [projectId, checkFigmaStatus]);

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

    setIsUploading(true);

    // Upload files one by one
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append("file", file);

      try {
        const response = await fetch(`/api/projects/${projectId}/knowledge`, {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          const data = await response.json();
          if (data.file) {
            setKnowledgeFiles((prev) => [data.file, ...prev]);
          }
        } else {
          const error = await response.json();
          toast.error(error.error || `Failed to upload ${file.name}`);
        }
      } catch {
        toast.error(`Failed to upload ${file.name}`);
      }
    }

    setIsUploading(false);
    toast.success(
      files.length === 1 ? "File uploaded" : `${files.length} files uploaded`
    );

    // Reset input
    e.target.value = "";
  };

  const handleDeleteFile = async (fileId: string, fileName: string) => {
    try {
      const response = await fetch(
        `/api/projects/${projectId}/knowledge/${fileId}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        setKnowledgeFiles((prev) => prev.filter((f) => f.id !== fileId));
        toast.success(`Deleted ${fileName}`);
      } else {
        toast.error("Failed to delete file");
      }
    } catch {
      toast.error("Failed to delete file");
    }
  };

  // Figma functions
  const handleFigmaConnect = async () => {
    try {
      const res = await fetch("/api/integrations/figma/connect");
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      toast.error("Failed to connect to Figma");
    }
  };

  const handleFigmaUrlSubmit = async () => {
    if (!figmaUrl.trim()) return;

    setFigmaLoading(true);
    setFigmaFile(null);
    setSelectedFrames(new Set());

    try {
      const res = await fetch(
        `/api/integrations/figma/files?url=${encodeURIComponent(figmaUrl)}`
      );

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to fetch Figma file");
      }

      const data = await res.json();
      setFigmaFile(data);

      // Auto-select all frames
      if (data.frames && data.frames.length > 0) {
        setSelectedFrames(new Set(data.frames.map((f: FigmaFrame) => f.id)));
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to load Figma file"
      );
    } finally {
      setFigmaLoading(false);
    }
  };

  const toggleFrameSelection = (frameId: string) => {
    setSelectedFrames((prev) => {
      const next = new Set(prev);
      if (next.has(frameId)) {
        next.delete(frameId);
      } else {
        next.add(frameId);
      }
      return next;
    });
  };

  const handleImportFrames = async () => {
    if (!figmaFile || selectedFrames.size === 0) return;

    setImportingFrames(true);

    try {
      const res = await fetch("/api/integrations/figma/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          fileKey: figmaFile.fileKey,
          nodeIds: Array.from(selectedFrames),
          format: "png",
          scale: 2,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to import frames");
      }

      const data = await res.json();

      // Add imported files to the list
      if (data.files && data.files.length > 0) {
        const newFiles: KnowledgeFile[] = data.files.map(
          (f: { id: string; name: string; r2Url: string }) => ({
            id: f.id,
            name: f.name,
            mimeType: "image/png",
            size: 0, // We don't have size info from the export
            r2Url: f.r2Url,
            description: `Imported from Figma`,
          })
        );
        setKnowledgeFiles((prev) => [...newFiles, ...prev]);
      }

      toast.success(
        `Imported ${data.imported} frame${
          data.imported > 1 ? "s" : ""
        } from Figma`
      );

      // Reset Figma import state
      setShowFigmaImport(false);
      setFigmaUrl("");
      setFigmaFile(null);
      setSelectedFrames(new Set());
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to import frames"
      );
    } finally {
      setImportingFrames(false);
    }
  };

  // Group files by category
  const imageFiles = knowledgeFiles.filter(
    (f) => getFileCategory(f.mimeType, f.name) === "image"
  );
  const documentFiles = knowledgeFiles.filter(
    (f) => getFileCategory(f.mimeType, f.name) === "document"
  );
  const otherFiles = knowledgeFiles.filter((f) => {
    const cat = getFileCategory(f.mimeType, f.name);
    return cat !== "image" && cat !== "document";
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="pb-4 border-b border-border">
          <h2 className="text-2xl font-semibold">Knowledge Base</h2>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-border">
        <h2 className="text-2xl font-semibold">Knowledge Base</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Add reference files to help AI understand your project better
        </p>
      </div>

      {/* How it works */}
      <div className="rounded-xl bg-neutral-50 dark:bg-neutral-900/50 p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Sparkles className="w-4 h-4 text-amber-500" />
          How Knowledge Base Works
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-muted-foreground">
          <div className="flex items-start gap-2">
            <ImageIcon className="w-4 h-4 mt-0.5 text-purple-500" />
            <div>
              <span className="font-medium text-foreground">Design Files</span>
              <p className="text-xs">
                Figma exports, mockups - share in chat for AI to implement
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <FileText className="w-4 h-4 mt-0.5 text-blue-500" />
            <div>
              <span className="font-medium text-foreground">PRDs & Docs</span>
              <p className="text-xs">
                Text files are automatically read by AI for context
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <FileCode className="w-4 h-4 mt-0.5 text-green-500" />
            <div>
              <span className="font-medium text-foreground">Data Files</span>
              <p className="text-xs">
                JSON configs, sample data - included in AI context
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Area */}
      <label
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer block ${
          isUploading
            ? "border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900/50"
            : "border-border hover:border-neutral-400 dark:hover:border-neutral-600"
        }`}
      >
        <input
          type="file"
          multiple
          onChange={handleFileUpload}
          className="hidden"
          accept="image/*,.pdf,.txt,.md,.doc,.docx,.json,.csv"
          disabled={isUploading}
        />
        {isUploading ? (
          <>
            <Loader2 className="w-10 h-10 mx-auto mb-3 text-muted-foreground animate-spin" />
            <p className="font-medium mb-1">Uploading...</p>
          </>
        ) : (
          <>
            <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
            <p className="font-medium mb-1">
              Drop files here or click to upload
            </p>
            <p className="text-sm text-muted-foreground">
              Images, PDFs, Markdown, Text, JSON (max 10MB each)
            </p>
          </>
        )}
      </label>

      {/* Figma Import Section */}
      <div className="rounded-xl border p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white dark:bg-neutral-800 flex items-center justify-center border">
              <svg className="w-5 h-5" viewBox="0 0 38 57" fill="none">
                <path
                  d="M19 28.5C19 23.2533 23.2533 19 28.5 19C33.7467 19 38 23.2533 38 28.5C38 33.7467 33.7467 38 28.5 38C23.2533 38 19 33.7467 19 28.5Z"
                  fill="#1ABCFE"
                />
                <path
                  d="M0 47.5C0 42.2533 4.25329 38 9.5 38H19V47.5C19 52.7467 14.7467 57 9.5 57C4.25329 57 0 52.7467 0 47.5Z"
                  fill="#0ACF83"
                />
                <path
                  d="M19 0V19H28.5C33.7467 19 38 14.7467 38 9.5C38 4.25329 33.7467 0 28.5 0H19Z"
                  fill="#FF7262"
                />
                <path
                  d="M0 9.5C0 14.7467 4.25329 19 9.5 19H19V0H9.5C4.25329 0 0 4.25329 0 9.5Z"
                  fill="#F24E1E"
                />
                <path
                  d="M0 28.5C0 33.7467 4.25329 38 9.5 38H19V19H9.5C4.25329 19 0 23.2533 0 28.5Z"
                  fill="#A259FF"
                />
              </svg>
            </div>
            <div>
              <p className="font-medium text-sm">Import from Figma</p>
              <p className="text-xs text-muted-foreground">
                {figmaConnected
                  ? "Import frames directly from your designs"
                  : "Connect Figma to import designs"}
              </p>
            </div>
          </div>
          {figmaConnected ? (
            <Button
              variant="outline"
              size="sm"
              className="rounded-lg"
              onClick={() => setShowFigmaImport(!showFigmaImport)}
            >
              {showFigmaImport ? "Cancel" : "Import"}
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="rounded-lg"
              onClick={handleFigmaConnect}
            >
              <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
              Connect
            </Button>
          )}
        </div>

        {/* Figma Import Flow */}
        {showFigmaImport && figmaConnected && (
          <div className="space-y-4 pt-4 border-t">
            {/* URL Input */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={figmaUrl}
                  onChange={(e) => setFigmaUrl(e.target.value)}
                  placeholder="Paste Figma file URL..."
                  className="w-full pl-10 pr-4 py-2 text-sm bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                  onKeyDown={(e) => e.key === "Enter" && handleFigmaUrlSubmit()}
                />
              </div>
              <Button
                onClick={handleFigmaUrlSubmit}
                disabled={!figmaUrl.trim() || figmaLoading}
                className="rounded-lg"
              >
                {figmaLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Load"
                )}
              </Button>
            </div>

            {/* Frame Selection */}
            {figmaFile && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{figmaFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedFrames.size} of {figmaFile.frames.length} selected
                  </p>
                </div>

                {figmaFile.frames.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No frames found in this file
                  </p>
                ) : (
                  <>
                    <div className="max-h-48 overflow-y-auto space-y-1 border rounded-lg p-2">
                      {figmaFile.frames.map((frame) => (
                        <button
                          key={frame.id}
                          onClick={() => toggleFrameSelection(frame.id)}
                          className={`w-full flex items-center justify-between p-2 rounded-lg text-left text-sm transition-colors ${
                            selectedFrames.has(frame.id)
                              ? "bg-neutral-100 dark:bg-neutral-800"
                              : "hover:bg-neutral-50 dark:hover:bg-neutral-900"
                          }`}
                        >
                          <span className="truncate">{frame.name}</span>
                          {selectedFrames.has(frame.id) ? (
                            <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                          ) : (
                            <div className="w-4 h-4 border rounded flex-shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-lg"
                        onClick={() => {
                          if (selectedFrames.size === figmaFile.frames.length) {
                            setSelectedFrames(new Set());
                          } else {
                            setSelectedFrames(
                              new Set(figmaFile.frames.map((f) => f.id))
                            );
                          }
                        }}
                      >
                        {selectedFrames.size === figmaFile.frames.length
                          ? "Deselect All"
                          : "Select All"}
                      </Button>
                      <Button
                        onClick={handleImportFrames}
                        disabled={selectedFrames.size === 0 || importingFrames}
                        className="rounded-lg flex-1"
                      >
                        {importingFrames ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Importing...
                          </>
                        ) : (
                          `Import ${selectedFrames.size} Frame${
                            selectedFrames.size > 1 ? "s" : ""
                          }`
                        )}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Files List */}
      {knowledgeFiles.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="font-medium">No knowledge files yet</p>
          <p className="text-sm mt-1">
            Upload PRDs, design files, or documentation to help AI understand
            your project
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Design Files Section */}
          {imageFiles.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-purple-500" />
                Design Files ({imageFiles.length})
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {imageFiles.map((file) => (
                  <FileCard
                    key={file.id}
                    file={file}
                    onDelete={() => handleDeleteFile(file.id, file.name)}
                    showPreview
                  />
                ))}
              </div>
            </div>
          )}

          {/* Documents Section */}
          {documentFiles.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-500" />
                Documents ({documentFiles.length})
                <span className="text-xs font-normal text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded-full">
                  Auto-included in AI context
                </span>
              </h3>
              <div className="space-y-2">
                {documentFiles.map((file) => (
                  <FileRow
                    key={file.id}
                    file={file}
                    onDelete={() => handleDeleteFile(file.id, file.name)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Other Files Section */}
          {otherFiles.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <FileType className="w-4 h-4 text-neutral-500" />
                Other Files ({otherFiles.length})
              </h3>
              <div className="space-y-2">
                {otherFiles.map((file) => (
                  <FileRow
                    key={file.id}
                    file={file}
                    onDelete={() => handleDeleteFile(file.id, file.name)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Image file card with preview
function FileCard({
  file,
  onDelete,
  showPreview,
}: {
  file: KnowledgeFile;
  onDelete: () => void;
  showPreview?: boolean;
}) {
  const category = getFileCategory(file.mimeType, file.name);

  return (
    <div className="group relative rounded-xl border overflow-hidden bg-card hover:shadow-sm transition-shadow">
      {/* Preview */}
      {showPreview && file.r2Url && category === "image" ? (
        <div className="aspect-video bg-neutral-100 dark:bg-neutral-800 relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={file.r2Url}
            alt={file.name}
            className="w-full h-full object-cover"
          />
          <a
            href={file.r2Url}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Eye className="w-5 h-5 text-white" />
          </a>
        </div>
      ) : (
        <div className="aspect-video bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
          {(() => {
            const Icon = getCategoryIcon(category);
            return <Icon className="w-8 h-8 text-muted-foreground" />;
          })()}
        </div>
      )}

      {/* Info */}
      <div className="p-3">
        <div className="font-medium text-sm truncate" title={file.name}>
          {file.name}
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs text-muted-foreground">
            {(file.size / 1024).toFixed(0)} KB
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={onDelete}
          >
            <Trash2 className="w-3.5 h-3.5 text-red-500" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// File row for documents
function FileRow({
  file,
  onDelete,
}: {
  file: KnowledgeFile;
  onDelete: () => void;
}) {
  const category = getFileCategory(file.mimeType, file.name);
  const Icon = getCategoryIcon(category);
  const colorClass = getCategoryColor(category);

  return (
    <div className="flex items-center justify-between p-3 rounded-xl border hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors group">
      <div className="flex items-center gap-3 min-w-0">
        <div className={`p-2 rounded-lg ${colorClass}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <div className="font-medium text-sm truncate">{file.name}</div>
          <div className="text-xs text-muted-foreground">
            {getCategoryLabel(category)} • {(file.size / 1024).toFixed(0)} KB
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {file.r2Url && (
          <a
            href={file.r2Url}
            target="_blank"
            rel="noopener noreferrer"
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 rounded-lg"
            >
              <Eye className="w-4 h-4 text-muted-foreground" />
            </Button>
          </a>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={onDelete}
        >
          <Trash2 className="w-4 h-4 text-red-500" />
        </Button>
      </div>
    </div>
  );
}
