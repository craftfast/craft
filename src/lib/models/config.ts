/**
 * AI Model Configuration System
 * Tier-based model selection with app-specific use cases
 * 
 * MODEL TIERS:
 * - Fast: Quick responses, lower cost (HOBBY+)
 * - Expert: Deep reasoning, premium quality (PRO+)
 * 
 * USE CASES:
 * - naming: Project/component naming generation
 * - coding: Code generation, editing, debugging
 * - memory: Context/memory generation and summarization (large context window, low cost)
 * - image-generation: Creating images from text/prompts
 * - audio-transcription: Converting audio to text (speech-to-text)
 * - audio-generation: Text-to-speech
 * - video-generation: Creating videos from text/images
 */

export type ModelTier = "fast" | "expert";
export type PlanName = "HOBBY" | "PRO" | "ENTERPRISE";

/**
 * App-specific use cases for different model capabilities
 * Each model is categorized by its primary purpose in the Craft application
 */
export type ModelUseCase =
    | "naming"              // Project/component naming generation
    | "coding"              // Code generation, editing, debugging
    | "memory"              // Context/memory generation and summarization
    | "image-generation"    // Creating images from text/prompts
    | "audio-transcription" // Converting audio to text (speech-to-text)
    | "audio-generation"    // Text-to-speech
    | "video-generation";   // Creating videos from text/images

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
    planSupport: PlanName[]; // Plans that can access this model (e.g., ["HOBBY", "PRO", "ENTERPRISE"])
    useCase: ModelUseCase; // Primary use case categorization for this model
    capabilities: ModelCapabilities; // What this model can do
    pricing?: {
        input: number; // USD per 1M input tokens
        output: number; // USD per 1M output tokens
    };
}

/**
 * All available AI models in the system
 * Categorized by app-specific use cases
 * 
 * NAMING MODELS (Project/Component Naming):
 * Fast Tier (HOBBY+): GPT-OSS-20B - Optimized for quick naming generation
 * 
 * MEMORY MODELS (Context/Memory Generation):
 * Fast Tier (HOBBY+): Grok 4 Fast - Large 128K context, cheapest model (0.05x cost)
 * 
 * CODING MODELS (Code Generation, Editing, Debugging):
 * Fast Tier (HOBBY+): GPT-5 Mini, MiniMax M2, Gemini 2.5 Flash, Claude Haiku 4.5
 * Expert Tier (PRO+): Kimi K2 Thinking, GPT-5, GPT-5 Codex, Gemini 2.5 Pro, Claude Sonnet 4.5, Claude 3 Opus
 * 
 * IMAGE GENERATION:
 * Fast Tier (HOBBY+): Stable Diffusion 3
 * Expert Tier (PRO+): DALL-E 3, FLUX Pro
 * 
 * AUDIO MODELS:
 * - Whisper Large v3: Speech-to-text transcription (HOBBY+)
 * - ElevenLabs Turbo v2: Text-to-speech generation (HOBBY+)
 * 
 * VIDEO GENERATION (PRO+):
 * - Runway Gen-3 Alpha: Professional video generation
 * - Luma Dream Machine: High-quality video from text/images
 */
