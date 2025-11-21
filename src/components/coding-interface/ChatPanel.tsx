"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.min.css";
import FileChangesCard from "./FileChangesCard";
import { useCreditBalance } from "@/hooks/useCreditBalance";
import SettingsModal from "../SettingsModal";
import { ModelSelector, ModelTier } from "@/components/ModelSelector";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { notifyCreditUpdate } from "@/lib/credit-events";
import { toast } from "sonner";
import ToolCallDisplay from "./ToolCallDisplay";
import { OrchestratorProgress } from "./OrchestratorProgress";

// Speech Recognition types
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onstart: ((this: SpeechRecognition, ev: Event) => void) | null;
  onend: ((this: SpeechRecognition, ev: Event) => void) | null;
  onresult:
    | ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void)
    | null;
  onerror:
    | ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => void)
    | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

interface ImageAttachment {
  id: string;
  name: string;
  url: string; // base64 data URL
  type: string;
}

interface FileChange {
  path: string;
  type: "added" | "modified" | "deleted";
  language?: string;
}

interface ToolCall {
  id: string;
  name: string;
  status: "running" | "success" | "error";
  args?: Record<string, string | number | boolean>;
  result?: string | Record<string, unknown>;
  error?: string;
  startedAt: number;
  completedAt?: number;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
  images?: ImageAttachment[];
  tokenCount?: {
    input: number;
    output: number;
    cost: number;
  };
  fileChanges?: FileChange[]; // Track file changes in assistant responses
  toolCalls?: ToolCall[]; // Track tool executions in assistant responses
  isStreaming?: boolean; // Track if message is currently streaming
  orchestratorProgress?: {
    tasks: Array<{
      id: string;
      phase: string;
      description: string;
      status: "pending" | "in-progress" | "completed" | "failed";
    }>;
    totalTasks: number;
    completedTasks: number;
    failedTasks: number;
    percentComplete: number;
    currentTaskId?: string;
    isActive: boolean;
  };
}

interface ChatPanelProps {
  projectId: string;
  projectDescription?: string | null;
  projectVersion?: number; // Project version (0 = new project, 1+ = has updates)
  projectFiles?: Record<string, string>; // Existing project files
  onFilesCreated?: (files: { path: string; content: string }[]) => void;
  onStreamingFiles?: (files: Record<string, string>) => void; // Real-time streaming files
  triggerNewChat?: number;
  onGeneratingStatusChange?: (isGenerating: boolean) => void;
  onFileClick?: (path: string) => void; // Handle file clicks from file changes card
  onRefreshProject?: () => Promise<void>; // Refresh project data from database
}

