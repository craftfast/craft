/**
 * AI Model Configuration System
 * Defines available models, pricing tiers, and plan-based restrictions
 */

export type ModelTier = "free" | "standard" | "premium";
export type PlanName = "HOBBY" | "PRO" | "ENTERPRISE";

export interface ModelConfig {
    id: string;
    name: string;
    displayName: string;
    provider: "anthropic" | "openrouter" | "openai" | "google" | "x-ai";
    tier: ModelTier;
    creditMultiplier: number;
    description: string;
    minPlanRequired: PlanName; // Minimum plan required to access this model
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
 */
export const AVAILABLE_MODELS: Record<string, ModelConfig> = {
    "minimax/minimax-m2": {
        id: "minimax/minimax-m2",
        name: "minimax/minimax-m2",
        displayName: "MiniMax M2",
        provider: "openrouter",
        tier: "standard",
        creditMultiplier: 0.1, // $1.02/M output tokens
        description: "MiniMax reasoning model",
        minPlanRequired: "HOBBY",
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
 * Returns the first standard-tier HOBBY model (typically the fastest/cheapest)
 */
export function getDefaultSelectedModel(): string {
    // Find the first standard-tier model available on HOBBY plan
    const hobbyModels = getModelsForPlan("HOBBY");
    const standardModel = hobbyModels.find(m => m.tier === "standard");

    if (standardModel) {
        return standardModel.id;
    }

    // Fallback to first HOBBY model if no standard tier found
    if (hobbyModels.length === 0) {
        throw new Error("No models available for HOBBY plan - configuration error");
    }
    return hobbyModels[0].id;
}
