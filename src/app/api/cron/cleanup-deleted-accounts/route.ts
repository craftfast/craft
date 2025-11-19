/**
 * API Route: Cleanup Expired Accounts
 * POST /api/cron/cleanup-deleted-accounts
 * 
 * This endpoint should be called by a cron job to permanently delete accounts
 * that have passed their 30-day grace period.
 * 
 * Security: This should be protected by a cron secret in production.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
    try {
        // Verify cron secret in production
        const authHeader = request.headers.get("authorization");
        const cronSecret = process.env.CRON_SECRET;

        if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const now = new Date();

        // Find users whose deletion date has passed
        const usersToDelete = await prisma.user.findMany({
            where: {
                deletionScheduledAt: {
                    lte: now, // Less than or equal to now
                },
                deletedAt: null, // Not already deleted
            },
            select: {
                id: true,
                email: true,
                deletionScheduledAt: true,
            },
        });

        console.log(`🗑️  Found ${usersToDelete.length} accounts to permanently delete`);

        let deletedCount = 0;
        const errors: { userId: string; email: string; error: string }[] = [];

        // Delete each user and all associated data
        for (const user of usersToDelete) {
            try {
                await prisma.$transaction(async (tx) => {
                    // Delete all user-related data
                    // Note: Most relations have onDelete: Cascade, but we'll be explicit

                    // Delete sessions
                    await tx.session.deleteMany({
                        where: { userId: user.id },
                    });

                    // Delete accounts (OAuth, email/password)
                    await tx.account.deleteMany({
                        where: { userId: user.id },
                    });

                    // Delete password history
                    await tx.passwordHistory.deleteMany({
                        where: { userId: user.id },
                    });

                    // Delete pending account links
                    await tx.pendingAccountLink.deleteMany({
                        where: { userId: user.id },
                    });

                    // Delete projects and associated data
                    const userProjects = await tx.project.findMany({
                        where: { userId: user.id },
                        select: { id: true },
                    });

                    for (const project of userProjects) {
                        // Delete chat messages
                        await tx.chatMessage.deleteMany({
                            where: { projectId: project.id },
                        });

                        // Delete files
                        await tx.file.deleteMany({
                            where: { projectId: project.id },
                        });
                    }

                    // Delete all projects (this will cascade delete AI credit usage via projectId index)
                    await tx.project.deleteMany({
                        where: { userId: user.id },
                    });

                    // Delete AI credit usage by userId
                    await tx.aICreditUsage.deleteMany({
                        where: { userId: user.id },
                    });

                    // Delete balance transactions
                    await tx.balanceTransaction.deleteMany({
                        where: { userId: user.id },
                    });

                    // Finally, mark the user as deleted (soft delete)
                    await tx.user.update({
                        where: { id: user.id },
                        data: {
                            deletedAt: now,
                            // Clear sensitive data
                            email: `deleted_${user.id}@deleted.local`,
                            name: null,
                            image: null,
                        },
                    });

                    // Clear password from Account model
                    await tx.account.updateMany({
                        where: { userId: user.id },
                        data: { password: null },
                    });

                    // Delete verification tokens
                    await tx.verificationToken.deleteMany({
                        where: { identifier: user.email },
                    });

                    // Delete two-factor authentication data
                    await tx.twoFactor.deleteMany({
                        where: { userId: user.id },
                    });
                });

                deletedCount++;
                console.log(`✅ Permanently deleted account: ${user.email} (ID: ${user.id})`);

            } catch (error) {
                console.error(`❌ Failed to delete account ${user.email}:`, error);
                errors.push({
                    userId: user.id,
                    email: user.email,
                    error: error instanceof Error ? error.message : "Unknown error",
                });
            }
        }

        return NextResponse.json({
            success: true,
            deletedCount,
            totalFound: usersToDelete.length,
            errors: errors.length > 0 ? errors : undefined,
        });

    } catch (error) {
        console.error("Error in cleanup job:", error);
        return NextResponse.json(
            {
                error: "Internal server error",
                message: error instanceof Error ? error.message : "Unknown error"
            },
            { status: 500 }
        );
    }
}
