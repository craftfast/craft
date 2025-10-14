"use client";

import { useState } from "react";
import { AI_MODELS } from "@/lib/ai-models";
import type { AIModel } from "@/lib/ai-models";

interface ModelSelectorProps {
  selectedModel: string;
  availableModels: AIModel[];
  onModelChange: (modelKey: string) => void;
}

export default function ModelSelector({
  selectedModel,
  availableModels,
  onModelChange,
}: ModelSelectorProps) {
  const [showModelSelector, setShowModelSelector] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setShowModelSelector(!showModelSelector)}
        className="flex items-center gap-2 px-3 py-2 rounded-full border border-neutral-200 dark:border-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors text-xs"
      >
        <svg
          className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
        <span className="text-neutral-500 dark:text-neutral-400">
          {AI_MODELS[selectedModel]?.name || "Select Model"}
        </span>
        <svg
          className={`w-3 h-3 text-neutral-400 dark:text-neutral-500 transition-transform ${
            showModelSelector ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {showModelSelector && (
        <div className="absolute bottom-full left-0 mb-2 w-64 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-lg overflow-hidden z-50">
          <div className="py-1">
            {Object.entries(AI_MODELS).map(([key, model]) => {
              const isAvailable = availableModels.some(
                (m) => m.id === model.id
              );
              const isSelected =
                selectedModel ===
                Object.keys(AI_MODELS).find(
                  (k) => AI_MODELS[k].id === model.id
                );

              return (
                <button
                  key={model.id}
                  onClick={() => {
                    if (isAvailable) {
                      onModelChange(key);
                      setShowModelSelector(false);
                    }
                  }}
                  disabled={!isAvailable}
                  className={`w-full px-4 py-2.5 text-left flex items-center justify-between transition-colors ${
                    isAvailable
                      ? "hover:bg-neutral-100 dark:hover:bg-neutral-700 cursor-pointer"
                      : "opacity-40 cursor-not-allowed"
                  } ${isSelected ? "bg-neutral-100 dark:bg-neutral-700" : ""}`}
                >
                  <span
                    className={`text-sm ${
                      isAvailable
                        ? "text-neutral-900 dark:text-neutral-100"
                        : "text-neutral-500 dark:text-neutral-500"
                    }`}
                  >
                    {model.name}
                  </span>
                  {isSelected && (
                    <svg
                      className="w-4 h-4 text-neutral-700 dark:text-neutral-300 flex-shrink-0"
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
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
