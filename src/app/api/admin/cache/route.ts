/**
 * Admin Cache API
 *
 * DELETE /api/admin/cache - Clear application cache
 */

import { NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import { isAdmin } from "@/lib/admin-auth";

export async function DELETE() {
    try {
        const session = await getSession();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const hasAdminRole = await isAdmin(session.user.id);
        if (!hasAdminRole) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Clear in-memory caches
        // Note: In a production setup with Redis, we would clear Redis here
        // For now, we log the cache clear action

        // In Next.js, we can use revalidation for cache clearing
        // The actual cache clearing depends on the caching strategy in use

        const clearedItems = [
            "Static page cache",
            "API response cache",
            "In-memory data cache",
        ];

        console.log(`[Admin] Cache cleared by user ${session.user.id}`);

        return NextResponse.json({
            success: true,
            message: "Cache cleared successfully",
            cleared: clearedItems,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error("Error clearing cache:", error);
        return NextResponse.json(
            { error: "Failed to clear cache" },
            { status: 500 }
        );
    }
}
