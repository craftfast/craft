/**
 * AI Model Registry Service
 * 
 * Single source of truth for AI model configurations.
 * Loads models from database with fallback to hardcoded config.
 * 
 * Features:
 * - Database-driven configuration (admin manageable)
 * - Fallback to hardcoded config if DB is unavailable
 * - Caching for performance
 * - Multi-provider support (Anthropic, OpenAI, Google, X-AI, OpenRouter)
 */

import { prisma } from "@/lib/db";
import type {
    AIModel,
    AIModelCapabilities,
    AIModelPricing,
    AIModelProvider as PrismaProvider,
    AIModelTier as PrismaTier,
    AIModelUseCase as PrismaUseCase,
    AIModelInputType as PrismaInputType,
    AIModelOutputType as PrismaOutputType,
} from "@prisma/client";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type ModelProvider = "anthropic" | "openrouter" | "openai" | "google" | "x-ai";
export type ModelTier = "fast" | "expert";
export type ModelUseCase = "orchestrator" | "memory" | "coding" | "image-generation" | "video-generation";
export type ModelInputType = "text" | "image" | "audio" | "video" | "pdf" | "document";
export type ModelOutputType = "text" | "code" | "image" | "audio" | "video" | "structured-data";

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

export interface ModelConfig {
    id: string;
    name: string;
    displayName: string;
    provider: ModelProvider;
    tier: ModelTier;
    description: string;
    useCase: ModelUseCase;
    capabilities: ModelCapabilities;
    pricing?: ModelPricing;
    isEnabled: boolean;
    isDefault: boolean;
    isSystem: boolean;
    sortOrder: number;
}

// ============================================================================
// ENUM CONVERTERS
// ============================================================================

function convertProvider(provider: PrismaProvider): ModelProvider {
    const map: Record<PrismaProvider, ModelProvider> = {
        ANTHROPIC: "anthropic",
        OPENAI: "openai",
        GOOGLE: "google",
        XAI: "x-ai",
        OPENROUTER: "openrouter",
    };
    return map[provider];
}

function convertTier(tier: PrismaTier): ModelTier {
    return tier.toLowerCase() as ModelTier;
}

function convertUseCase(useCase: PrismaUseCase): ModelUseCase {
    const map: Record<PrismaUseCase, ModelUseCase> = {
        ORCHESTRATOR: "orchestrator",
        MEMORY: "memory",
        CODING: "coding",
        IMAGE_GENERATION: "image-generation",
        VIDEO_GENERATION: "video-generation",
    };
    return map[useCase];
}

function convertInputType(type: PrismaInputType): ModelInputType {
    return type.toLowerCase() as ModelInputType;
}

function convertOutputType(type: PrismaOutputType): ModelOutputType {
    const map: Record<PrismaOutputType, ModelOutputType> = {
        TEXT: "text",
        CODE: "code",
        IMAGE: "image",
        AUDIO: "audio",
        VIDEO: "video",
        STRUCTURED_DATA: "structured-data",
    };
    return map[type];
}

// Reverse converters for saving to DB
export function toDbProvider(provider: ModelProvider): PrismaProvider {
    const map: Record<ModelProvider, PrismaProvider> = {
        anthropic: "ANTHROPIC",
        openai: "OPENAI",
        google: "GOOGLE",
        "x-ai": "XAI",
        openrouter: "OPENROUTER",
    };
    return map[provider];
}

export function toDbTier(tier: ModelTier): PrismaTier {
    return tier.toUpperCase() as PrismaTier;
}

export function toDbUseCase(useCase: ModelUseCase): PrismaUseCase {
    const map: Record<ModelUseCase, PrismaUseCase> = {
        orchestrator: "ORCHESTRATOR",
        memory: "MEMORY",
        coding: "CODING",
        "image-generation": "IMAGE_GENERATION",
        "video-generation": "VIDEO_GENERATION",
    };
    return map[useCase];
}

export function toDbInputType(type: ModelInputType): PrismaInputType {
    return type.toUpperCase() as PrismaInputType;
}

