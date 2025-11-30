/**
 * Admin AI Models - Sync/Seed Operations
 *
 * POST /api/admin/ai-models/sync - Sync database with JSON config
 *
 * Operations:
 * - seed: Add all models from JSON that don't exist in DB
 * - reset: Delete all models and re-seed from JSON config
 * - refresh: Refresh registry cache from database
 *
 * Single Source of Truth: src/data/ai-models.json
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, getAdminUser } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import {
    modelRegistry,
    toDbProvider,
    toDbTier,
    toDbUseCase,
    toDbInputType,
    toDbOutputType,
} from "@/lib/models/registry";
import type {
    ModelProvider,
    ModelTier,
    ModelUseCase,
    ModelInputType,
    ModelOutputType,
} from "@/lib/models/registry";
import { AI_MODELS, AI_MODEL_DEFAULTS, type AIModelData } from "@/data";
import { z } from "zod";

const syncOperationSchema = z.object({
    operation: z.enum(["seed", "reset", "refresh"]),
    dryRun: z.boolean().default(false),
});

export async function POST(request: NextRequest) {
    const adminCheck = await requireAdmin(request);
    if (adminCheck) return adminCheck;

    const admin = await getAdminUser(request);
    if (!admin) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const validated = syncOperationSchema.parse(body);

        switch (validated.operation) {
            case "seed": {
                // Get existing model IDs
                const existingModels = await prisma.aIModel.findMany({
                    select: { id: true },
                });
                const existingIds = new Set(existingModels.map((m) => m.id));

                // Find models to add from JSON config
                const modelsToAdd = AI_MODELS.filter((m) => !existingIds.has(m.id));

                if (validated.dryRun) {
                    return NextResponse.json({
                        success: true,
                        dryRun: true,
                        modelsToAdd: modelsToAdd.map((m) => ({
                            id: m.id,
                            displayName: m.displayName,
                            provider: m.provider,
                            useCase: m.useCase,
                        })),
                        existing: existingModels.length,
                    });
                }

                // Add missing models
                let added = 0;
                for (const model of modelsToAdd) {
                    const isDefault = AI_MODEL_DEFAULTS[model.useCase] === model.id;

                    await createModelFromData(model, isDefault, added, admin.id);
                    added++;
                }

                // Set up defaults
                await setupDefaults(admin.id);

                // Log audit
                await prisma.aIModelAuditLog.create({
                    data: {
                        action: "seeded",
                        changes: {
                            added,
                            modelIds: modelsToAdd.map((m) => m.id),
                        },
                        performedBy: admin.id,
                    },
                });

                modelRegistry.invalidateCache();

                return NextResponse.json({
                    success: true,
                    operation: "seed",
                    added,
                    existing: existingModels.length,
                    total: existingModels.length + added,
                });
            }

            case "reset": {
                if (validated.dryRun) {
                    const currentCount = await prisma.aIModel.count();
                    return NextResponse.json({
                        success: true,
                        dryRun: true,
                        willDelete: currentCount,
                        willAdd: AI_MODELS.length,
                    });
                }

                // Delete all models (cascades to capabilities and pricing)
                const deleted = await prisma.aIModel.deleteMany();

                // Add all models from JSON config
                let added = 0;
                for (const model of AI_MODELS) {
                    const isDefault = AI_MODEL_DEFAULTS[model.useCase] === model.id;

                    await createModelFromData(model, isDefault, added, admin.id);
                    added++;
                }

                // Set up defaults
                await setupDefaults(admin.id);

                // Log audit
                await prisma.aIModelAuditLog.create({
                    data: {
                        action: "reset",
                        changes: { deleted: deleted.count, added },
                        performedBy: admin.id,
                    },
                });

                modelRegistry.invalidateCache();

                return NextResponse.json({
                    success: true,
                    operation: "reset",
                    deleted: deleted.count,
                    added,
                });
            }

            case "refresh": {
                modelRegistry.invalidateCache();
                await modelRegistry.refresh();

                return NextResponse.json({
                    success: true,
                    operation: "refresh",
                    message: "Registry cache refreshed",
                });
            }
        }
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Validation failed", details: error.issues },
                { status: 400 }
            );
        }
        console.error("Sync operation failed:", error);
        return NextResponse.json({ error: "Sync operation failed" }, { status: 500 });
    }
}

/**
 * Create a model in the database from JSON data
 */
async function createModelFromData(
    model: AIModelData,
    isDefault: boolean,
    sortOrder: number,
    adminId: string
) {
    await prisma.aIModel.create({
        data: {
            id: model.id,
            name: model.name,
            displayName: model.displayName,
            provider: toDbProvider(model.provider as ModelProvider),
            tier: toDbTier(model.tier as ModelTier),
            description: model.description,
            useCase: toDbUseCase(model.useCase as ModelUseCase),
            isEnabled: true,
            isDefault,
            isSystem: model.isSystem,
            sortOrder,
            createdBy: adminId,
            capabilities: {
                create: {
                    supportedInputs: model.capabilities.supportedInputs.map((t) =>
                        toDbInputType(t as ModelInputType)
                    ),
                    supportedOutputs: model.capabilities.supportedOutputs.map((t) =>
                        toDbOutputType(t as ModelOutputType)
                    ),
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
}

/**
 * Set up default models from JSON config
 */
async function setupDefaults(adminId: string) {
    const useCaseMap: Record<string, string> = {
        orchestrator: "ORCHESTRATOR",
        memory: "MEMORY",
        coding: "CODING",
        "image-generation": "IMAGE_GENERATION",
        "video-generation": "VIDEO_GENERATION",
    };

    for (const [useCase, modelId] of Object.entries(AI_MODEL_DEFAULTS)) {
        const dbUseCase = useCaseMap[useCase];
        if (!dbUseCase) continue;

        await prisma.aIModelDefaults.upsert({
            where: { useCase: dbUseCase as any },
            create: {
                useCase: dbUseCase as any,
                modelId,
                updatedBy: adminId,
            },
            update: {
                modelId,
                updatedBy: adminId,
            },
        });
    }
}
