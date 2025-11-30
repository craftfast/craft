/**
 * Admin Health Check API
 *
 * GET /api/admin/health - Check system health status
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/get-session";
import { isAdmin } from "@/lib/admin-auth";

export async function GET() {
    try {
        const session = await getSession();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const hasAdminRole = await isAdmin(session.user.id);
        if (!hasAdminRole) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Check database health
        let databaseHealth: "healthy" | "degraded" | "down" = "down";
        try {
            await prisma.$queryRaw`SELECT 1`;
            databaseHealth = "healthy";
        } catch (error) {
            console.error("Database health check failed:", error);
            databaseHealth = "down";
        }

        // Check Redis health (placeholder - would need actual Redis client)
        const redisHealth: "healthy" | "degraded" | "down" = "healthy";

        // Check E2B health (placeholder - would need actual E2B client)
        const e2bHealth: "healthy" | "degraded" | "down" = "healthy";

        // Check storage health (placeholder - would need actual R2 client)
        const storageHealth: "healthy" | "degraded" | "down" = "healthy";

        return NextResponse.json({
            health: {
                database: databaseHealth,
                redis: redisHealth,
                e2b: e2bHealth,
                storage: storageHealth,
            },
        });
    } catch (error) {
        console.error("Error checking health:", error);
        return NextResponse.json(
            { error: "Failed to check health" },
            { status: 500 }
        );
    }
}
