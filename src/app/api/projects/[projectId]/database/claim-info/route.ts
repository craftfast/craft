import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * GET /api/projects/[projectId]/database/claim-info
 * Get claim information for a database
 */
export async function GET(
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

        // Get database info
        const database = await prisma.neonDatabase.findUnique({
            where: {
                projectId: project.id,
            },
        });

        if (!database) {
            return NextResponse.json(
                { error: "Database not provisioned" },
                { status: 404 }
            );
        }

        const now = new Date();
        const isExpired = database.transferExpiresAt
            ? now > database.transferExpiresAt
            : false;

        return NextResponse.json({
            projectId: database.projectId,
            neonProjectId: database.neonProjectId,
            claimUrl: database.claimUrl,
            isClaimable: database.isClaimable && !isExpired,
            isClaimed: !!database.claimedAt,
            claimedAt: database.claimedAt,
            claimedByEmail: database.claimedByEmail,
            transferExpiresAt: database.transferExpiresAt,
            isExpired,
            daysUntilExpiry: database.transferExpiresAt
                ? Math.ceil(
                    (database.transferExpiresAt.getTime() - now.getTime()) /
                    (1000 * 60 * 60 * 24)
                )
                : null,
        });
    } catch (error) {
        console.error("Error getting claim info:", error);
        return NextResponse.json(
            { error: "Failed to get claim information" },
            { status: 500 }
        );
    }
}
