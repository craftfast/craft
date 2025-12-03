"use client";

interface SettingsLoadingSkeletonProps {
  title?: string;
}

export function SettingsLoadingSkeleton({
  title = "General Settings",
}: SettingsLoadingSkeletonProps) {
  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-border">
        <h2 className="text-2xl font-semibold">{title}</h2>
      </div>
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground" />
      </div>
    </div>
  );
}
