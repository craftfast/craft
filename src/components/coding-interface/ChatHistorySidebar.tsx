"use client";

import { useState, useEffect } from "react";
import { MessageSquare } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
}

interface ChatSession {
  id: string;
  name: string;
  projectId: string;
  createdAt: Date;
  updatedAt: Date;
  messages: Message[];
}

interface ChatHistorySidebarProps {
  projectId: string;
  currentSessionId: string | null;
  onSessionSelect: (sessionId: string) => void;
  onRefresh?: () => void; // Optional callback to trigger session list refresh
}

export default function ChatHistorySidebar({
  projectId,
  currentSessionId,
  onSessionSelect,
  onRefresh,
}: ChatHistorySidebarProps) {
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadChatSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  // Reload sessions when opened
  useEffect(() => {
    loadChatSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadChatSessions = async () => {
    try {
      setIsLoading(true);
      console.log("🔄 Loading chat sessions for sidebar...");
      const response = await fetch(`/api/chat-sessions?projectId=${projectId}`);
      if (response.ok) {
        const data = await response.json();
        // Filter out any sessions with no messages (empty sessions)
        const sessionsWithMessages = data.chatSessions.filter(
          (session: ChatSession) =>
            session.messages && session.messages.length > 0
        );
        console.log(
          `✅ Loaded ${sessionsWithMessages.length} sessions with messages`
        );
        setChatSessions(sessionsWithMessages);

        // Notify parent if needed
        if (onRefresh) {
          onRefresh();
        }
      }
    } catch (error) {
      console.error("Error loading chat sessions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: Date) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      return "Today";
    } else if (diffInDays === 1) {
      return "Yesterday";
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-neutral-900">
      {/* Sessions List - Grid Layout */}
      <div className="flex-1 overflow-y-auto scrollbar-minimal">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-8 h-8 border-2 border-neutral-300 dark:border-neutral-600 border-t-neutral-900 dark:border-t-neutral-100 rounded-full animate-spin" />
          </div>
        ) : chatSessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-4 text-center">
            <MessageSquare className="w-12 h-12 text-neutral-300 dark:text-neutral-600 mb-3" />
            <p className="text-base text-neutral-500 dark:text-neutral-400">
              No chat history yet
            </p>
            <p className="text-sm text-neutral-400 dark:text-neutral-500 mt-1">
              Start a new conversation to see it here
            </p>
          </div>
        ) : (
          <div className="p-4">
            <div className="grid grid-cols-1 gap-3">
              {chatSessions.map((session) => {
                const isActive =
                  session.id === currentSessionId && currentSessionId !== "new";
                const messageCount = session.messages?.length || 0;
                const lastMessage =
                  session.messages?.[session.messages.length - 1];
                const preview =
                  lastMessage?.content.slice(0, 120) || "No messages";

                return (
                  <button
                    key={session.id}
                    onClick={() => onSessionSelect(session.id)}
                    className={`text-left p-4 rounded-xl transition-all group ${
                      isActive
                        ? "bg-neutral-900 dark:bg-neutral-100 ring-2 ring-neutral-900 dark:ring-neutral-100"
                        : "bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 hover:shadow-md"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <MessageSquare
                        className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                          isActive
                            ? "text-white dark:text-neutral-900"
                            : "text-neutral-600 dark:text-neutral-400"
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <h3
                            className={`text-base font-semibold truncate ${
                              isActive
                                ? "text-white dark:text-neutral-900"
                                : "text-neutral-900 dark:text-neutral-100"
                            }`}
                          >
                            {session.name}
                          </h3>
                          {isActive && (
                            <span className="flex-shrink-0 px-2 py-0.5 text-xs font-medium bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 rounded-full">
                              Active
                            </span>
                          )}
                        </div>
                        <p
                          className={`text-sm line-clamp-2 mb-3 ${
                            isActive
                              ? "text-neutral-300 dark:text-neutral-600"
                              : "text-neutral-500 dark:text-neutral-400"
                          }`}
                        >
                          {preview}
                        </p>
                        <div className="flex items-center gap-3">
                          <span
                            className={`text-xs ${
                              isActive
                                ? "text-neutral-400 dark:text-neutral-500"
                                : "text-neutral-400 dark:text-neutral-500"
                            }`}
                          >
                            {formatDate(session.updatedAt)}
                          </span>
                          <span
                            className={`text-xs ${
                              isActive
                                ? "text-neutral-400 dark:text-neutral-500"
                                : "text-neutral-400 dark:text-neutral-500"
                            }`}
                          >
                            • {messageCount}{" "}
                            {messageCount === 1 ? "message" : "messages"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
