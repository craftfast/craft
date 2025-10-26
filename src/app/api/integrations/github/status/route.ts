import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * GET /api/integrations/github/status
 * Gets GitHub integration status
 */
export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const integration = await prisma.gitHubIntegration.findUnique({
            where: { userId: session.user.id },
            select: {
                id: true,
                login: true,
                email: true,
                name: true,
                avatarUrl: true,
                isActive: true,
                lastSyncAt: true,
                createdAt: true,
            },
        });

        if (!integration) {
            return NextResponse.json({ connected: false });
        }

        return NextResponse.json({
            connected: true,
            login: integration.login,
            email: integration.email,
            name: integration.name,
            avatarUrl: integration.avatarUrl,
            isActive: integration.isActive,
            lastSyncAt: integration.lastSyncAt,
            connectedAt: integration.createdAt,
        });
    } catch (error) {
        console.error("GitHub status check error:", error);
        return NextResponse.json(
            { error: "Failed to check GitHub status" },
            { status: 500 }
        );
    }
}