export const AVAILABLE_MODELS: Record<string, ModelConfig> = {
    "openai/gpt-oss-20b": {
        id: "openai/gpt-oss-20b",
        name: "openai/gpt-oss-20b",
        displayName: "GPT-OSS-20B",
        provider: "openrouter",
        tier: "fast",
        creditMultiplier: 0.014,
        description: "Open-weight 21B MoE model with function calling",
        planSupport: ["HOBBY", "PRO", "ENTERPRISE"],
        useCase: "naming",
        capabilities: {
            supportedInputs: ["text"],
            supportedOutputs: ["text", "code", "structured-data"],
            maxContextLength: 131072,
            supportsStreaming: true,
            supportsSystemPrompts: true,
            supportsWebSearch: false,
            supportsFunctionCalling: true,
            supportsJsonMode: true,
        },
        pricing: { input: 0.03, output: 0.14 },
    },
    "x-ai/grok-4-fast": {
        id: "x-ai/grok-4-fast",
        name: "grok-4-fast-non-reasoning", // X.AI API model name (no prefix)
        displayName: "Grok 4 Fast",
        provider: "x-ai",
        tier: "fast",
        creditMultiplier: 0.05,
        description: "Context memory generation with 2M token context window",
        planSupport: ["HOBBY", "PRO", "ENTERPRISE"],
        useCase: "memory",
        capabilities: {
            supportedInputs: ["text"],
            supportedOutputs: ["text", "code"],
            maxContextLength: 2000000,
            supportsStreaming: true,
            supportsSystemPrompts: true,
            supportsWebSearch: true,
            supportsFunctionCalling: false,
            supportsJsonMode: false,
        },
        pricing: { input: 0.2, output: 0.5 },
    },
    "minimax/minimax-m2": {
        id: "minimax/minimax-m2",
        name: "minimax/minimax-m2",
        displayName: "MiniMax M2",
        provider: "openrouter",
        tier: "fast",
        creditMultiplier: 0.1,
        description: "Optimized for end-to-end coding and agentic workflows with tool use support",
        planSupport: ["HOBBY", "PRO", "ENTERPRISE"],
        useCase: "coding",
        capabilities: {
            supportedInputs: ["text"],
            supportedOutputs: ["text", "code", "structured-data"],
            maxContextLength: 204800,
            supportsStreaming: true,
            supportsSystemPrompts: true,
            supportsWebSearch: false,
            supportsFunctionCalling: true, // ✅ MiniMax M2 DOES support tool calling
            supportsJsonMode: false,
        },
        pricing: { input: 0.255, output: 1.02 }, // Updated pricing from OpenRouter
    },
    "openai/gpt-5-mini": {
        id: "openai/gpt-5-mini",
        name: "gpt-5-mini", // OpenAI API model name (no prefix)
        displayName: "GPT-5 Mini",
        provider: "openai",
        tier: "fast",
        creditMultiplier: 0.15,
        description: "Compact, efficient model for coding tasks",
        planSupport: ["HOBBY", "PRO", "ENTERPRISE"],
        useCase: "coding",
        capabilities: {
            supportedInputs: ["text"],
            supportedOutputs: ["text", "code", "structured-data"],
            maxContextLength: 128000,
            supportsStreaming: true,
            supportsSystemPrompts: true,
            supportsWebSearch: true,
            supportsFunctionCalling: false,
            supportsJsonMode: false,
        },
        pricing: { input: 0.3, output: 1.5 },
    },
    "google/gemini-2.5-flash-001": {
        id: "google/gemini-2.5-flash-001",
        name: "gemini-2.5-flash", // Google API model name (no prefix)
        displayName: "Gemini 2.5 Flash",
        provider: "google",
        tier: "fast",
        creditMultiplier: 0.2,
        description: "Fast Google model with multimodal capabilities",
        planSupport: ["HOBBY", "PRO", "ENTERPRISE"],
        useCase: "coding",
        capabilities: {
            supportedInputs: ["text", "image", "audio", "video", "pdf", "document"],
            supportedOutputs: ["text", "code", "structured-data"],
            maxContextLength: 1000000,
            supportsStreaming: true,
            supportsSystemPrompts: true,
            supportsWebSearch: true,
            supportsFunctionCalling: false,
            supportsJsonMode: false,
        },
        pricing: { input: 0.5, output: 1.5 },
    },
    "moonshotai/kimi-k2-thinking": {
        id: "moonshotai/kimi-k2-thinking",
        name: "moonshotai/kimi-k2-thinking",
        displayName: "Kimi K2 Thinking",
        provider: "openrouter",
        tier: "expert",
        creditMultiplier: 0.25,
        description: "Expert model with deep reasoning",
        planSupport: ["PRO", "ENTERPRISE"],
        useCase: "coding",
        capabilities: {
            supportedInputs: ["text"],
            supportedOutputs: ["text", "code", "structured-data"],
            maxContextLength: 128000,
            supportsStreaming: true,
            supportsSystemPrompts: true,
            supportsWebSearch: false,
            supportsFunctionCalling: false,
            supportsJsonMode: false,
        },
        pricing: { input: 1.0, output: 2.5 },
    },
    "anthropic/claude-sonnet-4.5": {
        id: "anthropic/claude-sonnet-4.5",
        name: "claude-sonnet-4-5", // Anthropic API model name (no prefix)
        displayName: "Claude 4.5 Sonnet",
        provider: "anthropic",
        tier: "expert",
        creditMultiplier: 1.5,
        description: "Most capable model with best quality",
        planSupport: ["PRO", "ENTERPRISE"],
        useCase: "coding",
        capabilities: {
            supportedInputs: ["text", "image", "pdf", "document"],
            supportedOutputs: ["text", "code", "structured-data"],
            maxContextLength: 200000,
            supportsStreaming: true,
            supportsSystemPrompts: true,
            supportsWebSearch: false,
            supportsFunctionCalling: false,
            supportsJsonMode: false,
        },
        pricing: { input: 3.0, output: 15.0 },
    },
    "google/gemini-2.5-pro-001": {
        id: "google/gemini-2.5-pro-001",
        name: "gemini-2.5-pro", // Google API model name (no prefix)
        displayName: "Gemini 2.5 Pro",
        provider: "google",
        tier: "expert",
        creditMultiplier: 1.0,
        description: "Google's advanced model with multimodal capabilities",
        planSupport: ["PRO", "ENTERPRISE"],
        useCase: "coding",
        capabilities: {
            supportedInputs: ["text", "image", "audio", "video", "pdf", "document"],
            supportedOutputs: ["text", "code", "structured-data"],
            maxContextLength: 2000000,
            supportsStreaming: true,
            supportsSystemPrompts: true,
            supportsWebSearch: true,
            supportsFunctionCalling: false,
            supportsJsonMode: false,
        },
        pricing: { input: 2.5, output: 10.0 },
    },
    "openai/dall-e-3": {
        id: "openai/dall-e-3",
        name: "dall-e-3", // Actual OpenAI API model name
        displayName: "DALL-E 3",
        provider: "openai",
        tier: "expert",
        creditMultiplier: 4.0,
        description: "Advanced AI image generation",
        planSupport: ["PRO", "ENTERPRISE"],
        useCase: "image-generation",
        capabilities: {
            supportedInputs: ["text"],
            supportedOutputs: ["image"],
            maxContextLength: 4000,
            supportsStreaming: false,
            supportsSystemPrompts: false,
            supportsWebSearch: false,
            supportsFunctionCalling: false,
            supportsJsonMode: false,
        },
        pricing: { input: 0, output: 40.0 },
    },
    "stability/stable-diffusion-3": {
        id: "stability/stable-diffusion-3",
        name: "stability/stable-diffusion-3",
        displayName: "Stable Diffusion 3",
        provider: "openrouter",
        tier: "fast",
        creditMultiplier: 0.35,
        description: "Fast and flexible image generation",
        planSupport: ["HOBBY", "PRO", "ENTERPRISE"],
        useCase: "image-generation",
        capabilities: {
            supportedInputs: ["text", "image"],
            supportedOutputs: ["image"],
            maxContextLength: 4000,
            supportsStreaming: false,
            supportsSystemPrompts: false,
            supportsWebSearch: false,
            supportsFunctionCalling: false,
            supportsJsonMode: false,
        },
        pricing: { input: 0, output: 3.5 },
    },
    "black-forest-labs/flux-pro": {
        id: "black-forest-labs/flux-pro",
        name: "black-forest-labs/flux-pro",
        displayName: "FLUX Pro",
        provider: "openrouter",
        tier: "expert",
        creditMultiplier: 0.5,
        description: "High-quality photorealistic image generation",
        planSupport: ["PRO", "ENTERPRISE"],
        useCase: "image-generation",
        capabilities: {
            supportedInputs: ["text", "image"],
            supportedOutputs: ["image"],
            maxContextLength: 4000,
            supportsStreaming: false,
            supportsSystemPrompts: false,
            supportsWebSearch: false,
            supportsFunctionCalling: false,
            supportsJsonMode: false,
        },
        pricing: { input: 0, output: 5.0 },
    },
    "openai/whisper-large-v3": {
        id: "openai/whisper-large-v3",
        name: "whisper-1", // Actual OpenAI API model name
        displayName: "Whisper Large v3",
        provider: "openai",
        tier: "fast",
        creditMultiplier: 0.06,
        description: "Speech-to-text transcription and translation",
        planSupport: ["HOBBY", "PRO", "ENTERPRISE"],
        useCase: "audio-transcription",
        capabilities: {
            supportedInputs: ["audio"],
            supportedOutputs: ["text"],
            maxContextLength: 0,
            supportsStreaming: false,
            supportsSystemPrompts: false,
            supportsWebSearch: false,
            supportsFunctionCalling: false,
            supportsJsonMode: false,
        },
        pricing: { input: 0.6, output: 0 },
    },
    "elevenlabs/eleven-turbo-v2": {
        id: "elevenlabs/eleven-turbo-v2",
        name: "elevenlabs/eleven-turbo-v2",
        displayName: "ElevenLabs Turbo v2",
        provider: "openrouter",
        tier: "fast",
        creditMultiplier: 0.3,
        description: "High-quality text-to-speech generation",
        planSupport: ["HOBBY", "PRO", "ENTERPRISE"],
        useCase: "audio-generation",
        capabilities: {
            supportedInputs: ["text"],
            supportedOutputs: ["audio"],
            maxContextLength: 5000,
            supportsStreaming: true,
            supportsSystemPrompts: false,
            supportsWebSearch: false,
            supportsFunctionCalling: false,
            supportsJsonMode: false,
        },
        pricing: { input: 0, output: 3.0 },
    },
    "runway/gen-3-alpha": {
        id: "runway/gen-3-alpha",
        name: "runway/gen-3-alpha",
        displayName: "Runway Gen-3 Alpha",
        provider: "openrouter",
        tier: "expert",
        creditMultiplier: 5.0,
        description: "Text-to-video and image-to-video generation",
        planSupport: ["PRO", "ENTERPRISE"],
        useCase: "video-generation",
        capabilities: {
            supportedInputs: ["text", "image"],
            supportedOutputs: ["video"],
            maxContextLength: 2000,
            supportsStreaming: false,
            supportsSystemPrompts: false,
            supportsWebSearch: false,
            supportsFunctionCalling: false,
            supportsJsonMode: false,
        },
        pricing: { input: 0, output: 50.0 },
    },
    "luma/dream-machine": {
        id: "luma/dream-machine",
        name: "luma/dream-machine",
        displayName: "Luma Dream Machine",
        provider: "openrouter",
        tier: "expert",
        creditMultiplier: 3.0,
        description: "High-quality video generation from text and images",
        planSupport: ["PRO", "ENTERPRISE"],
        useCase: "video-generation",
        capabilities: {
            supportedInputs: ["text", "image"],
            supportedOutputs: ["video"],
            maxContextLength: 2000,
            supportsStreaming: false,
            supportsSystemPrompts: false,
            supportsWebSearch: false,
            supportsFunctionCalling: false,
            supportsJsonMode: false,
        },
        pricing: { input: 0, output: 30.0 },
    },
};

