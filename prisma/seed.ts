/**
 * Database Seed Script
 *
 * Seeds the database with initial data from the single source of truth.
 * AI Models are loaded from: src/data/ai-models.json
 */

import {
    PrismaClient,
    AIModelProvider,
    AIModelTier,
    AIModelUseCase,
    AIModelInputType,
    AIModelOutputType,
} from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

// Import from the single source of truth
import aiModelsData from "../src/data/ai-models.json";

// Create Neon adapter
const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// Type definitions for JSON data
interface ModelData {
    id: string;
    name: string;
    displayName: string;
    provider: string;
    tier: string;
    description: string;
    useCase: string;
    isSystem: boolean;
    capabilities: {
        supportedInputs: string[];
        supportedOutputs: string[];
        maxContextLength?: number;
        supportsStreaming: boolean;
        supportsSystemPrompts: boolean;
        supportsWebSearch: boolean;
        supportsFunctionCalling: boolean;
        supportsJsonMode: boolean;
    };
    pricing: {
        inputTokens: number;
        outputTokens: number;
        longContextThreshold?: number;
        inputTokensLongContext?: number;
        outputTokensLongContext?: number;
        cacheCreation?: number;
        cacheRead?: number;
        cacheCreationLongContext?: number;
        cacheReadLongContext?: number;
        cacheDuration?: string;
        imageInputTokens?: number;
        audioInputTokens?: number;
        videoInputTokens?: number;
        audioOutputTokens?: number;
        images?: number;
        videoSeconds?: number;
        webSearchFreePerDay?: number;
        webSearch?: number;
        mapsGroundingFreePerDay?: number;
        mapsGrounding?: number;
    };
}

interface ModelsConfig {
    version: string;
    lastUpdated: string;
    defaults: Record<string, string>;
    models: ModelData[];
}

const modelsConfig = aiModelsData as ModelsConfig;

// ============================================================================
// ENUM CONVERTERS
// ============================================================================

function toDbProvider(provider: string): AIModelProvider {
    const map: Record<string, AIModelProvider> = {
        anthropic: "ANTHROPIC",
        openai: "OPENAI",
        google: "GOOGLE",
        "x-ai": "XAI",
        openrouter: "OPENROUTER",
    };
    return map[provider] || "OPENROUTER";
}

function toDbTier(tier: string): AIModelTier {
    return tier.toUpperCase() as AIModelTier;
}

function toDbUseCase(useCase: string): AIModelUseCase {
    const map: Record<string, AIModelUseCase> = {
        orchestrator: "ORCHESTRATOR",
        memory: "MEMORY",
        coding: "CODING",
        "image-generation": "IMAGE_GENERATION",
        "video-generation": "VIDEO_GENERATION",
    };
    return map[useCase] || "CODING";
}

function toDbInputType(type: string): AIModelInputType {
    return type.toUpperCase() as AIModelInputType;
}

function toDbOutputType(type: string): AIModelOutputType {
    const map: Record<string, AIModelOutputType> = {
        text: "TEXT",
        code: "CODE",
        image: "IMAGE",
        audio: "AUDIO",
        video: "VIDEO",
        "structured-data": "STRUCTURED_DATA",
    };
    return map[type] || "TEXT";
}

