import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * GET /api/integrations/vercel/status
 * Gets Vercel integration status
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const integration = await prisma.vercelIntegration.findUnique({
      where: { userId: session.user.id },
      select: {
        id: true,
        email: true,
        username: true,
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
      email: integration.email,
      username: integration.username,
      isActive: integration.isActive,
      lastSyncAt: integration.lastSyncAt,
      connectedAt: integration.createdAt,
    });
  } catch (error) {
    console.error("Vercel status check error:", error);
    return NextResponse.json(
      { error: "Failed to check Vercel status" },
      { status: 500 }
    );
  }
}
