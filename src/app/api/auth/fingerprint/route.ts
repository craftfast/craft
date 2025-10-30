/**
 * Session Fingerprint Update Endpoint (Issue 14)
 * 
 * This endpoint updates the session with current IP address and user-agent
 * to enable security monitoring and anomaly detection.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getSessionFingerprint } from "@/lib/session-fingerprint";

export async function POST(req: NextRequest) {
    try {
        // Get current session
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Capture current fingerprint from request
        const fingerprint = await getSessionFingerprint();

        // Return the fingerprint so it can be used to update the session client-side
        // The client will then call session.update() with this data
        return NextResponse.json({
            success: true,
            fingerprint: {
                ipAddress: fingerprint.ipAddress,
                userAgent: fingerprint.userAgent,
            },
        });
    } catch (error) {
        console.error("Error updating session fingerprint:", error);
        return NextResponse.json(
            { error: "Failed to update session fingerprint" },
            { status: 500 }
        );
    }
}

export async function GET(req: NextRequest) {
    try {
        // Get current session
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Get current fingerprint from headers
        const currentFingerprint = await getSessionFingerprint();

        // Get stored fingerprint from session
        const storedFingerprint = {
            ipAddress: session.ipAddress,
            userAgent: session.userAgent,
        };

        // Return both for comparison
        return NextResponse.json({
            current: currentFingerprint,
            stored: storedFingerprint,
            matches: {
                ipAddress: currentFingerprint.ipAddress === storedFingerprint.ipAddress,
                userAgent: currentFingerprint.userAgent === storedFingerprint.userAgent,
            },
        });
    } catch (error) {
        console.error("Error fetching session fingerprint:", error);
        return NextResponse.json(
            { error: "Failed to fetch session fingerprint" },
            { status: 500 }
        );
    }
}
