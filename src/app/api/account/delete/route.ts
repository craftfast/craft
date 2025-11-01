/**
 * API Route: Schedule Account Deletion
 * POST /api/account/delete
 * 
 * Schedules an account for deletion after a 30-day grace period.
 * User must provide OTP code for confirmation (works for all user types).
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
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

        const body = await request.json();
        const { otp } = body;

        if (!otp) {
            return NextResponse.json(
                { error: "Verification code is required" },
                { status: 400 }
            );
        }

        // Get user
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

        // Check if account is already scheduled for deletion
        if (user.deletionScheduledAt) {
            return NextResponse.json(
                {
                    error: "Account is already scheduled for deletion",
                    scheduledAt: user.deletionScheduledAt,
                },
                { status: 400 }
            );
        }

        // Verify OTP
        const verification = await prisma.verification.findFirst({
            where: {
                identifier: `account-deletion:${user.email}`,
                value: otp,
                expiresAt: {
                    gt: new Date(),
                },
            },
        });

        if (!verification) {
            return NextResponse.json(
                { error: "Invalid or expired verification code" },
                { status: 401 }
            );
        }

        // Delete the used OTP
        await prisma.verification.delete({
            where: {
                id: verification.id,
            },
        });

        // Schedule deletion 30 days from now
        const deletionDate = new Date();
        deletionDate.setDate(deletionDate.getDate() + 30);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                deletionScheduledAt: deletionDate,
            },
        });

        // Log the action
        console.log(`🗑️  Account deletion scheduled for user ${user.email} on ${deletionDate.toISOString()}`);

        return NextResponse.json({
            success: true,
            message: "Account scheduled for deletion",
            deletionDate: deletionDate.toISOString(),
        });

    } catch (error) {
        console.error("Error scheduling account deletion:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
