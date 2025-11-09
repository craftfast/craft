"use client";

import { useState, useEffect } from "react";
import { AVAILABLE_MODELS } from "@/lib/models/config";
import { toast } from "sonner";

interface PersonalizationTabProps {
  preferredModel: string;
  userPlan: "HOBBY" | "PRO" | "ENTERPRISE";
  isLoadingModelPrefs: boolean;
  isSavingModelPrefs: boolean;
  onSaveModelPreference: (modelId: string) => void;
}

export default function PersonalizationTab({
  preferredModel,
  userPlan,
  isLoadingModelPrefs,
  isSavingModelPrefs,
  onSaveModelPreference,
}: PersonalizationTabProps) {
  const [enabledModels, setEnabledModels] = useState<string[]>([]);
  const [isLoadingEnabledModels, setIsLoadingEnabledModels] = useState(true);
  const [isTogglingModel, setIsTogglingModel] = useState<string | null>(null);

  // Fetch enabled models
  useEffect(() => {
    const fetchEnabledModels = async () => {
      try {
        const res = await fetch("/api/user/model-preferences");
        if (res.ok) {
          const data = await res.json();
          setEnabledModels(data.enabledModels || []);
        }
      } catch (error) {
        console.error("Error fetching enabled models:", error);
      } finally {
        setIsLoadingEnabledModels(false);
      }
    };
    fetchEnabledModels();
  }, []);

  // Toggle model enabled/disabled
  const handleToggleModel = async (modelId: string) => {
    const model = AVAILABLE_MODELS[modelId];

    // Cannot disable the preferred model
    if (modelId === preferredModel) {
      toast.error(
        `Cannot disable ${model.displayName}. Please select a different model first.`
      );
      return;
    }

    // Prevent multiple clicks while already toggling
    if (isTogglingModel === modelId) {
      return;
    }

    setIsTogglingModel(modelId);

    // Save previous state before optimistic update
    const previousEnabledModels = [...enabledModels];

    // Determine if we're enabling or disabling based on current state
    const isCurrentlyEnabled = enabledModels.includes(modelId);
    const enabled = !isCurrentlyEnabled;

    // Optimistic update for instant feedback
    const newEnabledModels = enabled
      ? [...enabledModels, modelId]
      : enabledModels.filter((id) => id !== modelId);
    setEnabledModels(newEnabledModels);

    try {
      const res = await fetch("/api/user/model-preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabledModels: newEnabledModels }),
      });

      if (res.ok) {
        const data = await res.json();
        setEnabledModels(data.enabledModels);
        toast.success(
          `${model?.displayName} ${enabled ? "enabled" : "disabled"}`,
          { duration: 2000 }
        );
      } else {
        // Revert on error
        setEnabledModels(previousEnabledModels);
        const error = await res.json();
        toast.error(error.error || "Failed to update model");
      }
    } catch (error) {
      // Revert on error
      setEnabledModels(previousEnabledModels);
      console.error("Error toggling model:", error);
      toast.error("Failed to update model");
    } finally {
      setIsTogglingModel(null);
    }
  };

  // Handle selecting a model as preferred
  const handleSelectModel = (modelId: string) => {
    const isEnabled = enabledModels.includes(modelId);

    // Only allow selecting enabled models
    if (!isEnabled) {
      toast.error("Please enable the model first before selecting it");
      return;
    }

    if (!isSavingModelPrefs && preferredModel !== modelId) {
      onSaveModelPreference(modelId);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">
          AI Model Preferences
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Enable models you want to use and click on an enabled model to make it
          your preferred default. Premium models require a Pro plan.
        </p>

        {isLoadingModelPrefs || isLoadingEnabledModels ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-4 border-neutral-200 dark:border-neutral-800 border-t-neutral-900 dark:border-t-neutral-100 rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="space-y-3">
            {Object.values(AVAILABLE_MODELS)
              .sort((a, b) => a.creditMultiplier - b.creditMultiplier)
              .map((model) => {
                const isAccessible =
                  model.minPlanRequired === "HOBBY" ||
                  (model.minPlanRequired === "PRO" &&
                    (userPlan === "PRO" || userPlan === "ENTERPRISE")) ||
                  (model.minPlanRequired === "ENTERPRISE" &&
                    userPlan === "ENTERPRISE");
                const isSelected = preferredModel === model.id;
                const isEnabled = enabledModels.includes(model.id);
                const isToggling = isTogglingModel === model.id;

                return (
                  <div
                    key={model.id}
                    onClick={() => isAccessible && handleSelectModel(model.id)}
                    className={`w-full p-4 rounded-xl border-2 transition-all cursor-pointer hover:border-primary/50 ${
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border"
                    } ${
                      !isAccessible || !isEnabled
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-foreground">
                            {model.displayName}
                          </span>
                          {!isAccessible && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-700 dark:text-yellow-400 text-xs font-medium">
                              <svg
                                className="w-3 h-3"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              Pro
                            </span>
                          )}
                          {isSelected && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-medium">
                              <svg
                                className="w-3 h-3"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              Preferred
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {model.description}
                          {!isAccessible && " • Upgrade to Pro to access"}
                        </p>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-medium text-muted-foreground">
                            {model.creditMultiplier}× credits
                          </span>
                          {isAccessible && (
                            <div className="flex items-center gap-2">
                              {/* Enable/Disable Toggle - Can toggle all except preferred model */}
                              {!isSelected && (
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleToggleModel(model.id);
                                    }}
                                    disabled={isToggling}
                                    className="relative inline-flex h-5 w-9 items-center rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    style={{
                                      backgroundColor: isEnabled
                                        ? "rgb(34, 197, 94)"
                                        : "rgb(163, 163, 163)",
                                    }}
                                    title={
                                      isEnabled
                                        ? "Disable model"
                                        : "Enable model"
                                    }
                                  >
                                    <span
                                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                        isEnabled
                                          ? "translate-x-5"
                                          : "translate-x-0.5"
                                      }`}
                                    />
                                  </button>
                                  {isToggling && (
                                    <div className="w-4 h-4 border-2 border-neutral-300 dark:border-neutral-600 border-t-neutral-900 dark:border-t-neutral-100 rounded-full animate-spin"></div>
                                  )}
                                  <span className="text-xs text-muted-foreground">
                                    {isEnabled ? "Enabled" : "Disabled"}
                                  </span>
                                </div>
                              )}
                              {/* Show "Click to select" hint for enabled but not preferred models */}
                              {isEnabled && !isSelected && (
                                <span className="text-xs text-muted-foreground italic">
                                  Click to make preferred
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      <div className="border-t border-border pt-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Custom Instructions
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Manage your custom user rules or preferences for the LLM.
        </p>
        <div className="p-4 bg-muted/50 rounded-xl border border-input">
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            <div>
              <p className="text-sm font-medium text-foreground mb-1">
                Premium Feature
              </p>
              <p className="text-sm text-muted-foreground">
                Custom instructions are not available on the Free plan.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