/**
 * Get all model IDs
 */
export function getAllModelIds(): string[] {
    return Object.keys(AVAILABLE_MODELS);
}

/**
 * Get all models available for a specific plan
 */
export function getModelsForPlan(planName: PlanName): ModelConfig[] {
    return Object.values(AVAILABLE_MODELS).filter((model) => {
        return model.planSupport.includes(planName);
    });
}

/**
 * Check if a user can access a specific model
 */
export function canUserAccessModel(
    modelId: string,
    userPlan: PlanName
): boolean {
    const model = AVAILABLE_MODELS[modelId];
    if (!model) return false;

    return model.planSupport.includes(userPlan);
}

/**
 * Get model configuration by ID
 */
export function getModelConfig(modelId: string): ModelConfig | null {
    return AVAILABLE_MODELS[modelId] || null;
}

/**
 * Get fallback model when user's preferred model is not accessible
 * This is NOT a "default model" - just a fallback for edge cases
 * Always returns the first HOBBY-tier model (lowest tier)
 */
export function getFallbackModel(planName: PlanName): string {
    // Find the first model available on HOBBY plan (lowest tier)
    const hobbyModels = getModelsForPlan("HOBBY");
    if (hobbyModels.length === 0) {
        throw new Error("No models available for HOBBY plan - configuration error");
    }
    return hobbyModels[0].id;
}

