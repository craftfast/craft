/**
 * AI Model Configuration System
 * Defines available models, pricing tiers, plan-based restrictions, and use cases
 * 
 * USER PREFERENCE PHILOSOPHY:
 * - Users can ONLY select their preferred model for CODING tasks
 * - All other use cases (naming, chat, analysis) use SYSTEM DEFAULTS
 * - This keeps UX simple while optimizing cost/quality per task type
 * 
 * SYSTEM DEFAULTS (non-user-configurable):
 * - Naming: x-ai/grok-4-fast (fast & cheap for creative names)
 * - Chat: claude-haiku-4-5 (balanced for conversations)
 * - Analysis: claude-sonnet-4.5 (premium for deep reasoning)
 * 
 * USER PREFERENCES (user-configurable):
 * - Coding: User's preferred model from settings (default: minimax/minimax-m2)
 */

export type ModelTier = "free" | "standard" | "premium";
export type PlanName = "HOBBY" | "PRO" | "ENTERPRISE";

/**
 * Model use cases - categorizes models by their intended purpose
 * 
 * IMPORTANT: Only "coding" is user-configurable via preferences
 * All other use cases use fixed system defaults
 */
export type ModelUseCase =
    | "coding"          // Code generation, editing, debugging (USER CHOOSES)
    | "naming"          // Project naming (SYSTEM DEFAULT: grok-4-fast)
    | "chat"            // General conversations (SYSTEM DEFAULT: claude-haiku-4-5)
    | "analysis"        // Deep reasoning (SYSTEM DEFAULT: claude-sonnet-4.5)
    | "image"           // Image generation (future)
    | "audio"           // Audio generation/transcription (future)
    | "video";          // Video generation (future)

export interface ModelConfig {
    id: string;
    name: string;
    displayName: string;
    provider: "anthropic" | "openrouter" | "openai" | "google" | "x-ai";
    tier: ModelTier;
    creditMultiplier: number;
    description: string;
    minPlanRequired: PlanName; // Minimum plan required to access this model
    useCases: ModelUseCase[]; // What this model is optimized for
    pricing?: {
        input: number; // USD per 1M input tokens
        output: number; // USD per 1M output tokens
    };
}

/**
 * All available AI models in the system
 * Multipliers based on output token pricing: $1/M=0.1x, $2.5/M=0.25x, $5/M=0.5x, $10/M=1x, $15/M=1.5x
 * 
 * Free Tier Models (HOBBY+): MiniMax M2, Claude Haiku 4.5
 * Premium Models (PRO+): Claude Sonnet 4.5, GPT-5, Gemini 2.5 Pro, Kimi K2 Thinking
 * 
 * Use Cases:
 * - coding: Optimized for code generation and editing
 * - naming: Fast, creative text generation for project names
 * - chat: General conversational AI
 * - analysis: Deep reasoning and analysis tasks
 * - image: Image generation (future - e.g., DALL-E, Midjourney)
 * - audio: Audio generation/transcription (future - e.g., Whisper, ElevenLabs)
 * - video: Video generation (future - e.g., Runway, Sora)
 * 
 * How to add new models:
 * 1. Add model to AVAILABLE_MODELS with appropriate useCases array
 * 2. Use getDefaultModelForUseCase(useCase) to get the optimal model for a task
 * 3. Use getModelsForUseCase(useCase) to get all models supporting a use case
 * 
 * Example for future image generation:
 * ```typescript
 * "dall-e-3": {
 *     id: "dall-e-3",
 *     name: "dall-e-3",
 *     displayName: "DALL-E 3",
 *     provider: "openai",
 *     tier: "premium",
 *     creditMultiplier: 2.0,
 *     description: "Advanced image generation",
 *     minPlanRequired: "PRO",
 *     useCases: ["image"], // Image-specific use case
 *     pricing: { input: 0, output: 0.04 }, // Per image pricing
 * }
 * ```
 * 
 * Then use: getDefaultModelForUseCase("image") to get the default image model
 */
