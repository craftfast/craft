"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Check, Info, Sparkles, Brain } from "lucide-react";
import {
  AVAILABLE_MODELS,
  getAvailableCodingModels,
  getDefaultCodingModel,
} from "@/lib/models/config";

interface ModelPreference {
  preferredCodingModel: string;
  enabledCodingModels: string[];
}

export default function ModelPreferencesTab() {
  const [preferredModel, setPreferredModel] = useState<string>(
    getDefaultCodingModel()
  );
  const [enabledModels, setEnabledModels] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const codingModels = getAvailableCodingModels();

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await fetch("/api/user/model-preferences");
      if (!response.ok) throw new Error("Failed to load model preferences");

      const data: ModelPreference = await response.json();
      setPreferredModel(data.preferredCodingModel || getDefaultCodingModel());
      setEnabledModels(new Set(data.enabledCodingModels || []));
    } catch (error) {
      console.error("Error loading model preferences:", error);
      toast.error("Failed to load model preferences");
      // Set defaults
      setEnabledModels(new Set(codingModels.map((model) => model.id)));
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async (showToast = false) => {
    if (isSaving) return;

    setIsSaving(true);
    try {
      const response = await fetch("/api/user/model-preferences", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          preferredCodingModel: preferredModel,
          enabledCodingModels: Array.from(enabledModels),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Failed to save model preferences:", errorData);
        throw new Error(errorData.error || "Failed to save model preferences");
      }

      if (showToast) {
        toast.success("Model preferences saved");
      }
    } catch (error) {
      console.error("Error saving model preferences:", error);
      toast.error("Failed to save model preferences");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleModelEnabled = async (modelId: string) => {
    const newEnabled = new Set(enabledModels);
    if (newEnabled.has(modelId)) {
      // Don't allow disabling if it's the only enabled model
      if (newEnabled.size === 1) {
        toast.error("You must have at least one model enabled");
        return;
      }
      // Don't allow disabling the preferred model
      if (modelId === preferredModel) {
        toast.error(
          "Cannot disable your preferred model. Select another preferred model first."
        );
        return;
      }
      newEnabled.delete(modelId);
    } else {
      newEnabled.add(modelId);
    }
    setEnabledModels(newEnabled);

    // Auto-save
    try {
      const response = await fetch("/api/user/model-preferences", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          preferredCodingModel: preferredModel,
          enabledCodingModels: Array.from(newEnabled),
        }),
      });
      if (!response.ok) throw new Error("Failed to save");
    } catch (error) {
      console.error("Error saving:", error);
      toast.error("Failed to save changes");
    }
  };

  const setAsPreferred = async (modelId: string) => {
    // Auto-enable the model if it's not enabled
    const newEnabled = !enabledModels.has(modelId)
      ? new Set([...enabledModels, modelId])
      : enabledModels;

    if (!enabledModels.has(modelId)) {
      setEnabledModels(newEnabled);
    }
    setPreferredModel(modelId);

    // Auto-save
    try {
      const response = await fetch("/api/user/model-preferences", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          preferredCodingModel: modelId,
          enabledCodingModels: Array.from(newEnabled),
        }),
      });
      if (!response.ok) throw new Error("Failed to save");
    } catch (error) {
      console.error("Error saving:", error);
      toast.error("Failed to save changes");
    }
  };

  // Group models by provider
  const modelsByProvider = codingModels.reduce((acc, model) => {
    const provider = model.displayName.split(" ")[0]; // Get first word (Claude, GPT, Gemini, etc.)
    if (!acc[provider]) {
      acc[provider] = [];
    }
    acc[provider].push(model);
    return acc;
  }, {} as Record<string, typeof codingModels>);

  const providerOrder = ["Claude", "GPT", "Gemini", "Minimax"];
  const sortedProviders = Object.keys(modelsByProvider).sort((a, b) => {
    const indexA = providerOrder.indexOf(a);
    const indexB = providerOrder.indexOf(b);
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });

  if (isLoading) {
    return (
      <div className="space-y-8">
        {/* Header Skeleton */}
        <div>
          <Skeleton className="h-7 w-48 mb-2" />
          <Skeleton className="h-4 w-full max-w-md" />
        </div>

        {/* Models Skeleton */}
        <div className="space-y-6">
          {[1, 2, 3].map((provider) => (
            <div key={provider} className="space-y-3">
              <Skeleton className="h-5 w-32" />
              <div className="space-y-2">
                {[1, 2].map((model) => (
                  <div
                    key={model}
                    className="flex items-center justify-between p-4 rounded-xl border border-input bg-muted/50"
                  >
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-5 w-40" />
                        <Skeleton className="h-5 w-16 rounded-full" />
                      </div>
                      <Skeleton className="h-4 w-full max-w-sm" />
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-3 w-24" />
                        <Skeleton className="h-3 w-3 rounded-full" />
                        <Skeleton className="h-3 w-32" />
                        <Skeleton className="h-3 w-3 rounded-full" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                    </div>
                    <div className="flex items-center gap-3 ml-4">
                      <Skeleton className="h-8 w-28 rounded-full" />
                      <Skeleton className="h-10 w-12 rounded-full" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* System Models Skeleton */}
        <div>
          <Skeleton className="h-6 w-40 mb-4" />
          <div className="space-y-2">
            {[1, 2].map((model) => (
              <div
                key={model}
                className="flex items-center justify-between p-4 rounded-xl border border-input bg-muted/30"
              >
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4 rounded" />
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <Skeleton className="h-4 w-64" />
                </div>
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Coding Models
        </h3>
        <p className="text-sm text-muted-foreground">
          Choose your preferred AI model for code generation and enable/disable
          available models
        </p>
      </div>

      {/* Models by Provider */}
      <div className="space-y-6">
        {sortedProviders.map((provider) => (
          <div key={provider} className="space-y-3">
            <h4 className="text-sm font-medium text-foreground">{provider}</h4>
            <div className="space-y-2">
              {modelsByProvider[provider].map((model) => {
                const isEnabled = enabledModels.has(model.id);
                const isPreferred = preferredModel === model.id;

                return (
                  <div
                    key={model.id}
                    className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                      isPreferred
                        ? "bg-neutral-100 dark:bg-neutral-900 border-neutral-300 dark:border-neutral-700"
                        : "bg-muted/50 border-input hover:border-neutral-300 dark:hover:border-neutral-700"
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h5 className="text-sm font-medium text-foreground">
                          {model.displayName}
                        </h5>
                        {isPreferred && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-neutral-200 dark:bg-neutral-800 text-foreground rounded-full">
                            Default
                          </span>
                        )}
                        {model.id.includes("sonnet") && !isPreferred && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-neutral-100 dark:bg-neutral-900 text-muted-foreground rounded-full">
                            Recommended
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        {model.description}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>
                          Context:{" "}
                          {(
                            model.capabilities.maxContextLength! / 1000
                          ).toFixed(0)}
                          K tokens
                        </span>
                        <span>•</span>
                        <span>
                          ${model.pricing?.inputTokens?.toFixed(2) ?? "x.xx"}/1M
                          input tokens
                        </span>
                        <span>•</span>
                        <span>
                          ${model.pricing?.outputTokens?.toFixed(2) ?? "x.xx"}
                          /1M output tokens
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 ml-4">
                      {isEnabled && !isPreferred && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setAsPreferred(model.id)}
                          className="rounded-full text-xs"
                        >
                          Set as default
                        </Button>
                      )}
                      {isPreferred && (
                        <div className="flex items-center gap-1.5 text-xs font-medium text-foreground px-3 py-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-full">
                          <Check className="w-3.5 h-3.5" />
                          Current
                        </div>
                      )}
                      <Switch
                        checked={isEnabled}
                        onCheckedChange={() => toggleModelEnabled(model.id)}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* System Models (Non-editable) */}
      <div className="space-y-3 pt-6 border-t border-border">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-muted-foreground mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-foreground mb-1">
              System Models
            </h4>
            <p className="text-xs text-muted-foreground mb-3">
              These models are used for specific system functions and cannot be
              changed
            </p>
          </div>
        </div>

        <div className="space-y-2">
          {/* Naming Model */}
          <div className="flex items-center justify-between p-4 rounded-xl border bg-muted/30 border-input">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Brain className="w-4 h-4 text-muted-foreground" />
                <h5 className="text-sm font-medium text-foreground">
                  {AVAILABLE_MODELS["x-ai/grok-4-1-fast"].displayName}
                </h5>
                <span className="text-xs text-muted-foreground">(Naming)</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Automatically generates project names
              </p>
            </div>
            <div className="text-xs text-muted-foreground px-3 py-1.5 bg-muted rounded-full">
              System
            </div>
          </div>

          {/* Memory Model */}
          <div className="flex items-center justify-between p-4 rounded-xl border bg-muted/30 border-input">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Brain className="w-4 h-4 text-muted-foreground" />
                <h5 className="text-sm font-medium text-foreground">
                  {AVAILABLE_MODELS["x-ai/grok-4-1-fast"].displayName}
                </h5>
                <span className="text-xs text-muted-foreground">(Memory)</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Manages context and remembers your preferences
              </p>
            </div>
            <div className="text-xs text-muted-foreground px-3 py-1.5 bg-muted rounded-full">
              System
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
