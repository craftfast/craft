/**
 * AI Model Configuration System
 * User-selectable models with preferences
 * 
 * CODING MODELS (User-selectable):
 * - Claude Haiku 4.5 (Fast, affordable)
 * - Claude Sonnet 4.5 (Default, balanced)
 * - GPT-5 Mini (Fast OpenAI)
 * - GPT-5 (Premium OpenAI)
 * - Gemini 2.5 Flash (Fast Google)
 * - Gemini 3 Pro Preview (Premium Google)
 * - Minimax M2 (Alternative)
 * 
 * SYSTEM MODELS (Fixed, non-changeable):
 * - Grok 4 Fast: Project naming, memory/context
 * 
 * IMAGE GENERATION:
 * - Gemini 2.5 Flash: Fast image generation
 */

export type ModelTier = "fast" | "expert";

/**
 * App-specific use cases for different model capabilities
 */
export type ModelUseCase =
    | "orchestrator"        // Project naming (Grok 4 Fast - fixed)
    | "memory"              // Memory management (Grok 4 Fast - fixed)
    | "coding"              // Code generation, editing, debugging (User-selectable)
    | "image-generation";   // Creating images from text/prompts (Gemini)

/**
 * Input types that models can accept
 */
export type ModelInputType = "text" | "image" | "audio" | "video" | "pdf" | "document";

/**
 * Output types that models can generate
 */
export type ModelOutputType = "text" | "code" | "image" | "audio" | "video" | "structured-data";

export interface ModelCapabilities {
    supportedInputs: ModelInputType[]; // What types of input this model accepts
    supportedOutputs: ModelOutputType[]; // What types of output this model can generate
    maxContextLength?: number; // Maximum context window in tokens
    supportsStreaming: boolean; // Whether model supports streaming responses
    supportsSystemPrompts: boolean; // Whether model supports system prompts
    supportsWebSearch: boolean; // Whether model supports web search/grounding
    supportsFunctionCalling: boolean; // Whether model supports function/tool calling
    supportsJsonMode: boolean; // Whether model has native JSON mode for structured output
}

export interface ModelConfig {
    id: string;
    name: string;
    displayName: string;
    provider: "anthropic" | "openrouter" | "openai" | "google" | "x-ai";
    tier: ModelTier;
    creditMultiplier: number;
    description: string;
    useCase: ModelUseCase; // Primary use case categorization for this model
    capabilities: ModelCapabilities; // What this model can do
    pricing?: {
        input: number; // USD per 1M input tokens
        output: number; // USD per 1M output tokens
    };
}

/**
 * All available AI models in the system
 * 
 * SYSTEM MODELS (Fixed):
 * - Grok 4 Fast: Project naming, memory (non-changeable)
 * 
 * CODING MODELS (User-selectable):
 * - Claude Haiku 4.5, Claude Sonnet 4.5 (Default)
 * - GPT-5 Mini, GPT-5
 * - Gemini 2.5 Flash, Gemini 3 Pro Preview
 * - Minimax M2
 * 
 * IMAGE GENERATION:
 * - Gemini 2.5 Flash
 */
