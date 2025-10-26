import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

interface RouteContext {
    params: Promise<{ id: string }>;
}

// POST /api/projects/[id]/duplicate - Duplicate a project with all its files
export async function POST(
    request: NextRequest,
    context: RouteContext
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const { id: projectId } = await context.params;

        // Verify project ownership
        const originalProject = await prisma.project.findFirst({
            where: {
                id: projectId,
                userId: user.id,
            },
        });

        if (!originalProject) {
            return NextResponse.json(
                { error: "Project not found" },
                { status: 404 }
            );
        }

        // Create duplicate project
        const duplicateProject = await prisma.project.create({
            data: {
                name: `${originalProject.name} (Copy)`,
                description: originalProject.description,
                type: originalProject.type,
                status: originalProject.status,
                visibility: "private", // Always set duplicated projects to private
                userId: user.id,
                version: originalProject.version,
                generationStatus: originalProject.generationStatus,
                codeFiles: originalProject.codeFiles as Prisma.InputJsonValue, // Copy all code files
            },
        });

        console.log(`✅ Project duplicated: ${duplicateProject.id}`);

        return NextResponse.json({
            project: duplicateProject,
        });
    } catch (error) {
        console.error("Error duplicating project:", error);
        return NextResponse.json(
            { error: "Failed to duplicate project" },
            { status: 500 }
        );
    }
}
