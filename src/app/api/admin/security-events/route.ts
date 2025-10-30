import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * GET /api/admin/security-events
 * Fetch security events for monitoring and audit trails
 * This endpoint would typically be restricted to admin users only
 */
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // TODO: Add admin role check here when roles are implemented
        // For now, users can only see their own security events
        const userId = (session.user as { id: string }).id;

        // Parse query parameters
        const { searchParams } = request.nextUrl;
        const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
        const offset = parseInt(searchParams.get("offset") || "0");
        const eventType = searchParams.get("eventType");
        const severity = searchParams.get("severity");
        const userIdFilter = searchParams.get("userId");

        // Build filter
        const where: any = {
            // For now, users can only see their own events
            // When admin role is added, remove this for admin users
            userId: userId,
        };

        if (eventType) {
            where.eventType = eventType;
        }

        if (severity) {
            where.severity = severity;
        }

        if (userIdFilter && userIdFilter === userId) {
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
