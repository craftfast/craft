/**
 * Admin AI Models - Set Default Model
 *
 * POST /api/admin/ai-models/defaults - Set default model for a use case
 * GET  /api/admin/ai-models/defaults - Get all default models
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, getAdminUser } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { modelRegistry, toDbUseCase } from "@/lib/models/registry";
import type { ModelUseCase } from "@/lib/models/registry";
import { z } from "zod";

const setDefaultSchema = z.object({
    useCase: z.enum(["orchestrator", "memory", "coding", "image-generation", "video-generation"]),
    modelId: z.string().min(1),
});

// ============================================================================
// GET /api/admin/ai-models/defaults
// ============================================================================

export async function GET(request: NextRequest) {
    const adminCheck = await requireAdmin(request);
    if (adminCheck) return adminCheck;

    try {
        // Get defaults from the AIModelDefaults table
        const defaults = await prisma.aIModelDefaults.findMany({
            orderBy: { useCase: "asc" },
        });

        // Also get models marked as default
        const defaultModels = await prisma.aIModel.findMany({
            where: { isDefault: true },
            select: {
                id: true,
                displayName: true,
                useCase: true,
            },
        });

        // Build response with both sources
        const useCases: ModelUseCase[] = ["orchestrator", "memory", "coding", "image-generation", "video-generation"];

        const result = useCases.map(useCase => {
            const dbDefault = defaults.find(d => d.useCase.toLowerCase().replace("_", "-") === useCase);
            const modelDefault = defaultModels.find(m => m.useCase.toLowerCase().replace("_", "-") === useCase);

            return {
                useCase,
                modelId: dbDefault?.modelId || modelDefault?.id || null,
                displayName: modelDefault?.displayName || null,
                updatedAt: dbDefault?.updatedAt || null,
                updatedBy: dbDefault?.updatedBy || null,
            };
        });

        return NextResponse.json({
            defaults: result,
        });
    } catch (error) {
        console.error("Failed to fetch defaults:", error);
        return NextResponse.json(
            { error: "Failed to fetch defaults" },
            { status: 500 }
        );
    }
}

// ============================================================================
// POST /api/admin/ai-models/defaults
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
        const validated = setDefaultSchema.parse(body);

        const dbUseCase = toDbUseCase(validated.useCase as ModelUseCase);

        // Verify the model exists and matches the use case
        const model = await prisma.aIModel.findUnique({
            where: { id: validated.modelId },
        });

        if (!model) {
            return NextResponse.json(
                { error: "Model not found" },
                { status: 404 }
            );
        }

        if (model.useCase !== dbUseCase) {
            return NextResponse.json(
                { error: `Model ${validated.modelId} is not a ${validated.useCase} model` },
                { status: 400 }
            );
        }

        if (!model.isEnabled) {
            return NextResponse.json(
                { error: "Cannot set a disabled model as default" },
                { status: 400 }
            );
        }

        // Transaction: update both AIModelDefaults and AIModel.isDefault
        await prisma.$transaction(async (tx) => {
            // Upsert the defaults table
            await tx.aIModelDefaults.upsert({
                where: { useCase: dbUseCase },
                create: {
                    useCase: dbUseCase,
                    modelId: validated.modelId,
                    updatedBy: admin.id,
                },
                update: {
                    modelId: validated.modelId,
                    updatedBy: admin.id,
                },
            });

            // Unset isDefault for all models of this use case
            await tx.aIModel.updateMany({
                where: {
                    useCase: dbUseCase,
                    isDefault: true,
                },
                data: { isDefault: false },
            });

            // Set isDefault for the new default model
            await tx.aIModel.update({
                where: { id: validated.modelId },
                data: {
                    isDefault: true,
                    updatedBy: admin.id,
                },
            });
        });

        // Log audit
        await prisma.aIModelAuditLog.create({
            data: {
                modelId: validated.modelId,
                action: "set_default",
                changes: { useCase: validated.useCase, modelId: validated.modelId },
                performedBy: admin.id,
            },
        });

        // Invalidate registry cache
        modelRegistry.invalidateCache();

        return NextResponse.json({
            success: true,
            message: `Set ${model.displayName} as default for ${validated.useCase}`,
            default: {
                useCase: validated.useCase,
                modelId: validated.modelId,
                displayName: model.displayName,
            },
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Validation failed", details: error.issues },
                { status: 400 }
            );
        }
        console.error("Failed to set default:", error);
        return NextResponse.json(
            { error: "Failed to set default" },
            { status: 500 }
        );
    }
}
