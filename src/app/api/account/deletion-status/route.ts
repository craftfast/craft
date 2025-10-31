/**
 * API Route: Get Account Deletion Status
 * GET /api/account/deletion-status
 * 
 * Returns the current deletion status of the authenticated user's account.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-config";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: request.headers,
        });

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Get user's deletion status
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
                deletionScheduledAt: true,
                deletedAt: true,
            },
        });

        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        const isScheduledForDeletion = user.deletionScheduledAt !== null;
        let daysRemaining = null;

        if (isScheduledForDeletion && user.deletionScheduledAt) {
            const now = new Date();
            const scheduledDate = new Date(user.deletionScheduledAt);
            const diffTime = scheduledDate.getTime() - now.getTime();
            daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }

        return NextResponse.json({
            isScheduledForDeletion,
            deletionScheduledAt: user.deletionScheduledAt,
            daysRemaining,
            isDeleted: user.deletedAt !== null,
        });

    } catch (error) {
        console.error("Error checking deletion status:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
