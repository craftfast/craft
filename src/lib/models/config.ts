/**
 * AI Model Configuration System
 * Fixed, simple model selection - one model per use case
 * 
 * ORCHESTRATOR (Application-level tasks):
 * - Grok 4 Fast: Project naming, memory/context, task delegation
 * 
 * CODING (Code generation tasks):
 * - Claude Haiku 4.5: Fast coding (standard features, UI components)
 * - Claude Sonnet 4.5: Expert coding (complex logic, architecture)
 * 
 * IMAGE GENERATION:
 * - Gemini 2.5 Flash: Fast image generation
 */

export type ModelTier = "fast" | "expert";

/**
 * App-specific use cases for different model capabilities
 */
export type ModelUseCase =
    | "orchestrator"        // Project naming, memory, task delegation (Grok 4 Fast)
    | "coding"              // Code generation, editing, debugging (Claude)
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
 * Fixed model selection - one model per use case
 * 
 * ORCHESTRATOR: Grok 4 Fast - Project naming, memory, task delegation, context management
 * CODING FAST: Claude Haiku 4.5 - Fast coding for standard features and UI
 * CODING EXPERT: Claude Sonnet 4.5 - Expert coding for complex logic and architecture
 * IMAGE GENERATION: Gemini 2.5 Flash - Fast image generation
 */
export const AVAILABLE_MODELS: Record<string, ModelConfig> = {
    "x-ai/grok-4-fast": {
        id: "x-ai/grok-4-fast",
        name: "x-ai/grok-4-fast",
        displayName: "Grok 4 Fast",
        provider: "openrouter",
        tier: "fast",
        creditMultiplier: 0.05,
        description: "Orchestrator: Naming, memory, task delegation (2M context)",
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
        pricing: { input: 0.2, output: 0.5 },
    },
    "anthropic/claude-haiku-4.5": {
        id: "anthropic/claude-haiku-4.5",
        name: "claude-haiku-4-5",
        displayName: "Claude 4.5 Haiku",
        provider: "anthropic",
        tier: "fast",
        creditMultiplier: 0.5,
        description: "Fast coding with web search and tool use",
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
        pricing: { input: 1.0, output: 5.0 },
    },
    "anthropic/claude-sonnet-4.5": {
        id: "anthropic/claude-sonnet-4.5",
        name: "claude-sonnet-4-5",
        displayName: "Claude 4.5 Sonnet",
        provider: "anthropic",
        tier: "expert",
        creditMultiplier: 1.5,
        description: "Expert coding with web search and tool use",
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
        pricing: { input: 3.0, output: 15.0 },
    },
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
// DEDICATED MODEL FUNCTIONS - One function per role
// ============================================================================

/**
 * Get the orchestrator model for all application-level tasks
 * 
 * Use for:
 * - Project naming generation
 * - Memory and context management
 * - Task delegation and planning
 * - Conversation history
 */
export function getOrchestratorModel(): string {
    return "x-ai/grok-4-fast";
}

/**
 * Get the fast coding model for standard development tasks
 * 
 * Use for:
 * - UI components
 * - Standard features
 * - Quick iterations
 */
export function getFastCodingModel(): string {
    return "anthropic/claude-haiku-4.5";
}

/**
 * Get the expert coding model for complex development tasks
 * 
 * Use for:
 * - Complex logic and architecture
 * - Advanced features
 * - Performance-critical code
 */
export function getExpertCodingModel(): string {
    return "anthropic/claude-sonnet-4.5";
}

/**
 * Get the image generation model
 * 
 * Use for:
 * - Text-to-image generation
 * - Visual asset creation
 */
export function getImageGenerationModel(): string {
    return "google/gemini-2.5-flash-image";
}

/**
 * Get coding model by tier (convenience function)
 */
export function getCodingModel(tier: ModelTier): string {
    return tier === "fast" ? getFastCodingModel() : getExpertCodingModel();
}