export const AVAILABLE_MODELS: Record<string, ModelConfig> = {
    // ========================================================================
    // SYSTEM MODELS (Fixed, non-changeable)
    // ========================================================================
    "x-ai/grok-4-fast": {
        id: "x-ai/grok-4-fast",
        name: "x-ai/grok-4-fast",
        displayName: "Grok 4 Fast",
        provider: "openrouter",
        tier: "fast",
        creditMultiplier: 0.05,
        description: "System: Project naming and memory (2M context)",
        useCase: "orchestrator",
        capabilities: {
            supportedInputs: ["text"],
            supportedOutputs: ["text", "code", "structured-data"],
            maxContextLength: 2000000,
            supportsStreaming: true,
            supportsSystemPrompts: true,
            supportsWebSearch: true,
            supportsFunctionCalling: true,
            supportsJsonMode: true,
        },
        pricing: { input: 0.20, output: 0.50 },
    },

    // ========================================================================
    // CODING MODELS (User-selectable)
    // ========================================================================

    // Anthropic Claude Models
    "anthropic/claude-haiku-4.5": {
        id: "anthropic/claude-haiku-4.5",
        name: "claude-haiku-4-5",
        displayName: "Claude Haiku 4.5",
        provider: "openrouter",
        tier: "fast",
        creditMultiplier: 0.5,
        description: "Fast and affordable coding assistant",
        useCase: "coding",
        capabilities: {
            supportedInputs: ["text", "image", "pdf", "document"],
            supportedOutputs: ["text", "code", "structured-data"],
            maxContextLength: 200000,
            supportsStreaming: true,
            supportsSystemPrompts: true,
            supportsWebSearch: true,
            supportsFunctionCalling: true,
            supportsJsonMode: true,
        },
        pricing: { input: 1.00, output: 5.00 },
    },
    "anthropic/claude-sonnet-4.5": {
        id: "anthropic/claude-sonnet-4.5",
        name: "claude-sonnet-4-5",
        displayName: "Claude Sonnet 4.5",
        provider: "openrouter",
        tier: "expert",
        creditMultiplier: 1.5,
        description: "Balanced performance and quality",
        useCase: "coding",
        capabilities: {
            supportedInputs: ["text", "image", "pdf", "document"],
            supportedOutputs: ["text", "code", "structured-data"],
            maxContextLength: 200000,
            supportsStreaming: true,
            supportsSystemPrompts: true,
            supportsWebSearch: true,
            supportsFunctionCalling: true,
            supportsJsonMode: true,
        },
        pricing: { input: 3.00, output: 15.00 },
    },

    // OpenAI GPT Models
    "openai/gpt-5-mini": {
        id: "openai/gpt-5-mini",
        name: "gpt-5-mini",
        displayName: "GPT-5 Mini",
        provider: "openrouter",
        tier: "fast",
        creditMultiplier: 0.4,
        description: "Fast OpenAI model for coding",
        useCase: "coding",
        capabilities: {
            supportedInputs: ["text", "image"],
            supportedOutputs: ["text", "code", "structured-data"],
            maxContextLength: 128000,
            supportsStreaming: true,
            supportsSystemPrompts: true,
            supportsWebSearch: false,
            supportsFunctionCalling: true,
            supportsJsonMode: true,
        },
        pricing: { input: 0.25, output: 2.00 },
    },
    "openai/gpt-5": {
        id: "openai/gpt-5",
        name: "gpt-5",
        displayName: "GPT-5",
        provider: "openrouter",
        tier: "expert",
        creditMultiplier: 2.0,
        description: "Premium OpenAI model for complex tasks",
        useCase: "coding",
        capabilities: {
            supportedInputs: ["text", "image"],
            supportedOutputs: ["text", "code", "structured-data"],
            maxContextLength: 128000,
            supportsStreaming: true,
            supportsSystemPrompts: true,
            supportsWebSearch: false,
            supportsFunctionCalling: true,
            supportsJsonMode: true,
        },
        pricing: { input: 1.25, output: 10.00 },
    },

    // Google Gemini Models
    "google/gemini-2.5-flash": {
        id: "google/gemini-2.5-flash",
        name: "gemini-2.5-flash",
        displayName: "Gemini 2.5 Flash",
        provider: "openrouter",
        tier: "fast",
        creditMultiplier: 0.3,
        description: "Fast Google model with large context",
        useCase: "coding",
        capabilities: {
            supportedInputs: ["text", "image", "video", "audio"],
            supportedOutputs: ["text", "code", "structured-data"],
            maxContextLength: 1000000,
            supportsStreaming: true,
            supportsSystemPrompts: true,
            supportsWebSearch: true,
            supportsFunctionCalling: true,
            supportsJsonMode: true,
        },
        pricing: { input: 0.30, output: 2.50 },
    },
    "google/gemini-3-pro-preview": {
        id: "google/gemini-3-pro-preview",
        name: "gemini-3-pro-preview",
        displayName: "Gemini 3 Pro (Preview)",
        provider: "openrouter",
        tier: "expert",
        creditMultiplier: 1.8,
        description: "Latest Google experimental model",
        useCase: "coding",
        capabilities: {
            supportedInputs: ["text", "image", "video", "audio"],
            supportedOutputs: ["text", "code", "structured-data"],
            maxContextLength: 2000000,
            supportsStreaming: true,
            supportsSystemPrompts: true,
            supportsWebSearch: true,
            supportsFunctionCalling: true,
            supportsJsonMode: true,
        },
        pricing: { input: 2.00, output: 12.00 },
    },

    // Minimax Model
    "minimax/minimax-m2": {
        id: "minimax/minimax-m2",
        name: "minimax-m2",
        displayName: "Minimax M2",
        provider: "openrouter",
        tier: "expert",
        creditMultiplier: 1.2,
        description: "Alternative high-performance model",
        useCase: "coding",
        capabilities: {
            supportedInputs: ["text"],
            supportedOutputs: ["text", "code", "structured-data"],
            maxContextLength: 128000,
            supportsStreaming: true,
            supportsSystemPrompts: true,
            supportsWebSearch: false,
            supportsFunctionCalling: true,
            supportsJsonMode: true,
        },
        pricing: { input: 0.255, output: 1.02 },
    },

    // ========================================================================
    // IMAGE GENERATION
    // ========================================================================
    "google/gemini-2.5-flash-image": {
        id: "google/gemini-2.5-flash-image",
        name: "gemini-2.5-flash",
        displayName: "Gemini 2.5 Flash",
        provider: "google",
        tier: "fast",
        creditMultiplier: 0.2,
        description: "Fast image generation with Google Gemini",
        useCase: "image-generation",
        capabilities: {
            supportedInputs: ["text"],
            supportedOutputs: ["image"],
            maxContextLength: 8192,
            supportsStreaming: false,
            supportsSystemPrompts: false,
            supportsWebSearch: false,
            supportsFunctionCalling: false,
            supportsJsonMode: false,
        },
        pricing: { input: 0, output: 2.0 },
    },
};