/**
 * Filter enabled models to only include those accessible by the user's plan
 */
export function filterModelsByPlan(
    modelIds: string[],
    userPlan: PlanName
): string[] {
    return modelIds.filter((id) => canUserAccessModel(id, userPlan));
}

/**
 * Get expert tier models (PRO+ only)
 */
export function getExpertModels(): ModelConfig[] {
    return Object.values(AVAILABLE_MODELS).filter(
        (model) => model.tier === "expert"
    );
}

/**
 * Get fast tier models (available to all plans)
 */
export function getFastModels(): ModelConfig[] {
    return Object.values(AVAILABLE_MODELS).filter(
        (model) => model.tier === "fast"
    );
}

/**
 * Get the default fast model
 * Returns minimax-m2 as the primary fast model (optimized for agentic workflows)
 */
export function getDefaultFastModel(): string {
    return "minimax/minimax-m2";
}

/**
 * Get the default expert model
 * Returns kimi-k2-thinking as the primary expert model
 */
export function getDefaultExpertModel(): string {
    return "moonshotai/kimi-k2-thinking";
}

/**
 * Get the default selected model for general use
 * Returns the fast tier default model
 */
export function getDefaultSelectedModel(): string {
    return getDefaultFastModel();
}

/**
 * Get default model for a tier
 */
