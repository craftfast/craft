import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
    encryptValue,
    decryptValue,
    validateEnvVarName,
    validateEnvVarValue,
    maskSecretValue,
} from "@/lib/crypto";

/**
 * Helper to check if user has access to project
 */
async function checkProjectAccess(
    projectId: string,
    userId: string,
    requiredRole: "owner" | "editor" | "viewer" = "viewer"
) {
    const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
            collaborators: {
                where: { userId },
            },
        },
    });

    if (!project) {
        return { hasAccess: false, project: null, role: null };
    }

    const isOwner = project.userId === userId;
    const collaboration = project.collaborators[0];
    const role = isOwner ? "owner" : collaboration?.role || null;

    if (isOwner) {
        return { hasAccess: true, project, role: "owner" };
    }

    if (collaboration) {
        if (requiredRole === "viewer") {
            return { hasAccess: true, project, role: collaboration.role };
        }
        if (requiredRole === "editor" && ["editor", "owner"].includes(collaboration.role)) {
            return { hasAccess: true, project, role: collaboration.role };
        }
    }

    return { hasAccess: false, project, role };
}

/**
 * Helper to create audit log
 */
async function createAuditLog(
    envVarId: string,
    action: string,
    performedBy: string,
    req: NextRequest,
    metadata?: any
) {
    try {
        const ipAddress = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
        const userAgent = req.headers.get("user-agent") || "unknown";

        await prisma.environmentVariableAudit.create({
            data: {
                envVarId,
                action,
                performedBy,
                ipAddress,
                userAgent,
                metadata,
            },
        });
    } catch (error) {
        console.error("Failed to create audit log:", error);
    }
}

// GET /api/projects/[id]/environment/[varId] - Get specific environment variable
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string; varId: string }> }
) {
    try {
        const session = await auth.api.getSession({
            headers: req.headers,
        });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id: projectId, varId } = await params;

        // Check project access
        const { hasAccess } = await checkProjectAccess(projectId, session.user.id);

        if (!hasAccess) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const envVar = await prisma.projectEnvironmentVariable.findUnique({
            where: {
                id: varId,
                projectId,
                deletedAt: null,
            },
            include: {
                creator: {
                    select: {
                        name: true,
                        email: true,
                    },
                },
            },
        });

        if (!envVar) {
            return NextResponse.json(
                { error: "Environment variable not found" },
                { status: 404 }
            );
        }

        // Create audit log for viewing secret
        if (envVar.isSecret) {
            await createAuditLog(varId, "viewed", session.user.id, req, {
                key: envVar.key,
            });
        }

        // Mask secret values
        return NextResponse.json({
            ...envVar,
            value: envVar.isSecret ? maskSecretValue(envVar.value, 0) : envVar.value,
        });
    } catch (error) {
        console.error("Error fetching environment variable:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// PATCH /api/projects/[id]/environment/[varId] - Update environment variable
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string; varId: string }> }
) {
    try {
        const session = await auth.api.getSession({
            headers: req.headers,
        });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id: projectId, varId } = await params;
        const body = await req.json();
        const { value, isSecret, type, description } = body;

        // Check project access (editor or owner required)
        const { hasAccess, role } = await checkProjectAccess(projectId, session.user.id, "editor");

        if (!hasAccess || !["owner", "editor"].includes(role || "")) {
            return NextResponse.json(
                { error: "You don't have permission to update environment variables" },
                { status: 403 }
            );
        }

        const existingVar = await prisma.projectEnvironmentVariable.findUnique({
            where: {
                id: varId,
                projectId,
                deletedAt: null,
            },
        });

        if (!existingVar) {
            return NextResponse.json(
                { error: "Environment variable not found" },
                { status: 404 }
            );
        }

        // Validate new value if provided and type is specified
        if (value !== undefined && type) {
            const valueValidation = validateEnvVarValue(value, type);
            if (!valueValidation.valid) {
                return NextResponse.json(
                    { error: valueValidation.error },
                    { status: 400 }
                );
            }
        }

        const updateData: any = {
            updatedBy: session.user.id,
        };

        if (value !== undefined) {
            const shouldEncrypt = isSecret !== undefined ? isSecret : existingVar.isSecret;
            updateData.value = shouldEncrypt ? encryptValue(value) : value;
        }

        if (isSecret !== undefined) {
            updateData.isSecret = isSecret;
            // Re-encrypt if changing from non-secret to secret
            if (isSecret && !existingVar.isSecret && value === undefined) {
                updateData.value = encryptValue(existingVar.value);
            }
            // Decrypt if changing from secret to non-secret
            if (!isSecret && existingVar.isSecret && value === undefined) {
                try {
                    updateData.value = decryptValue(existingVar.value);
                } catch {
                    // If decryption fails, keep as is
                }
            }
        }

        if (type !== undefined) updateData.type = type;
        if (description !== undefined) updateData.description = description;

        const updatedVar = await prisma.projectEnvironmentVariable.update({
            where: { id: varId },
            data: updateData,
            include: {
                creator: {
                    select: {
                        name: true,
                        email: true,
                    },
                },
            },
        });

        // Create audit log
        await createAuditLog(
            varId,
            "updated",
            session.user.id,
            req,
            {
                key: updatedVar.key,
                changed: Object.keys(updateData),
            }
        );

        return NextResponse.json({
            ...updatedVar,
            value: updatedVar.isSecret ? maskSecretValue(updatedVar.value, 0) : updatedVar.value,
        });
    } catch (error) {
        console.error("Error updating environment variable:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// DELETE /api/projects/[id]/environment/[varId] - Delete environment variable (soft delete)
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string; varId: string }> }
) {
    try {
        const session = await auth.api.getSession({
            headers: req.headers,
        });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id: projectId, varId } = await params;

        // Check project access (editor or owner required)
        const { hasAccess, role } = await checkProjectAccess(projectId, session.user.id, "editor");

        if (!hasAccess || !["owner", "editor"].includes(role || "")) {
            return NextResponse.json(
                { error: "You don't have permission to delete environment variables" },
                { status: 403 }
            );
        }

        const envVar = await prisma.projectEnvironmentVariable.findUnique({
            where: {
                id: varId,
                projectId,
                deletedAt: null,
            },
        });

        if (!envVar) {
            return NextResponse.json(
                { error: "Environment variable not found" },
                { status: 404 }
            );
        }

        // Soft delete
        await prisma.projectEnvironmentVariable.update({
            where: { id: varId },
            data: {
                deletedAt: new Date(),
                updatedBy: session.user.id,
            },
        });

        // Create audit log
        await createAuditLog(
            varId,
            "deleted",
            session.user.id,
            req,
            {
                key: envVar.key,
            }
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error removing environment variable:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
