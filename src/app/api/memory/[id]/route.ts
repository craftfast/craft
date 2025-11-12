/**
 * Individual Memory API Routes
 * PATCH /api/memory/[id] - Update a memory
 * DELETE /api/memory/[id] - Delete a memory
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { updateMemory, deleteMemory, deactivateMemory } from "@/lib/memory/service";

// PATCH /api/memory/[id] - Update a memory
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id } = await params;
        const body = await request.json();
        const { title, content, importance, category } = body;

        // Verify memory belongs to user
        const existing = await prisma.userMemory.findUnique({
            where: { id },
            select: { userId: true },
        });

        if (!existing || existing.userId !== session.user.id) {
            return NextResponse.json({ error: "Memory not found" }, { status: 404 });
        }

        const memory = await updateMemory(id, {
            title,
            content,
            importance,
            category,
        });

        return NextResponse.json({ memory });
    } catch (error) {
        console.error("Error updating memory:", error);
        return NextResponse.json(
            { error: "Failed to update memory" },
            { status: 500 }
        );
    }
}

// DELETE /api/memory/[id] - Delete a memory
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id } = await params;
        const { searchParams } = new URL(request.url);
        const soft = searchParams.get("soft") === "true";

        // Verify memory belongs to user
        const existing = await prisma.userMemory.findUnique({
            where: { id },
            select: { userId: true },
        });

        if (!existing || existing.userId !== session.user.id) {
            return NextResponse.json({ error: "Memory not found" }, { status: 404 });
        }

        if (soft) {
            await deactivateMemory(id);
        } else {
            await deleteMemory(id);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting memory:", error);
        return NextResponse.json(
            { error: "Failed to delete memory" },
            { status: 500 }
        );
    }
}
