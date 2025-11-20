import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string; versionId: string }> }
) {
    const { id: projectId, versionId } = await params;
    try {
        const session = await auth.api.getSession({
            headers: req.headers,
        });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const projectId = params.id;
        const versionId = params.versionId;

        // Verify project ownership
        const project = await prisma.project.findUnique({
            where: { id: projectId, userId: session.user.id },
        });

        if (!project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        // Get the version to restore
        const version = await prisma.projectVersion.findFirst({
            where: {
                id: versionId,
                projectId: projectId,
            },
        });

        if (!version) {
            return NextResponse.json({ error: "Version not found" }, { status: 404 });
        }

        // Get current max version number
        const currentMaxVersion = await prisma.projectVersion.findFirst({
            where: { projectId },
            orderBy: { version: "desc" },
            select: { version: true },
        });

        const newVersionNumber = (currentMaxVersion?.version ?? 0) + 1;

        // Create new version with restored files (codeFiles is stored as JSON)
        await prisma.projectVersion.create({
            data: {
                projectId: projectId,
                version: newVersionNumber,
                name: `Restored from Version ${version.version}`,
                codeFiles: version.codeFiles as any, // Copy the code files JSON from the old version
                isBookmarked: false,
                isPublished: false,
            },
        });

        // Update project version
        await prisma.project.update({
            where: { id: projectId },
            data: {
                version: newVersionNumber,
                updatedAt: new Date(),
            },
        });

        return NextResponse.json({
            success: true,
            message: "Version restored",
            newVersion: newVersionNumber,
        });
    } catch (error) {
        console.error("Error restoring version:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
