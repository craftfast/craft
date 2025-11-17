import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET /api/projects/[id]/export - Export project as ZIP
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

        // Get project
        const project = await prisma.project.findUnique({
            where: { id: projectId, userId: session.user.id },
        });

        if (!project) {
            return NextResponse.json(
                { error: "Project not found" },
                { status: 404 }
            );
        }

        // Export project data as JSON
        const exportData = {
            metadata: {
                name: project.name,
                description: project.description,
                type: project.type,
                version: project.version,
                createdAt: project.createdAt,
                updatedAt: project.updatedAt,
            },
            codeFiles: project.codeFiles,
            environmentVariables: project.environmentVariables,
            customViews: project.customViews,
        };

        const jsonString = JSON.stringify(exportData, null, 2);
        const buffer = Buffer.from(jsonString, "utf-8");

        // Return as downloadable JSON file
        return new NextResponse(buffer, {
            status: 200,
            headers: {
                "Content-Type": "application/json",
                "Content-Disposition": `attachment; filename="${project.name.replace(/[^a-z0-9]/gi, "_")}.json"`,
            },
        });
    } catch (error) {
        console.error("Error exporting project:", error);
        return NextResponse.json(
            { error: "Failed to export project" },
            { status: 500 }
        );
    }
}