export function toDbOutputType(type: ModelOutputType): PrismaOutputType {
    const map: Record<ModelOutputType, PrismaOutputType> = {
        text: "TEXT",
        code: "CODE",
        image: "IMAGE",
        audio: "AUDIO",
        video: "VIDEO",
        "structured-data": "STRUCTURED_DATA",
    };
    return map[type];
}

// ============================================================================
// DATABASE TO MODEL CONVERTER
// ============================================================================

type DBModelWithRelations = AIModel & {
    capabilities: AIModelCapabilities | null;
    pricing: AIModelPricing | null;
};

function dbToModelConfig(dbModel: DBModelWithRelations): ModelConfig {
    const capabilities: ModelCapabilities = dbModel.capabilities
        ? {
            supportedInputs: dbModel.capabilities.supportedInputs.map(convertInputType),
            supportedOutputs: dbModel.capabilities.supportedOutputs.map(convertOutputType),
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
        provider: convertProvider(dbModel.provider),
        tier: convertTier(dbModel.tier),
        description: dbModel.description,
        useCase: convertUseCase(dbModel.useCase),
        capabilities,
        pricing,
        isEnabled: dbModel.isEnabled,
        isDefault: dbModel.isDefault,
        isSystem: dbModel.isSystem,
        sortOrder: dbModel.sortOrder,
    };
}

// ============================================================================
// MODEL REGISTRY CLASS
// ============================================================================

class ModelRegistry {
    private models: Map<string, ModelConfig> = new Map();
    private initialized = false;
    private initPromise: Promise<void> | null = null;
    private lastRefresh: Date | null = null;
    private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

    /**
     * Initialize the registry by loading models from database
     * Falls back to hardcoded config if database is unavailable
     */
    async initialize(forceRefresh = false): Promise<void> {
        // If already initializing, wait for that to complete
        if (this.initPromise && !forceRefresh) {
            return this.initPromise;
        }

        // Check if cache is still valid
        if (this.initialized && !forceRefresh && this.lastRefresh) {
            const cacheAge = Date.now() - this.lastRefresh.getTime();
            if (cacheAge < this.CACHE_TTL_MS) {
                return;
            }
        }

        this.initPromise = this._doInitialize();
        await this.initPromise;
        this.initPromise = null;
    }

