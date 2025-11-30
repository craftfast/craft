/**
 * Admin Projects API
 *
 * API routes for project management in admin panel
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";

/**
 * GET /api/admin/projects
 * Get paginated list of projects with filters
 */
export async function GET(request: NextRequest) {
    const adminCheck = await requireAdmin(request);
    if (adminCheck) return adminCheck;

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const userId = searchParams.get("userId") || "";
    const sort = searchParams.get("sort") || "createdAt";
    const order = searchParams.get("order") || "desc";

    const where: Record<string, unknown> = {};

    // Search by name
    if (search) {
        where.OR = [
            { name: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
        ];
    }

    // Filter by status
    if (status) {
        where.status = status;
    }

    // Filter by user
    if (userId) {
        where.userId = userId;
    }

    const [projects, total] = await Promise.all([
        prisma.project.findMany({
            where,
            orderBy: { [sort]: order },
            skip: (page - 1) * limit,
            take: limit,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        image: true,
                    },
                },
                _count: {
                    select: {
                        chatMessages: true,
                        versions: true,
                    },
                },
            },
        }),
        prisma.project.count({ where }),
    ]);

    return NextResponse.json({
        projects,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    });
}

/**
 * PATCH /api/admin/projects
 * Update project status or transfer ownership
 */
export async function PATCH(request: NextRequest) {
    const adminCheck = await requireAdmin(request);
    if (adminCheck) return adminCheck;

    try {
        const body = await request.json();
        const { projectId, action, data } = body;

        if (!projectId) {
            return NextResponse.json(
                { error: "Project ID required" },
                { status: 400 }
            );
        }

        let updateData: Record<string, unknown> = {};

        switch (action) {
            case "updateStatus":
                if (!data?.status) {
                    return NextResponse.json(
                        { error: "Status is required" },
                        { status: 400 }
                    );
                }
                updateData = { status: data.status };
                break;

            case "transferOwnership":
                if (!data?.newOwnerId) {
                    return NextResponse.json(
                        { error: "New owner ID is required" },
                        { status: 400 }
                    );
                }
                // Verify new owner exists
                const newOwner = await prisma.user.findUnique({
                    where: { id: data.newOwnerId },
                });
                if (!newOwner) {
                    return NextResponse.json(
                        { error: "New owner not found" },
                        { status: 404 }
                    );
                }
                updateData = { userId: data.newOwnerId };
                break;

            default:
                return NextResponse.json({ error: "Invalid action" }, { status: 400 });
        }

        const updatedProject = await prisma.project.update({
            where: { id: projectId },
            data: updateData,
            include: {
                user: {
                    select: { id: true, name: true, email: true },
                },
            },
        });

        return NextResponse.json({ project: updatedProject });
    } catch (error) {
        console.error("Error updating project:", error);
        return NextResponse.json(
            { error: "Failed to update project" },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/admin/projects
 * Delete a project
 */
export async function DELETE(request: NextRequest) {
    const adminCheck = await requireAdmin(request);
    if (adminCheck) return adminCheck;

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
        return NextResponse.json(
            { error: "Project ID required" },
            { status: 400 }
        );
    }

    try {
        await prisma.project.delete({
            where: { id: projectId },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting project:", error);
        return NextResponse.json(
            { error: "Failed to delete project" },
            { status: 500 }
        );
    }
}
