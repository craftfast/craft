/**
 * Fallback AI Model Configuration
 *
 * Loads from the single source of truth: src/data/ai-models.json
 * Used when the database is unavailable or empty.
 */

import {
    AI_MODELS,
    AI_MODEL_DEFAULTS,
    type AIModelData,
    type ModelUseCase,
} from "@/data";

// Re-export types from registry for backward compatibility
export type { ModelConfig, ModelCapabilities, ModelPricing } from "./registry";

// Type for fallback model (without runtime fields)
type FallbackModelConfig = Omit<AIModelData, "isSystem"> & {
    isSystem?: boolean;
};

/**
 * Fallback models loaded from JSON source of truth
 */
export const FALLBACK_MODELS: Record<string, FallbackModelConfig> = Object.fromEntries(
    AI_MODELS.map((model) => [model.id, model])
);

/**
 * Default model IDs per use case
 */
export const DEFAULT_MODEL_IDS = AI_MODEL_DEFAULTS;

/**
 * Get all fallback model IDs
 */
export function getFallbackModelIds(): string[] {
    return AI_MODELS.map((m) => m.id);
}

/**
 * Get fallback models by use case
 */
export function getFallbackModelsByUseCase(useCase: ModelUseCase): FallbackModelConfig[] {
    return AI_MODELS.filter((m) => m.useCase === useCase);
}

/**
 * Get the default model ID for a use case
 */
export function getDefaultModelId(useCase: ModelUseCase): string {
    return AI_MODEL_DEFAULTS[useCase];
}
