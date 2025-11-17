"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useSession } from "@/lib/auth-client";

type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: "light" | "dark";
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useSession();
  // Initialize from localStorage immediately to match the inline script
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("theme") as Theme | null;
      if (saved && ["light", "dark", "system"].includes(saved)) {
        return saved;
      }
    }
    return "system";
  });
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("theme") as Theme | null;
      const effectiveTheme = saved || "system";
      if (effectiveTheme === "system") {
        return window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";
      }
      return effectiveTheme;
    }
    return "dark";
  });
  const [hasLoadedFromDB, setHasLoadedFromDB] = useState(false);

  // Reset flag when user logs out
  useEffect(() => {
    if (!session && !isPending) {
      setHasLoadedFromDB(false);
    }
  }, [session, isPending]);

  // Load theme preference - only once on mount or when auth status changes
  useEffect(() => {
    const loadTheme = async () => {
      // First check if user is logged in and has a saved preference in DB
      if (session?.user && !isPending && !hasLoadedFromDB) {
        try {
          const response = await fetch("/api/user/settings");
          if (response.ok) {
            const data = await response.json();
            if (data.preferredTheme) {
              const dbTheme = data.preferredTheme as Theme;
              // Only update if different from current localStorage to avoid flicker
              const currentLocal = localStorage.getItem("theme");
              if (currentLocal !== dbTheme) {
                setThemeState(dbTheme);
                localStorage.setItem("theme", dbTheme);
              }
            } else {
              // No preference in DB, save current localStorage value to DB
              localStorage.setItem("theme", theme);
            }
          }
        } catch (error) {
          console.error("Error loading theme from database:", error);
        }
        setHasLoadedFromDB(true);
      }
    };

    loadTheme();
  }, [session, isPending, hasLoadedFromDB, theme]);

  // Apply theme to document
  useEffect(() => {
    const applyTheme = () => {
      let effectiveTheme: "light" | "dark" = "dark";

      if (theme === "system") {
        const prefersDark = window.matchMedia(
          "(prefers-color-scheme: dark)"
        ).matches;
        effectiveTheme = prefersDark ? "dark" : "light";
      } else {
        effectiveTheme = theme;
      }

      setResolvedTheme(effectiveTheme);

      // Apply to document
      if (effectiveTheme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    };

    applyTheme();

    // Listen for system theme changes when in system mode
    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = () => applyTheme();

      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, [theme]);

  const setTheme = async (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem("theme", newTheme);

    // Save to database if user is logged in
    if (session?.user) {
      try {
        await fetch("/api/user/settings", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ preferredTheme: newTheme }),
        });
      } catch (error) {
        console.error("Error saving theme preference:", error);
      }
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
