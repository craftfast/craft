import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * POST /api/integrations/vercel/disconnect
 * Disconnects Vercel integration
 */
export async function POST() {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Delete Vercel integration
        await prisma.vercelIntegration.delete({
            where: { userId: session.user.id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Vercel disconnect error:", error);
        return NextResponse.json(
            { error: "Failed to disconnect Vercel" },
            { status: 500 }
        );
    }
}
