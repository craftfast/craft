/**
 * Admin AI Models - Batch Operations
 *
 * POST /api/admin/ai-models/batch - Perform batch operations on models
 * 
 * Supported operations:
 * - enable: Enable multiple models
 * - disable: Disable multiple models
 * - delete: Delete multiple models
 * - updateSortOrder: Update sort order for models
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, getAdminUser } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { modelRegistry } from "@/lib/models/registry";
import { z } from "zod";
import type { AIModelUseCase } from "@prisma/client";

const batchOperationSchema = z.discriminatedUnion("operation", [
    z.object({
        operation: z.literal("enable"),
        modelIds: z.array(z.string()).min(1),
    }),
    z.object({
        operation: z.literal("disable"),
        modelIds: z.array(z.string()).min(1),
    }),
    z.object({
        operation: z.literal("delete"),
        modelIds: z.array(z.string()).min(1),
    }),
    z.object({
        operation: z.literal("updateSortOrder"),
        updates: z.array(z.object({
            modelId: z.string(),
            sortOrder: z.number(),
        })).min(1),
    }),
]);

export async function POST(request: NextRequest) {
    const adminCheck = await requireAdmin(request);
    if (adminCheck) return adminCheck;

    const admin = await getAdminUser(request);
    if (!admin) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const validated = batchOperationSchema.parse(body);

        let result: { success: boolean; affected: number; message: string };

        switch (validated.operation) {
            case "enable": {
                const updateResult = await prisma.aIModel.updateMany({
                    where: { id: { in: validated.modelIds } },
                    data: { isEnabled: true, updatedBy: admin.id },
                });

                await prisma.aIModelAuditLog.create({
                    data: {
                        action: "batch_enabled",
                        changes: { modelIds: validated.modelIds },
                        performedBy: admin.id,
                    },
                });

                result = {
                    success: true,
                    affected: updateResult.count,
                    message: `Enabled ${updateResult.count} models`,
                };
                break;
            }

            case "disable": {
                // Check that we're not disabling all models of a use case
                const modelsToDisable = await prisma.aIModel.findMany({
                    where: { id: { in: validated.modelIds } },
                    select: { id: true, useCase: true },
                });

                const useCases = [...new Set(modelsToDisable.map(m => m.useCase))] as AIModelUseCase[];

                for (const useCase of useCases) {
                    const enabledCount = await prisma.aIModel.count({
                        where: {
                            useCase,
                            isEnabled: true,
                            id: { notIn: validated.modelIds },
                        },
                    });

                    if (enabledCount === 0) {
                        return NextResponse.json(
                            { error: `Cannot disable all models for use case: ${useCase}` },
                            { status: 400 }
                        );
                    }
                }

                const updateResult = await prisma.aIModel.updateMany({
                    where: { id: { in: validated.modelIds } },
                    data: { isEnabled: false, updatedBy: admin.id },
                });

                await prisma.aIModelAuditLog.create({
                    data: {
                        action: "batch_disabled",
                        changes: { modelIds: validated.modelIds },
                        performedBy: admin.id,
                    },
                });

                result = {
                    success: true,
                    affected: updateResult.count,
                    message: `Disabled ${updateResult.count} models`,
                };
                break;
            }

            case "delete": {
                // Check constraints before deletion
                const modelsToDelete = await prisma.aIModel.findMany({
                    where: { id: { in: validated.modelIds } },
                    select: { id: true, useCase: true, isEnabled: true },
                });

                const useCases = [...new Set(modelsToDelete.map(m => m.useCase))] as AIModelUseCase[];

                for (const useCase of useCases) {
                    const remainingCount = await prisma.aIModel.count({
                        where: {
                            useCase,
                            id: { notIn: validated.modelIds },
                        },
                    });

                    if (remainingCount === 0) {
                        return NextResponse.json(
                            { error: `Cannot delete all models for use case: ${useCase}` },
                            { status: 400 }
                        );
                    }
                }

                // Log before deletion
                await prisma.aIModelAuditLog.create({
                    data: {
                        action: "batch_deleted",
                        changes: { modelIds: validated.modelIds },
                        performedBy: admin.id,
                    },
                });

                const deleteResult = await prisma.aIModel.deleteMany({
                    where: { id: { in: validated.modelIds } },
                });

                result = {
                    success: true,
                    affected: deleteResult.count,
                    message: `Deleted ${deleteResult.count} models`,
                };
                break;
            }

            case "updateSortOrder": {
                const updatePromises = validated.updates.map(update =>
                    prisma.aIModel.update({
                        where: { id: update.modelId },
                        data: { sortOrder: update.sortOrder, updatedBy: admin.id },
                    })
                );

                await Promise.all(updatePromises);

                await prisma.aIModelAuditLog.create({
                    data: {
                        action: "sort_order_updated",
                        changes: { updates: validated.updates },
                        performedBy: admin.id,
                    },
                });

                result = {
                    success: true,
                    affected: validated.updates.length,
                    message: `Updated sort order for ${validated.updates.length} models`,
                };
                break;
            }
        }

        // Invalidate registry cache
        modelRegistry.invalidateCache();

        return NextResponse.json(result);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Validation failed", details: error.issues },
                { status: 400 }
            );
        }
        console.error("Batch operation failed:", error);
        return NextResponse.json(
            { error: "Batch operation failed" },
            { status: 500 }
        );
    }
}
