import { NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import { prisma } from "@/lib/db";

/**
 * POST /api/integrations/github/disconnect
 * Disconnects GitHub integration
 */
export async function POST() {
    try {
        const session = await getSession();

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Delete GitHub integration
        await prisma.gitHubIntegration.delete({
            where: { userId: session.user.id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("GitHub disconnect error:", error);
        return NextResponse.json(
            { error: "Failed to disconnect GitHub" },
            { status: 500 }
        );
    }
}
