/**
 * AI Model Configuration System
 *
 * Single Source of Truth: src/data/ai-models.json
 *
 * This file provides backward-compatible exports for the rest of the codebase.
 * All model data is loaded from the JSON file.
 *
 * CODING MODELS (User-selectable):
 * - Claude Haiku 4.5, Claude Sonnet 4.5 (Default)
 * - GPT-5 Mini, GPT-5.1
 * - Gemini 2.5 Flash, Gemini 3 Pro Preview
 * - Grok Code Fast 1
 *
 * SYSTEM MODELS (Fixed, non-changeable):
 * - Grok 4.1 Fast: Project naming, memory/context
 *
 * IMAGE/VIDEO GENERATION:
 * - Gemini 2.5 Flash Image, Veo 3.1
 */

import {
    AI_MODELS,
    AI_MODELS_BY_ID,
    AI_MODEL_DEFAULTS,
    getModelById,
    getModelsByUseCase,
    getCodingModels as getCodingModelsFromData,
    getCodingModelIds,
    getAllModelIds as getAllModelIdsFromData,
    isValidCodingModel,
    type AIModelData,
    type ModelProvider,
    type ModelTier,
    type ModelUseCase,
    type ModelInputType,
    type ModelOutputType,
    type ModelCapabilities,
    type ModelPricing,
} from "@/data";

// ============================================================================
// RE-EXPORT TYPES
// ============================================================================

export type { ModelProvider, ModelTier, ModelUseCase, ModelInputType, ModelOutputType, ModelCapabilities, ModelPricing };

export interface ModelConfig extends AIModelData {
    // AIModelData already has all the fields we need
}

// ============================================================================
// AVAILABLE MODELS (Backward Compatible)
// ============================================================================

/**
 * All available AI models in the system
 * Loaded from src/data/ai-models.json
 */
export const AVAILABLE_MODELS: Record<string, ModelConfig> = AI_MODELS_BY_ID as Record<string, ModelConfig>;

// ============================================================================
// CORE UTILITY FUNCTIONS
// ============================================================================

/**
 * Get model configuration by ID
 */
export function getModelConfig(modelId: string): ModelConfig | null {
    return (getModelById(modelId) as ModelConfig) || null;
}

/**
 * Get all available model IDs
 */
export function getAllModelIds(): string[] {
    return getAllModelIdsFromData();
}

// ============================================================================
// SYSTEM MODEL FUNCTIONS (Fixed, non-changeable)
// ============================================================================

/**
 * Get the naming model for project name generation
 * FIXED: Users cannot change this model
 */
export function getNamingModel(): string {
    return AI_MODEL_DEFAULTS.orchestrator;
}

/**
 * Get the memory model for context and memory management
 * FIXED: Users cannot change this model
 */
export function getMemoryModel(): string {
    return AI_MODEL_DEFAULTS.memory;
}

/**
 * Get the orchestrator model (legacy, same as naming/memory)
 */
export function getOrchestratorModel(): string {
    return AI_MODEL_DEFAULTS.orchestrator;
}

/**
 * Get the image generation model
 */
export function getImageGenerationModel(): string {
    return AI_MODEL_DEFAULTS["image-generation"];
}

// ============================================================================
// CODING MODEL FUNCTIONS (User-selectable)
// ============================================================================

/**
 * Get all available coding models
 */
export function getAvailableCodingModels(): ModelConfig[] {
    return getCodingModelsFromData() as ModelConfig[];
}

/**
 * Get the default coding model
 */
export function getDefaultCodingModel(): string {
    return AI_MODEL_DEFAULTS.coding;
}

/**
 * Get default enabled coding models (all available by default)
 * Used for schema defaults and new user initialization
 */
export function getDefaultEnabledCodingModels(): string[] {
    return getCodingModelIds();
}

/**
 * Get coding model by user preference
 * Falls back to default if preference is invalid or model is disabled
 */
export function getCodingModel(
    userPreference?: string | null,
    enabledModels?: string[]
): string {
    const defaultModel = getDefaultCodingModel();

    // If no preference, return default
    if (!userPreference) {
        return defaultModel;
    }

    // Check if model exists and is a coding model
    if (!isValidCodingModel(userPreference)) {
        return defaultModel;
    }

    // Check if model is enabled (if enabledModels is provided)
    if (enabledModels && !enabledModels.includes(userPreference)) {
        return defaultModel;
    }

    return userPreference;
}

/**
 * Legacy function for backward compatibility
 * Maps "fast"/"expert" tier to a default model
 */
export function getCodingModelByTier(tier: ModelTier): string {
    const codingModels = getCodingModelsFromData();
    const tierModel = codingModels.find((m) => m.tier === tier);
    return tierModel?.id || getDefaultCodingModel();
}

/**
 * Legacy functions for backward compatibility
 */
export function getFastCodingModel(): string {
    return getCodingModelByTier("fast");
}

export function getExpertCodingModel(): string {
    return getCodingModelByTier("expert");
}

// ============================================================================
// DATABASE-BACKED REGISTRY (Async Functions)
// ============================================================================
// These async functions use the database-backed registry
// They should be preferred over the sync functions above for new code

export {
    modelRegistry,
    getModelConfig as getModelConfigAsync,
    getAllModelIds as getAllModelIdsAsync,
    getAvailableCodingModels as getAvailableCodingModelsAsync,
    getDefaultCodingModel as getDefaultCodingModelAsync,
    getDefaultEnabledCodingModels as getDefaultEnabledCodingModelsAsync,
    getCodingModel as getCodingModelAsync,
    getNamingModel as getNamingModelAsync,
    getMemoryModel as getMemoryModelAsync,
    getOrchestratorModel as getOrchestratorModelAsync,
    getImageGenerationModel as getImageGenerationModelAsync,
    getCodingModelByTier as getCodingModelByTierAsync,
    getFastCodingModel as getFastCodingModelAsync,
    getExpertCodingModel as getExpertCodingModelAsync,
} from "./registry";

export type {
    ModelConfig as AsyncModelConfig,
    ModelCapabilities as AsyncModelCapabilities,
    ModelPricing as AsyncModelPricing,
} from "./registry";