export const AVAILABLE_MODELS: Record<string, ModelConfig> = {
    "x-ai/grok-4-fast": {
        id: "x-ai/grok-4-fast",
        name: "x-ai/grok-4-fast",
        displayName: "Grok 4 Fast",
        provider: "x-ai",
        tier: "standard",
        creditMultiplier: 0.05, // Very cheap for naming tasks
        description: "Fast & creative naming",
        minPlanRequired: "HOBBY",
        useCases: ["naming", "chat"], // Specialized for creative tasks
        pricing: { input: 0.5, output: 0.5 }, // Estimated pricing
    },
    "minimax/minimax-m2": {
        id: "minimax/minimax-m2",
        name: "minimax/minimax-m2",
        displayName: "MiniMax M2",
        provider: "openrouter",
        tier: "standard",
        creditMultiplier: 0.1, // $1.02/M output tokens
        description: "MiniMax reasoning model",
        minPlanRequired: "HOBBY",
        useCases: ["coding", "naming", "chat"], // Fast, affordable, good for all basic tasks
        pricing: { input: 0.51, output: 1.02 }, // Estimated pricing
    },
    "moonshotai/kimi-k2-thinking": {
        id: "moonshotai/kimi-k2-thinking",
        name: "moonshotai/kimi-k2-thinking",
        displayName: "Kimi K2 Thinking",
        provider: "openrouter",
        tier: "premium",
        creditMultiplier: 0.25, // $2.50/M output tokens
        description: "Advanced reasoning model",
        minPlanRequired: "PRO",
        useCases: ["coding", "analysis", "chat"], // Deep reasoning capabilities
        pricing: { input: 1.0, output: 2.5 }, // Estimated pricing
    },
    "claude-haiku-4-5": {
        id: "claude-haiku-4-5",
        name: "claude-haiku-4-5",
        displayName: "Claude 4.5 Haiku",
        provider: "anthropic",
        tier: "standard",
        creditMultiplier: 0.5, // $5/M output tokens
        description: "Fast & efficient",
        minPlanRequired: "HOBBY",
        useCases: ["coding", "chat"], // Fast responses
        pricing: { input: 1.0, output: 5.0 },
    },
    "google/gemini-2.5-pro-001": {
        id: "google/gemini-2.5-pro-001",
        name: "google/gemini-2.5-pro-001",
        displayName: "Gemini 2.5 Pro",
        provider: "google",
        tier: "premium",
        creditMultiplier: 1.0, // $10/M output tokens
        description: "Google's most advanced model",
        minPlanRequired: "PRO",
        useCases: ["coding", "analysis", "chat"], // Multimodal capabilities
        pricing: { input: 2.5, output: 10.0 }, // Estimated pricing
    },
    "openai/gpt-5": {
        id: "openai/gpt-5",
        name: "openai/gpt-5",
        displayName: "GPT-5",
        provider: "openai",
        tier: "premium",
        creditMultiplier: 1.0, // $10/M output tokens
        description: "OpenAI's most advanced model",
        minPlanRequired: "PRO",
        useCases: ["coding", "analysis", "chat"], // General purpose excellence
        pricing: { input: 2.5, output: 10.0 }, // Estimated pricing
    },
    "claude-sonnet-4.5": {
        id: "claude-sonnet-4.5",
        name: "claude-sonnet-4.5",
        displayName: "Claude 4.5 Sonnet",
        provider: "anthropic",
        tier: "premium",
        creditMultiplier: 1.5, // $15/M output tokens
        description: "Most capable",
        minPlanRequired: "PRO",
        useCases: ["coding", "analysis", "chat"], // Best overall quality
        pricing: { input: 3.0, output: 15.0 },
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
 * Get premium models (PRO+ only)
 */
export function getPremiumModels(): ModelConfig[] {
    return Object.values(AVAILABLE_MODELS).filter(
        (model) => model.minPlanRequired === "PRO" || model.minPlanRequired === "ENTERPRISE"
    );
}

/**
 * Get free tier models (available to HOBBY)
 */
export function getFreeTierModels(): ModelConfig[] {
    return Object.values(AVAILABLE_MODELS).filter(
        (model) => model.minPlanRequired === "HOBBY"
    );
}

/**
 * Get initial enabled models for new users
 * All models from AVAILABLE_MODELS are enabled by default - users can personalize based on their needs
 * Premium models will only be accessible to Pro users in the coding interface
 */
export function getDefaultEnabledModels(): string[] {
    return getAllModelIds();
}

/**
 * Get initial preferred model for new users
 * This is set as the selected model when a user signs up
 * Always returns minimax-m2 as the default coding model (fastest & cheapest)
 */
export function getDefaultSelectedModel(): string {
    // Always default to minimax-m2 for coding
    return "minimax/minimax-m2";
}

/**
 * Get all models that support a specific use case
 */
export function getModelsForUseCase(useCase: ModelUseCase): ModelConfig[] {
    return Object.values(AVAILABLE_MODELS).filter((model) =>
        model.useCases.includes(useCase)
    );
}

/**
 * SYSTEM DEFAULT MODELS FOR NON-CODING USE CASES
 * These are fixed defaults chosen for optimal cost/quality balance
 * Users CANNOT change these - only their coding model preference
 * 
 * - Naming: Fast, cheap model for creative project names
 * - Chat: Balanced model for general conversations  
 * - Analysis: Premium model for deep reasoning tasks
 */
const SYSTEM_USE_CASE_DEFAULTS: Record<Exclude<ModelUseCase, "coding" | "image" | "audio" | "video">, string> = {
    naming: "x-ai/grok-4-fast",        // Fast & cheap for creative names
    chat: "claude-haiku-4-5",          // Balanced for conversations
    analysis: "claude-sonnet-4.5",     // Premium for deep reasoning
};

/**
 * Get the default model for a specific use case
 * 
 * IMPORTANT: 
 * - For CODING: Uses user's preferred model (from preferences)
 * - For OTHER use cases: Uses system defaults (users cannot change)
 * 
 * This function returns system defaults for non-coding tasks.
 * For coding tasks, use getUserPreferredModel() instead.
 */
export function getDefaultModelForUseCase(
    useCase: ModelUseCase,
    userPlan?: PlanName
): string {
    // For non-coding use cases, return the fixed system default
    if (useCase !== "coding") {
        const defaultModel = SYSTEM_USE_CASE_DEFAULTS[useCase as keyof typeof SYSTEM_USE_CASE_DEFAULTS];
        if (defaultModel) {
            return defaultModel;
        }
        // Fallback for future use cases (image, audio, video)
        console.warn(`No system default for use case: ${useCase}, using fallback`);
    }

    // For coding or as fallback, use dynamic selection
    const useCaseModels = getModelsForUseCase(useCase);

    if (useCaseModels.length === 0) {
        throw new Error(`No models available for use case: ${useCase}`);
    }

    // Filter by user's plan if provided
    const accessibleModels = userPlan
        ? useCaseModels.filter((m) => canUserAccessModel(m.id, userPlan))
        : useCaseModels.filter((m) => m.minPlanRequired === "HOBBY");

    if (accessibleModels.length === 0) {
        throw new Error(
            `No accessible models for use case: ${useCase} with plan: ${userPlan || "HOBBY"}`
        );
    }

    // Sort by creditMultiplier (lower = cheaper) and return the first
    const sortedModels = accessibleModels.sort(
        (a, b) => a.creditMultiplier - b.creditMultiplier
    );

    return sortedModels[0].id;
}

/**
 * Check if a model supports a specific use case
 */
export function modelSupportsUseCase(
    modelId: string,
    useCase: ModelUseCase
): boolean {
    const model = AVAILABLE_MODELS[modelId];
    if (!model) return false;
    return model.useCases.includes(useCase);
}

/**
 * Get all system default models (non-coding use cases)
 * These are NOT user-configurable
 */
export function getSystemDefaultModels(): Record<string, string> {
    return {
        naming: SYSTEM_USE_CASE_DEFAULTS.naming,
        chat: SYSTEM_USE_CASE_DEFAULTS.chat,
        analysis: SYSTEM_USE_CASE_DEFAULTS.analysis,
    };
}

/**
 * Check if a use case allows user preference
 * Only "coding" is user-configurable
 */
export function isUserConfigurableUseCase(useCase: ModelUseCase): boolean {
    return useCase === "coding";
}
