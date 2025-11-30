/**
 * Admin AI Models API
 *
 * Full CRUD API for managing AI model configurations
 * 
 * GET    /api/admin/ai-models          - List all models with stats
 * POST   /api/admin/ai-models          - Create a new model
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, getAdminUser } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { modelRegistry, toDbProvider, toDbTier, toDbUseCase, toDbInputType, toDbOutputType } from "@/lib/models/registry";
import type { ModelConfig, ModelProvider, ModelTier, ModelUseCase, ModelInputType, ModelOutputType, ModelCapabilities, ModelPricing } from "@/lib/models/registry";
import { z } from "zod";

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const capabilitiesSchema = z.object({
    supportedInputs: z.array(z.enum(["text", "image", "audio", "video", "pdf", "document"])),
    supportedOutputs: z.array(z.enum(["text", "code", "image", "audio", "video", "structured-data"])),
    maxContextLength: z.number().optional(),
    supportsStreaming: z.boolean(),
    supportsSystemPrompts: z.boolean(),
    supportsWebSearch: z.boolean(),
    supportsFunctionCalling: z.boolean(),
    supportsJsonMode: z.boolean(),
});

const pricingSchema = z.object({
    inputTokens: z.number(),
    outputTokens: z.number(),
    longContextThreshold: z.number().optional(),
    inputTokensLongContext: z.number().optional(),
    outputTokensLongContext: z.number().optional(),
    cacheCreation: z.number().optional(),
    cacheRead: z.number().optional(),
    cacheCreationLongContext: z.number().optional(),
    cacheReadLongContext: z.number().optional(),
    cacheDuration: z.string().optional(),
    imageInputTokens: z.number().optional(),
    audioInputTokens: z.number().optional(),
    videoInputTokens: z.number().optional(),
    audioOutputTokens: z.number().optional(),
    images: z.number().optional(),
    videoSeconds: z.number().optional(),
    webSearchFreePerDay: z.number().optional(),
    webSearch: z.number().optional(),
    mapsGroundingFreePerDay: z.number().optional(),
    mapsGrounding: z.number().optional(),
    pricingNotes: z.string().optional(),
});

const createModelSchema = z.object({
    id: z.string().regex(/^[a-z0-9-]+\/[a-z0-9.-]+$/, "ID must be in format: provider/model-name"),
    name: z.string().min(1),
    displayName: z.string().min(1),
    provider: z.enum(["anthropic", "openai", "google", "x-ai", "openrouter"]),
    tier: z.enum(["fast", "expert"]),
    description: z.string(),
    useCase: z.enum(["orchestrator", "memory", "coding", "image-generation", "video-generation"]),
    isEnabled: z.boolean().default(true),
    isDefault: z.boolean().default(false),
    isSystem: z.boolean().default(false),
    sortOrder: z.number().default(0),
    capabilities: capabilitiesSchema,
    pricing: pricingSchema.optional(),
});

// ============================================================================
// GET /api/admin/ai-models
// ============================================================================

export async function GET(request: NextRequest) {
    const adminCheck = await requireAdmin(request);
    if (adminCheck) return adminCheck;

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "30d";
    const useCase = searchParams.get("useCase");
    const provider = searchParams.get("provider");
    const includeDisabled = searchParams.get("includeDisabled") === "true";

    try {
        // Calculate date range for stats
        const now = new Date();
        let startDate: Date | undefined;

        switch (period) {
            case "1d":
                startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                break;
            case "7d":
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case "30d":
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            case "all":
                startDate = undefined;
                break;
        }

        // Get models from database
        const dbModels = await prisma.aIModel.findMany({
            where: {
                ...(useCase ? { useCase: toDbUseCase(useCase as ModelUseCase) } : {}),
                ...(provider ? { provider: toDbProvider(provider as ModelProvider) } : {}),
                ...(includeDisabled ? {} : { isEnabled: true }),
            },
            include: {
                capabilities: true,
                pricing: true,
            },
            orderBy: [
                { useCase: "asc" },
                { sortOrder: "asc" },
                { displayName: "asc" },
            ],
        });

        // Get usage stats per model
        const usageStats = await prisma.aICreditUsage.groupBy({
            by: ["model"],
            where: startDate ? { createdAt: { gte: startDate } } : undefined,
            _sum: {
                inputTokens: true,
                outputTokens: true,
                totalTokens: true,
                providerCostUsd: true,
            },
            _count: true,
        });

        // Get user preferences
        const modelPreferences = await prisma.user.groupBy({
            by: ["preferredCodingModel"],
            where: {
                preferredCodingModel: { not: null },
                deletedAt: null,
            },
            _count: true,
        });

        // Build response
        const models = dbModels.map(model => {
            const usage = usageStats.find(u => u.model === model.id) || {
                _count: 0,
                _sum: { inputTokens: 0, outputTokens: 0, totalTokens: 0, providerCostUsd: 0 },
            };
            const preference = modelPreferences.find(p => p.preferredCodingModel === model.id) || { _count: 0 };

            return {
                id: model.id,
                name: model.name,
                displayName: model.displayName,
                provider: model.provider.toLowerCase(),
                tier: model.tier.toLowerCase(),
                description: model.description,
                useCase: model.useCase.toLowerCase().replace("_", "-"),
                isEnabled: model.isEnabled,
                isDefault: model.isDefault,
                isSystem: model.isSystem,
                sortOrder: model.sortOrder,
                capabilities: model.capabilities ? {
                    supportedInputs: model.capabilities.supportedInputs.map(t => t.toLowerCase()),
                    supportedOutputs: model.capabilities.supportedOutputs.map(t => t.toLowerCase().replace("_", "-")),
                    maxContextLength: model.capabilities.maxContextLength,
                    supportsStreaming: model.capabilities.supportsStreaming,
                    supportsSystemPrompts: model.capabilities.supportsSystemPrompts,
                    supportsWebSearch: model.capabilities.supportsWebSearch,
                    supportsFunctionCalling: model.capabilities.supportsFunctionCalling,
                    supportsJsonMode: model.capabilities.supportsJsonMode,
                } : null,
                pricing: model.pricing ? {
                    inputTokens: model.pricing.inputTokens,
                    outputTokens: model.pricing.outputTokens,
                    longContextThreshold: model.pricing.longContextThreshold,
                    inputTokensLongContext: model.pricing.inputTokensLongContext,
                    outputTokensLongContext: model.pricing.outputTokensLongContext,
                    cacheCreation: model.pricing.cacheCreation,
                    cacheRead: model.pricing.cacheRead,
                    cacheCreationLongContext: model.pricing.cacheCreationLongContext,
                    cacheReadLongContext: model.pricing.cacheReadLongContext,
                    cacheDuration: model.pricing.cacheDuration,
                    imageInputTokens: model.pricing.imageInputTokens,
                    audioInputTokens: model.pricing.audioInputTokens,
                    videoInputTokens: model.pricing.videoInputTokens,
                    audioOutputTokens: model.pricing.audioOutputTokens,
                    images: model.pricing.images,
                    videoSeconds: model.pricing.videoSeconds,
                    webSearchFreePerDay: model.pricing.webSearchFreePerDay,
                    webSearch: model.pricing.webSearch,
                    mapsGroundingFreePerDay: model.pricing.mapsGroundingFreePerDay,
                    mapsGrounding: model.pricing.mapsGrounding,
                    pricingNotes: model.pricing.pricingNotes,
                } : null,
                stats: {
                    totalCalls: usage._count,
                    inputTokens: usage._sum.inputTokens || 0,
                    outputTokens: usage._sum.outputTokens || 0,
                    totalTokens: usage._sum.totalTokens || 0,
                    totalCost: usage._sum.providerCostUsd || 0,
                    usersPreferring: preference._count,
                },
                createdAt: model.createdAt,
                updatedAt: model.updatedAt,
            };
        });

        // Calculate totals
        const totals = {
            totalModels: dbModels.length,
            enabledModels: dbModels.filter(m => m.isEnabled).length,
            totalCalls: usageStats.reduce((sum, s) => sum + s._count, 0),
            totalInputTokens: usageStats.reduce((sum, s) => sum + (s._sum.inputTokens || 0), 0),
            totalOutputTokens: usageStats.reduce((sum, s) => sum + (s._sum.outputTokens || 0), 0),
            totalCost: usageStats.reduce((sum, s) => sum + (s._sum.providerCostUsd || 0), 0),
        };

        // Get defaults per use case
        const defaults = await prisma.aIModelDefaults.findMany();

        return NextResponse.json({
            models,
            totals,
            defaults: defaults.map(d => ({
                useCase: d.useCase.toLowerCase().replace("_", "-"),
                modelId: d.modelId,
            })),
            period,
            isFromDatabase: true,
        });
    } catch (error) {
        console.error("Failed to fetch AI models:", error);

        // Fallback to registry
        const allModels = await modelRegistry.getAllModels();

        return NextResponse.json({
            models: allModels.map(m => ({
                ...m,
                stats: { totalCalls: 0, inputTokens: 0, outputTokens: 0, totalTokens: 0, totalCost: 0, usersPreferring: 0 },
                createdAt: null,
                updatedAt: null,
            })),
            totals: { totalModels: allModels.length, enabledModels: allModels.filter(m => m.isEnabled).length, totalCalls: 0, totalInputTokens: 0, totalOutputTokens: 0, totalCost: 0 },
            defaults: [],
            period,
            isFromDatabase: false,
        });
    }
}

// ============================================================================
// POST /api/admin/ai-models
// ============================================================================

export async function POST(request: NextRequest) {
    const adminCheck = await requireAdmin(request);
    if (adminCheck) return adminCheck;

    const admin = await getAdminUser(request);
    if (!admin) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const validated = createModelSchema.parse(body);

        // Check if model already exists
        const existing = await prisma.aIModel.findUnique({
            where: { id: validated.id },
        });

        if (existing) {
            return NextResponse.json(
                { error: "Model with this ID already exists" },
                { status: 409 }
            );
        }

        // If setting as default, unset other defaults for this use case
        if (validated.isDefault) {
            await prisma.aIModel.updateMany({
                where: {
                    useCase: toDbUseCase(validated.useCase as ModelUseCase),
                    isDefault: true,
                },
                data: { isDefault: false },
            });
        }

        // Create model with capabilities and pricing
        const model = await prisma.aIModel.create({
            data: {
                id: validated.id,
                name: validated.name,
                displayName: validated.displayName,
                provider: toDbProvider(validated.provider as ModelProvider),
                tier: toDbTier(validated.tier as ModelTier),
                description: validated.description,
                useCase: toDbUseCase(validated.useCase as ModelUseCase),
                isEnabled: validated.isEnabled,
                isDefault: validated.isDefault,
                isSystem: validated.isSystem,
                sortOrder: validated.sortOrder,
                createdBy: admin.id,
                capabilities: {
                    create: {
                        supportedInputs: validated.capabilities.supportedInputs.map(t => toDbInputType(t as ModelInputType)),
                        supportedOutputs: validated.capabilities.supportedOutputs.map(t => toDbOutputType(t as ModelOutputType)),
                        maxContextLength: validated.capabilities.maxContextLength,
                        supportsStreaming: validated.capabilities.supportsStreaming,
                        supportsSystemPrompts: validated.capabilities.supportsSystemPrompts,
                        supportsWebSearch: validated.capabilities.supportsWebSearch,
                        supportsFunctionCalling: validated.capabilities.supportsFunctionCalling,
                        supportsJsonMode: validated.capabilities.supportsJsonMode,
                    },
                },
                ...(validated.pricing ? {
                    pricing: {
                        create: {
                            inputTokens: validated.pricing.inputTokens,
                            outputTokens: validated.pricing.outputTokens,
                            longContextThreshold: validated.pricing.longContextThreshold,
                            inputTokensLongContext: validated.pricing.inputTokensLongContext,
                            outputTokensLongContext: validated.pricing.outputTokensLongContext,
                            cacheCreation: validated.pricing.cacheCreation,
                            cacheRead: validated.pricing.cacheRead,
                            cacheCreationLongContext: validated.pricing.cacheCreationLongContext,
                            cacheReadLongContext: validated.pricing.cacheReadLongContext,
                            cacheDuration: validated.pricing.cacheDuration,
                            imageInputTokens: validated.pricing.imageInputTokens,
                            audioInputTokens: validated.pricing.audioInputTokens,
                            videoInputTokens: validated.pricing.videoInputTokens,
                            audioOutputTokens: validated.pricing.audioOutputTokens,
                            images: validated.pricing.images,
                            videoSeconds: validated.pricing.videoSeconds,
                            webSearchFreePerDay: validated.pricing.webSearchFreePerDay,
                            webSearch: validated.pricing.webSearch,
                            mapsGroundingFreePerDay: validated.pricing.mapsGroundingFreePerDay,
                            mapsGrounding: validated.pricing.mapsGrounding,
                            pricingNotes: validated.pricing.pricingNotes,
                        },
                    },
                } : {}),
            },
            include: {
                capabilities: true,
                pricing: true,
            },
        });

        // Log audit
        await prisma.aIModelAuditLog.create({
            data: {
                modelId: model.id,
                action: "created",
                changes: JSON.parse(JSON.stringify(validated)),
                performedBy: admin.id,
            },
        });

        // Invalidate registry cache
        modelRegistry.invalidateCache();

        return NextResponse.json({
            success: true,
            model,
        }, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Validation failed", details: error.issues },
                { status: 400 }
            );
        }
        console.error("Failed to create model:", error);
        return NextResponse.json(
            { error: "Failed to create model" },
            { status: 500 }
        );
    }
}