// ============================================================================
// CORE UTILITY FUNCTIONS
// ============================================================================

/**
 * Get model configuration by ID
 */
export function getModelConfig(modelId: string): ModelConfig | null {
    return AVAILABLE_MODELS[modelId] || null;
}

/**
 * Get all available model IDs
 */
export function getAllModelIds(): string[] {
    return Object.keys(AVAILABLE_MODELS);
}

// Plan-based access restrictions removed - all models available to all users

// ============================================================================
// SYSTEM MODEL FUNCTIONS (Fixed, non-changeable)
// ============================================================================

/**
 * Get the naming model for project name generation
 * FIXED: Users cannot change this model
 */
export function getNamingModel(): string {
    return "x-ai/grok-4-fast";
}

/**
 * Get the memory model for context and memory management
 * FIXED: Users cannot change this model
 */
export function getMemoryModel(): string {
    return "x-ai/grok-4-fast";
}

/**
 * Get the orchestrator model (legacy, same as naming/memory)
 */
export function getOrchestratorModel(): string {
    return "x-ai/grok-4-fast";
}

/**
 * Get the image generation model
 */
export function getImageGenerationModel(): string {
    return "google/gemini-2.5-flash-image";
}

// ============================================================================
// CODING MODEL FUNCTIONS (User-selectable)
// ============================================================================

/**
 * Get all available coding models
 */
export function getAvailableCodingModels(): ModelConfig[] {
    return Object.values(AVAILABLE_MODELS).filter(
        (model) => model.useCase === "coding"
    );
}

/**
 * Get the default coding model (Claude Sonnet 4.5)
 */
export function getDefaultCodingModel(): string {
    return "anthropic/claude-sonnet-4.5";
}

/**
 * Get coding model by user preference
 * Falls back to default if preference is invalid or model is disabled
 */
export function getCodingModel(
    userPreference?: string | null,
    enabledModels?: string[]
): string {
    // If no preference, return default
    if (!userPreference) {
        return getDefaultCodingModel();
    }

    // Check if model exists and is a coding model
    const model = AVAILABLE_MODELS[userPreference];
    if (!model || model.useCase !== "coding") {
        return getDefaultCodingModel();
    }

    // Check if model is enabled (if enabledModels is provided)
    if (enabledModels && !enabledModels.includes(userPreference)) {
        return getDefaultCodingModel();
    }

    return userPreference;
}

/**
 * Legacy function for backward compatibility
 * Maps "fast"/"expert" tier to a default model
 */
export function getCodingModelByTier(tier: ModelTier): string {
    return tier === "fast"
        ? "anthropic/claude-haiku-4.5"
        : "anthropic/claude-sonnet-4.5";
}

/**
 * Legacy functions for backward compatibility
 */
export function getFastCodingModel(): string {
    return "anthropic/claude-haiku-4.5";
}

export function getExpertCodingModel(): string {
    return "anthropic/claude-sonnet-4.5";
}


