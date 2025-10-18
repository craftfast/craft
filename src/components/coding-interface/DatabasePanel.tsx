"use client";

interface DatabasePanelProps {
  projectId: string;
}

export default function DatabasePanel({ projectId }: DatabasePanelProps) {
  console.log("DatabasePanel projectId:", projectId);
  return (
    <div className="h-full flex items-center justify-center bg-white dark:bg-neutral-900">
      <div className="text-center max-w-md p-8">
        <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-neutral-400 dark:text-neutral-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
          Database Integration Coming Soon
        </h3>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6">
          Get a free PostgreSQL database powered by Neon for your project.
        </p>
      </div>
    </div>
  );
}