async function main() {
    console.log("🌱 Seeding database...");
    console.log(`📦 Loading models from ai-models.json v${modelsConfig.version}`);

    // ========================================================================
    // AI MODELS SEEDING
    // ========================================================================
    console.log("\n🤖 Seeding AI models...");

    const existingModels = await prisma.aIModel.findMany({
        select: { id: true },
    });
    const existingIds = new Set(existingModels.map((m) => m.id));

    let addedCount = 0;

    for (let i = 0; i < modelsConfig.models.length; i++) {
        const model = modelsConfig.models[i];

        if (existingIds.has(model.id)) {
            console.log(`   ⏭️  Model ${model.id} already exists, skipping`);
            continue;
        }

        // Check if this model is the default for its use case
        const isDefault = modelsConfig.defaults[model.useCase] === model.id;

        await prisma.aIModel.create({
            data: {
                id: model.id,
                name: model.name,
                displayName: model.displayName,
                provider: toDbProvider(model.provider),
                tier: toDbTier(model.tier),
                description: model.description,
                useCase: toDbUseCase(model.useCase),
                isEnabled: true,
                isDefault,
                isSystem: model.isSystem,
                sortOrder: i,
                capabilities: {
                    create: {
                        supportedInputs: model.capabilities.supportedInputs.map(toDbInputType),
                        supportedOutputs: model.capabilities.supportedOutputs.map(toDbOutputType),
                        maxContextLength: model.capabilities.maxContextLength,
                        supportsStreaming: model.capabilities.supportsStreaming,
                        supportsSystemPrompts: model.capabilities.supportsSystemPrompts,
                        supportsWebSearch: model.capabilities.supportsWebSearch,
                        supportsFunctionCalling: model.capabilities.supportsFunctionCalling,
                        supportsJsonMode: model.capabilities.supportsJsonMode,
                    },
                },
                pricing: {
                    create: {
                        inputTokens: model.pricing.inputTokens,
                        outputTokens: model.pricing.outputTokens,
                        longContextThreshold: model.pricing.longContextThreshold ?? null,
                        inputTokensLongContext: model.pricing.inputTokensLongContext ?? null,
                        outputTokensLongContext: model.pricing.outputTokensLongContext ?? null,
                        cacheCreation: model.pricing.cacheCreation ?? null,
                        cacheRead: model.pricing.cacheRead ?? null,
                        cacheCreationLongContext: model.pricing.cacheCreationLongContext ?? null,
                        cacheReadLongContext: model.pricing.cacheReadLongContext ?? null,
                        cacheDuration: model.pricing.cacheDuration ?? null,
                        imageInputTokens: model.pricing.imageInputTokens ?? null,
                        audioInputTokens: model.pricing.audioInputTokens ?? null,
                        videoInputTokens: model.pricing.videoInputTokens ?? null,
                        audioOutputTokens: model.pricing.audioOutputTokens ?? null,
                        images: model.pricing.images ?? null,
                        videoSeconds: model.pricing.videoSeconds ?? null,
                        webSearchFreePerDay: model.pricing.webSearchFreePerDay ?? null,
                        webSearch: model.pricing.webSearch ?? null,
                        mapsGroundingFreePerDay: model.pricing.mapsGroundingFreePerDay ?? null,
                        mapsGrounding: model.pricing.mapsGrounding ?? null,
                    },
                },
            },
        });

        console.log(`   ✅ Added model: ${model.displayName} (${model.id})`);
        addedCount++;
    }

    console.log(`   📊 Added ${addedCount} new models, ${existingModels.length} already existed`);

    // ========================================================================
    // DEFAULT MODELS SEEDING
    // ========================================================================
    console.log("\n⭐ Setting default models...");

    const useCaseMap: Record<string, AIModelUseCase> = {
        orchestrator: "ORCHESTRATOR",
        memory: "MEMORY",
        coding: "CODING",
        "image-generation": "IMAGE_GENERATION",
        "video-generation": "VIDEO_GENERATION",
    };

    for (const [useCase, modelId] of Object.entries(modelsConfig.defaults)) {
        const dbUseCase = useCaseMap[useCase];
        if (!dbUseCase) continue;

        await prisma.aIModelDefaults.upsert({
            where: { useCase: dbUseCase },
            create: {
                useCase: dbUseCase,
                modelId,
            },
            update: {
                modelId,
            },
        });

        console.log(`   ✅ ${useCase} → ${modelId}`);
    }

    // ========================================================================
    // USER MODEL PREFERENCES SYNC
    // ========================================================================
    console.log("\n🔄 Syncing user model preferences...");

    const availableCodingModels = await prisma.aIModel.findMany({
        where: {
            useCase: "CODING",
            isEnabled: true,
        },
        select: { id: true },
    });
    const availableModelIds = availableCodingModels.map((m) => m.id);

    const defaultCodingModel = modelsConfig.defaults.coding;

    console.log(`   Available coding models: ${availableModelIds.length}`);
    console.log(`   Default: ${defaultCodingModel}`);

    const users = await prisma.user.findMany({
        select: {
            id: true,
            email: true,
            preferredCodingModel: true,
            enabledCodingModels: true,
        },
    });

    console.log(`   Found ${users.length} users to check`);

    let updatedCount = 0;

    for (const user of users) {
        let needsUpdate = false;
        const updates: Record<string, unknown> = {};

        // Filter out invalid models from enabled list
        const validEnabledModels = user.enabledCodingModels.filter((modelId: string) =>
            availableModelIds.includes(modelId)
        );

        if (validEnabledModels.length !== user.enabledCodingModels.length) {
            needsUpdate = true;
            updates.enabledCodingModels = validEnabledModels.length > 0 ? validEnabledModels : availableModelIds;
        }

        if (validEnabledModels.length === 0) {
            needsUpdate = true;
            updates.enabledCodingModels = availableModelIds;
        }

        if (user.preferredCodingModel && !availableModelIds.includes(user.preferredCodingModel)) {
            needsUpdate = true;
            updates.preferredCodingModel = defaultCodingModel;
        }

        const finalEnabledModels = (updates.enabledCodingModels as string[]) || validEnabledModels;
        const finalPreferredModel = (updates.preferredCodingModel as string) || user.preferredCodingModel || defaultCodingModel;

        if (!finalEnabledModels.includes(finalPreferredModel)) {
            needsUpdate = true;
            updates.enabledCodingModels = [...finalEnabledModels, finalPreferredModel];
        }

        if (needsUpdate) {
            await prisma.user.update({
                where: { id: user.id },
                data: updates,
            });
            updatedCount++;
            console.log(`   ⚠️  Updated ${user.email}`);
        }
    }

    console.log(`   ✅ Updated ${updatedCount} users with valid model preferences`);

    // ========================================================================
    // SUMMARY
    // ========================================================================
    console.log("\n✅ Seed completed!");
    console.log(`   📦 Models config version: ${modelsConfig.version}`);
    console.log(`   📅 Last updated: ${modelsConfig.lastUpdated}`);
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error("❌ Error seeding database:", e);
        await prisma.$disconnect();
        process.exit(1);
    });
