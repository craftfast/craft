import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import { prisma } from "@/lib/db";

/**
 * Admin Authorization Middleware
 * 
 * Checks if the authenticated user has admin role.
 * Use this to protect admin-only endpoints.
 * 
 * @example
 * ```typescript
 * export async function GET(request: NextRequest) {
 *   const adminCheck = await requireAdmin(request);
 *   if (adminCheck) return adminCheck; // Returns error response if not admin
 *   
 *   // Admin-only logic here
 * }
 * ```
 */
export async function requireAdmin(
    request: NextRequest
): Promise<NextResponse | null> {
    try {
        // Check if user is authenticated
        const session = await getSession();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized - Authentication required" },
                { status: 401 }
            );
        }

        // Get user's role from database
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { role: true, email: true },
        });

        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        // Check if user has admin role
        if (user.role !== "admin") {
            console.warn(
                `⚠️  Unauthorized admin access attempt: ${user.email} (${session.user.id})`
            );

            return NextResponse.json(
                { error: "Forbidden - Admin access required" },
                { status: 403 }
            );
        }

        // User is admin - allow access
        return null;
    } catch (error) {
        console.error("Error checking admin role:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

/**
 * Get the admin user if authenticated and has admin role
 * Use after requireAdmin to get user details for audit logging
 */
export async function getAdminUser(
    request: NextRequest
): Promise<{ id: string; email: string; role: string } | null> {
    try {
        const session = await getSession();

        if (!session?.user?.id) {
            return null;
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { id: true, email: true, role: true },
        });

        if (!user || user.role !== "admin") {
            return null;
        }

        return { id: user.id, email: user.email || "", role: user.role };
    } catch (error) {
        console.error("Error getting admin user:", error);
        return null;
    }
}

/**
 * Check if a user has admin role
 * Returns boolean instead of response (for use in non-route handlers)
 */
export async function isAdmin(userId: string): Promise<boolean> {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { role: true },
        });

        return user?.role === "admin";
    } catch (error) {
        console.error("Error checking admin role:", error);
        return false;
    }
}

/**
 * Get user role
 * Returns the role string or null if user not found
 */
export async function getUserRole(userId: string): Promise<string | null> {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { role: true },
        });

        return user?.role || null;
    } catch (error) {
        console.error("Error getting user role:", error);
        return null;
    }
}

/**
 * User roles enum
 */
export const UserRole = {
    USER: "user",
    ADMIN: "admin",
} as const;

export type UserRoleType = (typeof UserRole)[keyof typeof UserRole];
