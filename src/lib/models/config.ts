/**
 * AI Model Configuration System
 * Defines available models, pricing tiers, and plan-based restrictions
 */

export type ModelTier = "cheap" | "fast" | "standard" | "premium";
export type PlanName = "HOBBY" | "PRO" | "ENTERPRISE";

export interface ModelConfig {
    id: string;
    name: string;
    displayName: string;
    provider: "anthropic" | "openrouter";
    tier: ModelTier;
    creditMultiplier: number;
    description: string;
    minPlanRequired: PlanName; // Minimum plan required to access this model
    isDefault?: boolean; // Whether this is a default model
}

/**
 * All available AI models in the system
 */
export const AVAILABLE_MODELS: Record<string, ModelConfig> = {
    // ============================================================================
    // STANDARD TIER (1.0x) - Available to all plans - DEFAULT
    // ============================================================================
    "claude-haiku-4-5": {
        id: "claude-haiku-4-5",
        name: "claude-haiku-4-5",
        displayName: "Claude 4.5 Haiku",
        provider: "anthropic",
        tier: "standard",
        creditMultiplier: 1,
        description: "Fast & efficient",
        minPlanRequired: "HOBBY",
        isDefault: true,
    },

    // ============================================================================
    // PREMIUM TIER (2.0x) - PRO+ only
    // ============================================================================
    "claude-sonnet-4.5": {
        id: "claude-sonnet-4.5",
        name: "claude-sonnet-4.5",
        displayName: "Claude 4.5 Sonnet",
        provider: "anthropic",
        tier: "premium",
        creditMultiplier: 2,
        description: "Most capable",
        minPlanRequired: "PRO",
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
 * Get default model for a plan
 */
export function getDefaultModelForPlan(planName: PlanName): string {
    // Return Claude Haiku 4.5 as default for all plans
    return "claude-haiku-4-5";
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
