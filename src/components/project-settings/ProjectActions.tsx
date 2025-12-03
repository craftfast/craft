"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Download, Trash2, Loader2 } from "lucide-react";

interface ProjectActionsProps {
  onDuplicate: () => Promise<void>;
  onExport: () => Promise<void>;
  onDelete: () => Promise<void>;
  disabled?: boolean;
}

export function ProjectActions({
  onDuplicate,
  onExport,
  onDelete,
  disabled = false,
}: ProjectActionsProps) {
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDuplicate = async () => {
    setIsDuplicating(true);
    try {
      await onDuplicate();
    } finally {
      setIsDuplicating(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await onExport();
    } finally {
      setIsExporting(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4 pt-6 border-t">
      <h3 className="text-sm font-medium text-muted-foreground">Actions</h3>

      <div className="grid gap-3">
        {/* Duplicate Project */}
        <div className="p-4 border rounded-xl hover:bg-muted/50 transition-colors">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Copy className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">Duplicate Project</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Create an exact copy of this project with all files and
                settings. The new project will open automatically.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="rounded-lg shrink-0"
              onClick={handleDuplicate}
              disabled={disabled || isDuplicating}
            >
              {isDuplicating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Duplicating...
                </>
              ) : (
                "Duplicate"
              )}
            </Button>
          </div>
        </div>

        {/* Export Project */}
        <div className="p-4 border rounded-xl hover:bg-muted/50 transition-colors">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Download className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">Export Project</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Download your project as a ZIP file. Includes all code files,
                configuration, and a README to get started locally.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="rounded-lg shrink-0"
              onClick={handleExport}
              disabled={disabled || isExporting}
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                "Export"
              )}
            </Button>
          </div>
        </div>

        {/* Delete Project */}
        <div className="p-4 border border-red-200 dark:border-red-900/50 rounded-xl bg-red-50/50 dark:bg-red-950/20">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                <span className="font-medium text-red-600 dark:text-red-400">
                  Delete Project
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Permanently delete this project and all its data. This action
                cannot be undone.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="rounded-lg shrink-0 border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/50"
              onClick={handleDelete}
              disabled={disabled || isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
