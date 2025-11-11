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
    minPlanRequired: PlanName; // Minimum plan required to access this model
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
        minPlanRequired: "HOBBY",
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
        name: "x-ai/grok-4-fast",
        displayName: "Grok 4 Fast",
        provider: "x-ai",
        tier: "fast",
        creditMultiplier: 0.05,
        description: "Context memory generation with 2M token context window",
        minPlanRequired: "HOBBY",
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
        minPlanRequired: "HOBBY",
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
        name: "openai/gpt-5-mini",
        displayName: "GPT-5 Mini",
        provider: "openai",
        tier: "fast",
        creditMultiplier: 0.15,
        description: "Compact, efficient model for coding tasks",
        minPlanRequired: "HOBBY",
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
        name: "google/gemini-2.5-flash-001",
        displayName: "Gemini 2.5 Flash",
        provider: "google",
        tier: "fast",
        creditMultiplier: 0.2,
        description: "Fast Google model with multimodal capabilities",
        minPlanRequired: "HOBBY",
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
        minPlanRequired: "PRO",
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
    "google/gemini-2.5-pro-001": {
        id: "google/gemini-2.5-pro-001",
        name: "google/gemini-2.5-pro-001",
        displayName: "Gemini 2.5 Pro",
        provider: "google",
        tier: "expert",
        creditMultiplier: 1.0,
        description: "Google's advanced model with multimodal capabilities",
        minPlanRequired: "PRO",
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
    "openai/gpt-5": {
        id: "openai/gpt-5",
        name: "openai/gpt-5",
        displayName: "GPT-5",
        provider: "openai",
        tier: "expert",
        creditMultiplier: 1.0,
        description: "OpenAI's most advanced model",
        minPlanRequired: "PRO",
        useCase: "coding",
        capabilities: {
            supportedInputs: ["text", "image", "audio"],
            supportedOutputs: ["text", "code", "structured-data"],
            maxContextLength: 128000,
            supportsStreaming: true,
            supportsSystemPrompts: true,
            supportsWebSearch: true,
            supportsFunctionCalling: false,
            supportsJsonMode: false,
        },
        pricing: { input: 2.5, output: 10.0 },
    },
    "openai/gpt-5-codex": {
        id: "openai/gpt-5-codex",
        name: "openai/gpt-5-codex",
        displayName: "GPT-5 Codex",
        provider: "openai",
        tier: "expert",
        creditMultiplier: 1.5,
        description: "Advanced code generation and understanding model",
        minPlanRequired: "PRO",
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
        pricing: { input: 3.0, output: 15.0 },
    },
    "claude-sonnet-4.5": {
        id: "claude-sonnet-4.5",
        name: "claude-sonnet-4.5",
        displayName: "Claude 4.5 Sonnet",
        provider: "anthropic",
        tier: "expert",
        creditMultiplier: 1.5,
        description: "Most capable model with best quality",
        minPlanRequired: "PRO",
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
    "openai/dall-e-3": {
        id: "openai/dall-e-3",
        name: "openai/dall-e-3",
        displayName: "DALL-E 3",
        provider: "openai",
        tier: "expert",
        creditMultiplier: 4.0,
        description: "Advanced AI image generation",
        minPlanRequired: "PRO",
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
        minPlanRequired: "HOBBY",
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
        minPlanRequired: "PRO",
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
        name: "openai/whisper-large-v3",
        displayName: "Whisper Large v3",
        provider: "openai",
        tier: "fast",
        creditMultiplier: 0.06,
        description: "Speech-to-text transcription and translation",
        minPlanRequired: "HOBBY",
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
        minPlanRequired: "HOBBY",
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
        minPlanRequired: "PRO",
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
        minPlanRequired: "PRO",
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
    const planHierarchy: Record<PlanName, number> = {
        HOBBY: 0,
        PRO: 1,
        ENTERPRISE: 2,
    };

    const userPlanLevel = planHierarchy[planName];

    return Object.values(AVAILABLE_MODELS).filter((model) => {
        const requiredPlanLevel = planHierarchy[model.minPlanRequired];
        return userPlanLevel >= requiredPlanLevel;
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

    const planHierarchy: Record<PlanName, number> = {
        HOBBY: 0,
        PRO: 1,
        ENTERPRISE: 2,
    };

    const userPlanLevel = planHierarchy[userPlan];
    const requiredPlanLevel = planHierarchy[model.minPlanRequired];

    return userPlanLevel >= requiredPlanLevel;
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
 * Prioritizes models based on tier and capability match
 */
export function getBestModelForCapabilities(
    inputType: ModelInputType,
    outputType: ModelOutputType,
    userPlan: PlanName,
    preferredTier?: ModelTier
): string | null {
    const availableModels = Object.values(AVAILABLE_MODELS).filter((model) => {
        const hasInputSupport = model.capabilities.supportedInputs.includes(inputType);
        const hasOutputSupport = model.capabilities.supportedOutputs.includes(outputType);
        const hasAccess = canUserAccessModel(model.id, userPlan);
        const matchesTier = preferredTier ? model.tier === preferredTier : true;
        return hasInputSupport && hasOutputSupport && hasAccess && matchesTier;
    });

    if (availableModels.length === 0) return null;

    // Sort by tier (expert first) and credit multiplier (lower cost first within tier)
    availableModels.sort((a, b) => {
        if (a.tier !== b.tier) {
            return a.tier === "expert" ? -1 : 1;
        }
        return a.creditMultiplier - b.creditMultiplier;
    });

    return availableModels[0].id;
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
 */
export function getDefaultModelForUseCase(useCase: ModelUseCase, userPlan: PlanName): string | null {
    const models = getModelsByUseCase(useCase).filter((model) =>
        canUserAccessModel(model.id, userPlan)
    );

    if (models.length === 0) return null;

    // Sort by tier (fast first for efficiency) and credit multiplier
    models.sort((a, b) => {
        if (a.tier !== b.tier) {
            return a.tier === "fast" ? -1 : 1;
        }
        return a.creditMultiplier - b.creditMultiplier;
    });

    return models[0].id;
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



