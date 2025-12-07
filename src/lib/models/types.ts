/**
 * AI Model Types
 * 
 * Centralized type definitions for the AI model system.
 */

// ============================================================================
// CORE TYPES
// ============================================================================

export type ModelProvider = "anthropic" | "openai" | "google" | "x-ai" | "openrouter";
export type ModelTier = "fast" | "expert";
export type ModelUseCase = "coding" | "orchestrator" | "memory" | "image-generation" | "video-generation";
export type ModelInputType = "text" | "image" | "audio" | "video" | "pdf" | "document";
export type ModelOutputType = "text" | "code" | "image" | "audio" | "video" | "structured-data";

// ============================================================================
// MODEL CAPABILITIES
// ============================================================================

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

// ============================================================================
// MODEL PRICING
// ============================================================================

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
}

// ============================================================================
// MODEL CONFIG
// ============================================================================

export interface ModelConfig {
    id: string;                    // OpenRouter format: "provider/model-name"
    name: string;                  // Direct provider API name
    displayName: string;           // Human-readable name
    provider: ModelProvider;
    tier: ModelTier;
    description: string;
    useCase: ModelUseCase;
    capabilities: ModelCapabilities;
    pricing?: ModelPricing;
    isEnabled: boolean;
    isDefault: boolean;
    isSystem: boolean;             // System models cannot be user-selected
    sortOrder: number;
}

// ============================================================================
// USER PREFERENCES
// ============================================================================

/**
 * User's preferred model for each use case
 * Stored in User.modelPreferences as JSON
 */
export interface UserModelPreferences {
    coding?: string;               // Model ID for coding tasks
    imageGeneration?: string;      // Model ID for image generation
    videoGeneration?: string;      // Model ID for video generation
    // System models (read-only for users, but can view)
    orchestrator?: string;         // Model ID for orchestration/naming
    memory?: string;               // Model ID for memory management
}

// ============================================================================
// DATABASE ENUM MAPPINGS
// ============================================================================

import type {
    AIModelProvider as PrismaProvider,
    AIModelTier as PrismaTier,
    AIModelUseCase as PrismaUseCase,
    AIModelInputType as PrismaInputType,
    AIModelOutputType as PrismaOutputType,
} from "@prisma/client";

export const PROVIDER_MAP: Record<PrismaProvider, ModelProvider> = {
    ANTHROPIC: "anthropic",
    OPENAI: "openai",
    GOOGLE: "google",
    XAI: "x-ai",
    OPENROUTER: "openrouter",
};

export const PROVIDER_MAP_REVERSE: Record<ModelProvider, PrismaProvider> = {
    anthropic: "ANTHROPIC",
    openai: "OPENAI",
    google: "GOOGLE",
    "x-ai": "XAI",
    openrouter: "OPENROUTER",
};

export const TIER_MAP: Record<PrismaTier, ModelTier> = {
    FAST: "fast",
    EXPERT: "expert",
};

export const TIER_MAP_REVERSE: Record<ModelTier, PrismaTier> = {
    fast: "FAST",
    expert: "EXPERT",
};

export const USE_CASE_MAP: Record<PrismaUseCase, ModelUseCase> = {
    ORCHESTRATOR: "orchestrator",
    MEMORY: "memory",
    CODING: "coding",
    IMAGE_GENERATION: "image-generation",
    VIDEO_GENERATION: "video-generation",
};

export const USE_CASE_MAP_REVERSE: Record<ModelUseCase, PrismaUseCase> = {
    orchestrator: "ORCHESTRATOR",
    memory: "MEMORY",
    coding: "CODING",
    "image-generation": "IMAGE_GENERATION",
    "video-generation": "VIDEO_GENERATION",
};

export const INPUT_TYPE_MAP: Record<PrismaInputType, ModelInputType> = {
    TEXT: "text",
    IMAGE: "image",
    AUDIO: "audio",
    VIDEO: "video",
    PDF: "pdf",
    DOCUMENT: "document",
};

export const OUTPUT_TYPE_MAP: Record<PrismaOutputType, ModelOutputType> = {
    TEXT: "text",
    CODE: "code",
    IMAGE: "image",
    AUDIO: "audio",
    VIDEO: "video",
    STRUCTURED_DATA: "structured-data",
};

export const OUTPUT_TYPE_MAP_REVERSE: Record<ModelOutputType, PrismaOutputType> = {
    text: "TEXT",
    code: "CODE",
    image: "IMAGE",
    audio: "AUDIO",
    video: "VIDEO",
    "structured-data": "STRUCTURED_DATA",
};
