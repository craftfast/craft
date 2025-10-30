import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

/**
 * CSRF Protection for API Routes
 * 
 * Next.js 15 with NextAuth v4 provides built-in CSRF protection through:
 * 1. SameSite cookie attributes (automatically set by NextAuth)
 * 2. Origin/Referer header validation
 * 3. Session-based authentication
 * 
 * This middleware provides additional CSRF protection for custom API routes
 * by validating the origin header matches the expected host.
 */

/**
 * Validate Origin/Referer headers for CSRF protection
 * This prevents cross-origin requests from unauthorized domains
 */
export function validateOrigin(request: NextRequest): boolean {
    const origin = request.headers.get("origin");
    const referer = request.headers.get("referer");
    const host = request.headers.get("host");

    // In development, allow localhost with different ports
    if (process.env.NODE_ENV === "development") {
        const localhostPattern = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;
        if (origin && localhostPattern.test(origin)) {
            return true;
        }
        if (referer && localhostPattern.test(new URL(referer).origin)) {
            return true;
        }
    }

    // In production, validate origin matches host
    const allowedOrigins = [
        `https://${host}`,
        `http://${host}`, // For local testing
        process.env.NEXTAUTH_URL || "",
        process.env.NEXT_PUBLIC_APP_URL || "",
    ].filter(Boolean);

    // Check if origin header matches allowed origins
    if (origin && allowedOrigins.includes(origin)) {
        return true;
    }

    // Check if referer header matches allowed origins
    if (referer) {
        const refererOrigin = new URL(referer).origin;
        if (allowedOrigins.includes(refererOrigin)) {
            return true;
        }
    }

    // If no origin/referer headers (e.g., from server-side calls), allow
    // This is safe because browsers always send these headers for cross-origin requests
    if (!origin && !referer) {
        return true;
    }

    return false;
}

/**
 * CSRF Protection middleware for API routes
 * Validates session and origin headers
 * 
 * @param request - The incoming NextRequest
 * @param requireAuth - Whether authentication is required (default: true)
 * @returns NextResponse with error if validation fails, null if validation passes
 */
export async function csrfProtection(
    request: NextRequest,
    requireAuth = true
): Promise<NextResponse | null> {
    // Only apply CSRF protection to state-changing methods
    const method = request.method;
    if (!["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
        return null; // Skip CSRF check for GET, HEAD, OPTIONS
    }

    // Validate origin/referer headers
    if (!validateOrigin(request)) {
        console.warn(`🚨 CSRF attempt detected: Invalid origin from ${request.headers.get("origin") || "unknown"}`);
        return NextResponse.json(
            { error: "Invalid request origin" },
            { status: 403 }
        );
    }

    // If authentication is required, verify session
    if (requireAuth) {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }
    }

    return null; // Validation passed
}

/**
 * Helper function to use CSRF protection in API routes
 * 
 * @example
 * ```typescript
 * export async function POST(req: NextRequest) {
 *   const csrfCheck = await withCsrfProtection(req);
 *   if (csrfCheck) return csrfCheck;
 *   
 *   // Your handler logic here
 * }
 * ```
 */
export async function withCsrfProtection(
    request: NextRequest,
    requireAuth = true
): Promise<NextResponse | null> {
    return csrfProtection(request, requireAuth);
}
