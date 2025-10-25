"use client";

import { useTheme } from "@/contexts/ThemeContext";

export function ThemeSelector() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-foreground">
        Theme Preference
      </label>
      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={() => setTheme("light")}
          className={`
            relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all
            ${
              theme === "light"
                ? "border-primary bg-secondary"
                : "border-border bg-card hover:border-ring"
            }
          `}
        >
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-secondary to-muted border border-border flex items-center justify-center">
            <div className="w-6 h-6 rounded-full bg-primary"></div>
          </div>
          <span className="text-sm font-medium text-foreground">Light</span>
          {theme === "light" && (
            <div className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full"></div>
          )}
        </button>

        <button
          onClick={() => setTheme("dark")}
          className={`
            relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all
            ${
              theme === "dark"
                ? "border-primary bg-secondary"
                : "border-border bg-card hover:border-ring"
            }
          `}
        >
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-muted to-accent border border-border flex items-center justify-center">
            <div className="w-6 h-6 rounded-full bg-muted-foreground"></div>
          </div>
          <span className="text-sm font-medium text-foreground">Dark</span>
          {theme === "dark" && (
            <div className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full"></div>
          )}
        </button>

        <button
          onClick={() => setTheme("system")}
          className={`
            relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all
            ${
              theme === "system"
                ? "border-primary bg-secondary"
                : "border-border bg-card hover:border-ring"
            }
          `}
        >
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-secondary via-muted to-accent border border-border flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-muted-foreground"></div>
          </div>
          <span className="text-sm font-medium text-foreground">System</span>
          {theme === "system" && (
            <div className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full"></div>
          )}
        </button>
      </div>
      <p className="text-xs text-muted-foreground">
        {theme === "system"
          ? "Theme will match your system preference"
          : `Theme set to ${theme} mode`}
      </p>
    </div>
  );
}