export function getDefaultModelForTier(tier: ModelTier): string {
    return tier === "fast" ? getDefaultFastModel() : getDefaultExpertModel();
}

/**
 * Find models that support specific input types
 */
export function getModelsByInputType(inputType: ModelInputType, tier?: ModelTier): ModelConfig[] {
    return Object.values(AVAILABLE_MODELS).filter((model) => {
        const matchesInput = model.capabilities.supportedInputs.includes(inputType);
        const matchesTier = tier ? model.tier === tier : true;
        return matchesInput && matchesTier;
    });
}

/**
 * Find models that support specific output types
 */
export function getModelsByOutputType(outputType: ModelOutputType, tier?: ModelTier): ModelConfig[] {
    return Object.values(AVAILABLE_MODELS).filter((model) => {
        const matchesOutput = model.capabilities.supportedOutputs.includes(outputType);
        const matchesTier = tier ? model.tier === tier : true;
        return matchesOutput && matchesTier;
    });
}

/**
 * Check if a model supports a specific input type
 */
export function modelSupportsInput(modelId: string, inputType: ModelInputType): boolean {
    const model = AVAILABLE_MODELS[modelId];
    if (!model) return false;
    return model.capabilities.supportedInputs.includes(inputType);
}

/**
 * Check if a model supports a specific output type
 */
export function modelSupportsOutput(modelId: string, outputType: ModelOutputType): boolean {
    const model = AVAILABLE_MODELS[modelId];
    if (!model) return false;
    return model.capabilities.supportedOutputs.includes(outputType);
}

/**
 * Get the best model for a specific input/output combination
 * Uses sequential matching - returns FIRST model that matches requirements (no sorting)
 * This ensures predictable model selection based on AVAILABLE_MODELS order
 * 
 * @deprecated Use selectModelForUseCase instead for more control
 */
export function getBestModelForCapabilities(
    inputType: ModelInputType,
    outputType: ModelOutputType,
    userPlan: PlanName,
    preferredTier?: ModelTier
): string | null {
    // Get all models, maintaining order from AVAILABLE_MODELS
    const allModels = Object.values(AVAILABLE_MODELS);

    // Sequential matching - return first model that matches ALL requirements
    for (const model of allModels) {
        const hasInputSupport = model.capabilities.supportedInputs.includes(inputType);
        const hasOutputSupport = model.capabilities.supportedOutputs.includes(outputType);
        const hasAccess = model.planSupport.includes(userPlan);
        const matchesTier = preferredTier ? model.tier === preferredTier : true;

        if (hasInputSupport && hasOutputSupport && hasAccess && matchesTier) {
            return model.id; // Return first match
        }
    }

    return null; // No model matches requirements
}

/**
 * Get models filtered by use case
 * Useful for categorizing models by their primary purpose
 */
export function getModelsByUseCase(useCase: ModelUseCase, tier?: ModelTier): ModelConfig[] {
    return Object.values(AVAILABLE_MODELS).filter((model) => {
        const matchesUseCase = model.useCase === useCase;
        const matchesTier = tier ? model.tier === tier : true;
        return matchesUseCase && matchesTier;
    });
}

/**
 * Get all coding models (naming + coding use cases)
 * These are the primary models for project creation and code generation
 */
export function getCodingModels(tier?: ModelTier): ModelConfig[] {
    return Object.values(AVAILABLE_MODELS).filter((model) => {
        const isCodingModel = model.useCase === "coding" || model.useCase === "naming";
        const matchesTier = tier ? model.tier === tier : true;
        return isCodingModel && matchesTier;
    });
}

/**
 * Get all media generation models (image, audio, video)
 */
