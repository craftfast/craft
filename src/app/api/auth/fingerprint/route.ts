/**
 * Session Fingerprint Endpoint (Deprecated)
 * 
 * Note: Better Auth handles session tracking and IP/user-agent automatically.
 * This endpoint is kept for backward compatibility but may be removed in future versions.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import { buildErrorResponse, GENERIC_ERRORS } from "@/lib/error-handler";

export async function POST(req: NextRequest) {
    try {
        // Get current session
        const session = await getSession();

        if (!session) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Extract IP and user agent from request
        const ip = req.headers.get("x-forwarded-for") ||
            req.headers.get("x-real-ip") ||
            "unknown";
        const userAgent = req.headers.get("user-agent") || "unknown";

        // Return fingerprint data
        return NextResponse.json({
            success: true,
            fingerprint: {
                ipAddress: ip,
                userAgent: userAgent,
            },
        });
    } catch (error) {
        const errorResponse = buildErrorResponse(
            error,
            "Get session fingerprint",
            500,
            GENERIC_ERRORS.INTERNAL_SERVER_ERROR
        );

        return NextResponse.json(
            { error: errorResponse.error },
            { status: errorResponse.statusCode }
        );
    }
}

export async function GET(req: NextRequest) {
    try {
        // Get current session
        const session = await getSession();

        if (!session) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Get current fingerprint from headers
        const currentIp = req.headers.get("x-forwarded-for") ||
            req.headers.get("x-real-ip") ||
            "unknown";
        const currentUserAgent = req.headers.get("user-agent") || "unknown";

        // Get stored fingerprint from session
        const storedFingerprint = {
            ipAddress: session.session.ipAddress || "unknown",
            userAgent: session.session.userAgent || "unknown",
        };

        // Return both for comparison
        return NextResponse.json({
            current: {
                ipAddress: currentIp,
                userAgent: currentUserAgent,
            },
            stored: storedFingerprint,
            matches: {
                ipAddress: currentIp === storedFingerprint.ipAddress,
                userAgent: currentUserAgent === storedFingerprint.userAgent,
            },
        });
    } catch (error) {
        const errorResponse = buildErrorResponse(
            error,
            "Fetch session fingerprint",
            500,
            GENERIC_ERRORS.INTERNAL_SERVER_ERROR
        );

        return NextResponse.json(
            { error: errorResponse.error },
            { status: errorResponse.statusCode }
        );
    }
}
