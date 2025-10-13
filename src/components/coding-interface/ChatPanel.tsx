"use client";

import { useState, useRef, useEffect, useCallback } from "react";
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

interface ChatPanelProps {
  projectId: string;
  projectDescription?: string | null;
  projectVersion?: number; // Project version (0 = new project, 1+ = has updates)
  projectFiles?: Record<string, string>; // Existing project files
  onFilesCreated?: (files: { path: string; content: string }[]) => void;
  triggerNewChat?: number;
  onGeneratingStatusChange?: (isGenerating: boolean) => void;
  currentSessionId?: string | null;
  onSessionChange?: (sessionId: string) => void;
}

export default function ChatPanel({
  projectId,
  projectDescription,
  projectVersion = 0,
  projectFiles = {},
  onFilesCreated,
  triggerNewChat = 0,
  onGeneratingStatusChange,
  currentSessionId: externalSessionId = null,
  onSessionChange,
}: ChatPanelProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const hasLoadedSessions = useRef(false); // Track if we've already loaded sessions
  const hasTriggeredAutoSend = useRef(false); // Track if we've triggered auto-send

  const [currentSessionId, setCurrentSessionId] = useState<string | null>(
    externalSessionId
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messagesLoaded, setMessagesLoaded] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [feedbackMessageId, setFeedbackMessageId] = useState<{
    [key: string]: "like" | "dislike" | null;
  }>({});

  // Define loadMessages callback before any useEffect that uses it
  const loadMessages = useCallback(async (sessionId: string) => {
    try {
      console.log(`📨 Loading messages for session: ${sessionId}`);
      const response = await fetch(`/api/chat-sessions/${sessionId}`);
      if (response.ok) {
        const data = await response.json();
        const loadedMessages = data.chatSession.messages.map(
          (m: Message & { createdAt: string }) => ({
            ...m,
            createdAt: new Date(m.createdAt),
          })
        );
        console.log(
          `✅ Loaded ${loadedMessages.length} messages for session ${sessionId}`
        );
        setMessages(loadedMessages);
        setMessagesLoaded(true);
      } else {
        console.error(`❌ Failed to load messages for session ${sessionId}`);
        setMessagesLoaded(true);
      }
    } catch (error) {
      console.error("Error loading messages:", error);
      setMessagesLoaded(true); // Still mark as loaded even on error
    }
  }, []);

  const loadChatSessions = useCallback(async () => {
    // Prevent duplicate loads
    if (hasLoadedSessions.current) {
      console.log("⏭️ Chat sessions already loaded, skipping...");
      return;
    }

    try {
      const response = await fetch(`/api/chat-sessions?projectId=${projectId}`);
      if (response.ok) {
        const data = await response.json();

        // Mark as loaded BEFORE any session operations to prevent race conditions
        hasLoadedSessions.current = true;

        // If there are sessions, select the most recent one
        if (data.chatSessions.length > 0) {
          const sessionId = data.chatSessions[0].id;
          setCurrentSessionId(sessionId);
          if (onSessionChange) {
            onSessionChange(sessionId);
          }
          console.log(
            `✅ Loaded ${data.chatSessions.length} chat session(s), selected: ${sessionId}`
          );
        } else {
          // No sessions exist - create a temporary 'new' session in frontend only
          console.log(
            "📝 No chat sessions found - creating temporary 'new' session (frontend only)"
          );
          setCurrentSessionId("new");
          setMessages([]);
          setMessagesLoaded(true);
          if (onSessionChange) {
            onSessionChange("new");
          }
        }
      }
    } catch (error) {
      console.error("Error loading chat sessions:", error);
      hasLoadedSessions.current = false; // Reset on error so it can retry
    }
  }, [projectId, onSessionChange]);

  // Sync external session ID changes and load messages
  useEffect(() => {
    if (externalSessionId && externalSessionId !== currentSessionId) {
      console.log(`🔄 External session changed to: ${externalSessionId}`);
      setCurrentSessionId(externalSessionId);
      // If it's not a temporary 'new' session, load messages
      if (externalSessionId !== "new") {
        setMessagesLoaded(false);
        loadMessages(externalSessionId);
      } else {
        // For new session, clear messages
        setMessages([]);
        setMessagesLoaded(true);
      }
    }
  }, [externalSessionId, currentSessionId, loadMessages]);

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

  // Auto-focus textarea when a new session is created or switched to
  useEffect(() => {
    if (messagesLoaded && textareaRef.current) {
      // Focus the textarea after messages are loaded
      textareaRef.current.focus();
    }
  }, [messagesLoaded, currentSessionId]);

  // Simplified auto-send: Only trigger if project version is 0
  useEffect(() => {
    const sendFirstMessage = async () => {
      // Only auto-send if:
      // 1. Project version is 0 (brand new project)
      // 2. We haven't triggered auto-send yet
      // 3. We have a description
      // 4. Messages are loaded
      // 5. Not currently loading
      if (
        projectVersion === 0 &&
        !hasTriggeredAutoSend.current &&
        projectDescription &&
        projectDescription.trim() !== "" &&
        messagesLoaded &&
        !isLoading
      ) {
        console.log("🚀 Auto-sending first message (project version 0)");
        hasTriggeredAutoSend.current = true;

        // Auto-send after a short delay (session will be created automatically)
        setTimeout(() => {
          handleSendMessage(projectDescription);
        }, 100);
      }
    };

    sendFirstMessage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectVersion, projectDescription, messagesLoaded, isLoading]);

  const createNewSession = useCallback(
    async (name?: string): Promise<string | null> => {
      try {
        console.log(`📝 Creating new chat session in database...`);
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
          console.log(`✅ Session created with ID: ${data.chatSession.id}`);
          setCurrentSessionId(data.chatSession.id);
          setMessages([]);
          setMessagesLoaded(true);

          // Notify parent of session change
          if (onSessionChange) {
            onSessionChange(data.chatSession.id);
          }

          return data.chatSession.id;
        }
        return null;
      } catch (error) {
        console.error("Error creating chat session:", error);
        return null;
      }
    },
    [projectId, onSessionChange]
  );

  // Handle new chat - creates a temporary 'new' session in frontend only
  const handleNewChat = useCallback(() => {
    console.log(
      "📝 Starting new chat (frontend only, no database session yet)"
    );

    // Set a temporary 'new' session ID
    setCurrentSessionId("new");
    setMessages([]);
    setMessagesLoaded(true);

    if (onSessionChange) {
      onSessionChange("new");
    }
  }, [onSessionChange]);

  // Handle new chat trigger from parent
  useEffect(() => {
    if (triggerNewChat > 0) {
      handleNewChat();
    }
  }, [triggerNewChat, handleNewChat]);

  const saveMessage = async (
    role: "user" | "assistant",
    content: string,
    sessionId?: string
  ) => {
    const sessionToUse = sessionId || currentSessionId;
    if (!sessionToUse) {
      console.error("❌ Cannot save message: No session ID available");
      return;
    }

    try {
      console.log(
        `💾 Saving ${role} message to session ${sessionToUse.substring(
          0,
          8
        )}...`
      );
      const response = await fetch("/api/chat-messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chatSessionId: sessionToUse,
          role,
          content,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("❌ Failed to save message:", errorData);
        return;
      }

      const data = await response.json();
      console.log(`✅ ${role} message saved successfully:`, data.message.id);
    } catch (error) {
      console.error("❌ Error saving message:", error);
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
      .replace(/\n{3,}/g, "\n\n") // Clean up extra newlines
      .trim();
  };

  // Function to save files to the project
  const saveFiles = async (files: { path: string; content: string }[]) => {
    try {
      // Save files one by one for better error handling
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
            skipGenerationTracking: true, // Don't update tracking on each file
          }),
        });
      }

      // After all files saved, update generation tracking ONCE
      await fetch("/api/files", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId,
          finalizeGeneration: true, // Signal to update generation tracking
        }),
      });

      console.log(
        `📦 Saved ${files.length} files and updated generation tracking`
      );

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
    if (!contentToSend.trim() || isLoading) return;

    // If no session exists or it's a temporary 'new' session, create one first
    let sessionIdToUse = currentSessionId;
    if (!sessionIdToUse || sessionIdToUse === "new") {
      console.log("📝 Creating session in database (first message being sent)");
      sessionIdToUse = await createNewSession("New Chat");

      // If still no session after creation, something went wrong
      if (!sessionIdToUse) {
        console.error("Failed to create session");
        return;
      }
    }

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: contentToSend,
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Notify parent that we're generating files
    onGeneratingStatusChange?.(true);

    // Set project status to "generating"
    await fetch(`/api/projects/${projectId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ generationStatus: "generating" }),
    });

    // Save user message to database
    await saveMessage("user", userMessage.content, sessionIdToUse);

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
          projectFiles, // Send existing project files for context
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
        let displayContent = ""; // Content to display (without code blocks during streaming)

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          fullContent += chunk;

          // During streaming, hide code blocks and show placeholder
          displayContent = removeCodeBlocks(fullContent);

          // If we removed code blocks, add a placeholder
          const hasCodeBlocks =
            fullContent !== displayContent && displayContent.trim().length > 0;
          const finalDisplayContent = hasCodeBlocks
            ? displayContent + "\n\n*✨ Generating project files...*"
            : fullContent;

          assistantMessage.content = finalDisplayContent;

          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMessage.id
                ? { ...m, content: finalDisplayContent }
                : m
            )
          );
        }

        // After streaming is complete, extract and save code blocks
        const extractedFiles = extractCodeBlocks(fullContent);
        if (extractedFiles.length > 0) {
          console.log(
            `📝 Extracted ${extractedFiles.length} files from AI response`
          );
          await saveFiles(extractedFiles);

          // Update the message to remove code blocks from display
          const contentWithoutCode = removeCodeBlocks(fullContent);
          const finalContent =
            contentWithoutCode.trim().length > 0
              ? contentWithoutCode +
                "\n\n*✅ Project files created successfully!*"
              : "*✅ Project files created successfully!*";

          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMessage.id ? { ...m, content: finalContent } : m
            )
          );

          // Save assistant message with cleaned content
          await saveMessage("assistant", finalContent, sessionIdToUse);
        } else {
          // Save assistant message as-is
          await saveMessage("assistant", fullContent, sessionIdToUse);
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
      // Notify parent that file generation is complete
      onGeneratingStatusChange?.(false);
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

  const handleCopyMessage = async (content: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (error) {
      console.error("Failed to copy message:", error);
    }
  };

  const handleFeedback = (messageId: string, feedback: "like" | "dislike") => {
    setFeedbackMessageId((prev) => ({
      ...prev,
      [messageId]: prev[messageId] === feedback ? null : feedback,
    }));
    // Here you can add API call to save feedback to database
    console.log(`Feedback for message ${messageId}: ${feedback}`);
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-neutral-900 overflow-x-hidden">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-6 scrollbar-minimal">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {messages.map((message: any) => (
            <div
              key={message.id}
              className={`flex gap-4 ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`px-4 py-3 ${
                  message.role === "user"
                    ? "max-w-[80%] bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-2xl"
                    : "w-full text-neutral-900 dark:text-neutral-100"
                }`}
              >
                {message.role === "assistant" ? (
                  <>
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeHighlight]}
                        components={{
                          code: ({ className, children, ...props }) => {
                            const match = /language-(\w+)/.exec(
                              className || ""
                            );
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
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs opacity-60">
                        {message.createdAt
                          ? new Date(message.createdAt).toLocaleTimeString()
                          : new Date().toLocaleTimeString()}
                      </span>
                      <div className="flex items-center gap-1 ml-auto">
                        {/* Copy Button */}
                        <button
                          onClick={() =>
                            handleCopyMessage(message.content, message.id)
                          }
                          className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
                          aria-label="Copy response"
                          title="Copy"
                        >
                          {copiedMessageId === message.id ? (
                            <svg
                              className="w-4 h-4 text-green-600 dark:text-green-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          ) : (
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                              />
                            </svg>
                          )}
                        </button>
                        {/* Like Button */}
                        <button
                          onClick={() => handleFeedback(message.id, "like")}
                          className={`p-1.5 rounded-lg transition-colors ${
                            feedbackMessageId[message.id] === "like"
                              ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                              : "hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300"
                          }`}
                          aria-label="Good response"
                          title="Good response"
                        >
                          <svg
                            className="w-4 h-4"
                            fill={
                              feedbackMessageId[message.id] === "like"
                                ? "currentColor"
                                : "none"
                            }
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
                            />
                          </svg>
                        </button>
                        {/* Dislike Button */}
                        <button
                          onClick={() => handleFeedback(message.id, "dislike")}
                          className={`p-1.5 rounded-lg transition-colors ${
                            feedbackMessageId[message.id] === "dislike"
                              ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                              : "hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300"
                          }`}
                          aria-label="Bad response"
                          title="Bad response"
                        >
                          <svg
                            className="w-4 h-4"
                            fill={
                              feedbackMessageId[message.id] === "dislike"
                                ? "currentColor"
                                : "none"
                            }
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-sm whitespace-pre-wrap">
                      {message.content}
                    </p>
                    <span className="text-xs opacity-60 mt-1 block">
                      {message.createdAt
                        ? new Date(message.createdAt).toLocaleTimeString()
                        : new Date().toLocaleTimeString()}
                    </span>
                  </>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-4 justify-start">
              <div className="px-4 py-3 w-full">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" />
                    <span className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                  <span className="text-sm text-neutral-500 dark:text-neutral-400">
                    Generating code...
                  </span>
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
