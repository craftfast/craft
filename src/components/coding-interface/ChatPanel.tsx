"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";

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

interface ChatPanelProps {
  projectId: string;
  projectDescription?: string | null;
  onFilesCreated?: (files: { path: string; content: string }[]) => void;
  showHistory?: boolean;
  onHistoryClose?: () => void;
  triggerNewChat?: number;
}

export default function ChatPanel({
  projectId,
  projectDescription,
  onFilesCreated,
  showHistory = false,
  onHistoryClose,
  triggerNewChat = 0,
}: ChatPanelProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasAutoSentFirstMessage, setHasAutoSentFirstMessage] = useState(false);
  const [messagesLoaded, setMessagesLoaded] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load chat sessions on mount
  useEffect(() => {
    loadChatSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  // Load messages when session changes
  useEffect(() => {
    if (currentSessionId) {
      setMessagesLoaded(false);
      loadMessages(currentSessionId);
    }
  }, [currentSessionId]);

  // Auto-send first message if project has description and no messages yet
  useEffect(() => {
    const sendFirstMessage = async () => {
      // Check if we should auto-send the first message
      // Only auto-send if messages have been loaded AND there are no messages
      if (
        !hasAutoSentFirstMessage &&
        currentSessionId &&
        messagesLoaded &&
        messages.length === 0 &&
        projectDescription &&
        projectDescription.trim() !== "" &&
        !isLoading
      ) {
        console.log("🚀 Auto-sending first message from project description");
        setHasAutoSentFirstMessage(true);

        // Wait a brief moment to ensure state is set
        setTimeout(() => {
          handleSendMessage(projectDescription);
        }, 100);
      }
    };

    sendFirstMessage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    currentSessionId,
    messages,
    messagesLoaded,
    projectDescription,
    hasAutoSentFirstMessage,
    isLoading,
  ]);

  // Handle new chat trigger from parent
  useEffect(() => {
    if (triggerNewChat > 0) {
      createNewSession();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerNewChat]);

  const loadChatSessions = async () => {
    try {
      const response = await fetch(`/api/chat-sessions?projectId=${projectId}`);
      if (response.ok) {
        const data = await response.json();
        setChatSessions(data.chatSessions);

        // If there are sessions, select the most recent one
        if (data.chatSessions.length > 0) {
          setCurrentSessionId(data.chatSessions[0].id);
        } else {
          // Create a default session if none exists
          createNewSession();
        }
      }
    } catch (error) {
      console.error("Error loading chat sessions:", error);
    }
  };

  const loadMessages = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/chat-sessions/${sessionId}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(
          data.chatSession.messages.map(
            (m: Message & { createdAt: string }) => ({
              ...m,
              createdAt: new Date(m.createdAt),
            })
          )
        );
        setMessagesLoaded(true);
      }
    } catch (error) {
      console.error("Error loading messages:", error);
      setMessagesLoaded(true); // Still mark as loaded even on error
    }
  };

  const createNewSession = async (name?: string) => {
    try {
      const response = await fetch("/api/chat-sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId,
          name: name || "New Chat",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setChatSessions((prev) => [data.chatSession, ...prev]);
        setCurrentSessionId(data.chatSession.id);
        setMessages([]);
        setMessagesLoaded(true); // New session has no messages, so it's "loaded"
      }
    } catch (error) {
      console.error("Error creating chat session:", error);
    }
  };

  const saveMessage = async (role: "user" | "assistant", content: string) => {
    if (!currentSessionId) return;

    try {
      await fetch("/api/chat-messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chatSessionId: currentSessionId,
          role,
          content,
        }),
      });
    } catch (error) {
      console.error("Error saving message:", error);
    }
  };

  // Function to extract code blocks from markdown
  const extractCodeBlocks = (content: string) => {
    const codeBlockRegex = /```(\w+)?\s*(?:\/\/\s*(.+?)\s*)?\n([\s\S]+?)```/g;
    const files: { path: string; content: string; language: string }[] = [];
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      const language = match[1] || "text";
      const filePath = match[2]?.trim();
      const code = match[3];

      if (filePath && code) {
        files.push({
          path: filePath,
          content: code.trim(),
          language,
        });
      }
    }

    return files;
  };

  // Function to remove code blocks from content for display
  const removeCodeBlocks = (content: string) => {
    return content
      .replace(/```(\w+)?\s*(?:\/\/\s*.+?\s*)?\n[\s\S]+?```/g, (match) => {
        // Check if this code block has a file path comment
        const hasFilePath = /```\w+\s*\/\/\s*.+?\s*\n/.test(match);
        if (hasFilePath) {
          // Remove the entire block if it has a file path (it's a file to be created)
          return "";
        }
        // Keep code blocks without file paths (they're examples/explanations)
        return match;
      })
      .replace(/\n{3,}/g, "\n\n")
      .trim(); // Clean up extra newlines
  };

  // Function to save files to the project
  const saveFiles = async (files: { path: string; content: string }[]) => {
    try {
      for (const file of files) {
        await fetch("/api/files", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            projectId,
            filePath: file.path,
            content: file.content,
          }),
        });
      }

      // Notify parent component about new files
      if (onFilesCreated) {
        onFilesCreated(files);
      }
    } catch (error) {
      console.error("Error saving files:", error);
    }
  };

  const handleSendMessage = async (messageContent?: string) => {
    const contentToSend = messageContent || input;
    if (!contentToSend.trim() || isLoading || !currentSessionId) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: contentToSend,
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Save user message to database
    await saveMessage("user", userMessage.content);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          taskType: "coding",
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: "",
        createdAt: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      if (reader) {
        let fullContent = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          fullContent += chunk;
          assistantMessage.content = fullContent;

          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMessage.id ? { ...m, content: fullContent } : m
            )
          );
        }

        // After streaming is complete, extract and save code blocks
        const extractedFiles = extractCodeBlocks(fullContent);
        if (extractedFiles.length > 0) {
          await saveFiles(extractedFiles);

          // Update the message to remove code blocks from display
          const contentWithoutCode = removeCodeBlocks(fullContent);
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMessage.id
                ? { ...m, content: contentWithoutCode }
                : m
            )
          );

          // Save assistant message with cleaned content
          await saveMessage("assistant", contentWithoutCode);
        } else {
          // Save assistant message as-is
          await saveMessage("assistant", fullContent);
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content:
          "Sorry, I encountered an error. Please make sure you have set up your OpenRouter API key in the .env.local file.",
        createdAt: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement;
    target.style.height = "auto";
    // Calculate max height for 12 rows (approximately 24px per row)
    const maxHeight = 24 * 12;
    target.style.height = Math.min(target.scrollHeight, maxHeight) + "px";
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-neutral-900">
      {/* Chat History Overlay */}
      {showHistory && (
        <div className="absolute inset-0 bg-white dark:bg-neutral-900 z-10 flex flex-col">
          {/* History Header */}
          <div className="border-b border-neutral-200 dark:border-neutral-800 px-4 py-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                Chat History
              </h2>
              <button
                onClick={onHistoryClose}
                className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors"
              >
                <svg
                  className="w-4 h-4 text-neutral-600 dark:text-neutral-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* History List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-minimal">
            {chatSessions.map((session) => (
              <button
                key={session.id}
                onClick={() => {
                  setCurrentSessionId(session.id);
                  if (onHistoryClose) onHistoryClose();
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-left ${
                  session.id === currentSessionId
                    ? "bg-neutral-900 dark:bg-neutral-100"
                    : "hover:bg-neutral-100 dark:hover:bg-neutral-700"
                }`}
              >
                <svg
                  className={`w-4 h-4 flex-shrink-0 ${
                    session.id === currentSessionId
                      ? "text-white dark:text-neutral-900"
                      : "text-neutral-600 dark:text-neutral-400"
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-medium truncate ${
                      session.id === currentSessionId
                        ? "text-white dark:text-neutral-900"
                        : "text-neutral-900 dark:text-neutral-100"
                    }`}
                  >
                    {session.name}
                  </p>
                  <p
                    className={`text-xs truncate ${
                      session.id === currentSessionId
                        ? "text-neutral-300 dark:text-neutral-600"
                        : "text-neutral-500 dark:text-neutral-400"
                    }`}
                  >
                    {new Date(session.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 scrollbar-minimal">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {messages.map((message: any) => (
            <div
              key={message.id}
              className={`flex gap-4 ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {message.role === "assistant" && (
                <div className="w-8 h-8 rounded-full bg-neutral-900 dark:bg-neutral-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm">✨</span>
                </div>
              )}
              <div
                className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                  message.role === "user"
                    ? "bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900"
                    : "bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                }`}
              >
                {message.role === "assistant" ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeHighlight]}
                      components={{
                        code: ({ className, children, ...props }) => {
                          const match = /language-(\w+)/.exec(className || "");
                          const isInline = !match;
                          return isInline ? (
                            <code
                              className="bg-neutral-200 dark:bg-neutral-700 px-1 py-0.5 rounded text-xs"
                              {...props}
                            >
                              {children}
                            </code>
                          ) : (
                            <code className={className} {...props}>
                              {children}
                            </code>
                          );
                        },
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-sm whitespace-pre-wrap">
                    {message.content}
                  </p>
                )}
                <span className="text-xs opacity-60 mt-1 block">
                  {message.createdAt
                    ? new Date(message.createdAt).toLocaleTimeString()
                    : new Date().toLocaleTimeString()}
                </span>
              </div>
              {message.role === "user" && (
                <div className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm">👤</span>
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-neutral-900 dark:bg-neutral-100 flex items-center justify-center">
                <span className="text-sm">✨</span>
              </div>
              <div className="px-4 py-3 rounded-2xl bg-neutral-100 dark:bg-neutral-800">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" />
                  <span className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <span className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="border-neutral-200 dark:border-neutral-800 p-2 pl-4">
        <div className="max-w-3xl mx-auto">
          <div className="rounded-2xl px-2 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-sm hover:shadow-md focus-within:shadow-lg transition-shadow">
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  handleInput(e);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Describe what you want to build or modify..."
                rows={1}
                className="w-full p-2 bg-transparent focus:outline-none resize-none text-base sm:text-md text-foreground placeholder:text-neutral-500 dark:placeholder:text-neutral-400 overflow-y-auto scrollbar-minimal"
                style={{ minHeight: "3.5rem", maxHeight: "288px" }}
              />
            </div>

            {/* Controls Row */}
            <div className="flex items-center justify-between px-1 pt-2">
              <button
                onClick={() => console.log("Attach file")}
                className="p-2 rounded-full border border-neutral-200 dark:border-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-500 text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
                aria-label="Attach files"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
              </button>

              <button
                onClick={handleFormSubmit}
                disabled={!input.trim() || isLoading}
                className="p-2 rounded-full bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Submit"
              >
                {isLoading ? (
                  <svg
                    className="w-4 h-4 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 10l7-7m0 0l7 7m-7-7v18"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
