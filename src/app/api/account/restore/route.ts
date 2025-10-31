/**
 * API Route: Restore Account
 * POST /api/account/restore
 * 
 * Cancels a pending account deletion within the 30-day grace period.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-config";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
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

        // Get user with deletion status
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
                id: true,
                email: true,
                deletionScheduledAt: true,
            },
        });

        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        // Check if account is scheduled for deletion
        if (!user.deletionScheduledAt) {
            return NextResponse.json(
                { error: "Account is not scheduled for deletion" },
                { status: 400 }
            );
        }

        // Check if grace period has expired
        const now = new Date();
        if (user.deletionScheduledAt < now) {
            return NextResponse.json(
                { error: "Grace period has expired. Account cannot be restored." },
                { status: 400 }
            );
        }

        // Cancel the deletion
        await prisma.user.update({
            where: { id: user.id },
            data: {
                deletionScheduledAt: null,
            },
        });

        // Log the action
        console.log(`♻️  Account deletion cancelled for user ${user.email}`);

        return NextResponse.json({
            success: true,
            message: "Account deletion cancelled successfully",
        });

    } catch (error) {
        console.error("Error restoring account:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
