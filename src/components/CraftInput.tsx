"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { getModelsForPlan, getDefaultModel, AI_MODELS } from "@/lib/ai-models";
import type { PlanName } from "@/lib/ai-models";
import ModelSelector from "./ModelSelector";

interface ImageAttachment {
  id: string;
  name: string;
  url: string; // base64 data URL
  type: string;
}

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

// Example prompts to cycle through
const examplePrompts = [
  "Create a modern landing page for my startup...",
  "Design a mobile app for fitness tracking...",
  "Build a dashboard with analytics charts...",
  "Generate a portfolio website template...",
  "Make a responsive e-commerce layout...",
  "Create a blog theme with dark mode...",
  "Design an admin panel interface...",
  "Build a social media app layout...",
  "Create a restaurant booking system...",
  "Design a music streaming interface...",
  "Build a task management application...",
  "Generate a weather app design...",
];

export default function CraftInput() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [input, setInput] = useState("");
  const [placeholderText, setPlaceholderText] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [selectedImages, setSelectedImages] = useState<ImageAttachment[]>([]);
  const [previewImage, setPreviewImage] = useState<ImageAttachment | null>(
    null
  );
  const [isRecording, setIsRecording] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const recognitionRef = useRef<SpeechRecognition | null>(null);

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
        Math.min(textareaRef.current.scrollHeight, 200) + "px";
    }
  }, [input, interimTranscript]);

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

  // Model selection
  const [selectedModel, setSelectedModel] =
    useState<string>("claude-haiku-4.5");
  const [availableModels, setAvailableModels] = useState(
    getModelsForPlan("HOBBY")
  );

  // Fetch user's plan and set available models
  useEffect(() => {
    const fetchUserPlan = async () => {
      try {
        const response = await fetch("/api/user/plan");
        if (response.ok) {
          const data = await response.json();
          const plan = data.plan as PlanName;
          const models = getModelsForPlan(plan);
          setAvailableModels(models);
          // Set default model based on plan
          const defaultModel = getDefaultModel(plan);
          setSelectedModel(
            Object.keys(AI_MODELS).find(
              (key) => AI_MODELS[key].id === defaultModel
            ) || "claude-haiku-4.5"
          );
        }
      } catch (error) {
        console.error("Failed to fetch user plan:", error);
      }
    };
    fetchUserPlan();
  }, []);

  useEffect(() => {
    let currentIndex = 0;
    let timeoutId: NodeJS.Timeout;
    let typeIntervalId: NodeJS.Timeout;
    let eraseIntervalId: NodeJS.Timeout;
    let currentText = "";

    const typeText = (text: string, callback?: () => void) => {
      let charIndex = 0;
      currentText = "";
      setPlaceholderText("");

      typeIntervalId = setInterval(() => {
        if (charIndex < text.length) {
          currentText = text.substring(0, charIndex + 1);
          setPlaceholderText(currentText);
          charIndex++;
        } else {
          clearInterval(typeIntervalId);
          if (callback) {
            timeoutId = setTimeout(callback, 2000); // Wait 2 seconds before erasing
          }
        }
      }, 50); // Type each character every 50ms
    };

    const eraseText = (callback?: () => void) => {
      let charIndex = currentText.length;

      eraseIntervalId = setInterval(() => {
        if (charIndex > 0) {
          charIndex--;
          currentText = currentText.substring(0, charIndex);
          setPlaceholderText(currentText);
        } else {
          clearInterval(eraseIntervalId);
          if (callback) {
            timeoutId = setTimeout(callback, 500); // Wait 500ms before typing next
          }
        }
      }, 20); // Erase faster than typing (20ms vs 50ms for typing)
    };

    const cyclePrompts = () => {
      if (!input.trim()) {
        typeText(examplePrompts[currentIndex], () => {
          eraseText(() => {
            currentIndex = (currentIndex + 1) % examplePrompts.length;
            cyclePrompts();
          });
        });
      }
    };

    if (!input.trim()) {
      cyclePrompts();
    } else {
      setPlaceholderText("");
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (typeIntervalId) clearInterval(typeIntervalId);
      if (eraseIntervalId) clearInterval(eraseIntervalId);
    };
  }, [input]);

  const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement;
    target.style.height = "auto";
    target.style.height = Math.min(target.scrollHeight, 200) + "px";
  };

  const handleSubmit = async () => {
    if (!input.trim() || isCreating) return;

    setIsCreating(true);

    try {
      // Create a new project with default name "New Project"
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "New Project", // Default name
          description: input,
          aiModel: AI_MODELS[selectedModel]?.id, // Include selected model
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Project created:", data);

        // Store images in sessionStorage if any were selected
        if (selectedImages.length > 0 && data.project?.id) {
          sessionStorage.setItem(
            `project-${data.project.id}-images`,
            JSON.stringify(selectedImages)
          );
        }

        // Redirect to the coding interface
        if (data.project && data.project.id) {
          router.push(`/chat/${data.project.id}`);
        } else {
          console.error("Project ID not found in response:", data);
          setIsCreating(false);
        }
      } else {
        const errorData = await response.json();
        console.error("Failed to create project:", errorData);
        setIsCreating(false);
      }
    } catch (error) {
      console.error("Error creating project:", error);
      setIsCreating(false);
    }
  };

  const handleQuickOption = (option: string) => {
    setInput(option);
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

  const handleFileAttachment = () => {
    handleImageUpload();
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="rounded-3xl px-2 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-sm hover:shadow-md focus-within:shadow-lg">
        {/* Image Previews */}
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

        {/* First row - Input */}
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={input + interimTranscript}
            onChange={(e) => {
              // Only update input if not recording or if user is typing
              if (!isRecording) {
                setInput(e.target.value);
              }
            }}
            onInput={handleInput}
            placeholder=""
            className="w-full p-2 rounded-t-lg bg-transparent focus:outline-none resize-none text-base sm:text-md text-foreground placeholder:text-muted min-h-[3.5rem] max-h-[200px] scrollbar-minimal"
            rows={1}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
          />
          {!input.trim() && !interimTranscript && (
            <div className="absolute inset-0 p-2 pointer-events-none flex items-start">
              <span className="text-neutral-500 dark:text-neutral-400 text-base sm:text-md leading-relaxed">
                {placeholderText}
              </span>
            </div>
          )}
          {/* Show interim transcript indicator */}
          {interimTranscript && (
            <div className="absolute bottom-1 right-2 pointer-events-none">
              <span className="text-xs text-neutral-400 dark:text-neutral-500 italic flex items-center gap-1">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-neutral-400 dark:bg-neutral-500 animate-pulse"></span>
                transcribing...
              </span>
            </div>
          )}
        </div>

        {/* Second row - Controls */}
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
              onClick={handleFileAttachment}
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

          <div className="flex items-center gap-2">
            {/* Voice input button */}
            <button
              onClick={toggleVoiceInput}
              className={`p-2 rounded-full border transition-all ${
                isRecording
                  ? "border-neutral-500 dark:border-neutral-400 bg-neutral-100 dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 animate-pulse"
                  : "border-neutral-200 dark:border-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-500 text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300"
              }`}
              aria-label={isRecording ? "Stop recording" : "Start voice input"}
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
            </button>

            <button
              onClick={handleSubmit}
              disabled={!input.trim() || isCreating}
              className="p-2 rounded-full bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Submit"
            >
              {isCreating ? (
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

      {/* Quick options */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <span className="text-sm text-neutral-500 dark:text-neutral-400">
          or import from
        </span>
        <button
          onClick={() => handleQuickOption("Import from Figma")}
          className="px-4 py-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-sm text-foreground transition-colors border border-neutral-200 dark:border-neutral-700 flex items-center gap-2"
        >
          <svg
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 5.5A3.5 3.5 0 0 1 8.5 2H12v7H8.5A3.5 3.5 0 0 1 5 5.5z" />
            <path d="M12 2h3.5a3.5 3.5 0 1 1 0 7H12V2z" />
            <path d="M12 12.5a3.5 3.5 0 1 1 7 0 3.5 3.5 0 1 1-7 0z" />
            <path d="M5 19.5A3.5 3.5 0 0 1 8.5 16H12v3.5a3.5 3.5 0 1 1-7 0z" />
            <path d="M5 12.5A3.5 3.5 0 0 1 8.5 9H12v7H8.5A3.5 3.5 0 0 1 5 12.5z" />
          </svg>
          Figma
        </button>
        <button
          onClick={() => handleQuickOption("Import from GitHub")}
          className="px-4 py-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-sm text-foreground transition-colors border border-neutral-200 dark:border-neutral-700 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0C5.374 0 0 5.373 0 12 0 17.302 3.438 21.8 8.207 23.387c.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.30.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.300 24 12c0-6.627-5.373-12-12-12z" />
          </svg>
          GitHub
        </button>
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
