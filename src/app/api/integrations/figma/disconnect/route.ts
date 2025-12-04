import { NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import { prisma } from "@/lib/db";

/**
 * POST /api/integrations/figma/disconnect
 * Disconnect Figma integration
 */
export async function POST() {
    try {
        const session = await getSession();

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await prisma.figmaIntegration.update({
            where: { userId: session.user.id },
            data: { isActive: false },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Figma disconnect error:", error);
        return NextResponse.json(
            { error: "Failed to disconnect Figma" },
            { status: 500 }
        );
    }
}
