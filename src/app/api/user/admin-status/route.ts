import { NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import { isAdmin } from "@/lib/admin-auth";

/**
 * GET /api/user/admin-status
 * Check if the current user has admin role
 * Used for lazy loading admin UI elements
 */
export async function GET() {
    try {
        const session = await getSession();

        if (!session?.user?.id) {
            return NextResponse.json({ isAdmin: false });
        }

        const hasAdminRole = await isAdmin(session.user.id);

        return NextResponse.json({ isAdmin: hasAdminRole });
    } catch (error) {
        console.error("Error checking admin status:", error);
        return NextResponse.json({ isAdmin: false });
    }
}
