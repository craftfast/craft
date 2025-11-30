/**
 * AI Models Data - Single Source of Truth
 *
 * This module provides type-safe access to the AI models configuration.
 * All model data is stored in ai-models.json and loaded here.
 *
 * Usage:
 *   import { AI_MODELS, AI_MODEL_DEFAULTS, getModelById } from "@/data";
 */

import aiModelsData from "./ai-models.json";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type ModelProvider = "anthropic" | "openai" | "google" | "x-ai" | "openrouter";
export type ModelTier = "fast" | "expert";
export type ModelUseCase = "orchestrator" | "memory" | "coding" | "image-generation" | "video-generation";
export type ModelInputType = "text" | "image" | "audio" | "video" | "pdf" | "document";
export type ModelOutputType = "text" | "code" | "image" | "audio" | "video" | "structured-data";

export interface ModelCapabilities {
    supportedInputs: ModelInputType[];
    supportedOutputs: ModelOutputType[];
    maxContextLength?: number;
    supportsStreaming: boolean;
    supportsSystemPrompts: boolean;
    supportsWebSearch: boolean;
    supportsFunctionCalling: boolean;
    supportsJsonMode: boolean;
}

export interface ModelPricing {
    // Standard token pricing (USD per 1M tokens)
    inputTokens: number;
    outputTokens: number;
    // Long context pricing
    longContextThreshold?: number;
    inputTokensLongContext?: number;
    outputTokensLongContext?: number;
    // Prompt caching
    cacheCreation?: number;
    cacheRead?: number;
    cacheCreationLongContext?: number;
    cacheReadLongContext?: number;
    cacheDuration?: string;
    // Multimodal inputs
    imageInputTokens?: number;
    audioInputTokens?: number;
    videoInputTokens?: number;
    // Multimodal outputs
    audioOutputTokens?: number;
    // Generated content
    images?: number;
    videoSeconds?: number;
    // Tool/feature charges
    webSearchFreePerDay?: number;
    webSearch?: number;
    mapsGroundingFreePerDay?: number;
    mapsGrounding?: number;
    pricingNotes?: string;
}

export interface AIModelData {
    id: string;
    name: string;
    displayName: string;
    provider: ModelProvider;
    tier: ModelTier;
    description: string;
    useCase: ModelUseCase;
    isSystem: boolean;
    capabilities: ModelCapabilities;
    pricing: ModelPricing;
}

export interface AIModelsConfig {
    version: string;
    lastUpdated: string;
    defaults: Record<ModelUseCase, string>;
    models: AIModelData[];
}

// ============================================================================
// LOAD AND EXPORT DATA
// ============================================================================

// Cast the JSON data with proper types
const config = aiModelsData as AIModelsConfig;

/**
 * All AI models from the single source of truth
 */
export const AI_MODELS: AIModelData[] = config.models;

/**
 * Model defaults per use case
 */
export const AI_MODEL_DEFAULTS: Record<ModelUseCase, string> = config.defaults as Record<ModelUseCase, string>;

/**
 * Models indexed by ID for quick lookup
 */
export const AI_MODELS_BY_ID: Record<string, AIModelData> = Object.fromEntries(
    config.models.map(m => [m.id, m])
);

/**
 * Config version
 */
export const AI_MODELS_VERSION = config.version;

/**
 * Last updated date
 */
export const AI_MODELS_LAST_UPDATED = config.lastUpdated;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get a model by ID
 */
export function getModelById(id: string): AIModelData | undefined {
    return AI_MODELS_BY_ID[id];
}

/**
 * Get models by use case
 */
export function getModelsByUseCase(useCase: ModelUseCase): AIModelData[] {
    return AI_MODELS.filter(m => m.useCase === useCase);
}

/**
 * Get models by provider
 */
export function getModelsByProvider(provider: ModelProvider): AIModelData[] {
    return AI_MODELS.filter(m => m.provider === provider);
}

/**
 * Get coding models (user-selectable)
 */
export function getCodingModels(): AIModelData[] {
    return AI_MODELS.filter(m => m.useCase === "coding");
}

/**
 * Get system models (non-user-selectable)
 */
export function getSystemModels(): AIModelData[] {
    return AI_MODELS.filter(m => m.isSystem);
}

/**
 * Get the default model ID for a use case
 */
export function getDefaultModelId(useCase: ModelUseCase): string {
    return AI_MODEL_DEFAULTS[useCase];
}

/**
 * Get the default model for a use case
 */
export function getDefaultModel(useCase: ModelUseCase): AIModelData | undefined {
    const defaultId = AI_MODEL_DEFAULTS[useCase];
    return getModelById(defaultId);
}

/**
 * Get all model IDs
 */
export function getAllModelIds(): string[] {
    return AI_MODELS.map(m => m.id);
}

/**
 * Get coding model IDs
 */
export function getCodingModelIds(): string[] {
    return getCodingModels().map(m => m.id);
}

/**
 * Validate if a model ID exists
 */
export function isValidModelId(id: string): boolean {
    return id in AI_MODELS_BY_ID;
}

/**
 * Validate if a model is available for coding
 */
export function isValidCodingModel(id: string): boolean {
    const model = AI_MODELS_BY_ID[id];
    return model?.useCase === "coding";
}
