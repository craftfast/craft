"use client";

import { Check, Loader2 } from "lucide-react";

type SaveStatus = "idle" | "saving" | "saved";

interface SaveStatusIndicatorProps {
  status: SaveStatus;
}

export function SaveStatusIndicator({ status }: SaveStatusIndicatorProps) {
  if (status === "idle") {
    return null;
  }

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      {status === "saving" && (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Saving...</span>
        </>
      )}
      {status === "saved" && (
        <>
          <Check className="w-4 h-4 text-green-600" />
          <span className="text-green-600">Saved</span>
        </>
      )}
    </div>
  );
}
