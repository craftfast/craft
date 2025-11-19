"use client";

import { useState, useRef, useEffect } from "react";
import { Check, ChevronDown, Settings, Sparkles } from "lucide-react";
import { AVAILABLE_MODELS } from "@/lib/models/config";

// Model tier types (legacy support)
export type ModelTier = "fast" | "expert";

interface ModelSelectorProps {
  selectedModel?: string; // New: actual model ID
  selectedTier?: ModelTier; // Legacy: tier support
  onModelChange?: (modelId: string) => void; // New: model change
  onTierChange?: (tier: ModelTier) => void; // Legacy: tier change
  onOpenSettings?: () => void; // Callback to open settings modal
  className?: string;
}

export function ModelSelector({
  selectedModel,
  selectedTier,
  onModelChange,
  onTierChange,
  onOpenSettings,
  className = "",
}: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [enabledModels, setEnabledModels] = useState<string[]>([]);
  const [isLoadingPrefs, setIsLoadingPrefs] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load user's enabled models
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const response = await fetch("/api/user/model-preferences");
        if (response.ok) {
          const data = await response.json();
          setEnabledModels(data.enabledCodingModels || []);
        }
      } catch (error) {
        console.error("Failed to load model preferences:", error);
      } finally {
        setIsLoadingPrefs(false);
      }
    };
    loadPreferences();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isOpen]);

  // Get coding models that are enabled by user
  const codingModels = Object.values(AVAILABLE_MODELS)
    .filter((model) => model.useCase === "coding")
    .filter(
      (model) => enabledModels.length === 0 || enabledModels.includes(model.id)
    );

  // Determine current selected model
  const currentModelId = selectedModel || "anthropic/claude-sonnet-4.5";
  const currentModel = AVAILABLE_MODELS[currentModelId];

  // Get display name (short version)
  const getShortName = (displayName: string) => {
    // "Claude Sonnet 4.5" -> "Sonnet 4.5"
    // "GPT-5 Mini" -> "GPT-5 Mini"
    // "Gemini 2.5 Flash" -> "2.5 Flash"
    const parts = displayName.split(" ");
    if (parts[0] === "Claude") return parts.slice(1).join(" ");
    if (parts[0] === "Gemini") return parts.slice(1).join(" ");
    return displayName;
  };

  const handleModelSelect = (modelId: string) => {
    if (onModelChange) {
      onModelChange(modelId);
    }
    setIsOpen(false);
  };

  if (isLoadingPrefs) {
    return (
      <div className={`${className}`}>
        <div className="flex items-center gap-1.5 px-2 py-1 text-xs text-muted-foreground">
          <Sparkles className="w-3 h-3 animate-pulse" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2 py-1 bg-transparent hover:bg-surface-hover text-foreground rounded-full transition-colors text-xs"
        aria-label="Select AI model"
        title={`Current model: ${currentModel?.displayName || "Default"}`}
      >
        <span className="font-medium">
          {currentModel?.displayName || "Model"}
        </span>
        <ChevronDown
          className={`w-3 h-3 text-muted-foreground transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-64 bg-card border border-border rounded-xl shadow-lg z-[60] overflow-hidden">
          <div className="p-1">
            {codingModels.length === 0 ? (
              <div className="px-3 py-6 text-center">
                <p className="text-sm text-muted-foreground mb-3">
                  No models enabled
                </p>
                <button
                  className="text-xs text-primary hover:underline"
                  onClick={() => {
                    setIsOpen(false);
                    onOpenSettings?.();
                  }}
                >
                  Enable models in preferences
                </button>
              </div>
            ) : (
              <>
                {codingModels.map((model) => {
                  const isSelected = model.id === currentModelId;

                  return (
                    <button
                      key={model.id}
                      onClick={() => handleModelSelect(model.id)}
                      className={`w-full px-3 py-2 text-left transition-colors flex items-center justify-between rounded-lg group hover:bg-surface-hover cursor-pointer ${
                        isSelected ? "bg-surface-hover" : ""
                      }`}
                      title={model.description}
                    >
                      <span className="text-sm font-normal text-foreground">
                        {model.displayName}
                      </span>
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-foreground" />
                      )}
                    </button>
                  );
                })}
                <div className="border-t border-border mt-1 pt-1">
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      onOpenSettings?.();
                    }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-surface-hover rounded-lg transition-colors"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span>Manage models</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
