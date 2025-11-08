"use client";

import { AVAILABLE_MODELS } from "@/lib/models/config";

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
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Preferred AI Model
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Choose your default AI model for new projects. Premium models require
          a Pro plan.
        </p>

        {isLoadingModelPrefs ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-4 border-neutral-200 dark:border-neutral-800 border-t-neutral-900 dark:border-t-neutral-100 rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="space-y-3">
            {Object.values(AVAILABLE_MODELS).map((model) => {
              const isAccessible =
                model.minPlanRequired === "HOBBY" ||
                (model.minPlanRequired === "PRO" &&
                  (userPlan === "PRO" || userPlan === "ENTERPRISE")) ||
                (model.minPlanRequired === "ENTERPRISE" &&
                  userPlan === "ENTERPRISE");
              const isSelected = preferredModel === model.id;

              return (
                <button
                  key={model.id}
                  onClick={() => {
                    if (isAccessible && !isSavingModelPrefs) {
                      onSaveModelPreference(model.id);
                    }
                  }}
                  disabled={!isAccessible || isSavingModelPrefs}
                  className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  } ${
                    !isAccessible
                      ? "opacity-50 cursor-not-allowed"
                      : "cursor-pointer"
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
                            Selected
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {model.description}
                        {!isAccessible && " • Upgrade to Pro to access"}
                      </p>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <span className="text-sm font-medium text-muted-foreground">
                        {model.creditMultiplier}× credits
                      </span>
                    </div>
                  </div>
                </button>
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
