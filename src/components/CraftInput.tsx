"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import SubscriptionModal from "./SubscriptionModal";
import SettingsModal from "./SettingsModal";
import { useCreditBalance } from "@/hooks/useCreditBalance";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ModelSelector } from "@/components/ModelSelector";
import { useSession } from "@/lib/auth-client";

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
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsInitialTab, setSettingsInitialTab] = useState<
    "general" | "billing" | "usage" | "account" | "integrations"
  >("general");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { balance } = useCreditBalance();
  const [selectedModel, setSelectedModel] = useState(""); // Will be set from API (uses config default)
  const [userPlan, setUserPlan] = useState<"HOBBY" | "PRO" | "ENTERPRISE">(
    "HOBBY"
  );
  const { data: session } = useSession();

  // Fetch user's preferred model and plan on mount
  useEffect(() => {
    const fetchPreferredModel = async () => {
      if (!session?.user) return;

      try {
        const response = await fetch("/api/user/model-preferences");
        if (response.ok) {
          const data = await response.json();
          if (data.preferredModel) {
            setSelectedModel(data.preferredModel);
          }
          if (data.userPlan) {
            setUserPlan(data.userPlan);
          }
        }
      } catch (error) {
        console.error("Failed to fetch preferred model:", error);
        // Keep empty string - backend will use config default
      }
    };

    fetchPreferredModel();
  }, [session?.user]);

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
    const trimmedInput = input.trim();
    if (!trimmedInput || isCreating) return;

    setIsCreating(true);
    setErrorMessage(null); // Clear any previous errors

    try {
      // Check if user is authenticated
      const checkAuthResponse = await fetch("/api/projects", {
        method: "GET",
      });

      // If unauthorized (401), store prompt and redirect to signup
      if (checkAuthResponse.status === 401) {
        console.log(
          "🔒 User not authenticated, storing prompt and redirecting to signup"
        );

        // Check if localStorage is available
        if (typeof window === "undefined" || !window.localStorage) {
          console.error("❌ localStorage not available");
          setErrorMessage(
            "Your browser doesn't support local storage. Please enable cookies and try again."
          );
          setIsCreating(false);
          return;
        }

        // Check if there's already a pending project
        const existingPending = localStorage.getItem("pendingProject");
        if (existingPending) {
          try {
            const existing = JSON.parse(existingPending);
            // Check if it's recent (not expired)
            const isRecent =
              Date.now() - existing.timestamp < 24 * 60 * 60 * 1000;
            if (isRecent) {
              console.log("⚠️ Overwriting existing pending project");
            }
          } catch (e) {
            // Ignore parse errors, will overwrite anyway
          }
        }

        // Store the prompt, images, and selected model in localStorage
        try {
          localStorage.setItem(
            "pendingProject",
            JSON.stringify({
              prompt: trimmedInput, // Use trimmed input
              images: selectedImages,
              selectedModel: selectedModel,
              timestamp: Date.now(),
            })
          );
        } catch (storageError) {
          console.error("❌ Failed to store in localStorage:", storageError);

          // Check if it's a quota exceeded error
          if (
            storageError instanceof DOMException &&
            (storageError.name === "QuotaExceededError" ||
              storageError.name === "NS_ERROR_DOM_QUOTA_REACHED")
          ) {
            setErrorMessage(
              "Browser storage is full. Please clear some space and try again."
            );
          } else {
            setErrorMessage(
              "Failed to save your prompt. Please check your browser settings and try again."
            );
          }
          setIsCreating(false);
          return;
        }

        // Redirect to signup with callback to home page
        router.push("/auth/signup?callbackUrl=/");
        return;
      }

      // User is authenticated - check if tokens are exhausted
      if (isTokensExhausted) {
        setErrorMessage(
          "Out of credits this month. Upgrade to Pro to continue."
        );
        setSettingsInitialTab("billing");
        setShowSettingsModal(true);
        setIsCreating(false);
        return;
      }

      // Create a new project with default name "New Project"
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "New Project", // Default name
          description: input,
          selectedModel: selectedModel, // Save user's selected model
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Project created:", data);

        // Store images and selected model in sessionStorage if project was created
        if (data.project?.id) {
          if (selectedImages.length > 0) {
            sessionStorage.setItem(
              `project-${data.project.id}-images`,
              JSON.stringify(selectedImages)
            );
          }

          // Store selected model for the chat interface
          sessionStorage.setItem(
            `project-${data.project.id}-model`,
            selectedModel
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

        // Check if it's a project limit error
        if (errorData.code === "PROJECT_LIMIT_REACHED") {
          setErrorMessage(errorData.error);
          setSettingsInitialTab("billing");
          setShowSettingsModal(true);
        } else {
          // Show generic error message
          setErrorMessage(
            errorData.error || "Failed to create project. Please try again."
          );
        }

        setIsCreating(false);
      }
    } catch (error) {
      console.error("Error creating project:", error);

      // Handle network errors gracefully
      if (error instanceof TypeError && error.message.includes("fetch")) {
        setErrorMessage(
          "Network error. Please check your connection and try again."
        );
      } else {
        setErrorMessage("An unexpected error occurred. Please try again.");
      }

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
      <div className="rounded-3xl px-2 py-2 bg-card border border-border shadow-sm hover:shadow-md focus-within:shadow-lg transition-shadow">
        {/* Low Token Warning */}
        {isLowTokens && !isTokensExhausted && (
          <div className="mb-2 px-4 py-2 bg-muted/50 border-b border-border -mx-2 -mt-2 rounded-t-3xl">
            <p className="text-xs text-muted-foreground">
              {balance?.totalAvailable.toLocaleString()} credits remaining.{" "}
              <button
                onClick={() => {
                  setSettingsInitialTab("billing");
                  setShowSettingsModal(true);
                }}
                className="text-foreground underline hover:no-underline font-medium"
              >
                {balance?.planName === "PRO"
                  ? "Upgrade your plan"
                  : "Upgrade to Pro"}
              </button>
            </p>
          </div>
        )}

        {/* Exhausted Token Warning */}
        {isTokensExhausted && (
          <div className="mb-2 px-4 py-2 bg-muted/50 border-b border-border -mx-2 -mt-2 rounded-t-3xl">
            <p className="text-xs text-muted-foreground">
              Out of credits this month.{" "}
              <button
                onClick={() => {
                  setSettingsInitialTab("billing");
                  setShowSettingsModal(true);
                }}
                className="text-foreground underline hover:no-underline font-medium"
              >
                {balance?.planName === "PRO"
                  ? "Upgrade your plan for more monthly credits"
                  : "Upgrade to Pro"}
              </button>
            </p>
          </div>
        )}

        {/* Image Previews */}
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
                <button
                  onClick={() => handleRemoveImage(image.id)}
                  className="absolute top-1 right-1 p-1 bg-primary text-primary-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
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
          <Textarea
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
            className="w-full p-2 rounded-t-lg bg-transparent !border-0 !shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none outline-none resize-none text-base sm:text-md min-h-[3.5rem] max-h-[200px] scrollbar-minimal"
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
              <span className="text-muted-foreground text-base sm:text-md leading-relaxed">
                {placeholderText}
              </span>
            </div>
          )}
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

            {/* Add button (for image upload) */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleFileAttachment}
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
            <ModelSelector
              selectedModel={selectedModel}
              onModelChange={setSelectedModel}
              userPlan={userPlan}
            />
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
            </Button>

            <Button
              type="button"
              size="icon"
              onClick={handleSubmit}
              disabled={!input.trim() || isCreating}
              className="rounded-full"
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
            </Button>
          </div>
        </div>
      </div>

      {/* Quick options */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <span className="text-sm text-muted-foreground">or import from</span>
        <Button
          type="button"
          variant="outline"
          onClick={() => handleQuickOption("Import from Figma")}
          className="rounded-full"
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
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => handleQuickOption("Import from GitHub")}
          className="rounded-full"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0C5.374 0 0 5.373 0 12 0 17.302 3.438 21.8 8.207 23.387c.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.30.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.300 24 12c0-6.627-5.373-12-12-12z" />
          </svg>
          GitHub
        </Button>
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
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setPreviewImage(null)}
              className="absolute -top-12 right-0 text-white hover:text-white/80 hover:bg-white/10"
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
            </Button>

            {/* Image */}
            <div className="relative bg-card rounded-2xl overflow-hidden shadow-2xl">
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

      {/* Error Message Display */}
      {errorMessage && !showPricingModal && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={() => setErrorMessage(null)}
        >
          <div
            className="bg-card rounded-2xl shadow-2xl max-w-md w-full p-6 border border-border"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3 mb-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-destructive"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-foreground mb-1">
                  Error
                </h3>
                <p className="text-sm text-muted-foreground">{errorMessage}</p>
              </div>
            </div>
            <Button
              onClick={() => setErrorMessage(null)}
              className="w-full rounded-full"
            >
              Close
            </Button>
          </div>
        </div>
      )}

      {/* Subscription Modal */}
      <SubscriptionModal
        isOpen={showPricingModal}
        onClose={() => {
          setShowPricingModal(false);
          setErrorMessage(null);
        }}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        initialTab={settingsInitialTab}
      />
    </div>
  );
}
