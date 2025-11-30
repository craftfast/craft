/**
 * Admin User Sessions API
 *
 * Manage user sessions (view, terminate)
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";

/**
 * GET /api/admin/users/[userId]/sessions
 * Get all sessions for a user
 */
export async function GET(
    request: NextRequest,
    context: { params: Promise<{ userId: string }> }
) {
    const adminCheck = await requireAdmin(request);
    if (adminCheck) return adminCheck;

    const { userId } = await context.params;

    const sessions = await prisma.session.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ sessions });
}

/**
 * DELETE /api/admin/users/[userId]/sessions
 * Terminate all sessions for a user
 */
export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ userId: string }> }
) {
    const adminCheck = await requireAdmin(request);
    if (adminCheck) return adminCheck;

    const { userId } = await context.params;
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");

    if (sessionId) {
        // Delete specific session
        await prisma.session.delete({
            where: { id: sessionId, userId },
        });
    } else {
        // Delete all sessions for user
        await prisma.session.deleteMany({
            where: { userId },
        });
    }

    return NextResponse.json({ success: true });
}
