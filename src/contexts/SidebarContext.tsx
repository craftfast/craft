"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";

interface SidebarContextType {
  isExpanded: boolean;
  setIsExpanded: (expanded: boolean) => void;
  toggleSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  // Default to closed (overlay sidebar)
  const [isExpanded, setIsExpandedState] = useState(false);

  const setIsExpanded = useCallback((expanded: boolean) => {
    setIsExpandedState(expanded);
  }, []);

  const toggleSidebar = useCallback(() => {
    setIsExpandedState((prev) => !prev);
  }, []);

  // Prevent body scroll when sidebar is open
  useEffect(() => {
    if (isExpanded) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isExpanded]);

  return (
    <SidebarContext.Provider
      value={{
        isExpanded,
        setIsExpanded,
        toggleSidebar,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}
