/**
 * API Route: Schedule Account Deletion
 * POST /api/account/delete
 * 
 * Schedules an account for deletion after a 30-day grace period.
 * User must provide their password for confirmation.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

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
        const { password } = body;

        if (!password) {
            return NextResponse.json(
                { error: "Password is required" },
                { status: 400 }
            );
        }

        // Get user with credential account (Better Auth compatible)
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
                id: true,
                email: true,
                deletionScheduledAt: true,
                accounts: {
                    where: {
                        providerId: "credential",
                    },
                    select: {
                        password: true,
                    },
                },
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

        // Verify password (only if user has a credential account)
        const credentialAccount = user.accounts[0];
        if (credentialAccount?.password) {
            const isPasswordValid = await bcrypt.compare(password, credentialAccount.password);
            if (!isPasswordValid) {
                return NextResponse.json(
                    { error: "Invalid password" },
                    { status: 401 }
                );
            }
        } else {
            // For OAuth-only users, we might want to use a different verification method
            // For now, we'll allow it but you might want to add email verification
            console.log(`OAuth user ${user.email} scheduling account deletion without password verification`);
        }

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