export function getMediaGenerationModels(tier?: ModelTier): ModelConfig[] {
    return Object.values(AVAILABLE_MODELS).filter((model) => {
        const isMediaModel =
            model.useCase === "image-generation" ||
            model.useCase === "audio-generation" ||
            model.useCase === "audio-transcription" ||
            model.useCase === "video-generation";
        const matchesTier = tier ? model.tier === tier : true;
        return isMediaModel && matchesTier;
    });
}

/**
 * Get the default model for a specific use case
 * This is a convenience function that uses selectModelForUseCase internally
 * Defaults to "fast" tier for efficiency
 */
export function getDefaultModelForUseCase(useCase: ModelUseCase, userPlan: PlanName): string | null {
    // Try fast tier first (more efficient)
    const fastModel = selectModelForUseCase({
        useCase,
        tier: "fast",
        userPlan,
    });

    if (fastModel) return fastModel;

    // Fallback to expert tier if user has PRO+ plan and fast tier not available
    if (userPlan === "PRO" || userPlan === "ENTERPRISE") {
        const expertModel = selectModelForUseCase({
            useCase,
            tier: "expert",
            userPlan,
        });
        return expertModel;
    }

    return null;
}

/**
 * Get the memory/context generation model
 * Returns Grok 4 Fast which has the largest context window (128K) and lowest cost
 */
export function getMemoryModel(): string {
    return "x-ai/grok-4-fast";
}

/**
 * Get all models that support web search/grounding
 */
export function getWebSearchModels(tier?: ModelTier): ModelConfig[] {
    return Object.values(AVAILABLE_MODELS).filter((model) => {
        const supportsWeb = model.capabilities.supportsWebSearch;
        const matchesTier = tier ? model.tier === tier : true;
        return supportsWeb && matchesTier;
    });
}

/**
 * Check if a model supports web search
 */
export function modelSupportsWebSearch(modelId: string): boolean {
    const model = AVAILABLE_MODELS[modelId];
    if (!model) return false;
    return model.capabilities.supportsWebSearch;
}

/**
 * Model Selection Requirements
 * Used to specify what capabilities are needed for automatic model selection
 */
export interface ModelSelectionRequirements {
    useCase: ModelUseCase;
    tier: ModelTier;
    userPlan: PlanName;
    requiredInputs?: ModelInputType[]; // If specified, model must support ALL these input types
    requiredOutputs?: ModelOutputType[]; // If specified, model must support ALL these output types
    requiresWebSearch?: boolean; // If true, model must support web search
    requiresFunctionCalling?: boolean; // If true, model must support function calling
    requiresJsonMode?: boolean; // If true, model must support JSON mode
}

/**
 * Intelligent Model Selection Algorithm
 * 
 * This function implements the sequential matching logic for automatic model selection:
 * 
 * 1. For NAMING use case:
 *    - Returns the first available model (currently only GPT-OSS-20B)
 *    - Simple text in/out, no complex requirements needed
 * 
 * 2. For MEMORY use case:
 *    - Returns the first available model (currently only Grok 4 Fast)
 *    - Large context window, cheap, text in/out
 * 
 * 3. For CODING use case:
 *    - Collects all models that match requirements
 *    - Sorts by creditMultiplier (cheapest/fastest first)
 *    - Returns the most efficient model that matches ALL requirements
 * 
 * 4. For IMAGE/AUDIO/VIDEO GENERATION:
 *    - Same approach: match requirements, then pick most efficient
 * 
 * 5. Fallback:
 *    - If no model matches requirements, returns cheapest accessible model
 * 
 * @param requirements - The model selection requirements
 * @returns The model ID that best matches requirements, or null if none found
 */
