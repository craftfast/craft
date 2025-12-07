/**
 * Admin Users API
 *
 * API routes for user management in admin panel
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";

/**
 * GET /api/admin/users
 * Get paginated list of users with filters
 */
export async function GET(request: NextRequest) {
    const adminCheck = await requireAdmin(request);
    if (adminCheck) return adminCheck;

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role") || "";
    const sort = searchParams.get("sort") || "createdAt";
    const order = searchParams.get("order") || "desc";

    const where: Record<string, unknown> = {
        deletedAt: null,
    };

    // Search by email or name
    if (search) {
        where.OR = [
            { email: { contains: search, mode: "insensitive" } },
            { name: { contains: search, mode: "insensitive" } },
        ];
    }

    // Filter by role
    if (role) {
        where.role = role;
    }

    const [users, total] = await Promise.all([
        prisma.user.findMany({
            where,
            orderBy: { [sort]: order },
            skip: (page - 1) * limit,
            take: limit,
            select: {
                id: true,
                name: true,
                email: true,
                emailVerified: true,
                image: true,
                role: true,
                banned: true,
                banReason: true,
                banExpires: true,
                accountBalance: true,
                createdAt: true,
                updatedAt: true,
                modelPreferences: true,
                enableMemory: true,
                enableWebSearch: true,
                _count: {
                    select: {
                        projects: true,
                        sessions: true,
                    },
                },
            },
        }),
        prisma.user.count({ where }),
    ]);

    return NextResponse.json({
        users,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    });
}

/**
 * PATCH /api/admin/users
 * Update user (ban, unban, change role)
 */
export async function PATCH(request: NextRequest) {
    const adminCheck = await requireAdmin(request);
    if (adminCheck) return adminCheck;

    try {
        const body = await request.json();
        const { userId, action, data } = body;

        if (!userId) {
            return NextResponse.json({ error: "User ID required" }, { status: 400 });
        }

        let updateData: Record<string, unknown> = {};

        switch (action) {
            case "ban":
                updateData = {
                    banned: true,
                    banReason: data?.reason || "Banned by admin",
                    banExpires: data?.expiresAt ? new Date(data.expiresAt) : null,
                };
                break;

            case "unban":
                updateData = {
                    banned: false,
                    banReason: null,
                    banExpires: null,
                };
                break;

            case "changeRole":
                if (!data?.role) {
                    return NextResponse.json(
                        { error: "Role is required" },
                        { status: 400 }
                    );
                }
                updateData = { role: data.role };
                break;

            case "addCredits":
                if (typeof data?.amount !== "number" || data.amount <= 0) {
                    return NextResponse.json(
                        { error: "Valid amount required" },
                        { status: 400 }
                    );
                }
                const user = await prisma.user.findUnique({
                    where: { id: userId },
                    select: { accountBalance: true },
                });
                if (!user) {
                    return NextResponse.json(
                        { error: "User not found" },
                        { status: 404 }
                    );
                }
                updateData = {
                    accountBalance: {
                        increment: data.amount,
                    },
                };
                // Also create a balance transaction
                await prisma.balanceTransaction.create({
                    data: {
                        userId,
                        type: "TOPUP",
                        amount: data.amount,
                        balanceBefore: user.accountBalance,
                        balanceAfter: Number(user.accountBalance) + data.amount,
                        description: data.description || "Admin credit adjustment",
                    },
                });
                break;

            default:
                return NextResponse.json(
                    { error: "Invalid action" },
                    { status: 400 }
                );
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: updateData,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                banned: true,
                banReason: true,
                accountBalance: true,
            },
        });

        return NextResponse.json({ user: updatedUser });
    } catch (error) {
        console.error("Error updating user:", error);
        return NextResponse.json(
            { error: "Failed to update user" },
            { status: 500 }
        );
    }
}
