/**
 * AI Model Service
 * 
 * Unified service for all AI model operations.
 * Database-first with fallback to JSON config.
 * 
 * Features:
 * - Per-use-case model preferences
 * - Database-driven configuration
 * - Automatic caching with TTL
 * - Provider fallback support
 */

import { prisma } from "@/lib/db";
import type { AIModel, AIModelCapabilities, AIModelPricing } from "@prisma/client";
import type {
    ModelConfig,
    ModelCapabilities,
    ModelPricing,
    ModelUseCase,
    ModelProvider,
    UserModelPreferences,
} from "./types";
import {
    PROVIDER_MAP,
    TIER_MAP,
    USE_CASE_MAP,
    INPUT_TYPE_MAP,
    OUTPUT_TYPE_MAP,
} from "./types";
import { DEFAULT_MODEL_IDS, MODEL_CACHE_TTL_MS } from "./constants";

// ============================================================================
// DATABASE CONVERTER
// ============================================================================

type DBModelWithRelations = AIModel & {
    capabilities: AIModelCapabilities | null;
    pricing: AIModelPricing | null;
};

function dbToModelConfig(dbModel: DBModelWithRelations): ModelConfig {
    const capabilities: ModelCapabilities = dbModel.capabilities
        ? {
            supportedInputs: dbModel.capabilities.supportedInputs.map(t => INPUT_TYPE_MAP[t]),
            supportedOutputs: dbModel.capabilities.supportedOutputs.map(t => OUTPUT_TYPE_MAP[t]),
            maxContextLength: dbModel.capabilities.maxContextLength ?? undefined,
            supportsStreaming: dbModel.capabilities.supportsStreaming,
            supportsSystemPrompts: dbModel.capabilities.supportsSystemPrompts,
            supportsWebSearch: dbModel.capabilities.supportsWebSearch,
            supportsFunctionCalling: dbModel.capabilities.supportsFunctionCalling,
            supportsJsonMode: dbModel.capabilities.supportsJsonMode,
        }
        : {
            supportedInputs: ["text"],
            supportedOutputs: ["text"],
            supportsStreaming: true,
            supportsSystemPrompts: true,
            supportsWebSearch: false,
            supportsFunctionCalling: true,
            supportsJsonMode: true,
        };

    const pricing: ModelPricing | undefined = dbModel.pricing
        ? {
            inputTokens: dbModel.pricing.inputTokens,
            outputTokens: dbModel.pricing.outputTokens,
            longContextThreshold: dbModel.pricing.longContextThreshold ?? undefined,
            inputTokensLongContext: dbModel.pricing.inputTokensLongContext ?? undefined,
            outputTokensLongContext: dbModel.pricing.outputTokensLongContext ?? undefined,
            cacheCreation: dbModel.pricing.cacheCreation ?? undefined,
            cacheRead: dbModel.pricing.cacheRead ?? undefined,
            cacheCreationLongContext: dbModel.pricing.cacheCreationLongContext ?? undefined,
            cacheReadLongContext: dbModel.pricing.cacheReadLongContext ?? undefined,
            cacheDuration: dbModel.pricing.cacheDuration ?? undefined,
            imageInputTokens: dbModel.pricing.imageInputTokens ?? undefined,
            audioInputTokens: dbModel.pricing.audioInputTokens ?? undefined,
            videoInputTokens: dbModel.pricing.videoInputTokens ?? undefined,
            audioOutputTokens: dbModel.pricing.audioOutputTokens ?? undefined,
            images: dbModel.pricing.images ?? undefined,
            videoSeconds: dbModel.pricing.videoSeconds ?? undefined,
            webSearchFreePerDay: dbModel.pricing.webSearchFreePerDay ?? undefined,
            webSearch: dbModel.pricing.webSearch ?? undefined,
            mapsGroundingFreePerDay: dbModel.pricing.mapsGroundingFreePerDay ?? undefined,
            mapsGrounding: dbModel.pricing.mapsGrounding ?? undefined,
        }
        : undefined;

    return {
        id: dbModel.id,
        name: dbModel.name,
        displayName: dbModel.displayName,
        provider: PROVIDER_MAP[dbModel.provider],
        tier: TIER_MAP[dbModel.tier],
        description: dbModel.description,
        useCase: USE_CASE_MAP[dbModel.useCase],
        capabilities,
        pricing,
        isEnabled: dbModel.isEnabled,
        isDefault: dbModel.isDefault,
        isSystem: dbModel.isSystem,
        sortOrder: dbModel.sortOrder,
    };
}

// ============================================================================
// MODEL SERVICE CLASS
// ============================================================================

class ModelService {
    private models: Map<string, ModelConfig> = new Map();
    private initialized = false;
    private initPromise: Promise<void> | null = null;
    private lastRefresh: Date | null = null;

    // ========================================================================
    // INITIALIZATION
    // ========================================================================