export function selectModelForUseCase(requirements: ModelSelectionRequirements): string | null {
    const { useCase, tier, userPlan, requiredInputs, requiredOutputs, requiresWebSearch, requiresFunctionCalling, requiresJsonMode } = requirements;

    // Get all models for this use case and tier
    const candidateModels = Object.values(AVAILABLE_MODELS).filter((model) => {
        return model.useCase === useCase && model.tier === tier;
    });

    if (candidateModels.length === 0) {
        return null; // No models available for this use case + tier combination
    }

    // SPECIAL CASE: Naming and Memory use cases
    // These only have one model each, so just return the first one if user has access
    if (useCase === "naming" || useCase === "memory") {
        const accessibleModel = candidateModels.find((model) => model.planSupport.includes(userPlan));
        return accessibleModel ? accessibleModel.id : null;
    }

    // GENERAL CASE: Collect all matching models
    const matchingModels: ModelConfig[] = [];

    for (const model of candidateModels) {
        // Check 1: User must have access to this model's plan
        if (!model.planSupport.includes(userPlan)) {
            continue;
        }

        // Check 2: Model must support all required input types
        if (requiredInputs && requiredInputs.length > 0) {
            const supportsAllInputs = requiredInputs.every((inputType) =>
                model.capabilities.supportedInputs.includes(inputType)
            );
            if (!supportsAllInputs) {
                continue;
            }
        }

        // Check 3: Model must support all required output types
        if (requiredOutputs && requiredOutputs.length > 0) {
            const supportsAllOutputs = requiredOutputs.every((outputType) =>
                model.capabilities.supportedOutputs.includes(outputType)
            );
            if (!supportsAllOutputs) {
                continue;
            }
        }

        // Check 4: Model must support web search if required
        if (requiresWebSearch && !model.capabilities.supportsWebSearch) {
            continue;
        }

        // Check 5: Model must support function calling if required
        if (requiresFunctionCalling && !model.capabilities.supportsFunctionCalling) {
            continue;
        }

        // Check 6: Model must support JSON mode if required
        if (requiresJsonMode && !model.capabilities.supportsJsonMode) {
            continue;
        }

        // All checks passed! Add to matching models
        matchingModels.push(model);
    }

    // If we have matching models, return the most efficient one (lowest cost)
    if (matchingModels.length > 0) {
        // Sort by creditMultiplier (lower = cheaper/faster)
        matchingModels.sort((a, b) => a.creditMultiplier - b.creditMultiplier);
        return matchingModels[0].id;
    }

    // FALLBACK 1: No model matched all requirements
    // Return cheapest model that user has access to (ignore capability requirements)
    const accessibleModels = candidateModels.filter((model) => model.planSupport.includes(userPlan));
    if (accessibleModels.length > 0) {
        accessibleModels.sort((a, b) => a.creditMultiplier - b.creditMultiplier);
        console.warn(`⚠️ No model found matching all requirements for ${useCase}/${tier}, falling back to ${accessibleModels[0].id}`);
        return accessibleModels[0].id;
    }

    // FALLBACK 2: User doesn't have access to any models for this use case + tier
    // This shouldn't happen in production, but return null to be safe
    console.error(`❌ No accessible models found for ${useCase}/${tier} with plan ${userPlan}`);
    return null;
}

/**
 * USAGE EXAMPLES:
 * 
 * // Example 1: Simple naming (text in, text out)
 * const namingModel = selectModelForUseCase({
 *     useCase: "naming",
 *     tier: "fast",
 *     userPlan: "HOBBY"
 * });
 * // Returns: "openai/gpt-oss-20b" (first and only naming model)
 * 
 * // Example 2: Simple coding (text in, code out)
 * const codingModel = selectModelForUseCase({
 *     useCase: "coding",
 *     tier: "fast",
 *     userPlan: "HOBBY",
 *     requiredInputs: ["text"],
 *     requiredOutputs: ["code"]
 * });
 * // Returns: "minimax/minimax-m2" (cheapest model that matches: 0.1x multiplier)
 * 
 * // Example 3: Multimodal coding (image + text in, code out)
 * const multimodalModel = selectModelForUseCase({
 *     useCase: "coding",
 *     tier: "fast",
 *     userPlan: "HOBBY",
 *     requiredInputs: ["text", "image"],
 *     requiredOutputs: ["code"]
 * });
 * // Returns: "google/gemini-2.5-flash-001" (only fast model supporting image input)
 * 
 * // Example 4: Coding with web search
 * const webSearchModel = selectModelForUseCase({
 *     useCase: "coding",
 *     tier: "expert",
 *     userPlan: "PRO",
 *     requiresWebSearch: true
 * });
 * // Returns: "openai/gpt-5" (1.0x) or "google/gemini-2.5-pro-001" (1.0x) - cheapest with web search
 * 
 * // Example 5: Image generation
 * const imageModel = selectModelForUseCase({
 *     useCase: "image-generation",
 *     tier: "fast",
 *     userPlan: "HOBBY"
 * });
 * // Returns: "stability/stable-diffusion-3" (first and only fast image model)
 */






