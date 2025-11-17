import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { withCsrfProtection } from "@/lib/csrf";
import {
    encryptValue,
    decryptValue,
    validateEnvVarName,
    validateEnvVarValue,
} from "@/lib/crypto";

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

        const { id: projectId } = await params;
        const body = await req.json();
        const { key, value, isSecret = true, type } = body;

        if (!key || !value) {
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
                        "Invalid environment variable name. Must be uppercase letters, numbers, and underscores only.",
                },
                { status: 400 }
            );
        }

        // Validate value if type is specified
        const valueValidation = validateEnvVarValue(value, type);
        if (!valueValidation.valid) {
            return NextResponse.json(
                { error: valueValidation.error },
                { status: 400 }
            );
        }

        // Verify project ownership or editor access
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: {
                collaborators: true,
            },
        });

        if (!project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        const isOwner = project.userId === session.user.id;
        const isEditor = project.collaborators?.some(
            (c: any) => c.userId === session.user.id && c.role === "editor"
        );

        if (!isOwner && !isEditor) {
            return NextResponse.json(
                { error: "You don't have permission to add environment variables" },
                { status: 403 }
            );
        }

        // Get existing environment variables
        const existingVars = Array.isArray(project.environmentVariables)
            ? (project.environmentVariables as any[])
            : [];

        // Check for duplicate keys
        if (existingVars.some((v: any) => v.key === key)) {
            return NextResponse.json(
                { error: "Environment variable with this key already exists" },
                { status: 400 }
            );
        }

        // Encrypt value if secret
        const storedValue = isSecret ? encryptValue(value) : value;

        // Add new variable
        const newVar = {
            id: Date.now().toString(),
            key,
            value: storedValue,
            isSecret,
            type: type || null,
            createdAt: new Date().toISOString(),
        };

        const updatedVars = [...existingVars, newVar];

        // Update project
        await prisma.project.update({
            where: { id: projectId },
            data: {
                environmentVariables: updatedVars as any,
            },
        });

        // Return variable with masked value if secret
        return NextResponse.json({
            ...newVar,
            value: isSecret ? "••••••••" : value,
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

        const { id: projectId } = await params;

        // Verify project access
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: {
                collaborators: true,
            },
        });

        if (!project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        const hasAccess =
            project.userId === session.user.id ||
            project.collaborators?.some((c: any) => c.userId === session.user.id);

        if (!hasAccess) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const vars = Array.isArray(project.environmentVariables)
            ? (project.environmentVariables as any[])
            : [];

        // Return with masked secret values
        const maskedVars = vars.map((v: any) => ({
            ...v,
            value: v.isSecret ? "••••••••" : v.value,
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
