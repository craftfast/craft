/**
 * Admin Settings API
 *
 * GET /api/admin/settings - Get current settings
 * POST /api/admin/settings - Save settings
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import { isAdmin } from "@/lib/admin-auth";

// In-memory settings store (in production, use database)
let adminSettings = {
    maintenanceMode: false,
    debugMode: false,
    emailNotifications: true,
    securityAlerts: true,
    signupsEnabled: true,
    maxProjectsPerUser: 50,
    defaultBalance: 0,
};

export async function GET() {
    try {
        const session = await getSession();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const hasAdminRole = await isAdmin(session.user.id);
        if (!hasAdminRole) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        return NextResponse.json({ settings: adminSettings });
    } catch (error) {
        console.error("Error fetching settings:", error);
        return NextResponse.json(
            { error: "Failed to fetch settings" },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const hasAdminRole = await isAdmin(session.user.id);
        if (!hasAdminRole) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await request.json();

        // Validate and update settings
        adminSettings = {
            maintenanceMode: Boolean(body.maintenanceMode),
            debugMode: Boolean(body.debugMode),
            emailNotifications: Boolean(body.emailNotifications),
            securityAlerts: Boolean(body.securityAlerts),
            signupsEnabled: Boolean(body.signupsEnabled),
            maxProjectsPerUser: Number(body.maxProjectsPerUser) || 50,
            defaultBalance: Number(body.defaultBalance) || 0,
        };

        return NextResponse.json({ success: true, settings: adminSettings });
    } catch (error) {
        console.error("Error saving settings:", error);
        return NextResponse.json(
            { error: "Failed to save settings" },
            { status: 500 }
        );
    }
}
