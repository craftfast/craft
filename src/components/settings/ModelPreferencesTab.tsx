"use client";

import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Check,
  Info,
  Sparkles,
  Brain,
  Image,
  Video,
  Code,
  Lock,
  Zap,
  Crown,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ModelConfig, ModelUseCase } from "@/lib/models/types-client";

// Icon mapping for use cases
const USE_CASE_ICONS: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  coding: Code,
  "image-generation": Image,
  "video-generation": Video,
  orchestrator: Brain,
  memory: Brain,
};

// Description mapping for use cases
const USE_CASE_DESCRIPTIONS: Record<string, string> = {
  coding:
    "This model will be used for all code generation, debugging, and software development tasks.",
  "image-generation":
    "This model will be used when generating images from text descriptions.",
  "video-generation":
    "This model will be used when generating videos from text descriptions.",
};

interface UseCasePreference {
  useCase: ModelUseCase;
  displayName: string;
  preferredModelId: string;
  preferredModel: ModelConfig | null;
  availableModels: ModelConfig[];
  isUserSelectable: boolean;
}

export default function ModelPreferencesTab() {
  const [preferences, setPreferences] = useState<UseCasePreference[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [savingUseCase, setSavingUseCase] = useState<string | null>(null);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async (showRefreshToast = false) => {
    try {
      if (showRefreshToast) setIsRefreshing(true);
      const response = await fetch("/api/user/model-preferences");
      if (!response.ok) throw new Error("Failed to load model preferences");

      const data = await response.json();
      setPreferences(data.preferences || []);
      if (showRefreshToast) toast.success("Model preferences refreshed");
    } catch (error) {
      console.error("Error loading model preferences:", error);
      toast.error("Failed to load model preferences");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const selectModel = async (useCase: ModelUseCase, modelId: string) => {
    setSavingUseCase(useCase);
    try {
      const response = await fetch("/api/user/model-preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ useCase, modelId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save");
      }

      const data = await response.json();
      setPreferences(data.preferences || []);
      toast.success("Model preference updated");
    } catch (error) {
      console.error("Error saving model preference:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to save model preference"
      );
    } finally {
      setSavingUseCase(null);
    }
  };

  // Group preferences by user-selectable and system
  const userSelectablePrefs = preferences.filter((p) => p.isUserSelectable);
  const systemPrefs = preferences.filter((p) => !p.isUserSelectable);

  if (isLoading) {
    return (
      <div className="space-y-8">
        {/* Header Skeleton */}
        <div>
          <Skeleton className="h-7 w-48 mb-2" />
          <Skeleton className="h-4 w-full max-w-md" />
        </div>

        {/* Use Cases Skeleton */}
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-3">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-5" />
                <Skeleton className="h-5 w-32" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {[1, 2].map((j) => (
                  <div
                    key={j}
                    className="p-4 rounded-xl border border-input bg-muted/50"
                  >
                    <Skeleton className="h-5 w-40 mb-2" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            AI Model Preferences
          </h3>
          <p className="text-sm text-muted-foreground max-w-xl">
            Choose your preferred AI model for each task. Your selection will be
            used throughout the app — no need to select a model in every chat.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => loadSettings(true)}
          disabled={isRefreshing}
          className="rounded-full"
        >
          <RefreshCw
            className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {/* User-Selectable Models */}
      <div className="space-y-10">
        {userSelectablePrefs.map((pref) => {
          const Icon = USE_CASE_ICONS[pref.useCase] || Sparkles;
          const isSaving = savingUseCase === pref.useCase;
          const useCaseDescription = USE_CASE_DESCRIPTIONS[pref.useCase] || "";
          const availableModels = pref.availableModels.filter(
            (m) => !m.isSystem
          );

          // Show message if no models available for this use case
          if (availableModels.length === 0) {
            return (
              <div key={pref.useCase} className="space-y-4">
                <div className="flex items-center gap-2">
                  <Icon className="w-5 h-5 text-foreground" />
                  <h4 className="text-base font-medium text-foreground">
                    {pref.displayName}
                  </h4>
                </div>
                <div className="p-4 rounded-xl border border-dashed border-input bg-muted/30 text-center">
                  <p className="text-sm text-muted-foreground">
                    No models available for this use case yet.
                  </p>
                </div>
              </div>
            );
          }

          return (
            <div key={pref.useCase} className="space-y-4">
              {/* Use Case Header */}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Icon className="w-5 h-5 text-foreground" />
                  <h4 className="text-base font-medium text-foreground">
                    {pref.displayName}
                  </h4>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    {availableModels.length}{" "}
                    {availableModels.length === 1 ? "model" : "models"}
                  </span>
                </div>
                {useCaseDescription && (
                  <p className="text-xs text-muted-foreground pl-7">
                    {useCaseDescription}
                  </p>
                )}
              </div>

              {/* Model Options */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {availableModels.map((model) => {
                  const isSelected = model.id === pref.preferredModelId;
                  const TierIcon = model.tier === "expert" ? Crown : Zap;

                  return (
                    <button
                      key={model.id}
                      onClick={() =>
                        !isSelected && selectModel(pref.useCase, model.id)
                      }
                      disabled={isSaving || isSelected}
                      className={`relative flex flex-col items-start p-4 rounded-xl border transition-all text-left ${
                        isSelected
                          ? "bg-neutral-100 dark:bg-neutral-900 border-neutral-300 dark:border-neutral-700 ring-2 ring-neutral-400 dark:ring-neutral-600"
                          : "bg-card border-input hover:border-neutral-300 dark:hover:border-neutral-700 hover:bg-muted/50 cursor-pointer"
                      } ${isSaving ? "opacity-50 cursor-wait" : ""}`}
                    >
                      {/* Selection indicator */}
                      {isSelected && (
                        <div className="absolute top-3 right-3">
                          <div className="flex items-center justify-center w-5 h-5 rounded-full bg-neutral-800 dark:bg-neutral-200">
                            <Check className="w-3 h-3 text-white dark:text-neutral-900" />
                          </div>
                        </div>
                      )}

                      {/* Model Name & Tier */}
                      <div className="flex items-center gap-2 mb-1.5 pr-6">
                        <h5 className="text-sm font-medium text-foreground">
                          {model.displayName}
                        </h5>
                        <span
                          className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium rounded ${
                            model.tier === "expert"
                              ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
                              : "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                          }`}
                        >
                          <TierIcon className="w-2.5 h-2.5" />
                          {model.tier === "expert" ? "Expert" : "Fast"}
                        </span>
                      </div>

                      {/* Provider */}
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">
                        {model.provider}
                      </p>

                      {/* Description */}
                      <p className="text-xs text-muted-foreground mb-3 line-clamp-2 min-h-8">
                        {model.description}
                      </p>

                      {/* Pricing & Capabilities Info */}
                      <div className="flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
                        {model.pricing?.inputTokens && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-muted">
                            ${model.pricing.inputTokens.toFixed(2)}/1M in
                          </span>
                        )}
                        {model.pricing?.outputTokens && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-muted">
                            ${model.pricing.outputTokens.toFixed(2)}/1M out
                          </span>
                        )}
                        {model.capabilities?.maxContextLength && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-muted">
                            {(
                              model.capabilities.maxContextLength / 1000
                            ).toFixed(0)}
                            K context
                          </span>
                        )}
                        {model.pricing?.images && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-muted">
                            ${model.pricing.images.toFixed(2)}/1K images
                          </span>
                        )}
                        {model.pricing?.videoSeconds && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-muted">
                            ${model.pricing.videoSeconds.toFixed(2)}/sec video
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* System Models (Non-editable) */}
      {systemPrefs.length > 0 && (
        <div className="space-y-4 pt-8 border-t border-border">
          <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/30">
            <Info className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-foreground mb-1">
                System Models
              </h4>
              <p className="text-xs text-muted-foreground mb-4">
                These models are automatically selected by the system for
                internal operations. They are optimized for their specific tasks
                and cannot be changed.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {systemPrefs.map((pref) => {
                  const Icon = USE_CASE_ICONS[pref.useCase] || Brain;

                  return (
                    <div
                      key={pref.useCase}
                      className="flex items-center justify-between p-3 rounded-lg bg-background border border-input"
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {pref.displayName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {pref.preferredModel?.displayName || "Default"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground px-2 py-1 bg-muted rounded-full">
                        <Lock className="w-3 h-3" />
                        Auto
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
