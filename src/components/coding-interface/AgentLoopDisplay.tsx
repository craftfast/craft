"use client";

import { useState } from "react";
import {
  Brain,
  Zap,
  Eye,
  Lightbulb,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

// ============================================================================
// TYPES
// ============================================================================

export type AgentPhase = "think" | "act" | "observe" | "reflect";

export interface AgentReasoningStep {
  phase: AgentPhase;
  content: string;
  timestamp: number;
}

export interface AgentObservation {
  type: "tool-result" | "user-feedback" | "error" | "success";
  content: string;
  relatedToolId?: string;
  timestamp: number;
}

export interface AgentReflection {
  insight: string;
  learnings: string[];
  suggestedActions?: string[];
  confidence: number;
  timestamp: number;
}

// ============================================================================
// AGENT LOOP VISUALIZATION
// ============================================================================

interface AgentLoopDisplayProps {
  reasoningSteps: AgentReasoningStep[];
  observations: AgentObservation[];
  reflections: AgentReflection[];
  currentPhase: AgentPhase;
}

/**
 * Display the agent's thinking process in real-time
 * Shows Think→Act→Observe→Reflect cycle
 */
export default function AgentLoopDisplay({
  reasoningSteps,
  observations,
  reflections,
  currentPhase,
}: AgentLoopDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const getPhaseIcon = (phase: AgentPhase) => {
    const iconProps = "h-4 w-4";
    switch (phase) {
      case "think":
        return <Brain className={`${iconProps} text-purple-500`} />;
      case "act":
        return <Zap className={`${iconProps} text-blue-500`} />;
      case "observe":
        return <Eye className={`${iconProps} text-green-500`} />;
      case "reflect":
        return <Lightbulb className={`${iconProps} text-yellow-500`} />;
    }
  };

  const getPhaseLabel = (phase: AgentPhase) => {
    switch (phase) {
      case "think":
        return "Think";
      case "act":
        return "Act";
      case "observe":
        return "Observe";
      case "reflect":
        return "Reflect";
    }
  };

  const getPhaseColor = (phase: AgentPhase) => {
    switch (phase) {
      case "think":
        return "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800";
      case "act":
        return "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800";
      case "observe":
        return "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800";
      case "reflect":
        return "text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800";
    }
  };

  if (
    reasoningSteps.length === 0 &&
    observations.length === 0 &&
    reflections.length === 0
  ) {
    return null;
  }

  return (
    <div className="mb-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-950 overflow-hidden shadow-sm">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-neutral-100/50 dark:hover:bg-neutral-800/50 transition-colors"
      >
        {isExpanded ? (
          <ChevronDown className="h-4 w-4 text-neutral-500 flex-shrink-0" />
        ) : (
          <ChevronRight className="h-4 w-4 text-neutral-500 flex-shrink-0" />
        )}

        <div className="flex items-center gap-2">
          {getPhaseIcon(currentPhase)}
          <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
            Agent Reasoning
          </span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-neutral-500">
            {getPhaseLabel(currentPhase)} Phase
          </span>
        </div>
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-neutral-200 dark:border-neutral-800">
          {/* Reasoning Steps */}
          {reasoningSteps.length > 0 && (
            <div className="mt-4 space-y-2">
              {reasoningSteps.map((step, index) => (
                <div
                  key={index}
                  className={`rounded-lg border px-3 py-2 ${getPhaseColor(
                    step.phase
                  )}`}
                >
                  <div className="flex items-start gap-2">
                    {getPhaseIcon(step.phase)}
                    <div className="flex-1">
                      <div className="text-xs font-medium mb-1">
                        {getPhaseLabel(step.phase)}
                      </div>
                      <div className="text-sm">{step.content}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Observations */}
          {observations.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                Observations
              </div>
              {observations.map((obs, index) => (
                <div
                  key={index}
                  className={`rounded-lg border px-3 py-2 ${
                    obs.type === "error"
                      ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300"
                      : obs.type === "success"
                      ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300"
                      : "bg-neutral-50 dark:bg-neutral-900/50 border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <Eye className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <div className="text-sm flex-1">{obs.content}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Reflections */}
          {reflections.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                Reflections
              </div>
              {reflections.map((reflection, index) => (
                <div
                  key={index}
                  className="rounded-lg border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20 px-3 py-2"
                >
                  <div className="flex items-start gap-2 mb-2">
                    <Lightbulb className="h-4 w-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm font-medium text-yellow-700 dark:text-yellow-300">
                      {reflection.insight}
                    </div>
                  </div>

                  {reflection.learnings.length > 0 && (
                    <div className="ml-6 space-y-1">
                      {reflection.learnings.map((learning, idx) => (
                        <div
                          key={idx}
                          className="text-xs text-yellow-600 dark:text-yellow-400"
                        >
                          • {learning}
                        </div>
                      ))}
                    </div>
                  )}

                  {reflection.suggestedActions &&
                    reflection.suggestedActions.length > 0 && (
                      <div className="ml-6 mt-2 space-y-1">
                        <div className="text-xs font-medium text-yellow-700 dark:text-yellow-300">
                          Suggested Actions:
                        </div>
                        {reflection.suggestedActions.map((action, idx) => (
                          <div
                            key={idx}
                            className="text-xs text-yellow-600 dark:text-yellow-400"
                          >
                            → {action}
                          </div>
                        ))}
                      </div>
                    )}

                  <div className="mt-2 ml-6">
                    <div className="text-xs text-yellow-600 dark:text-yellow-400">
                      Confidence: {(reflection.confidence * 100).toFixed(0)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
