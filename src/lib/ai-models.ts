/**
 * AI Model Configuration
 * Model definitions, display names, and availability per plan
 */

export type PlanName = "HOBBY" | "PRO" | "ENTERPRISE";

export interface AIModel {
    id: string;
    name: string;
    provider: string;
    description: string;
    tier: "lite" | "premium" | "enterprise";
    minPlan: PlanName;
    pricingPer1M: {
        input: number;
        output: number;
    };
}

export const AI_MODELS: Record<string, AIModel> = {
    // ========== LITE MODELS (Hobby+) ==========
    "claude-haiku-4.5": {
        id: "anthropic/claude-haiku-4.5",
        name: "Claude Haiku 4.5",
        provider: "Anthropic",
        description: "Fast and efficient AI model for quick iterations",
        tier: "lite",
        minPlan: "HOBBY",
        pricingPer1M: { input: 1.0, output: 5.0 },
    },
    "gpt-5-mini": {
        id: "openai/gpt-5-mini",
        name: "GPT-5 mini",
        provider: "OpenAI",
        description: "Efficient and cost-effective general-purpose model",
        tier: "lite",
        minPlan: "HOBBY",
        pricingPer1M: { input: 0.25, output: 2.0 },
    },
    "gemini-2.5-flash": {
        id: "google/gemini-2.5-flash",
        name: "Gemini 2.5 Flash",
        provider: "Google",
        description: "Fast and efficient for quick iterations",
        tier: "lite",
        minPlan: "HOBBY",
        pricingPer1M: { input: 0.3, output: 2.5 },
    },

    // ========== PREMIUM MODELS (Pro+) ==========
    "claude-sonnet-4.5": {
        id: "anthropic/claude-sonnet-4.5",
        name: "Claude Sonnet 4.5",
        provider: "Anthropic",
        description: "Advanced reasoning and complex code generation",
        tier: "premium",
        minPlan: "PRO",
        pricingPer1M: { input: 3.0, output: 15.0 },
    },
    "gpt-5": {
        id: "openai/gpt-5",
        name: "GPT-5",
        provider: "OpenAI",
        description: "Advanced reasoning and code generation",
        tier: "premium",
        minPlan: "PRO",
        pricingPer1M: { input: 1.25, output: 10.0 },
    },
    "gemini-2.5-pro": {
        id: "google/gemini-2.5-pro",
        name: "Gemini 2.5 Pro",
        provider: "Google",
        description: "High-capability multimodal reasoning",
        tier: "premium",
        minPlan: "PRO",
        pricingPer1M: { input: 1.25, output: 10.0 },
    },
};

/**
 * Get models available for a specific plan
 */
export function getModelsForPlan(plan: PlanName): AIModel[] {
    const planHierarchy: Record<PlanName, number> = {
        HOBBY: 0,
        PRO: 1,
        ENTERPRISE: 2,
    };

    const userLevel = planHierarchy[plan];

    return Object.values(AI_MODELS).filter((model) => {
        const requiredLevel = planHierarchy[model.minPlan];
        return userLevel >= requiredLevel;
    });
}

/**
 * Check if a plan has access to a specific model
 */
export function canAccessModel(plan: PlanName, modelKey: string): boolean {
    const model = AI_MODELS[modelKey];
    if (!model) return false;

    const planHierarchy: Record<PlanName, number> = {
        HOBBY: 0,
        PRO: 1,
        ENTERPRISE: 2,
    };

    return planHierarchy[plan] >= planHierarchy[model.minPlan];
}

/**
 * Get default model for a plan
 */
export function getDefaultModel(plan: PlanName): string {
    if (plan === "HOBBY") return "claude-haiku-4.5";
    if (plan === "PRO") return "claude-sonnet-4.5";
    return "claude-sonnet-4.5";
}

/**
 * Get model display info by key
 */
export function getModelInfo(modelKey: string): AIModel | null {
    return AI_MODELS[modelKey] || null;
}

/**
 * Estimate cost for token usage
 */
export function estimateCost(
    modelKey: string,
    inputTokens: number,
    outputTokens: number
): number {
    const model = AI_MODELS[modelKey];
    if (!model) return 0;

    const inputCost = (inputTokens / 1000000) * model.pricingPer1M.input;
    const outputCost = (outputTokens / 1000000) * model.pricingPer1M.output;

    return inputCost + outputCost;
}