    /**
     * Initialize the service by loading models from database
     */
    async initialize(forceRefresh = false): Promise<void> {
        if (this.initPromise && !forceRefresh) {
            return this.initPromise;
        }

        // Check cache validity
        if (this.initialized && !forceRefresh && this.lastRefresh) {
            const cacheAge = Date.now() - this.lastRefresh.getTime();
            if (cacheAge < MODEL_CACHE_TTL_MS) {
                return;
            }
        }

        this.initPromise = this._doInitialize();
        await this.initPromise;
        this.initPromise = null;
    }

    private async _doInitialize(): Promise<void> {
        try {
            const dbModels = await prisma.aIModel.findMany({
                include: {
                    capabilities: true,
                    pricing: true,
                },
                orderBy: [
                    { useCase: "asc" },
                    { sortOrder: "asc" },
                ],
            });

            if (dbModels.length > 0) {
                console.log(`📦 Model Service: Loaded ${dbModels.length} models from database`);
                this.models.clear();

                for (const dbModel of dbModels) {
                    const config = dbToModelConfig(dbModel);
                    this.models.set(config.id, config);
                }
            } else {
                console.log("⚠️ Model Service: No models in database, using fallback config");
                await this._loadFallbackConfig();
            }

            this.initialized = true;
            this.lastRefresh = new Date();
        } catch (error) {
            console.error("❌ Model Service: Failed to load from database:", error);
            console.log("⚠️ Model Service: Falling back to JSON config");
            await this._loadFallbackConfig();
            this.initialized = true;
            this.lastRefresh = new Date();
        }
    }

    private async _loadFallbackConfig(): Promise<void> {
        const { AI_MODELS } = await import("@/data");
        this.models.clear();
        for (const model of AI_MODELS) {
            this.models.set(model.id, {
                id: model.id,
                name: model.name,
                displayName: model.displayName,
                provider: model.provider,
                tier: model.tier,
                description: model.description,
                useCase: model.useCase,
                capabilities: model.capabilities,
                pricing: model.pricing,
                isEnabled: true,
                isDefault: model.id === DEFAULT_MODEL_IDS[model.useCase],
                isSystem: model.isSystem,
                sortOrder: 0,
            });
        }
    }

    /**
     * Force refresh from database
     */
    async refresh(): Promise<void> {
        await this.initialize(true);
    }

    /**
     * Invalidate cache
     */
    invalidateCache(): void {
        this.initialized = false;
        this.lastRefresh = null;
        this.models.clear();
    }

    // ========================================================================
    // MODEL QUERIES
    // ========================================================================

    /**
     * Get a model by ID
     */
    async getModel(id: string): Promise<ModelConfig | null> {
        await this.initialize();
        return this.models.get(id) || null;
    }

    /**
     * Get all models
     */
    async getAllModels(): Promise<ModelConfig[]> {
        await this.initialize();
        return Array.from(this.models.values());
    }

    /**
     * Get all enabled models
     */
    async getEnabledModels(): Promise<ModelConfig[]> {
        await this.initialize();
        return Array.from(this.models.values()).filter(m => m.isEnabled);
    }

    /**
     * Get models for a specific use case
     */
    async getModelsForUseCase(useCase: ModelUseCase): Promise<ModelConfig[]> {
        await this.initialize();
        return Array.from(this.models.values())
            .filter(m => m.useCase === useCase && m.isEnabled)
            .sort((a, b) => a.sortOrder - b.sortOrder);
    }

    /**
     * Get user-selectable models for a use case (excludes system models)
     */
    async getSelectableModelsForUseCase(useCase: ModelUseCase): Promise<ModelConfig[]> {
        const models = await this.getModelsForUseCase(useCase);
        return models.filter(m => !m.isSystem);
    }

    /**
     * Get the default model for a use case
     */
    async getDefaultModel(useCase: ModelUseCase): Promise<ModelConfig | null> {
        await this.initialize();

        // First try database default
        const defaultModel = Array.from(this.models.values())
            .find(m => m.useCase === useCase && m.isDefault && m.isEnabled);

        if (defaultModel) return defaultModel;

        // Fallback to hardcoded default
        const defaultId = DEFAULT_MODEL_IDS[useCase];
        return this.models.get(defaultId) || null;
    }

    /**
     * Get the default model ID for a use case
     */
    async getDefaultModelId(useCase: ModelUseCase): Promise<string> {
        const model = await this.getDefaultModel(useCase);
        return model?.id || DEFAULT_MODEL_IDS[useCase];
    }

    // ========================================================================
    // USER PREFERENCES
    // ========================================================================

