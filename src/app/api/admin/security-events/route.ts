import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { Prisma } from "@prisma/client";

/**
 * GET /api/admin/security-events
 * Fetch security events for monitoring and audit trails
 * ADMIN ONLY - Requires admin role
 */
export async function GET(request: NextRequest) {
    try {
        // Check admin authorization
        const adminCheck = await requireAdmin(request);
        if (adminCheck) return adminCheck;

        // At this point, we know the user is authenticated and is an admin
        const session = await getSession();
        if (!session?.user?.id) {
            // This shouldn't happen after requireAdmin, but add for type safety
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Parse query parameters
        const { searchParams } = request.nextUrl;
        const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
        const offset = parseInt(searchParams.get("offset") || "0");
        const eventType = searchParams.get("eventType");
        const severity = searchParams.get("severity");
        const userIdFilter = searchParams.get("userId");

        // Build filter - admins can see all events
        const where: Prisma.SecurityEventWhereInput = {};

        if (eventType) {
            where.eventType = eventType;
        }

        if (severity) {
            where.severity = severity;
        }

        // Allow filtering by specific user ID
        if (userIdFilter) {
            where.userId = userIdFilter;
        }

        // Fetch events
        const [events, totalCount] = await Promise.all([
            prisma.securityEvent.findMany({
                where,
                orderBy: {
                    createdAt: "desc",
                },
                take: limit,
                skip: offset,
            }),
            prisma.securityEvent.count({ where }),
        ]);

        return NextResponse.json({
            events,
            pagination: {
                total: totalCount,
                limit,
                offset,
                hasMore: offset + limit < totalCount,
            },
        });
    } catch (error) {
        console.error("Error fetching security events:", error);
        return NextResponse.json(
            { error: "Failed to fetch security events" },
            { status: 500 }
        );
    }
}
