import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { withCsrfProtection } from "@/lib/csrf";
import { envVarRateLimiter, checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import {
    encryptValue,
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

// POST /api/projects/[id]/environment - Add environment variable
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // CSRF Protection
        const csrfCheck = await withCsrfProtection(req);
        if (csrfCheck) return csrfCheck;

        const session = await auth.api.getSession({
            headers: req.headers,
        });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Rate limiting
        const rateLimitResult = await checkRateLimit(envVarRateLimiter, session.user.id);
        if (!rateLimitResult.success) {
            return NextResponse.json(
                { error: "Too many requests. Please try again later." },
                { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
            );
        }

        const { id: projectId } = await params;
        const body = await req.json();
        const { key, value, isSecret = true, type, description } = body;

        if (!key || value === undefined || value === null || value === "") {
            return NextResponse.json(
                { error: "Key and value are required" },
                { status: 400 }
            );
        }

        // Validate environment variable name
        if (!validateEnvVarName(key)) {
            return NextResponse.json(
                {
                    error:
                        "Invalid environment variable name. Must start with a letter and contain only uppercase letters, numbers, and underscores.",
                },
                { status: 400 }
            );
        }

        // Validate value if type is specified
        if (type) {
            const valueValidation = validateEnvVarValue(value, type);
            if (!valueValidation.valid) {
                return NextResponse.json(
                    { error: valueValidation.error },
                    { status: 400 }
                );
            }
        }

        // Check project access (editor or owner required)
        const { hasAccess, role } = await checkProjectAccess(projectId, session.user.id, "editor");

        if (!hasAccess || !["owner", "editor"].includes(role || "")) {
            return NextResponse.json(
                { error: "You don't have permission to add environment variables" },
                { status: 403 }
            );
        }

        // Check for duplicate key
        const existingVar = await prisma.projectEnvironmentVariable.findUnique({
            where: {
                projectId_key: {
                    projectId,
                    key,
                },
            },
        });

        if (existingVar && !existingVar.deletedAt) {
            return NextResponse.json(
                { error: "Environment variable with this key already exists" },
                { status: 400 }
            );
        }

        // Encrypt value if secret
        const storedValue = isSecret ? encryptValue(value) : value;

        // Create environment variable
        const envVar = await prisma.projectEnvironmentVariable.create({
            data: {
                projectId,
                key,
                value: storedValue,
                isSecret,
                type,
                description,
                createdBy: session.user.id,
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

        // Create audit log
        await createAuditLog(
            envVar.id,
            "created",
            session.user.id,
            req,
            {
                key,
                isSecret,
                type,
            }
        );

        // Return with masked value if secret
        return NextResponse.json({
            ...envVar,
            value: isSecret ? maskSecretValue(storedValue, 0) : value,
        });
    } catch (error) {
        console.error("Error adding environment variable:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// GET /api/projects/[id]/environment - Get all environment variables
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth.api.getSession({
            headers: req.headers,
        });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Rate limiting
        const rateLimitResult = await checkRateLimit(envVarRateLimiter, session.user.id);
        if (!rateLimitResult.success) {
            return NextResponse.json(
                { error: "Too many requests. Please try again later." },
                { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
            );
        }

        const { id: projectId } = await params;

        // Check project access
        const { hasAccess } = await checkProjectAccess(projectId, session.user.id);

        if (!hasAccess) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Get environment variables (only non-deleted)
        const envVars = await prisma.projectEnvironmentVariable.findMany({
            where: {
                projectId,
                deletedAt: null,
            },
            orderBy: {
                createdAt: "asc",
            },
            select: {
                id: true,
                key: true,
                value: true,
                isSecret: true,
                type: true,
                description: true,
                createdAt: true,
                updatedAt: true,
                creator: {
                    select: {
                        name: true,
                        email: true,
                    },
                },
            },
        });

        // Mask secret values
        const maskedVars = envVars.map((v) => ({
            ...v,
            value: v.isSecret ? maskSecretValue(v.value, 0) : v.value,
        }));

        return NextResponse.json({ environmentVariables: maskedVars });
    } catch (error) {
        console.error("Error fetching environment variables:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