    /**
     * Get user's model preferences
     */
    async getUserPreferences(userId: string): Promise<UserModelPreferences> {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { modelPreferences: true },
        });

        if (!user?.modelPreferences) {
            return {};
        }

        return user.modelPreferences as UserModelPreferences;
    }

    /**
     * Get user's preferred model for a use case
     * Falls back to default if no preference or invalid model
     */
    async getUserPreferredModel(userId: string, useCase: ModelUseCase): Promise<string> {
        await this.initialize();

        const preferences = await this.getUserPreferences(userId);
        const useCaseKey = this._useCaseToKey(useCase);
        const preferredId = preferences[useCaseKey as keyof UserModelPreferences];

        // Validate the preferred model exists and is enabled
        if (preferredId) {
            const model = this.models.get(preferredId);
            if (model && model.isEnabled && model.useCase === useCase) {
                return preferredId;
            }
        }

        // Fall back to default
        return this.getDefaultModelId(useCase);
    }

    /**
     * Set user's preferred model for a use case
     */
    async setUserPreferredModel(
        userId: string,
        useCase: ModelUseCase,
        modelId: string
    ): Promise<void> {
        await this.initialize();

        // Validate model exists and is for this use case
        const model = this.models.get(modelId);
        if (!model) {
            throw new Error(`Model not found: ${modelId}`);
        }
        if (model.useCase !== useCase) {
            throw new Error(`Model ${modelId} is not a ${useCase} model`);
        }
        if (!model.isEnabled) {
            throw new Error(`Model ${modelId} is not enabled`);
        }
        if (model.isSystem) {
            throw new Error(`Cannot set preference for system model: ${modelId}`);
        }

        const currentPrefs = await this.getUserPreferences(userId);
        const useCaseKey = this._useCaseToKey(useCase);

        const newPrefs = {
            ...currentPrefs,
            [useCaseKey]: modelId,
        };

        await prisma.user.update({
            where: { id: userId },
            data: { modelPreferences: newPrefs },
        });
    }

    /**
     * Get all user preferences with model details
     */
    async getUserPreferencesWithDetails(userId: string): Promise<{
        useCase: ModelUseCase;
        displayName: string;
        preferredModelId: string;
        preferredModel: ModelConfig | null;
        availableModels: ModelConfig[];
        isUserSelectable: boolean;
    }[]> {
        await this.initialize();

        const preferences = await this.getUserPreferences(userId);
        const { MODEL_USE_CASES } = await import("./constants");

        const result = [];

        for (const [useCase, info] of Object.entries(MODEL_USE_CASES)) {
            const uc = useCase as ModelUseCase;
            const useCaseKey = this._useCaseToKey(uc);
            const preferredId = preferences[useCaseKey as keyof UserModelPreferences]
                || await this.getDefaultModelId(uc);

            result.push({
                useCase: uc,
                displayName: info.displayName,
                preferredModelId: preferredId,
                preferredModel: this.models.get(preferredId) || null,
                availableModels: await this.getModelsForUseCase(uc),
                isUserSelectable: info.isUserSelectable,
            });
        }

        return result;
    }

    // ========================================================================
    // CONVENIENCE METHODS (for backward compatibility)
    // ========================================================================

    /**
     * Get coding model for user
     */
    async getCodingModel(userId: string): Promise<string> {
        return this.getUserPreferredModel(userId, "coding");
    }

    /**
     * Get naming/orchestrator model (system, not user-selectable)
     */
    async getNamingModel(): Promise<string> {
        return this.getDefaultModelId("orchestrator");
    }

    /**
     * Get orchestrator model (alias for getNamingModel)
     */
    async getOrchestratorModel(): Promise<string> {
        return this.getDefaultModelId("orchestrator");
    }

    /**
     * Get memory model (system, not user-selectable)
     */
    async getMemoryModel(): Promise<string> {
        return this.getDefaultModelId("memory");
    }

    /**
     * Get image generation model for user
     */
    async getImageGenerationModel(userId: string): Promise<string> {
        return this.getUserPreferredModel(userId, "image-generation");
    }

    /**
     * Get video generation model for user
     */
    async getVideoGenerationModel(userId: string): Promise<string> {
        return this.getUserPreferredModel(userId, "video-generation");
    }

    // ========================================================================
    // PROVIDER HELPERS
    // ========================================================================

    /**
     * Get provider info for a model
     * Used by agent.ts to instantiate the correct SDK
     */
    async getModelProviderInfo(modelId: string): Promise<{
        provider: ModelProvider;
        modelPath: string;      // Path to use with provider SDK
        displayName: string;
        providerType: ModelProvider;
    } | null> {
        await this.initialize();

        const model = this.models.get(modelId);
        if (!model) return null;

        // Direct providers use model.name, OpenRouter uses model.id
        const modelPath = model.provider === "openrouter" ? model.id : model.name;

        return {
            provider: model.provider,
            modelPath,
            displayName: model.displayName,
            providerType: model.provider,
        };
    }

    // ========================================================================
    // PRIVATE HELPERS
    // ========================================================================

    private _useCaseToKey(useCase: ModelUseCase): string {
        const map: Record<ModelUseCase, keyof UserModelPreferences> = {
            coding: "coding",
            "image-generation": "imageGeneration",
            "video-generation": "videoGeneration",
            orchestrator: "orchestrator",
            memory: "memory",
        };
        return map[useCase];
    }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const modelService = new ModelService();
