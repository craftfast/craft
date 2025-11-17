import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth.api.getSession({
            headers: req.headers,
        });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const projectId = params.id;
        const body = await req.json();
        const { key, value, isSecret } = body;

        if (!key || !value) {
            return NextResponse.json(
                { error: "Key and value are required" },
                { status: 400 }
            );
        }

        // Verify project ownership
        const project = await prisma.project.findUnique({
            where: { id: projectId, userId: session.user.id },
        });

        if (!project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        // Get existing environment variables
        const existingVars = Array.isArray(project.environmentVariables)
            ? project.environmentVariables
            : [];

        // Add new variable
        const newVar = {
            id: Date.now().toString(),
            key,
            value,
            isSecret: isSecret || false,
        };

        const updatedVars = [...existingVars, newVar];

        // Update project
        await prisma.project.update({
            where: { id: projectId },
            data: {
                environmentVariables: updatedVars as any,
            },
        });

        return NextResponse.json(newVar);
    } catch (error) {
        console.error("Error adding environment variable:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
