/**
 * User Memory API Routes
 * GET /api/memory - Get all user memories or by category
 * POST /api/memory - Create a new memory
 * PATCH /api/memory/:id - Update a memory
 * DELETE /api/memory/:id - Delete a memory
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
    getAllUserMemories,
    getMemoriesByCategory,
    getRelevantMemories,
    createMemory,
    clearAllMemories,
} from "@/lib/memory/service";

// GET /api/memory - Get all memories
export async function GET(request: NextRequest) {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const category = searchParams.get("category");
        const grouped = searchParams.get("grouped") === "true";
        const relevantOnly = searchParams.get("relevant") === "true";
        const projectId = searchParams.get("projectId");

        let memories;

        if (relevantOnly) {
            // Get most relevant memories (for AI context)
            memories = await getRelevantMemories({
                userId: session.user.id,
                projectId: projectId || undefined,
                category: category || undefined,
            });
        } else if (grouped) {
            // Get memories grouped by category
            memories = await getMemoriesByCategory(session.user.id);
        } else if (category) {
            // Get memories for specific category
            memories = await getRelevantMemories({
                userId: session.user.id,
                category,
                limit: 100,
            });
        } else {
            // Get all memories
            memories = await getAllUserMemories(session.user.id);
        }

        return NextResponse.json({ memories });
    } catch (error) {
        console.error("Error fetching memories:", error);
        return NextResponse.json(
            { error: "Failed to fetch memories" },
            { status: 500 }
        );
    }
}

// POST /api/memory - Create a new memory
export async function POST(request: NextRequest) {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { category, title, content, importance, projectId } = body;

        if (!category || !title || !content) {
            return NextResponse.json(
                { error: "Missing required fields: category, title, content" },
                { status: 400 }
            );
        }

        const memory = await createMemory({
            userId: session.user.id,
            category,
            title,
            content,
            importance: importance || 5,
            projectId,
        });

        return NextResponse.json({ memory }, { status: 201 });
    } catch (error) {
        console.error("Error creating memory:", error);
        return NextResponse.json(
            { error: "Failed to create memory" },
            { status: 500 }
        );
    }
}

// DELETE /api/memory - Clear all memories
export async function DELETE(request: NextRequest) {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        await clearAllMemories(session.user.id);

        return NextResponse.json({ success: true, message: "All memories cleared" });
    } catch (error) {
        console.error("Error clearing memories:", error);
        return NextResponse.json(
            { error: "Failed to clear memories" },
            { status: 500 }
        );
    }
}
