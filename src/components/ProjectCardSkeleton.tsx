export default function ProjectCardSkeleton() {
  return (
    <div className="p-4 bg-card/50 rounded-xl border border-border/50 animate-pulse">
      <div className="flex items-start justify-between mb-2">
        {/* Icon skeleton */}
        <div className="w-8 h-8 rounded-lg bg-muted/50" />
        {/* Date skeleton */}
        <div className="h-3 w-12 bg-muted/50 rounded" />
      </div>
      {/* Title skeleton */}
      <div className="h-4 bg-muted/50 rounded mb-2 w-3/4" />
      {/* Metadata skeleton */}
      <div className="h-3 bg-muted/50 rounded w-1/2" />
    </div>
  );
}
