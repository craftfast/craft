"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { useSession } from "@/lib/auth-client";

interface UserSettingsContextType {
  suggestionsEnabled: boolean;
  setSuggestionsEnabled: (enabled: boolean) => void;
  soundNotifications: boolean;
  setSoundNotifications: (enabled: boolean) => void;
  playNotificationSound: () => void;
  isLoading: boolean;
}

const UserSettingsContext = createContext<UserSettingsContextType | undefined>(
  undefined
);

export function UserSettingsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, isPending } = useSession();
  const [suggestionsEnabled, setSuggestionsEnabledState] = useState(true);
  const [soundNotifications, setSoundNotificationsState] = useState(false);
  const [hasLoadedFromDB, setHasLoadedFromDB] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio element
  useEffect(() => {
    if (typeof window !== "undefined") {
      audioRef.current = new Audio("/sounds/notification.mp3");
      audioRef.current.volume = 0.5;
    }
  }, []);

  // Reset when user logs out
  useEffect(() => {
    if (!session && !isPending) {
      setHasLoadedFromDB(false);
      setSuggestionsEnabledState(true);
      setSoundNotificationsState(false);
      setIsLoading(false);
    }
  }, [session, isPending]);

  // Load settings from database
  useEffect(() => {
    const loadSettings = async () => {
      if (session?.user && !isPending && !hasLoadedFromDB) {
        try {
          const response = await fetch("/api/user/settings");
          if (response.ok) {
            const data = await response.json();
            if (data.suggestionsEnabled !== undefined) {
              setSuggestionsEnabledState(data.suggestionsEnabled);
            }
            if (data.soundNotifications !== undefined) {
              setSoundNotificationsState(data.soundNotifications);
            }
          }
        } catch (error) {
          console.error("Error loading user settings from database:", error);
        }
        setHasLoadedFromDB(true);
        setIsLoading(false);
      } else if (!session && !isPending) {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, [session, isPending, hasLoadedFromDB]);

  // Function to update suggestionsEnabled and save to database
  const setSuggestionsEnabled = useCallback(
    async (enabled: boolean) => {
      setSuggestionsEnabledState(enabled);

      if (session?.user && !isPending) {
        try {
          const response = await fetch("/api/user/settings", {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ suggestionsEnabled: enabled }),
          });

          if (!response.ok) {
            console.error("Failed to save suggestionsEnabled preference");
          }
        } catch (error) {
          console.error("Error saving suggestionsEnabled:", error);
        }
      }
    },
    [session, isPending]
  );

  // Function to update soundNotifications and save to database
  const setSoundNotifications = useCallback(
    async (enabled: boolean) => {
      setSoundNotificationsState(enabled);

      if (session?.user && !isPending) {
        try {
          const response = await fetch("/api/user/settings", {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ soundNotifications: enabled }),
          });

          if (!response.ok) {
            console.error("Failed to save soundNotifications preference");
          }
        } catch (error) {
          console.error("Error saving soundNotifications:", error);
        }
      }
    },
    [session, isPending]
  );

  // Function to play notification sound
  const playNotificationSound = useCallback(() => {
    if (soundNotifications && audioRef.current && document.hidden) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch((error) => {
        console.error("Error playing notification sound:", error);
      });
    }
  }, [soundNotifications]);

  return (
    <UserSettingsContext.Provider
      value={{
        suggestionsEnabled,
        setSuggestionsEnabled,
        soundNotifications,
        setSoundNotifications,
        playNotificationSound,
        isLoading,
      }}
    >
      {children}
    </UserSettingsContext.Provider>
  );
}

export function useUserSettings() {
  const context = useContext(UserSettingsContext);
  if (context === undefined) {
    throw new Error(
      "useUserSettings must be used within a UserSettingsProvider"
    );
  }
  return context;
}
