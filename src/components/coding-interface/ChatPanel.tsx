"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";
import { getModelsForPlan, getDefaultModel, AI_MODELS } from "@/lib/ai-models";
import type { PlanName } from "@/lib/ai-models";
import ModelSelector from "../ModelSelector";

interface ImageAttachment {
  id: string;
  name: string;
  url: string; // base64 data URL
  type: string;
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
}

interface ChatPanelProps {
  projectId: string;
  projectDescription?: string | null;
  projectVersion?: number; // Project version (0 = new project, 1+ = has updates)
  projectFiles?: Record<string, string>; // Existing project files
  onFilesCreated?: (files: { path: string; content: string }[]) => void;
  triggerNewChat?: number;
  onGeneratingStatusChange?: (isGenerating: boolean) => void;
}

export default function ChatPanel({
  projectId,
  projectDescription,
  projectVersion = 0,
  projectFiles = {},
  onFilesCreated,
  triggerNewChat = 0,
  onGeneratingStatusChange,
}: ChatPanelProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasLoadedMessages = useRef(false); // Track if we've already loaded messages
  const hasTriggeredAutoSend = useRef(false); // Track if we've triggered auto-send

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messagesLoaded, setMessagesLoaded] = useState(false);
  const [modelLoaded, setModelLoaded] = useState(false); // Track if model has been loaded
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [selectedImages, setSelectedImages] = useState<ImageAttachment[]>([]);
  const [previewImage, setPreviewImage] = useState<ImageAttachment | null>(
    null
  );
  const [feedbackMessageId, setFeedbackMessageId] = useState<{
    [key: string]: "like" | "dislike" | null;
  }>({});

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

  // Model selection
  const [selectedModel, setSelectedModel] =
    useState<string>("grok-code-fast-1");
  const [availableModels, setAvailableModels] = useState(
    getModelsForPlan("HOBBY")
  );

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
        modelLoaded &&
        !isLoading
      ) {
        console.log(
          `🚀 Auto-sending first message with model: ${selectedModel}`
        );
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
  }, [
    projectVersion,
    projectDescription,
    messagesLoaded,
    modelLoaded,
    isLoading,
  ]);

  // Fetch user's plan and project's saved model
  useEffect(() => {
    const fetchUserPlanAndProjectModel = async () => {
      try {
        // Fetch user plan
        const planResponse = await fetch("/api/user/plan");
        if (planResponse.ok) {
          const planData = await planResponse.json();
          const plan: PlanName = planData.plan || "HOBBY";

          console.log(`🎯 User plan: ${plan}`);

          setAvailableModels(getModelsForPlan(plan));

          // Fetch project to get saved aiModel
          const projectResponse = await fetch(`/api/projects/${projectId}`);
          if (projectResponse.ok) {
            const projectData = await projectResponse.json();
            const savedAiModel = projectData.project?.aiModel;

            if (savedAiModel) {
              // Find the model key from the model ID
              const modelKey = Object.keys(AI_MODELS).find(
                (key) => AI_MODELS[key].id === savedAiModel
              );

              if (modelKey) {
                setSelectedModel(modelKey);
                console.log(
                  `🤖 Using saved model from project: ${savedAiModel}`
                );
              } else {
                // If saved model not found, use default for plan
                const defaultModel = getDefaultModel(plan);
                setSelectedModel(defaultModel);
                console.log(
                  `🤖 Saved model not found, using default for ${plan}: ${defaultModel}`
                );
              }
            } else {
              // No saved model, use default for plan
              const defaultModel = getDefaultModel(plan);
              setSelectedModel(defaultModel);
              console.log(
                `🤖 No saved model, using default for ${plan}: ${defaultModel}`
              );
            }
          } else {
            // Failed to fetch project, use default for plan
            const defaultModel = getDefaultModel(plan);
            setSelectedModel(defaultModel);
            console.log(
              `🤖 Failed to fetch project, using default for ${plan}: ${defaultModel}`
            );
          }

          // Mark model as loaded
          setModelLoaded(true);
        }
      } catch (error) {
        console.error("Error fetching user plan or project:", error);
        // Default to HOBBY plan on error
        setAvailableModels(getModelsForPlan("HOBBY"));
        setSelectedModel(getDefaultModel("HOBBY"));
        setModelLoaded(true); // Still mark as loaded even on error
      }
    };

    fetchUserPlanAndProjectModel();
  }, [projectId]);

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
    fileIds?: string[]
  ) => {
    try {
      console.log(`💾 Saving ${role} message to project ${projectId}...`);

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

  const handleSendMessage = async (
    messageContent?: string,
    imagesToSend?: ImageAttachment[]
  ) => {
    const contentToSend = messageContent || input;
    if (!contentToSend.trim() || isLoading) return;

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

    // Notify parent that we're generating files
    onGeneratingStatusChange?.(true);

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
          selectedModel, // Send selected AI model
          teamId: projectId, // For plan verification
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
          await saveMessage("assistant", finalContent);
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
    <div className="h-full flex flex-col bg-white dark:bg-neutral-900 overflow-x-hidden">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-6 scrollbar-minimal">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {messages.map((message: any) => (
            <div
              key={message.id}
              className={`flex flex-col gap-2 ${
                message.role === "user" ? "items-end" : "items-start"
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
                        <div className="rounded-lg overflow-hidden bg-neutral-800 dark:bg-neutral-700 border border-neutral-700 dark:border-neutral-600 hover:opacity-80 transition-opacity shadow-sm p-2 flex items-center gap-2">
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
                                  (svg as HTMLElement).style.display = "block";
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
                          <span className="text-xs text-neutral-300 dark:text-neutral-400 truncate max-w-[100px]">
                            {image.name}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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
            {/* Image Attachments - Above the textarea */}
            {selectedImages.length > 0 && (
              <div className="flex flex-wrap gap-2 pb-2">
                {selectedImages.map((image) => (
                  <div
                    key={image.id}
                    className="relative group rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-600"
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
                    <button
                      onClick={() => handleRemoveImage(image.id)}
                      className="absolute top-1 right-1 p-1 bg-neutral-900/80 dark:bg-neutral-100/80 text-white dark:text-neutral-900 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
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
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Textarea - Main prompt area */}
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
              <div className="flex items-center gap-2">
                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                />

                {/* Image upload button */}
                <button
                  onClick={handleImageUpload}
                  className="p-2 rounded-full border border-neutral-200 dark:border-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-500 text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
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
                </button>

                {/* Model Selector */}
                <ModelSelector
                  selectedModel={selectedModel}
                  availableModels={availableModels}
                  onModelChange={setSelectedModel}
                />
              </div>

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

      {/* Image Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
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
    </div>
  );
}
