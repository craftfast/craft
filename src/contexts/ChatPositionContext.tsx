"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useSession } from "@/lib/auth-client";

type ChatPosition = "left" | "right";

interface ChatPositionContextType {
  chatPosition: ChatPosition;
  setChatPosition: (position: ChatPosition) => void;
}

const ChatPositionContext = createContext<ChatPositionContextType | undefined>(
  undefined
);

export function ChatPositionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, isPending } = useSession();
  const [chatPosition, setChatPositionState] = useState<ChatPosition>("right");
  const [hasLoadedFromDB, setHasLoadedFromDB] = useState(false);

  // Reset flag when user logs out
  useEffect(() => {
    if (!session && !isPending) {
      setHasLoadedFromDB(false);
      setChatPositionState("right"); // Reset to default
    }
  }, [session, isPending]);

  // Load chat position preference from database
  useEffect(() => {
    const loadChatPosition = async () => {
      if (session?.user && !isPending && !hasLoadedFromDB) {
        try {
          const response = await fetch("/api/user/settings");
          if (response.ok) {
            const data = await response.json();
            if (data.preferredChatPosition) {
              setChatPositionState(data.preferredChatPosition as ChatPosition);
            }
          }
        } catch (error) {
          console.error("Error loading chat position from database:", error);
        }
        setHasLoadedFromDB(true);
      }
    };

    loadChatPosition();
  }, [session, isPending, hasLoadedFromDB]);

  // Function to update chat position and save to database
  const setChatPosition = async (position: ChatPosition) => {
    setChatPositionState(position);

    // Save to database if user is authenticated
    if (session?.user && !isPending) {
      try {
        const response = await fetch("/api/user/settings", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ preferredChatPosition: position }),
        });

        if (!response.ok) {
          console.error("Failed to save chat position preference");
        }
      } catch (error) {
        console.error("Error saving chat position:", error);
      }
    }
  };

  return (
    <ChatPositionContext.Provider value={{ chatPosition, setChatPosition }}>
      {children}
    </ChatPositionContext.Provider>
  );
}

export function useChatPosition() {
  const context = useContext(ChatPositionContext);
  if (context === undefined) {
    throw new Error(
      "useChatPosition must be used within a ChatPositionProvider"
    );
  }
  return context;
}