export default function ChatPanel({
  projectId,
  projectDescription,
  projectVersion = 0,
  projectFiles = {},
  onFilesCreated,
  onStreamingFiles,
  triggerNewChat = 0,
  onGeneratingStatusChange,
  onFileClick,
  onRefreshProject,
}: ChatPanelProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasLoadedMessages = useRef(false); // Track if we've already loaded messages
  const hasTriggeredAutoSend = useRef(false); // Track if we've triggered auto-send
  const router = useRouter();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messagesLoaded, setMessagesLoaded] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [activeToolCalls, setActiveToolCalls] = useState<Map<string, ToolCall>>(
    new Map()
  ); // Track tool executions
  const [selectedImages, setSelectedImages] = useState<ImageAttachment[]>([]);
  const [previewImage, setPreviewImage] = useState<ImageAttachment | null>(
    null
  );
  const [feedbackMessageId, setFeedbackMessageId] = useState<{
    [key: string]: "like" | "dislike" | null;
  }>({});
  const [isRecording, setIsRecording] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsInitialTab, setSettingsInitialTab] = useState<
    | "general"
    | "billing"
    | "usage"
    | "account"
    | "integrations"
    | "model-preferences"
  >("general");
  const { balance } = useCreditBalance();

  // Initialize selected model from user preferences
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [isLoadingModel, setIsLoadingModel] = useState(true);

  // Load user's preferred model on mount
  useEffect(() => {
    const loadPreferredModel = async () => {
      try {
        const response = await fetch("/api/user/model-preferences");
        if (response.ok) {
          const data = await response.json();
          const sessionModel = sessionStorage.getItem(
            `project-${projectId}-model`
          );
          // Use session model if available, otherwise use preferred model
          setSelectedModel(
            sessionModel ||
              data.preferredCodingModel ||
              "anthropic/claude-sonnet-4.5"
          );
        } else {
          setSelectedModel("anthropic/claude-sonnet-4.5");
        }
      } catch (error) {
        console.error("Failed to load model preferences:", error);
        setSelectedModel("anthropic/claude-sonnet-4.5");
      } finally {
        setIsLoadingModel(false);
      }
    };
    loadPreferredModel();
  }, [projectId]);

  // Save model selection to sessionStorage when it changes
  useEffect(() => {
    if (selectedModel && !isLoadingModel) {
      sessionStorage.setItem(`project-${projectId}-model`, selectedModel);
    }
  }, [selectedModel, projectId, isLoadingModel]);

  // Check if tokens are low or exhausted
  const isLowTokens =
    balance && balance.totalAvailable > 0 && balance.totalAvailable <= 10;
  const isTokensExhausted = balance && balance.totalAvailable === 0;

  // Close preview modal on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && previewImage) {
        setPreviewImage(null);
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [previewImage]);

  // Load messages for the project
  const loadMessages = useCallback(async () => {
    // Prevent duplicate loads
    if (hasLoadedMessages.current) {
      console.log("⏭️ Messages already loaded, skipping...");
      return;
    }

    hasLoadedMessages.current = true;

    try {
      console.log(`📥 Loading messages for project: ${projectId}`);
      const response = await fetch(`/api/chat-messages?projectId=${projectId}`);

      if (response.ok) {
        const data = await response.json();
        const loadedMessages = data.messages.map(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (m: any) => ({
            ...m,
            createdAt: new Date(m.createdAt),
            // Transform files from database to ImageAttachment format
            images:
              m.files && m.files.length > 0
                ? m.files.map(
                    (file: {
                      id: string;
                      fileName: string;
                      r2Url: string;
                      mimeType: string;
                    }) => ({
                      id: file.id,
                      name: file.fileName,
                      url: file.r2Url, // Use R2 public URL instead of base64
                      type: file.mimeType,
                    })
                  )
                : undefined,
            // fileChanges is already in the correct format from database
            fileChanges: m.fileChanges || undefined,
            // Remove files property as we've transformed it to images
            files: undefined,
          })
        );
        console.log(`✅ Loaded ${loadedMessages.length} messages`);
        setMessages(loadedMessages);
        setMessagesLoaded(true);
      } else {
        console.error(`❌ Failed to load messages`);
        setMessagesLoaded(true);
      }
    } catch (error) {
      console.error("Error loading messages:", error);
      hasLoadedMessages.current = false; // Reset on error so it can retry
      setMessagesLoaded(true);
    }
  }, [projectId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load messages on mount
  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Auto-focus textarea when messages are loaded
  useEffect(() => {
    if (messagesLoaded && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [messagesLoaded]);

  // Simplified auto-send: Only trigger if project version is 0 AND model is loaded
  useEffect(() => {
    const sendFirstMessage = async () => {
      // Only auto-send if:
      // 1. Project version is 0 (brand new project)
      // 2. We haven't triggered auto-send yet
      // 3. We have a description
      // 4. Messages are loaded
      // 5. Model is loaded (ensures we use the correct saved model)
      // 6. Not currently loading
      if (
        projectVersion === 0 &&
        !hasTriggeredAutoSend.current &&
        projectDescription &&
        projectDescription.trim() !== "" &&
        messagesLoaded &&
        !isLoading
      ) {
        console.log(`🚀 Auto-sending first message`);
        hasTriggeredAutoSend.current = true;

        // Check for images in sessionStorage
        const storedImagesKey = `project-${projectId}-images`;
        const storedImages = sessionStorage.getItem(storedImagesKey);

        let imagesToSend: ImageAttachment[] = [];

        if (storedImages) {
          try {
            imagesToSend = JSON.parse(storedImages) as ImageAttachment[];
            console.log(
              `📷 Found ${imagesToSend.length} stored images for auto-send`
            );
            // Also set in state for UI display
            setSelectedImages(imagesToSend);
            // Clean up sessionStorage
            sessionStorage.removeItem(storedImagesKey);
          } catch (error) {
            console.error("Failed to parse stored images:", error);
          }
        }

        // Auto-send after a short delay (pass images directly to avoid state timing issues)
        // Just use the user's description as-is
        const defaultPrompt = projectDescription;

        setTimeout(() => {
          handleSendMessage(defaultPrompt, imagesToSend);
        }, 100);
      }
    };

    sendFirstMessage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectVersion, projectDescription, messagesLoaded, isLoading]);

  // Handle new chat - just clear messages
  const handleNewChat = useCallback(() => {
    console.log("📝 Starting new chat - clearing messages");
    setMessages([]);
    setInput("");
  }, []);

  // Handle new chat trigger from parent
  useEffect(() => {
    if (triggerNewChat > 0) {
      handleNewChat();
    }
  }, [triggerNewChat, handleNewChat]);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Check if browser supports speech recognition
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        recognition.onstart = () => {
          console.log("🎤 Voice recognition started");
        };

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          console.log("📝 Voice recognition result received");
          let interimText = "";
          let finalText = "";

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            console.log(
              `Result ${i}: "${transcript}" (final: ${event.results[i].isFinal})`
            );
            if (event.results[i].isFinal) {
              finalText += transcript + " ";
            } else {
              interimText += transcript;
            }
          }

          // Update interim transcript for real-time display
          if (interimText) {
            console.log("Setting interim:", interimText);
            setInterimTranscript(interimText);
          }

          // Add final transcript to the input
          if (finalText) {
            console.log("Setting final:", finalText);
            setInput((prev) => prev + finalText);
            setInterimTranscript(""); // Clear interim when we get final
          }
        };

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
          console.error("❌ Speech recognition error:", event.error);
          setIsRecording(false);
          setInterimTranscript(""); // Clear interim on error
        };

        recognition.onend = () => {
          console.log("🛑 Voice recognition ended");
          setIsRecording(false);
          setInterimTranscript(""); // Clear interim when recognition ends
        };

        recognitionRef.current = recognition;
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []); // Only initialize once!

  // Auto-resize textarea when voice input changes
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 288) + "px";
    }
  }, [input, interimTranscript]);

  // Helper function to upload images to R2 and return file data
  const uploadImagesToR2 = async (
    images: ImageAttachment[]
  ): Promise<{ id: string; url: string; name: string; type: string }[]> => {
    console.log(`📤 Uploading ${images.length} images to R2...`);

    const uploadPromises = images.map(async (image) => {
      // Convert base64 data URL to blob
      const base64Data = image.url.split(",")[1];
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: image.type });

      // Create FormData
      const formData = new FormData();
      formData.append("files", blob, image.name);

      // Upload to R2
      const uploadResponse = await fetch(
        `/api/upload?projectId=${projectId}&purpose=image`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!uploadResponse.ok) {
        throw new Error(`Failed to upload ${image.name}`);
      }

      const uploadData = await uploadResponse.json();
      const fileData = uploadData.files[0];
      return {
        id: fileData.id,
        url: fileData.r2Url,
        name: fileData.fileName,
        type: fileData.mimeType,
      };
    });

    const uploadedFiles = await Promise.all(uploadPromises);
    console.log(`✅ Uploaded ${uploadedFiles.length} images to R2`);
    return uploadedFiles;
  };

  const saveMessage = async (
    role: "user" | "assistant",
    content: string,
    fileIds?: string[],
    fileChanges?: FileChange[],
    toolCalls?: ToolCall[]
  ) => {
    try {
      // Validate content before sending
      if (!content || !content.trim()) {
        console.warn(`⚠️ Skipping save: ${role} message has empty content`);
        return;
      }

      console.log(`💾 Saving ${role} message to project ${projectId}...`);
      console.log("📤 Message data:", {
        projectId,
        role,
        contentLength: content?.length || 0,
        hasContent: !!content,
        contentPreview: content?.substring(0, 100),
        fileIds: fileIds?.length || 0,
        fileChanges: fileChanges?.length || 0,
        toolCalls: toolCalls?.length || 0,
      });

      const response = await fetch("/api/chat-messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId,
          role,
          content,
          fileIds: fileIds && fileIds.length > 0 ? fileIds : undefined,
          fileChanges:
            fileChanges && fileChanges.length > 0 ? fileChanges : undefined,
          toolCalls: toolCalls && toolCalls.length > 0 ? toolCalls : undefined,
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

  // Function to clean AI response content from model-specific markers
  const cleanAIResponse = (content: string): string => {
    return content
      .replace(/minimax:tool_call[^\n]*/gi, "") // Remove MiniMax tool call markers
      .replace(/\btool_call[^\n]*/gi, "") // Remove generic tool call text
      .replace(/<\|tool_call\|>/gi, "") // Remove tool call tags
      .replace(/<\|end_tool_call\|>/gi, "") // Remove end tool call tags
      .replace(/^Content\s*$/gim, "") // Remove standalone "Content" markers
      .trim();
  };

  // Function to save files to the project
  const saveFiles = async (
    files: { path: string; content: string; language: string }[]
  ): Promise<FileChange[]> => {
    try {
      const fileChanges: FileChange[] = [];

      // Determine if files are new or modified
      const batchFiles: Record<string, string> = {};
      for (const file of files) {
        const isExisting = projectFiles && projectFiles[file.path];
        fileChanges.push({
          path: file.path,
          type: isExisting ? "modified" : "added",
          language: file.language,
        });
        batchFiles[file.path] = file.content;
      }

      // Save all files in a SINGLE batch request
      console.log(
        `🚀 BATCH SAVE: Saving ${files.length} files in one request...`
      );
      await fetch("/api/files", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId,
          files: batchFiles, // Use batch endpoint
        }),
      });

      console.log(
        `✅ BATCH SAVE COMPLETE: Saved ${files.length} files in single batch request`
      );

      // Notify parent component about new files
      if (onFilesCreated) {
        onFilesCreated(
          files.map((f) => ({ path: f.path, content: f.content }))
        );
      }

      return fileChanges;
    } catch (error) {
      console.error("Error saving files:", error);
      return [];
    }
  };

  const handleSendMessage = async (
    messageContent?: string,
    imagesToSend?: ImageAttachment[]
  ) => {
    const contentToSend = messageContent || input;
    if (!contentToSend.trim() || isLoading) return;

    // Check if tokens are exhausted
    if (isTokensExhausted) {
      setSettingsInitialTab("billing");
      setShowSettingsModal(true);
      return;
    }

    // Use provided images or fall back to selectedImages from state
    const imagesToUpload = imagesToSend || selectedImages;

    // Upload images to R2 first (if any) before sending message
    let uploadedImages: ImageAttachment[] | undefined;
    let fileIds: string[] = [];

    if (imagesToUpload.length > 0) {
      try {
        const r2Images = await uploadImagesToR2(imagesToUpload);
        uploadedImages = r2Images.map((img) => ({
          id: img.id,
          name: img.name,
          url: img.url, // R2 public URL
          type: img.type,
        }));
        fileIds = r2Images.map((img) => img.id);
      } catch (error) {
        console.error("Failed to upload images:", error);
        // Continue without images if upload fails
        uploadedImages = undefined;
      }
    }

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: contentToSend,
      createdAt: new Date(),
      images: uploadedImages, // Use R2 URLs instead of base64
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setSelectedImages([]); // Clear selected images after sending
    setIsLoading(true);

    // DON'T notify parent yet - wait until we detect file generation
    // onGeneratingStatusChange?.(true); // Moved to when we detect files

    // Set project status to "generating"
    await fetch(`/api/projects/${projectId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ generationStatus: "generating" }),
    });

    // Save user message to database (with file IDs if images were uploaded)
    await saveMessage("user", userMessage.content, fileIds);

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
          messages: [...messages, userMessage].map((m) => {
            // For messages with images, format as vision API expects
            if (m.images && m.images.length > 0) {
              return {
                role: m.role,
                content: [
                  { type: "text", text: m.content },
                  ...m.images.map((img) => ({
                    type: "image_url",
                    image_url: { url: img.url },
                  })),
                ],
              };
            }
            // Regular text-only messages
            return {
              role: m.role,
              content: m.content,
            };
          }),
          taskType: "coding",
          projectFiles, // Send existing project files for context
          projectId, // Required for AI usage tracking
          selectedModel: selectedModel, // Pass selected model ID
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // ⚡ SSE: Parse Server-Sent Events stream
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: "",
        createdAt: new Date(),
        isStreaming: true, // Mark as streaming
      };

      setMessages((prev) => [...prev, assistantMessage]);

      if (reader) {
        let fullContent = "";
        let hasNotifiedFileGeneration = false; // Track if we've notified about file generation
        let lastStreamedContent = ""; // Track last streamed content to avoid duplicate updates
        const messageToolCalls = new Map<string, ToolCall>(); // Track tools for this message
        let buffer = ""; // Buffer for SSE parsing
        const streamingFilesMap = new Map<string, string>(); // Track streaming file content
        const completeFilesSet = new Set<string>(); // Track completed files

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          buffer += chunk;

          // Parse complete SSE events (format: "event: <type>\ndata: <json>\n\n")
          const events = buffer.split("\n\n");
          buffer = events.pop() || ""; // Keep incomplete event in buffer

          for (const eventStr of events) {
            if (!eventStr.trim()) continue;

            const lines = eventStr.split("\n");
            let eventType = "";
            let eventData = "";

            for (const line of lines) {
              if (line.startsWith("event: ")) {
                eventType = line.slice(7).trim();
              } else if (line.startsWith("data: ")) {
                eventData = line.slice(6).trim();
              }
            }

            if (!eventType || !eventData) continue;

            try {
              const data = JSON.parse(eventData);

              // Handle different event types
              switch (eventType) {
                case "text-delta":
                  // Accumulate text content
                  fullContent += data.content || "";
                  break;

                case "file-stream-start": {
                  // File generation started
                  const { file } = data;
                  console.log(`📝 File streaming started: ${file.path}`);

                  // Initialize empty content for this file
                  streamingFilesMap.set(file.path, "");

                  // Notify parent when we first detect file generation
                  if (!hasNotifiedFileGeneration) {
                    onGeneratingStatusChange?.(true);
                    hasNotifiedFileGeneration = true;
                  }

                  // Create initial file changes card entry
                  const fileChange: FileChange = {
                    path: file.path,
                    type: file.isNew ? "added" : "modified",
                    language: file.language,
                  };

                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantMessage.id
                        ? {
                            ...m,
                            fileChanges: [
                              ...(m.fileChanges || []).filter(
                                (fc) => fc.path !== file.path
                              ),
                              fileChange,
                            ],
                          }
                        : m
                    )
                  );
                  break;
                }

                case "file-stream-delta": {
                  // File content chunk received
                  const { file } = data;
                  const currentContent = streamingFilesMap.get(file.path) || "";
                  const newContent = currentContent + file.contentDelta;
                  streamingFilesMap.set(file.path, newContent);

                  // Send streaming files to parent for live code view
                  if (onStreamingFiles) {
                    const filesObj: Record<string, string> = {};
                    streamingFilesMap.forEach((content, path) => {
                      filesObj[path] = content;
                    });
                    onStreamingFiles(filesObj);
                  }
                  break;
                }

                case "file-stream-complete": {
                  // File generation completed
                  const { file } = data;
                  console.log(`✅ File streaming complete: ${file.path}`);

                  // Mark file as complete
                  completeFilesSet.add(file.path);
                  streamingFilesMap.set(file.path, file.content);

                  // Send final file content
                  if (onStreamingFiles) {
                    const filesObj: Record<string, string> = {};
                    streamingFilesMap.forEach((content, path) => {
                      filesObj[path] = content;
                    });
                    onStreamingFiles(filesObj);
                  }
                  break;
                }

                case "tool-call-start": {
                  // Tool execution started
                  const { toolCall: tc } = data;
                  const toolCall: ToolCall = {
                    id: tc.id,
                    name: tc.name,
                    status: "running",
                    args: tc.args,
                    startedAt: tc.startedAt,
                  };
                  messageToolCalls.set(tc.id, toolCall);

                  console.log(`🔧 Tool started: ${tc.name}`);

                  // Show toast notification
                  toast.info(`Running ${tc.name}...`, {
                    id: `tool-${tc.id}`,
                  });
                  break;
                }

                case "tool-call-complete": {
                  // Tool execution completed
                  const { toolCall: tc } = data;
                  const existingTool = messageToolCalls.get(tc.id);

                  if (existingTool) {
                    existingTool.status = tc.status;
                    existingTool.result = tc.result;
                    existingTool.error = tc.error;
                    existingTool.completedAt = tc.completedAt;
                  }

                  console.log(
                    `✅ Tool completed: ${tc.name} (${tc.status}) in ${tc.duration}ms`
                  );

                  // Update toast notification
                  if (tc.status === "success") {
                    toast.success(`✓ ${tc.name} completed`, {
                      id: `tool-${tc.id}`,
                      description: `Finished in ${tc.duration}ms`,
                    });
                  } else {
                    toast.error(`✗ ${tc.name} failed`, {
                      id: `tool-${tc.id}`,
                      description: tc.error || "Unknown error",
                    });
                  }
                  break;
                }

                case "preview-ready": {
                  // Preview is ready to start
                  const {
                    projectId: previewProjectId,
                    filesGenerated,
                    reason,
                  } = data;
                  console.log(
                    `🎬 Preview ready: ${filesGenerated} files (${
                      reason || "no reason"
                    })`
                  );

                  // Notify parent to trigger preview
                  // The PreviewPanel will detect this through its effect hook
                  // We signal this by updating the generation status
                  onGeneratingStatusChange?.(false);

                  // Refresh project data to get updated generationStatus
                  if (onRefreshProject) {
                    onRefreshProject().then(() => {
                      console.log(
                        "✅ Project data refreshed after preview-ready"
                      );
                    });
                  }

                  toast.success("Preview Ready!", {
                    description: `${filesGenerated} files are ready to preview`,
                  });
                  break;
                }

                case "orchestrator-session": {
                  // Orchestrator session started/updated
                  const { sessionId, status } = data;
                  console.log(
                    `🎯 Orchestrator session ${sessionId}: ${status}`
                  );

                  // Initialize orchestrator progress in message
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantMessage.id
                        ? {
                            ...m,
                            orchestratorProgress: {
                              tasks: [],
                              totalTasks: 0,
                              completedTasks: 0,
                              failedTasks: 0,
                              percentComplete: 0,
                              isActive: status === "active",
                            },
                          }
                        : m
                    )
                  );

                  toast.info("Multi-Agent Orchestration Started", {
                    description: "Planning and delegating tasks...",
                  });
                  break;
                }

                case "orchestrator-task-created": {
                  // New task created
                  const { task } = data;
                  console.log(
                    `📋 Task created: ${task.phase} - ${task.description}`
                  );

                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantMessage.id && m.orchestratorProgress
                        ? {
                            ...m,
                            orchestratorProgress: {
                              ...m.orchestratorProgress,
                              tasks: [...m.orchestratorProgress.tasks, task],
                              totalTasks: m.orchestratorProgress.totalTasks + 1,
                            },
                          }
                        : m
                    )
                  );
                  break;
                }

                case "orchestrator-delegation": {
                  // Task delegated to coding agent
                  const { taskId } = data;
                  console.log(`🤖 Task delegated: ${taskId}`);

                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantMessage.id && m.orchestratorProgress
                        ? {
                            ...m,
                            orchestratorProgress: {
                              ...m.orchestratorProgress,
                              currentTaskId: taskId,
                              tasks: m.orchestratorProgress.tasks.map((t) =>
                                t.id === taskId
                                  ? { ...t, status: "in-progress" as const }
                                  : t
                              ),
                            },
                          }
                        : m
                    )
                  );
                  break;
                }

                case "orchestrator-task-completed": {
                  // Task completed or failed
                  const { taskId, success } = data;
                  console.log(
                    `${success ? "✅" : "❌"} Task ${taskId}: ${
                      success ? "completed" : "failed"
                    }`
                  );

                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantMessage.id && m.orchestratorProgress
                        ? {
                            ...m,
                            orchestratorProgress: {
                              ...m.orchestratorProgress,
                              tasks: m.orchestratorProgress.tasks.map((t) =>
                                t.id === taskId
                                  ? {
                                      ...t,
                                      status: success
                                        ? ("completed" as const)
                                        : ("failed" as const),
                                    }
                                  : t
                              ),
                              completedTasks: success
                                ? m.orchestratorProgress.completedTasks + 1
                                : m.orchestratorProgress.completedTasks,
                              failedTasks: !success
                                ? m.orchestratorProgress.failedTasks + 1
                                : m.orchestratorProgress.failedTasks,
                            },
                          }
                        : m
                    )
                  );
                  break;
                }

                case "orchestrator-progress": {
                  // Overall progress update
                  const {
                    totalTasks,
                    completedTasks,
                    failedTasks,
                    percentComplete,
                  } = data;
                  console.log(
                    `📊 Progress: ${completedTasks}/${totalTasks} (${percentComplete}%)`
                  );

                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantMessage.id && m.orchestratorProgress
                        ? {
                            ...m,
                            orchestratorProgress: {
                              ...m.orchestratorProgress,
                              totalTasks,
                              completedTasks,
                              failedTasks,
                              percentComplete,
                              isActive:
                                completedTasks + failedTasks < totalTasks,
                            },
                          }
                        : m
                    )
                  );
                  break;
                }

                case "done":
                  // Stream complete
                  console.log("🏁 Stream complete", data.metadata);
                  break;
              }
            } catch (parseError) {
              console.warn("Failed to parse SSE event:", parseError);
            }
          }

          // Only process streaming every ~50ms or when done to reduce updates
          const shouldUpdate =
            done || fullContent.length - lastStreamedContent.length > 100;

          if (!shouldUpdate) continue;

          // Build file changes list from SSE streamed files
          const streamingFileChanges: FileChange[] = Array.from(
            streamingFilesMap.keys()
          ).map((path) => ({
            path,
            type: projectFiles && projectFiles[path] ? "modified" : "added",
            language: path.split(".").pop(), // Simple language detection from extension
          }));

          // Update message content and metadata
          lastStreamedContent = fullContent;
          assistantMessage.content = fullContent.trim();

          // Convert tool calls map to array for display
          const toolCallsArray = Array.from(messageToolCalls.values());

          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMessage.id
                ? {
                    ...m,
                    content: fullContent.trim(),
                    fileChanges:
                      streamingFileChanges.length > 0
                        ? streamingFileChanges
                        : undefined,
                    toolCalls:
                      toolCallsArray.length > 0 ? toolCallsArray : undefined,
                    isStreaming: true, // Still streaming
                  }
                : m
            )
          );
        }

        // After streaming is complete, save files from SSE events
        if (streamingFilesMap.size > 0) {
          console.log(
            `📝 Saving ${streamingFilesMap.size} files from SSE stream`
          );

          const filesToSave = Array.from(streamingFilesMap.entries()).map(
            ([path, content]) => ({
              path,
              content,
              language: path.split(".").pop() || "txt",
            })
          );

          const fileChanges = await saveFiles(filesToSave);

          // Update the message with file changes
          const finalContent = fullContent.trim() || "Created project files";

          // Convert tool calls map to array for message
          const toolCallsArray = Array.from(messageToolCalls.values());

          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMessage.id
                ? {
                    ...m,
                    content: finalContent,
                    fileChanges,
                    toolCalls:
                      toolCallsArray.length > 0 ? toolCallsArray : undefined,
                    isStreaming: false, // Streaming complete
                  }
                : m
            )
          );

          // Save assistant message with cleaned content, file changes, and tool calls
          await saveMessage(
            "assistant",
            finalContent,
            undefined,
            fileChanges,
            toolCallsArray
          );
        } else {
          // Save assistant message as-is (with validation)
          const contentToSave = fullContent.trim() || "Response received";

          // Convert tool calls map to array for message
          const toolCallsArray = Array.from(messageToolCalls.values());

          // Update message with tool calls and mark as complete
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMessage.id
                ? {
                    ...m,
                    toolCalls:
                      toolCallsArray.length > 0 ? toolCallsArray : undefined,
                    isStreaming: false, // Streaming complete
                  }
                : m
            )
          );

          await saveMessage(
            "assistant",
            contentToSave,
            undefined,
            undefined,
            toolCallsArray
          );
        }

        // Trigger credit balance update after successful response
        notifyCreditUpdate();
      }
    } catch (error) {
      console.error("Error sending message:", error);

      // Provide more specific error message
      let errorContent =
        "Sorry, I encountered an error processing your request.";
      if (error instanceof Error) {
        if (error.message.includes("401")) {
          errorContent =
            "Authentication error. Please make sure you're logged in.";
        } else if (error.message.includes("400")) {
          errorContent =
            "Invalid request. Please try again or refresh the page.";
        } else if (error.message.includes("429")) {
          errorContent =
            "Token limit reached. Please upgrade your plan or purchase additional tokens.";
        } else if (error.message.includes("500")) {
          errorContent =
            "Server error. Please check your OpenRouter API key in the .env file and restart the server.";
        }
      }

      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: errorContent,
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

  const handleImageUpload = () => {
    fileInputRef.current?.click();
  };

  // Voice input handlers
  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      console.error("❌ Recognition not available");
      alert(
        "Speech recognition is not supported in your browser. Please try Chrome, Edge, or Safari."
      );
      return;
    }

    if (isRecording) {
      console.log("⏹️ Stopping voice input");
      recognitionRef.current.stop();
      setIsRecording(false);
      setInterimTranscript(""); // Clear interim transcript on stop
    } else {
      console.log("▶️ Starting voice input");
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (error) {
        console.error("Error starting recognition:", error);
      }
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const validFiles = fileArray.filter((file) => {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        console.error(`File ${file.name} is not an image`);
        return false;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        console.error(`File ${file.name} is too large (max 5MB)`);
        return false;
      }

      return true;
    });

    // Limit to 5 images total (including already selected)
    const availableSlots = 5 - selectedImages.length;
    const filesToProcess = validFiles.slice(0, availableSlots);

    // Convert all files to base64 using Promise.all
    const imagePromises = filesToProcess.map((file, index) => {
      return new Promise<ImageAttachment>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const dataUrl = event.target?.result as string;
          resolve({
            id: `${Date.now()}-${index}`,
            name: file.name,
            url: dataUrl,
            type: file.type,
          });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    });

    try {
      const newImages = await Promise.all(imagePromises);
      setSelectedImages((prev) => [...prev, ...newImages].slice(0, 5));
    } catch (error) {
      console.error("Error processing images:", error);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveImage = (imageId: string) => {
    setSelectedImages((prev) => prev.filter((img) => img.id !== imageId));
  };

  return (
    <div className="h-full flex flex-col bg-background overflow-x-hidden">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-0 py-6 scrollbar-minimal">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.map((message: Message, index: number) => {
            // Calculate version number based on how many messages with file changes
            // up to and including this message (for chronological tracking)
            const messageVersionNumber = messages
              .slice(0, index + 1)
              .filter(
                (m: Message) => m.fileChanges && m.fileChanges.length > 0
              ).length;

            return (
              <div
                key={message.id}
                className={`flex flex-col gap-2 ${
                  message.role === "user" ? "items-end" : "items-start"
                }`}
              >
                <div
                  className={`px-4 py-3 ${
                    message.role === "user"
                      ? "max-w-[80%] bg-muted text-foreground rounded-2xl"
                      : "w-full text-foreground"
                  }`}
                >
                  {message.role === "assistant" ? (
                    <>
                      {/* Orchestrator Progress */}
                      {message.orchestratorProgress && (
                        <div className="mb-4">
                          <OrchestratorProgress
                            tasks={message.orchestratorProgress.tasks}
                            totalTasks={message.orchestratorProgress.totalTasks}
                            completedTasks={
                              message.orchestratorProgress.completedTasks
                            }
                            failedTasks={
                              message.orchestratorProgress.failedTasks
                            }
                            percentComplete={
                              message.orchestratorProgress.percentComplete
                            }
                            currentTaskId={
                              message.orchestratorProgress.currentTaskId
                            }
                            isActive={message.orchestratorProgress.isActive}
                          />
                        </div>
                      )}

                      {/* File Changes Card - Higher priority */}
                      {message.fileChanges &&
                        message.fileChanges.length > 0 && (
                          <div className="mb-4">
                            <FileChangesCard
                              title={`Updated project files`}
                              version={`v${messageVersionNumber}`}
                              files={message.fileChanges}
                              isStreaming={message.isStreaming}
                              onFileClick={onFileClick}
                            />
                          </div>
                        )}

                      {/* Message content - show if there's text OR still streaming */}
                      {(message.content.trim() || message.isStreaming) && (
                        <div className="prose prose-sm dark:prose-invert max-w-none mb-3">
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
                                    className="bg-muted px-1 py-0.5 rounded text-xs"
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
                            {message.content || ""}
                          </ReactMarkdown>
                        </div>
                      )}

                      {/* Tool Executions - Live display during streaming and after */}
                      {message.toolCalls && message.toolCalls.length > 0 && (
                        <div className="space-y-1.5 mb-3">
                          {message.toolCalls.map((toolCall) => (
                            <ToolCallDisplay
                              key={toolCall.id}
                              toolCall={toolCall}
                            />
                          ))}
                        </div>
                      )}

                      {/* Footer - Only show when NOT streaming */}
                      {!message.isStreaming && (
                        <div className="flex items-center gap-2 mt-2 pt-2">
                          <span className="text-xs text-neutral-500 dark:text-neutral-400">
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
                              className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                              aria-label="Copy response"
                              title="Copy"
                            >
                              {copiedMessageId === message.id ? (
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
                                  ? "bg-muted text-foreground"
                                  : "hover:bg-muted text-muted-foreground hover:text-foreground"
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
                              onClick={() =>
                                handleFeedback(message.id, "dislike")
                              }
                              className={`p-1.5 rounded-lg transition-colors ${
                                feedbackMessageId[message.id] === "dislike"
                                  ? "bg-muted text-foreground"
                                  : "hover:bg-muted text-muted-foreground hover:text-foreground"
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
                      )}
                    </>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap">
                      {message.content}
                    </p>
                  )}
                </div>
                {/* User message images - displayed as small thumbnails outside the text box */}
                {message.role === "user" &&
                  message.images &&
                  message.images.length > 0 && (
                    <div className="flex flex-wrap gap-2 max-w-[80%]">
                      {message.images.map((image: ImageAttachment) => (
                        <div
                          key={image.id}
                          className="flex flex-col gap-1 cursor-pointer group"
                          onClick={() => setPreviewImage(image)}
                        >
                          <div className="rounded-lg overflow-hidden bg-muted border border-border hover:opacity-80 transition-opacity shadow-sm p-2 flex items-center gap-2">
                            {/* Image preview with fallback to icon */}
                            <div className="w-4 h-4 flex-shrink-0 relative">
                              <Image
                                src={image.url}
                                alt={image.name}
                                width={16}
                                height={16}
                                className="w-4 h-4 object-cover rounded"
                                unoptimized
                                onError={(e) => {
                                  // Show SVG fallback on error
                                  const target = e.target as HTMLElement;
                                  target.style.display = "none";
                                  const svg = target.nextElementSibling;
                                  if (svg) {
                                    (svg as HTMLElement).style.display =
                                      "block";
                                  }
                                }}
                              />
                              <svg
                                className="w-4 h-4 text-neutral-400 flex-shrink-0 hidden"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                              </svg>
                            </div>
                            {/* Filename */}
                            <span className="text-xs text-muted-foreground truncate max-w-[100px]">
                              {image.name}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
              </div>
            );
          })}
          {isLoading && (
            <div className="flex gap-4 justify-start">
              <div className="px-4 py-3 w-full">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                    <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                  <span className="text-sm text-muted-foreground">
                    Working...
                  </span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="border-border px-0">
        <div className="max-w-3xl mx-auto">
          <div className="rounded-2xl px-2 py-2 bg-card border border-border transition-shadow">
            {/* Low Token Warning */}
            {isLowTokens && !isTokensExhausted && (
              <div className="mb-2 px-4 py-2 bg-muted/50 border-b border-border -mx-2 -mt-2 rounded-t-2xl">
                <p className="text-xs text-muted-foreground">
                  {balance?.totalAvailable.toLocaleString()} credits remaining.{" "}
                  <button
                    onClick={() => {
                      setSettingsInitialTab("billing");
                      setShowSettingsModal(true);
                    }}
                    className="text-foreground underline hover:no-underline font-medium"
                  >
                    Top up credits
                  </button>
                </p>
              </div>
            )}

            {/* Exhausted Token Warning */}
            {isTokensExhausted && (
              <div className="mb-2 px-3 py-2 bg-muted/50 border-b border-border -mx-2 -mt-2 rounded-t-2xl">
                <p className="text-xs text-muted-foreground">
                  Out of credits.{" "}
                  <button
                    onClick={() => {
                      setSettingsInitialTab("billing");
                      setShowSettingsModal(true);
                    }}
                    className="text-foreground underline hover:no-underline font-medium"
                  >
                    Top up credits to continue
                  </button>
                </p>
              </div>
            )}

            {/* Image Attachments - Above the textarea */}
            {selectedImages.length > 0 && (
              <div className="flex flex-wrap gap-2 pb-2">
                {selectedImages.map((image) => (
                  <div
                    key={image.id}
                    className="relative group rounded-2xl overflow-hidden border border-border"
                  >
                    <Image
                      src={image.url}
                      alt={image.name}
                      width={80}
                      height={80}
                      className="w-20 h-20 object-cover cursor-pointer hover:opacity-80 transition-opacity"
                      unoptimized
                      onClick={() => setPreviewImage(image)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveImage(image.id)}
                      className="absolute top-1 right-1 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity bg-popover/80 hover:bg-popover text-popover-foreground"
                      aria-label="Remove image"
                    >
                      <svg
                        className="w-3 h-3"
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
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Textarea - Main prompt area */}
            <div className="relative">
              <Textarea
                ref={textareaRef}
                value={input + interimTranscript}
                onChange={(e) => {
                  // Only update input if not recording or if user is typing
                  if (!isRecording) {
                    setInput(e.target.value);
                    handleInput(e);
                  }
                }}
                onKeyDown={handleKeyDown}
                placeholder="Describe what you want to build or modify..."
                rows={1}
                className="w-full p-2 !border-0 !shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent focus:outline-none resize-none text-base sm:text-md text-foreground placeholder:text-muted-foreground overflow-y-auto scrollbar-minimal min-h-[3.5rem] max-h-[288px]"
              />
              {/* Show interim transcript indicator */}
              {interimTranscript && (
                <div className="absolute bottom-1 right-2 pointer-events-none">
                  <span className="text-xs text-muted-foreground italic flex items-center gap-1">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-muted-foreground animate-pulse"></span>
                    transcribing...
                  </span>
                </div>
              )}
            </div>

            {/* Controls Row */}
            <div className="flex items-center justify-between px-1 pt-2">
              <div className="flex items-center gap-0">
                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                />

                {/* Add button (for image upload) */}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleImageUpload}
                  className="rounded-full"
                  aria-label="Attach images"
                  title="Upload images (max 5, 5MB each)"
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
                </Button>

                {/* Model Selector */}
                {!isLoadingModel && (
                  <ModelSelector
                    selectedModel={selectedModel || undefined}
                    onModelChange={setSelectedModel}
                    onOpenSettings={() => {
                      setSettingsInitialTab("model-preferences");
                      setShowSettingsModal(true);
                    }}
                  />
                )}
              </div>

              <div className="flex items-center gap-2">
                {/* Voice input button */}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={toggleVoiceInput}
                  className={`rounded-full ${
                    isRecording
                      ? "bg-accent text-accent-foreground animate-pulse"
                      : ""
                  }`}
                  aria-label={
                    isRecording ? "Stop recording" : "Start voice input"
                  }
                  title={isRecording ? "Stop recording" : "Start voice input"}
                >
                  {isRecording ? (
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <rect x="6" y="6" width="12" height="12" rx="2" />
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
                        d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                      />
                    </svg>
                  )}
                </Button>

                <Button
                  type="button"
                  size="icon"
                  onClick={handleFormSubmit}
                  disabled={!input.trim() || isLoading}
                  className="rounded-full"
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
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Image Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-12 right-0 p-2 text-white hover:text-neutral-300 transition-colors"
              aria-label="Close preview"
            >
              <svg
                className="w-8 h-8"
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

            {/* Image */}
            <div className="relative bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden shadow-2xl">
              <Image
                src={previewImage.url}
                alt={previewImage.name}
                width={1200}
                height={800}
                className="w-full h-auto max-h-[80vh] object-contain"
                unoptimized
              />
              {/* Image name */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                <p className="text-white text-sm font-medium">
                  {previewImage.name}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        initialTab={settingsInitialTab}
      />
    </div>
  );
}
