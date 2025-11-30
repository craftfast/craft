/**
 * Admin Support Messages API
 *
 * API routes for support chat system
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getSession } from "@/lib/get-session";
import { prisma } from "@/lib/db";

/**
 * GET /api/admin/support
 * Get support conversations
 */
export async function GET(request: NextRequest) {
    const adminCheck = await requireAdmin(request);
    if (adminCheck) return adminCheck;

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const status = searchParams.get("status") || "all"; // all, open, resolved
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    // If userId is provided, get conversation with that user
    if (userId) {
        const messages = await prisma.supportMessage.findMany({
            where: { userId },
            orderBy: { createdAt: "asc" },
            include: {
                user: {
                    select: { id: true, name: true, email: true, image: true },
                },
            },
        });

        return NextResponse.json({ messages });
    }

    // Get list of conversations (grouped by user)
    const conversations = await prisma.supportMessage.groupBy({
        by: ["userId"],
        _count: { id: true },
        _max: { createdAt: true },
        orderBy: { _max: { createdAt: "desc" } },
        skip: (page - 1) * limit,
        take: limit,
    });

    // Get user info for each conversation
    const userIds = conversations.map((c) => c.userId);
    const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true, email: true, image: true },
    });

    // Get unread count per user
    const unreadCounts = await prisma.supportMessage.groupBy({
        by: ["userId"],
        where: {
            userId: { in: userIds },
            isRead: false,
            isFromAdmin: false,
        },
        _count: { id: true },
    });

    const conversationList = conversations.map((c) => {
        const user = users.find((u) => u.id === c.userId);
        const unread = unreadCounts.find((u) => u.userId === c.userId);
        return {
            userId: c.userId,
            user,
            messageCount: c._count.id,
            lastMessageAt: c._max.createdAt,
            unreadCount: unread?._count.id || 0,
        };
    });

    const total = await prisma.supportMessage.groupBy({
        by: ["userId"],
    }).then((r) => r.length);

    return NextResponse.json({
        conversations: conversationList,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    });
}

/**
 * POST /api/admin/support
 * Send a support message to a user
 */
export async function POST(request: NextRequest) {
    const adminCheck = await requireAdmin(request);
    if (adminCheck) return adminCheck;

    const session = await getSession();
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { userId, content } = body;

        if (!userId || !content) {
            return NextResponse.json(
                { error: "User ID and content are required" },
                { status: 400 }
            );
        }

        const message = await prisma.supportMessage.create({
            data: {
                userId,
                content,
                isFromAdmin: true,
                adminId: session.user.id,
                isRead: false,
            },
            include: {
                user: {
                    select: { id: true, name: true, email: true },
                },
            },
        });

        return NextResponse.json({ message });
    } catch (error) {
        console.error("Error sending support message:", error);
        return NextResponse.json(
            { error: "Failed to send message" },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/admin/support
 * Mark messages as read
 */
export async function PATCH(request: NextRequest) {
    const adminCheck = await requireAdmin(request);
    if (adminCheck) return adminCheck;

    try {
        const body = await request.json();
        const { userId, messageIds } = body;

        if (messageIds && messageIds.length > 0) {
            // Mark specific messages as read
            await prisma.supportMessage.updateMany({
                where: { id: { in: messageIds } },
                data: { isRead: true },
            });
        } else if (userId) {
            // Mark all messages from user as read
            await prisma.supportMessage.updateMany({
                where: { userId, isFromAdmin: false },
                data: { isRead: true },
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error marking messages as read:", error);
        return NextResponse.json(
            { error: "Failed to update messages" },
            { status: 500 }
        );
    }
}