    private async _doInitialize(): Promise<void> {
        try {
            // Try to load from database
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
                console.log(`📦 Loaded ${dbModels.length} AI models from database`);
                this.models.clear();

                for (const dbModel of dbModels) {
                    const config = dbToModelConfig(dbModel);
                    this.models.set(config.id, config);
                }
            } else {
                console.log("⚠️ No models in database, using fallback config");
                await this._loadFallbackConfig();
            }

            this.initialized = true;
            this.lastRefresh = new Date();
        } catch (error) {
            console.error("❌ Failed to load models from database:", error);
            console.log("⚠️ Falling back to hardcoded config");
            await this._loadFallbackConfig();
            this.initialized = true;
            this.lastRefresh = new Date();
        }
    }

    private async _loadFallbackConfig(): Promise<void> {
        // Import fallback config dynamically to avoid circular dependencies
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
                isDefault: false,
                isSystem: model.isSystem,
                sortOrder: 0,
            });
        }
    }

    /**
     * Force refresh models from database
     */
    async refresh(): Promise<void> {
        await this.initialize(true);
    }

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
     * Get models by use case
     */
    async getModelsByUseCase(useCase: ModelUseCase): Promise<ModelConfig[]> {
        await this.initialize();
        return Array.from(this.models.values())
            .filter(m => m.useCase === useCase && m.isEnabled)
            .sort((a, b) => a.sortOrder - b.sortOrder);
    }

    /**
     * Get coding models (user-selectable)
     */
    async getCodingModels(): Promise<ModelConfig[]> {
        return this.getModelsByUseCase("coding");
    }

    /**
     * Get the default model for a use case
     */
    async getDefaultModel(useCase: ModelUseCase): Promise<ModelConfig | null> {
        await this.initialize();

        // First try to find a model marked as default
        const defaultModel = Array.from(this.models.values())
            .find(m => m.useCase === useCase && m.isDefault && m.isEnabled);

        if (defaultModel) return defaultModel;

        // Fall back to first enabled model for that use case
        const models = await this.getModelsByUseCase(useCase);
        return models[0] || null;
    }

    /**
     * Get the default coding model
     */
    async getDefaultCodingModel(): Promise<string> {
        const model = await this.getDefaultModel("coding");
        return model?.id || "anthropic/claude-sonnet-4.5";
    }

    /**
     * Get the naming/orchestrator model (system, fixed)
     */
    async getNamingModel(): Promise<string> {
        const model = await this.getDefaultModel("orchestrator");
        return model?.id || "x-ai/grok-4-1-fast";
    }

    /**
     * Get the memory model (system, fixed)
     */
    async getMemoryModel(): Promise<string> {
        const model = await this.getDefaultModel("memory");
        return model?.id || "x-ai/grok-4-1-fast";
    }

    /**
     * Get the image generation model
     */
    async getImageGenerationModel(): Promise<string> {
        const model = await this.getDefaultModel("image-generation");
        return model?.id || "google/gemini-2.5-flash-image";
    }

    /**
     * Get all model IDs
     */
    async getAllModelIds(): Promise<string[]> {
        await this.initialize();
        return Array.from(this.models.keys());
    }

    /**
     * Get default enabled coding models (for new users)
     */
    async getDefaultEnabledCodingModels(): Promise<string[]> {
        const models = await this.getCodingModels();
        return models.map(m => m.id);
    }

    /**
     * Validate user's model selection
     */
    async getCodingModel(
        userPreference?: string | null,
        enabledModels?: string[]
    ): Promise<string> {
        const defaultModel = await this.getDefaultCodingModel();

        if (!userPreference) {
            return defaultModel;
        }

        const model = await this.getModel(userPreference);
        if (!model || model.useCase !== "coding" || !model.isEnabled) {
            return defaultModel;
        }

        if (enabledModels && !enabledModels.includes(userPreference)) {
            return defaultModel;
        }

        return userPreference;
    }

    /**
     * Check if registry has been initialized with DB data
     */
    isFromDatabase(): boolean {
        return this.initialized && this.lastRefresh !== null;
    }

    /**
     * Invalidate cache (call after DB updates)
     */
    invalidateCache(): void {
        this.initialized = false;
        this.lastRefresh = null;
        this.models.clear();
    }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const modelRegistry = new ModelRegistry();

// ============================================================================
// CONVENIENCE FUNCTIONS (for backward compatibility)
// ============================================================================

export async function getModelConfig(modelId: string): Promise<ModelConfig | null> {
    return modelRegistry.getModel(modelId);
}

export async function getAllModelIds(): Promise<string[]> {
    return modelRegistry.getAllModelIds();
}

export async function getAvailableCodingModels(): Promise<ModelConfig[]> {
    return modelRegistry.getCodingModels();
}

export async function getDefaultCodingModel(): Promise<string> {
    return modelRegistry.getDefaultCodingModel();
}

export async function getDefaultEnabledCodingModels(): Promise<string[]> {
    return modelRegistry.getDefaultEnabledCodingModels();
}

export async function getCodingModel(
    userPreference?: string | null,
    enabledModels?: string[]
): Promise<string> {
    return modelRegistry.getCodingModel(userPreference, enabledModels);
}

export async function getNamingModel(): Promise<string> {
    return modelRegistry.getNamingModel();
}

export async function getMemoryModel(): Promise<string> {
    return modelRegistry.getMemoryModel();
}

export async function getOrchestratorModel(): Promise<string> {
    return modelRegistry.getNamingModel();
}

export async function getImageGenerationModel(): Promise<string> {
    return modelRegistry.getImageGenerationModel();
}

// Legacy tier-based functions
export async function getCodingModelByTier(tier: ModelTier): Promise<string> {
    const models = await modelRegistry.getCodingModels();
    const tierModel = models.find(m => m.tier === tier);
    return tierModel?.id || await modelRegistry.getDefaultCodingModel();
}

export async function getFastCodingModel(): Promise<string> {
    return getCodingModelByTier("fast");
}

export async function getExpertCodingModel(): Promise<string> {
    return getCodingModelByTier("expert");
}
