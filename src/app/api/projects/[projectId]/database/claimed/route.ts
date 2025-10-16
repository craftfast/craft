import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * POST /api/projects/[projectId]/database/claimed
 * Mark database as claimed when user returns from Neon claim flow
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ projectId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { projectId } = await params;

        // Verify project ownership
        const project = await prisma.project.findFirst({
            where: {
                id: projectId,
                user: {
                    email: session.user.email,
                },
            },
        });

        if (!project) {
            return NextResponse.json(
                { error: "Project not found" },
                { status: 404 }
            );
        }

        // Update database status to claimed
        const database = await prisma.neonDatabase.update({
            where: {
                projectId: project.id,
            },
            data: {
                status: "claimed",
                claimedAt: new Date(),
                claimedByEmail: session.user.email,
            },
        });

        console.log(`✅ Database claimed by ${session.user.email}`);

        return NextResponse.json({
            message: "Database claimed successfully",
            database: {
                id: database.id,
                projectId: database.projectId,
                status: database.status,
                claimedAt: database.claimedAt,
                claimedByEmail: database.claimedByEmail,
            },
        });
    } catch (error) {
        console.error("Error marking database as claimed:", error);
        return NextResponse.json(
            { error: "Failed to mark database as claimed" },
            { status: 500 }
        );
    }
}
