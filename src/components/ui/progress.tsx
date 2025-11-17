import * as React from "react";

import { cn } from "@/lib/utils";

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800",
        className
      )}
      {...props}
    >
      <div
        className="h-full bg-neutral-900 dark:bg-neutral-50 transition-all duration-300 ease-in-out rounded-full"
        style={{ width: `${value || 0}%` }}
      />
    </div>
  )
);
Progress.displayName = "Progress";

export { Progress };
