"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, Lock } from "lucide-react";
import { AVAILABLE_MODELS as MODEL_CONFIG } from "@/lib/models/config";

export interface ModelOption {
  id: string;
  name: string;
  multiplier: string;
  multiplierValue: number; // Numeric value for sorting
  isPremium?: boolean; // PRO+ only
  description?: string;
}

// Convert centralized model config to ModelOption format
const AVAILABLE_MODELS: ModelOption[] = Object.values(MODEL_CONFIG).map(
  (model) => ({
    id: model.id,
    name: model.displayName,
    multiplier: `${model.creditMultiplier}×`,
    multiplierValue: model.creditMultiplier,
    description: model.description,
    isPremium:
      model.minPlanRequired === "PRO" || model.minPlanRequired === "ENTERPRISE",
  })
);

interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (modelId: string) => void;
  userPlan?: "HOBBY" | "PRO" | "ENTERPRISE"; // User's current plan
  className?: string;
}

export function ModelSelector({
  selectedModel,
  onModelChange,
  userPlan = "HOBBY",
  className = "",
}: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [enabledModels, setEnabledModels] = useState<string[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch enabled models - memo to prevent duplicate calls
  useEffect(() => {
    let isMounted = true;

    const fetchEnabledModels = async () => {
      try {
        const res = await fetch("/api/user/model-preferences");
        if (!isMounted) return;

        if (res.ok) {
          const data = await res.json();
          setEnabledModels(data.enabledModels || []);
        } else if (res.status === 401) {
          // Not logged in - show all models so users can see what's available
          setEnabledModels(AVAILABLE_MODELS.map((m) => m.id));
        }
      } catch (error) {
        if (!isMounted) return;
        console.error("Error fetching enabled models:", error);
        // Fallback to showing all models for non-logged-in users
        setEnabledModels(AVAILABLE_MODELS.map((m) => m.id));
      } finally {
        if (isMounted) {
          setIsLoadingModels(false);
        }
      }
    };
    fetchEnabledModels();

    return () => {
      isMounted = false;
    };
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

  // Filter to only enabled models and sort by price (low to high)
  const availableModelsForUser = AVAILABLE_MODELS.filter((model) =>
    enabledModels.includes(model.id)
  ).sort((a, b) => a.multiplierValue - b.multiplierValue);

  const selectedModelData =
    AVAILABLE_MODELS.find((m) => m.id === selectedModel) || AVAILABLE_MODELS[0]; // Default to Claude Haiku 4.5

  // Check if user can access a model
  const canAccessModel = (model: ModelOption) => {
    if (!model.isPremium) return true; // Free tier models
    return userPlan === "PRO" || userPlan === "ENTERPRISE"; // Premium models require PRO+
  };

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
        <div className="absolute bottom-full left-0 mb-2 w-52 bg-card border border-border rounded-xl shadow-lg z-[60] overflow-hidden">
          {isLoadingModels ? (
            <div className="px-4 py-6 text-center">
              <div className="w-5 h-5 border-2 border-neutral-200 dark:border-neutral-700 border-t-neutral-900 dark:border-t-neutral-100 rounded-full animate-spin mx-auto"></div>
            </div>
          ) : availableModelsForUser.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
              No models enabled
            </div>
          ) : (
            <div className="max-h-[400px] overflow-y-auto scrollbar-minimal">
              {availableModelsForUser.map((model) => {
                const hasAccess = canAccessModel(model);
                const isSelected = selectedModel === model.id;

                return (
                  <button
                    key={model.id}
                    onClick={() => {
                      if (hasAccess) {
                        onModelChange(model.id);
                        setIsOpen(false);
                      }
                    }}
                    disabled={!hasAccess}
                    className={`w-full px-4 py-2.5 text-left transition-colors flex items-center justify-between group ${
                      hasAccess
                        ? "hover:bg-surface-hover cursor-pointer"
                        : "opacity-50 cursor-not-allowed"
                    }`}
                    title={
                      !hasAccess
                        ? "Upgrade to Pro to access this model"
                        : model.description
                    }
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span
                        className={`text-sm font-medium ${
                          hasAccess
                            ? "text-foreground"
                            : "text-muted-foreground"
                        }`}
                      >
                        {model.name}
                      </span>
                      {!hasAccess && (
                        <Lock className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                      )}
                      {isSelected && hasAccess && (
                        <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">
                      {model.multiplier}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
