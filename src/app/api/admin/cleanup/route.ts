/**
 * Admin Cleanup API
 *
 * POST /api/admin/cleanup - Clean up orphaned database records
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/get-session";
import { isAdmin } from "@/lib/admin-auth";

export async function POST() {
    try {
        const session = await getSession();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const hasAdminRole = await isAdmin(session.user.id);
        if (!hasAdminRole) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const cleanupResults = {
            orphanedFiles: 0,
            orphanedSessions: 0,
            expiredVerifications: 0,
            oldSecurityEvents: 0,
            inactiveProjects: 0,
        };

        // Clean up files marked as deleted
        const orphanedFiles = await prisma.file.deleteMany({
            where: {
                isDeleted: true,
            },
        });
        cleanupResults.orphanedFiles = orphanedFiles.count;

        // Clean up expired sessions (older than 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const expiredSessions = await prisma.session.deleteMany({
            where: {
                expiresAt: { lt: new Date() },
            },
        });
        cleanupResults.orphanedSessions = expiredSessions.count;

        // Clean up expired verification tokens
        const expiredVerifications = await prisma.verification.deleteMany({
            where: {
                expiresAt: { lt: new Date() },
            },
        });
        cleanupResults.expiredVerifications = expiredVerifications.count;

        // Archive old security events (older than 90 days)
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

        const oldEvents = await prisma.securityEvent.deleteMany({
            where: {
                createdAt: { lt: ninetyDaysAgo },
            },
        });
        cleanupResults.oldSecurityEvents = oldEvents.count;

        // Count inactive projects (not accessed in 30 days) for reporting
        const inactiveProjects = await prisma.project.count({
            where: {
                updatedAt: { lt: thirtyDaysAgo },
                status: "active",
            },
        });
        cleanupResults.inactiveProjects = inactiveProjects;

        const totalCleaned =
            cleanupResults.orphanedFiles +
            cleanupResults.orphanedSessions +
            cleanupResults.expiredVerifications +
            cleanupResults.oldSecurityEvents;

        console.log(`[Admin] Database cleanup by user ${session.user.id}:`, cleanupResults);

        return NextResponse.json({
            success: true,
            message: `Cleaned up ${totalCleaned} records (found ${cleanupResults.inactiveProjects} inactive projects)`,
            details: cleanupResults,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error("Error during cleanup:", error);
        return NextResponse.json(
            { error: "Failed to perform cleanup" },
            { status: 500 }
        );
    }
}
