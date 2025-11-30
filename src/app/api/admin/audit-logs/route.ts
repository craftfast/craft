/**
 * Admin Audit Logs API
 *
 * GET /api/admin/audit-logs - List AI model audit logs
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/get-session";
import { isAdmin } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const hasAdminRole = await isAdmin(session.user.id);
        if (!hasAdminRole) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "50");
        const action = searchParams.get("action");

        const where: Record<string, unknown> = {};
        if (action && action !== "all") {
            where.action = action;
        }

        const [logs, total] = await Promise.all([
            prisma.aIModelAuditLog.findMany({
                where,
                orderBy: { createdAt: "desc" },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.aIModelAuditLog.count({ where }),
        ]);

        // Get user details for performedBy
        const userIds = [...new Set(logs.map((log) => log.performedBy))];
        const users = await prisma.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, name: true, email: true },
        });

        const userMap = new Map(users.map((u) => [u.id, u]));

        const logsWithUsers = logs.map((log) => ({
            ...log,
            performedByUser: userMap.get(log.performedBy),
        }));

        return NextResponse.json({
            logs: logsWithUsers,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("Error fetching audit logs:", error);
        return NextResponse.json(
            { error: "Failed to fetch audit logs" },
            { status: 500 }
        );
    }
}
