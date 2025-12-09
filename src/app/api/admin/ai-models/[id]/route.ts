/**
 * Admin AI Model API - Individual Model Operations
 *
 * GET    /api/admin/ai-models/[id]  - Get a single model
 * PUT    /api/admin/ai-models/[id]  - Update a model
 * DELETE /api/admin/ai-models/[id]  - Delete a model
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, getAdminUser } from "@/lib/admin-auth";
import { prisma, Prisma } from "@/lib/db";
import { modelRegistry, toDbProvider, toDbTier, toDbUseCase, toDbInputType, toDbOutputType } from "@/lib/models/registry";
import type { ModelProvider, ModelTier, ModelUseCase, ModelInputType, ModelOutputType } from "@/lib/models/registry";
import { z } from "zod";

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const updateModelSchema = z.object({
    name: z.string().min(1).optional(),
    displayName: z.string().min(1).optional(),
    provider: z.enum(["anthropic", "openai", "google", "x-ai", "openrouter"]).optional(),
    tier: z.enum(["fast", "expert"]).optional(),
    description: z.string().optional(),
    useCase: z.enum(["orchestrator", "memory", "coding", "image-generation", "video-generation"]).optional(),
    isEnabled: z.boolean().optional(),
    isDefault: z.boolean().optional(),
    isSystem: z.boolean().optional(),
    sortOrder: z.number().optional(),
    capabilities: z.object({
        supportedInputs: z.array(z.enum(["text", "image", "audio", "video", "pdf", "document"])),
        supportedOutputs: z.array(z.enum(["text", "code", "image", "audio", "video", "structured-data"])),
        maxContextLength: z.number().nullable().optional(),
        supportsStreaming: z.boolean(),
        supportsSystemPrompts: z.boolean(),
        supportsWebSearch: z.boolean(),
        supportsFunctionCalling: z.boolean(),
        supportsJsonMode: z.boolean(),
    }).optional(),
    pricing: z.object({
        inputTokens: z.number(),
        outputTokens: z.number(),
        longContextThreshold: z.number().nullable().optional(),
        inputTokensLongContext: z.number().nullable().optional(),
        outputTokensLongContext: z.number().nullable().optional(),
        cacheCreation: z.number().nullable().optional(),
        cacheRead: z.number().nullable().optional(),
        cacheCreationLongContext: z.number().nullable().optional(),
        cacheReadLongContext: z.number().nullable().optional(),
        cacheDuration: z.string().nullable().optional(),
        imageInputTokens: z.number().nullable().optional(),
        audioInputTokens: z.number().nullable().optional(),
        videoInputTokens: z.number().nullable().optional(),
        audioOutputTokens: z.number().nullable().optional(),
        images: z.number().nullable().optional(),
        videoSeconds: z.number().nullable().optional(),
        webSearchFreePerDay: z.number().nullable().optional(),
        webSearch: z.number().nullable().optional(),
        mapsGroundingFreePerDay: z.number().nullable().optional(),
        mapsGrounding: z.number().nullable().optional(),
        pricingNotes: z.string().nullable().optional(),
    }).optional(),
});

// ============================================================================
// GET /api/admin/ai-models/[id]
// ============================================================================

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const adminCheck = await requireAdmin(request);
    if (adminCheck) return adminCheck;

    const { id } = await params;
    const modelId = decodeURIComponent(id);

    try {
        const model = await prisma.aIModel.findUnique({
            where: { id: modelId },
            include: {
                capabilities: true,
                pricing: true,
            },
        });

        if (!model) {
            return NextResponse.json(
                { error: "Model not found" },
                { status: 404 }
            );
        }

        // Get usage stats for this model
        const usageStats = await prisma.aICreditUsage.aggregate({
            where: { model: modelId },
            _sum: {
                inputTokens: true,
                outputTokens: true,
                totalTokens: true,
                providerCostUsd: true,
            },
            _count: true,
        });

        // Get users preferring this model (from modelPreferences JSON field)
        const usersWithPreferences = await prisma.user.findMany({
            where: {
                modelPreferences: { not: Prisma.DbNull },
                deletedAt: null,
            },
            select: {
                modelPreferences: true,
            },
        });
        const usersPreferring = usersWithPreferences.filter((u: { modelPreferences: unknown }) => {
            const prefs = u.modelPreferences as { coding?: string } | null;
            return prefs?.coding === modelId;
        }).length;

        // Get audit logs
        const auditLogs = await prisma.aIModelAuditLog.findMany({
            where: { modelId },
            orderBy: { createdAt: "desc" },
            take: 20,
        });

        return NextResponse.json({
            model: {
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
                    supportedInputs: model.capabilities.supportedInputs.map((t: string) => t.toLowerCase()),
                    supportedOutputs: model.capabilities.supportedOutputs.map((t: string) => t.toLowerCase().replace("_", "-")),
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
                createdAt: model.createdAt,
                updatedAt: model.updatedAt,
                createdBy: model.createdBy,
                updatedBy: model.updatedBy,
            },
            stats: {
                totalCalls: usageStats._count,
                inputTokens: usageStats._sum.inputTokens || 0,
                outputTokens: usageStats._sum.outputTokens || 0,
                totalTokens: usageStats._sum.totalTokens || 0,
                totalCost: usageStats._sum.providerCostUsd || 0,
                usersPreferring,
            },
            auditLogs: auditLogs.map((log: { id: string; action: string; changes: unknown; performedBy: string | null; createdAt: Date }) => ({
                id: log.id,
                action: log.action,
                changes: log.changes,
                performedBy: log.performedBy,
                createdAt: log.createdAt,
            })),
        });
    } catch (error) {
        console.error("Failed to fetch model:", error);
        return NextResponse.json(
            { error: "Failed to fetch model" },
            { status: 500 }
        );
    }
}

// ============================================================================
// PUT /api/admin/ai-models/[id]
// ============================================================================

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const adminCheck = await requireAdmin(request);
    if (adminCheck) return adminCheck;

    const admin = await getAdminUser(request);
    if (!admin) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const modelId = decodeURIComponent(id);

    try {
        const body = await request.json();
        const validated = updateModelSchema.parse(body);

        // Check if model exists
        const existing = await prisma.aIModel.findUnique({
            where: { id: modelId },
            include: { capabilities: true, pricing: true },
        });

        if (!existing) {
            return NextResponse.json(
                { error: "Model not found" },
                { status: 404 }
            );
        }

        // Store old values for audit
        const oldValues = {
            name: existing.name,
            displayName: existing.displayName,
            provider: existing.provider,
            tier: existing.tier,
            description: existing.description,
            useCase: existing.useCase,
            isEnabled: existing.isEnabled,
            isDefault: existing.isDefault,
            isSystem: existing.isSystem,
            sortOrder: existing.sortOrder,
        };

        // If setting as default, unset other defaults for this use case
        const targetUseCase = validated.useCase
            ? toDbUseCase(validated.useCase as ModelUseCase)
            : existing.useCase;

        if (validated.isDefault === true) {
            await prisma.aIModel.updateMany({
                where: {
                    useCase: targetUseCase,
                    isDefault: true,
                    id: { not: modelId },
                },
                data: { isDefault: false },
            });
        }

        // Update model
        const updated = await prisma.aIModel.update({
            where: { id: modelId },
            data: {
                ...(validated.name !== undefined && { name: validated.name }),
                ...(validated.displayName !== undefined && { displayName: validated.displayName }),
                ...(validated.provider !== undefined && { provider: toDbProvider(validated.provider as ModelProvider) }),
                ...(validated.tier !== undefined && { tier: toDbTier(validated.tier as ModelTier) }),
                ...(validated.description !== undefined && { description: validated.description }),
                ...(validated.useCase !== undefined && { useCase: toDbUseCase(validated.useCase as ModelUseCase) }),
                ...(validated.isEnabled !== undefined && { isEnabled: validated.isEnabled }),
                ...(validated.isDefault !== undefined && { isDefault: validated.isDefault }),
                ...(validated.isSystem !== undefined && { isSystem: validated.isSystem }),
                ...(validated.sortOrder !== undefined && { sortOrder: validated.sortOrder }),
                updatedBy: admin.id,
            },
            include: {
                capabilities: true,
                pricing: true,
            },
        });

        // Update capabilities if provided
        if (validated.capabilities) {
            if (existing.capabilities) {
                await prisma.aIModelCapabilities.update({
                    where: { modelId },
                    data: {
                        supportedInputs: validated.capabilities.supportedInputs.map(t => toDbInputType(t as ModelInputType)),
                        supportedOutputs: validated.capabilities.supportedOutputs.map(t => toDbOutputType(t as ModelOutputType)),
                        maxContextLength: validated.capabilities.maxContextLength ?? null,
                        supportsStreaming: validated.capabilities.supportsStreaming,
                        supportsSystemPrompts: validated.capabilities.supportsSystemPrompts,
                        supportsWebSearch: validated.capabilities.supportsWebSearch,
                        supportsFunctionCalling: validated.capabilities.supportsFunctionCalling,
                        supportsJsonMode: validated.capabilities.supportsJsonMode,
                    },
                });
            } else {
                await prisma.aIModelCapabilities.create({
                    data: {
                        modelId,
                        supportedInputs: validated.capabilities.supportedInputs.map(t => toDbInputType(t as ModelInputType)),
                        supportedOutputs: validated.capabilities.supportedOutputs.map(t => toDbOutputType(t as ModelOutputType)),
                        maxContextLength: validated.capabilities.maxContextLength ?? null,
                        supportsStreaming: validated.capabilities.supportsStreaming,
                        supportsSystemPrompts: validated.capabilities.supportsSystemPrompts,
                        supportsWebSearch: validated.capabilities.supportsWebSearch,
                        supportsFunctionCalling: validated.capabilities.supportsFunctionCalling,
                        supportsJsonMode: validated.capabilities.supportsJsonMode,
                    },
                });
            }
        }

        // Update pricing if provided
        if (validated.pricing) {
            if (existing.pricing) {
                await prisma.aIModelPricing.update({
                    where: { modelId },
                    data: {
                        inputTokens: validated.pricing.inputTokens,
                        outputTokens: validated.pricing.outputTokens,
                        longContextThreshold: validated.pricing.longContextThreshold ?? null,
                        inputTokensLongContext: validated.pricing.inputTokensLongContext ?? null,
                        outputTokensLongContext: validated.pricing.outputTokensLongContext ?? null,
                        cacheCreation: validated.pricing.cacheCreation ?? null,
                        cacheRead: validated.pricing.cacheRead ?? null,
                        cacheCreationLongContext: validated.pricing.cacheCreationLongContext ?? null,
                        cacheReadLongContext: validated.pricing.cacheReadLongContext ?? null,
                        cacheDuration: validated.pricing.cacheDuration ?? null,
                        imageInputTokens: validated.pricing.imageInputTokens ?? null,
                        audioInputTokens: validated.pricing.audioInputTokens ?? null,
                        videoInputTokens: validated.pricing.videoInputTokens ?? null,
                        audioOutputTokens: validated.pricing.audioOutputTokens ?? null,
                        images: validated.pricing.images ?? null,
                        videoSeconds: validated.pricing.videoSeconds ?? null,
                        webSearchFreePerDay: validated.pricing.webSearchFreePerDay ?? null,
                        webSearch: validated.pricing.webSearch ?? null,
                        mapsGroundingFreePerDay: validated.pricing.mapsGroundingFreePerDay ?? null,
                        mapsGrounding: validated.pricing.mapsGrounding ?? null,
                        pricingNotes: validated.pricing.pricingNotes ?? null,
                    },
                });
            } else {
                await prisma.aIModelPricing.create({
                    data: {
                        modelId,
                        inputTokens: validated.pricing.inputTokens,
                        outputTokens: validated.pricing.outputTokens,
                        longContextThreshold: validated.pricing.longContextThreshold ?? null,
                        inputTokensLongContext: validated.pricing.inputTokensLongContext ?? null,
                        outputTokensLongContext: validated.pricing.outputTokensLongContext ?? null,
                        cacheCreation: validated.pricing.cacheCreation ?? null,
                        cacheRead: validated.pricing.cacheRead ?? null,
                        cacheCreationLongContext: validated.pricing.cacheCreationLongContext ?? null,
                        cacheReadLongContext: validated.pricing.cacheReadLongContext ?? null,
                        cacheDuration: validated.pricing.cacheDuration ?? null,
                        imageInputTokens: validated.pricing.imageInputTokens ?? null,
                        audioInputTokens: validated.pricing.audioInputTokens ?? null,
                        videoInputTokens: validated.pricing.videoInputTokens ?? null,
                        audioOutputTokens: validated.pricing.audioOutputTokens ?? null,
                        images: validated.pricing.images ?? null,
                        videoSeconds: validated.pricing.videoSeconds ?? null,
                        webSearchFreePerDay: validated.pricing.webSearchFreePerDay ?? null,
                        webSearch: validated.pricing.webSearch ?? null,
                        mapsGroundingFreePerDay: validated.pricing.mapsGroundingFreePerDay ?? null,
                        mapsGrounding: validated.pricing.mapsGrounding ?? null,
                        pricingNotes: validated.pricing.pricingNotes ?? null,
                    },
                });
            }
        }

        // Log audit
        await prisma.aIModelAuditLog.create({
            data: {
                modelId,
                action: "updated",
                changes: {
                    before: oldValues,
                    after: validated,
                },
                performedBy: admin.id,
            },
        });

        // Invalidate registry cache
        modelRegistry.invalidateCache();

        return NextResponse.json({
            success: true,
            model: updated,
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Validation failed", details: error.issues },
                { status: 400 }
            );
        }
        console.error("Failed to update model:", error);
        return NextResponse.json(
            { error: "Failed to update model" },
            { status: 500 }
        );
    }
}

// ============================================================================
// DELETE /api/admin/ai-models/[id]
// ============================================================================

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const adminCheck = await requireAdmin(request);
    if (adminCheck) return adminCheck;

    const admin = await getAdminUser(request);
    if (!admin) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const modelId = decodeURIComponent(id);

    try {
        // Check if model exists
        const existing = await prisma.aIModel.findUnique({
            where: { id: modelId },
        });

        if (!existing) {
            return NextResponse.json(
                { error: "Model not found" },
                { status: 404 }
            );
        }

        // Check if this is the only enabled model for its use case
        const enabledCount = await prisma.aIModel.count({
            where: {
                useCase: existing.useCase,
                isEnabled: true,
            },
        });

        if (enabledCount <= 1 && existing.isEnabled) {
            return NextResponse.json(
                { error: "Cannot delete the only enabled model for this use case" },
                { status: 400 }
            );
        }

        // Check if users are using this model (from modelPreferences JSON field)
        const usersWithModelPref = await prisma.user.findMany({
            where: {
                modelPreferences: { not: Prisma.DbNull },
                deletedAt: null,
            },
            select: {
                modelPreferences: true,
            },
        });
        const usersUsingModel = usersWithModelPref.filter((u) => {
            const prefs = u.modelPreferences as { coding?: string; "image-generation"?: string; "video-generation"?: string } | null;
            return prefs?.coding === modelId || prefs?.["image-generation"] === modelId || prefs?.["video-generation"] === modelId;
        }).length;

        if (usersUsingModel > 0) {
            // Instead of blocking, we could migrate users to default
            // For now, just warn but allow deletion
            console.warn(`Deleting model ${modelId} which is preferred by ${usersUsingModel} users`);
        }

        // Log audit before deletion
        await prisma.aIModelAuditLog.create({
            data: {
                modelId,
                action: "deleted",
                changes: { model: existing },
                performedBy: admin.id,
            },
        });

        // Delete model (cascades to capabilities and pricing)
        await prisma.aIModel.delete({
            where: { id: modelId },
        });

        // Invalidate registry cache
        modelRegistry.invalidateCache();

        return NextResponse.json({
            success: true,
            message: `Model ${modelId} deleted successfully`,
            affectedUsers: usersUsingModel,
        });
    } catch (error) {
        console.error("Failed to delete model:", error);
        return NextResponse.json(
            { error: "Failed to delete model" },
            { status: 500 }
        );
    }
}
