import { NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import { prisma } from "@/lib/db";

/**
 * GET /api/integrations/figma/status
 * Get current Figma integration status
 */
export async function GET() {
    try {
        const session = await getSession();

        if (!session?.user?.id) {
            return NextResponse.json({ connected: false });
        }

        const integration = await prisma.figmaIntegration.findUnique({
            where: { userId: session.user.id },
            select: {
                isActive: true,
                email: true,
                handle: true,
                imgUrl: true,
                lastSyncAt: true,
            },
        });

        if (!integration || !integration.isActive) {
            return NextResponse.json({ connected: false });
        }

        return NextResponse.json({
            connected: true,
            email: integration.email,
            handle: integration.handle,
            imgUrl: integration.imgUrl,
            lastSyncAt: integration.lastSyncAt,
        });
    } catch (error) {
        console.error("Figma status error:", error);
        return NextResponse.json({ connected: false });
    }
}
