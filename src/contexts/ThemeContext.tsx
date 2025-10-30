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
  const [theme, setThemeState] = useState<Theme>("dark");
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("dark");
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
              setThemeState(data.preferredTheme as Theme);
              setHasLoadedFromDB(true);
              return;
            }
          }
        } catch (error) {
          console.error("Error loading theme from database:", error);
        }
        setHasLoadedFromDB(true);
        return;
      }

      // Fall back to localStorage for unauthenticated users or if no DB preference
      if ((!session && !isPending) || (session && hasLoadedFromDB)) {
        const savedTheme = localStorage.getItem("theme") as Theme | null;
        if (savedTheme && ["light", "dark", "system"].includes(savedTheme)) {
          setThemeState(savedTheme);
        } else {
          // Default to dark mode
          setThemeState("dark");
          localStorage.setItem("theme", "dark");
        }
      }
    };

    loadTheme();
  }, [session, isPending, hasLoadedFromDB]);

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
