/**
 * Seed AI Models into Database
 * 
 * Run with: npx ts-node scripts/seed-ai-models.ts
 * 
 * This script:
 * 1. Loads models from src/data/ai-models.json
 * 2. Upserts them into the AIModel, AIModelCapabilities, AIModelPricing tables
 * 3. Sets up AIModelDefaults for each use case
 */

import { PrismaClient } from "@prisma/client";
import aiModelsData from "../src/data/ai-models.json";

const prisma = new PrismaClient();

// Type definitions matching the JSON structure
interface AIModelData {
    id: string;
    name: string;
    displayName: string;
    provider: "anthropic" | "openai" | "google" | "x-ai" | "openrouter";
    tier: "fast" | "expert";
    description: string;
    useCase: "orchestrator" | "memory" | "coding" | "image-generation" | "video-generation";
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

// Map JSON values to Prisma enums
const providerMap = {
    anthropic: "ANTHROPIC",
    openai: "OPENAI",
    google: "GOOGLE",
    "x-ai": "XAI",
    openrouter: "OPENROUTER",
} as const;

const tierMap = {
    fast: "FAST",
    expert: "EXPERT",
} as const;

const useCaseMap = {
    orchestrator: "ORCHESTRATOR",
    memory: "MEMORY",
    coding: "CODING",
    "image-generation": "IMAGE_GENERATION",
    "video-generation": "VIDEO_GENERATION",
} as const;

const inputTypeMap = {
    text: "TEXT",
    image: "IMAGE",
    audio: "AUDIO",
    video: "VIDEO",
    pdf: "PDF",
    document: "DOCUMENT",
} as const;

const outputTypeMap = {
    text: "TEXT",
    code: "CODE",
    image: "IMAGE",
    audio: "AUDIO",
    video: "VIDEO",
    "structured-data": "STRUCTURED_DATA",
} as const;

async function seedModels() {
    console.log("🌱 Starting AI model seed...\n");

    const models = aiModelsData.models as AIModelData[];
    const defaults = aiModelsData.defaults as Record<string, string>;

    let created = 0;
    let updated = 0;

    for (let i = 0; i < models.length; i++) {
        const model = models[i];
        const isDefault = defaults[model.useCase] === model.id;

        console.log(`[${i + 1}/${models.length}] Processing: ${model.displayName}`);

        try {
            // Check if model exists
            const existing = await prisma.aIModel.findUnique({
                where: { id: model.id },
            });

            // Prepare model data
            const modelData = {
                id: model.id,
                name: model.name,
                displayName: model.displayName,
                provider: providerMap[model.provider],
                tier: tierMap[model.tier],
                description: model.description,
                useCase: useCaseMap[model.useCase],
                isEnabled: true,
                isDefault,
                isSystem: model.isSystem,
                sortOrder: i,
            };

            // Prepare capabilities data
            const capabilitiesData = {
                supportedInputs: model.capabilities.supportedInputs.map(
                    (t) => inputTypeMap[t as keyof typeof inputTypeMap]
                ),
                supportedOutputs: model.capabilities.supportedOutputs.map(
                    (t) => outputTypeMap[t as keyof typeof outputTypeMap]
                ),
                maxContextLength: model.capabilities.maxContextLength ?? null,
                supportsStreaming: model.capabilities.supportsStreaming,
                supportsSystemPrompts: model.capabilities.supportsSystemPrompts,
                supportsWebSearch: model.capabilities.supportsWebSearch,
                supportsFunctionCalling: model.capabilities.supportsFunctionCalling,
                supportsJsonMode: model.capabilities.supportsJsonMode,
            };

            // Prepare pricing data
            const pricingData = {
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
            };

            if (existing) {
                // Update existing model
                await prisma.aIModel.update({
                    where: { id: model.id },
                    data: modelData,
                });

                // Update capabilities
                await prisma.aIModelCapabilities.upsert({
                    where: { modelId: model.id },
                    create: { modelId: model.id, ...capabilitiesData },
                    update: capabilitiesData,
                });

                // Update pricing
                await prisma.aIModelPricing.upsert({
                    where: { modelId: model.id },
                    create: { modelId: model.id, ...pricingData },
                    update: pricingData,
                });

                updated++;
                console.log(`   ✅ Updated: ${model.displayName}`);
            } else {
                // Create new model with relations
                await prisma.aIModel.create({
                    data: {
                        ...modelData,
                        capabilities: {
                            create: capabilitiesData,
                        },
                        pricing: {
                            create: pricingData,
                        },
                    },
                });

                created++;
                console.log(`   ✨ Created: ${model.displayName}`);
            }
        } catch (error) {
            console.error(`   ❌ Error processing ${model.displayName}:`, error);
        }
    }

    // Seed defaults
    console.log("\n🎯 Setting up model defaults...\n");

    for (const [useCase, modelId] of Object.entries(defaults)) {
        const useCaseEnum = useCaseMap[useCase as keyof typeof useCaseMap];

        try {
            await prisma.aIModelDefaults.upsert({
                where: { useCase: useCaseEnum },
                create: {
                    useCase: useCaseEnum,
                    modelId,
                },
                update: {
                    modelId,
                },
            });
            console.log(`   ✅ Default for ${useCase}: ${modelId}`);
        } catch (error) {
            console.error(`   ❌ Error setting default for ${useCase}:`, error);
        }
    }

    console.log("\n📊 Seed Summary:");
    console.log(`   Created: ${created} models`);
    console.log(`   Updated: ${updated} models`);
    console.log(`   Total: ${models.length} models`);
    console.log("\n✅ AI model seed complete!");
}

// Run the seed
seedModels()
    .catch((error) => {
        console.error("❌ Seed failed:", error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
