"use client";

import { useState, useEffect } from "react";
import { MessageSquare, Plus, X } from "lucide-react";

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
  onNewChat: () => void;
  onClose?: () => void;
}

export default function ChatHistorySidebar({
  projectId,
  currentSessionId,
  onSessionSelect,
  onNewChat,
  onClose,
}: ChatHistorySidebarProps) {
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadChatSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const loadChatSessions = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/chat-sessions?projectId=${projectId}`);
      if (response.ok) {
        const data = await response.json();
        setChatSessions(data.chatSessions);
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
    <div className="h-full flex flex-col bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            Chat History
          </h2>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors"
              title="Close sidebar"
            >
              <X className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
            </button>
          )}
        </div>

        {/* New Chat Button */}
        <button
          onClick={onNewChat}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-neutral-900 dark:text-neutral-100 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-xl transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Chat
        </button>
      </div>

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto scrollbar-minimal">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-6 h-6 border-2 border-neutral-300 dark:border-neutral-600 border-t-neutral-900 dark:border-t-neutral-100 rounded-full animate-spin" />
          </div>
        ) : chatSessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 px-4 text-center">
            <MessageSquare className="w-8 h-8 text-neutral-300 dark:text-neutral-600 mb-2" />
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              No chat history yet
            </p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {chatSessions.map((session) => {
              const isActive = session.id === currentSessionId;
              const messageCount = session.messages?.length || 0;
              const lastMessage =
                session.messages?.[session.messages.length - 1];
              const preview =
                lastMessage?.content.slice(0, 60) || "No messages";

              return (
                <button
                  key={session.id}
                  onClick={() => onSessionSelect(session.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl transition-all group ${
                    isActive
                      ? "bg-neutral-900 dark:bg-neutral-100"
                      : "hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <MessageSquare
                      className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                        isActive
                          ? "text-white dark:text-neutral-900"
                          : "text-neutral-600 dark:text-neutral-400"
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h3
                          className={`text-sm font-medium truncate ${
                            isActive
                              ? "text-white dark:text-neutral-900"
                              : "text-neutral-900 dark:text-neutral-100"
                          }`}
                        >
                          {session.name}
                        </h3>
                        {isActive && (
                          <span className="flex-shrink-0 px-1.5 py-0.5 text-xs font-medium bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 rounded-full">
                            Active
                          </span>
                        )}
                      </div>
                      <p
                        className={`text-xs truncate mb-1 ${
                          isActive
                            ? "text-neutral-300 dark:text-neutral-600"
                            : "text-neutral-500 dark:text-neutral-400"
                        }`}
                      >
                        {preview}
                      </p>
                      <div className="flex items-center gap-2">
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
        )}
      </div>
    </div>
  );
}
