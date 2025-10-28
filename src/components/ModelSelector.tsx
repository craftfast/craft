"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

export interface ModelOption {
  id: string;
  name: string;
  multiplier: string;
}

// Credit multipliers from MODEL_CREDIT_MULTIPLIERS in ai-usage.ts
// These are the exact models allowed for coding
const AVAILABLE_MODELS: ModelOption[] = [
  {
    id: "gpt-5-mini",
    name: "GPT-5 Mini",
    multiplier: "0.25×", // Cheap tier
  },
  {
    id: "claude-haiku-4.5",
    name: "Claude Haiku 4.5",
    multiplier: "0.5×", // Fast tier
  },
  {
    id: "gpt-5",
    name: "GPT-5",
    multiplier: "1×", // Standard tier (default)
  },
  {
    id: "claude-sonnet-4.5",
    name: "Claude Sonnet 4.5",
    multiplier: "1.5×", // Premium tier
  },
];

interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (modelId: string) => void;
  className?: string;
}

export function ModelSelector({
  selectedModel,
  onModelChange,
  className = "",
}: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  const selectedModelData =
    AVAILABLE_MODELS.find((m) => m.id === selectedModel) || AVAILABLE_MODELS[0];

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2 py-1 bg-transparent hover:bg-surface-hover text-foreground rounded-full transition-colors text-xs"
        aria-label="Select AI model"
        title="Select AI model"
      >
        <span className="font-medium">{selectedModelData.name}</span>
        <ChevronDown
          className={`w-3 h-3 text-muted-foreground transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-64 bg-card border border-border rounded-xl shadow-lg z-[60] overflow-hidden">
          <div className="max-h-[400px] overflow-y-auto scrollbar-minimal">
            {AVAILABLE_MODELS.map((model) => (
              <button
                key={model.id}
                onClick={() => {
                  onModelChange(model.id);
                  setIsOpen(false);
                }}
                className="w-full px-4 py-2.5 text-left hover:bg-surface-hover transition-colors flex items-center justify-between group"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-sm font-medium text-foreground">
                    {model.name}
                  </span>
                  {selectedModel === model.id && (
                    <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                  )}
                </div>
                <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">
                  {model.multiplier}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
