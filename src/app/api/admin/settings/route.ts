/**
 * Admin Settings API
 *
 * GET /api/admin/settings - Get current settings
 * POST /api/admin/settings - Save settings
 * 
 * Settings are persisted in the database for self-hosted instances.
 * Each setting is stored as a key-value pair in the SystemSetting table.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import { isAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";

// Default settings (used when no database value exists)
const DEFAULT_SETTINGS = {
    maintenanceMode: false,
    signupsEnabled: true,
    maxProjectsPerUser: 50,
    defaultBalance: 0,
};

// Setting descriptions for self-hosters
const SETTING_DESCRIPTIONS: Record<string, string> = {
    maintenanceMode: "When enabled, only admins can access the platform",
    signupsEnabled: "Allow new user registrations",
    maxProjectsPerUser: "Maximum number of projects per user (0 = unlimited)",
    defaultBalance: "Starting credit balance for new users (in USD)",
};

type SettingsType = {
    maintenanceMode: boolean;
    signupsEnabled: boolean;
    maxProjectsPerUser: number;
    defaultBalance: number;
};

/**
 * Load all settings from database, falling back to defaults
 * Gracefully handles cases where the table doesn't exist yet (pre-migration)
 */
async function loadSettings(): Promise<SettingsType> {
    try {
        // Check if the table exists by attempting to query it
        const dbSettings = await prisma.systemSetting.findMany();

        const settings = { ...DEFAULT_SETTINGS };

        for (const setting of dbSettings) {
            if (setting.key in DEFAULT_SETTINGS) {
                try {
                    const value = JSON.parse(setting.value);
                    (settings as Record<string, unknown>)[setting.key] = value;
                } catch {
                    // Keep default if JSON parse fails
                }
            }
        }

        return settings;
    } catch (error) {
        // Table might not exist yet (pre-migration) - return defaults
        // This allows the admin panel to work before running migrations
        console.warn("SystemSetting table not available, using defaults:", (error as Error).message);
        return DEFAULT_SETTINGS;
    }
}

/**
 * Save a single setting to database
 * Throws if table doesn't exist yet
 */
async function saveSetting(key: string, value: unknown, userId: string): Promise<void> {
    try {
        await prisma.systemSetting.upsert({
            where: { key },
            update: {
                value: JSON.stringify(value),
                updatedBy: userId,
            },
            create: {
                key,
                value: JSON.stringify(value),
                description: SETTING_DESCRIPTIONS[key] || null,
                updatedBy: userId,
            },
        });
    } catch (error) {
        // Check if it's a table not found error
        const message = (error as Error).message || "";
        if (message.includes("system_settings") || message.includes("does not exist")) {
            throw new Error("Settings table not found. Please run: npx prisma migrate dev");
        }
        throw error;
    }
}

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

        const settings = await loadSettings();
        return NextResponse.json({ settings });
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
        const userId = session.user.id;

        // Validate and save each setting
        const settings: SettingsType = {
            maintenanceMode: Boolean(body.maintenanceMode),
            signupsEnabled: Boolean(body.signupsEnabled),
            maxProjectsPerUser: Math.max(0, Number(body.maxProjectsPerUser) || 50),
            defaultBalance: Math.max(0, Number(body.defaultBalance) || 0),
        };

        // Save each setting to database
        await Promise.all(
            Object.entries(settings).map(([key, value]) =>
                saveSetting(key, value, userId)
            )
        );

        console.log(`[Admin] Settings updated by ${session.user.email}`);

        return NextResponse.json({ success: true, settings });
    } catch (error) {
        console.error("Error saving settings:", error);
        return NextResponse.json(
            { error: "Failed to save settings" },
            { status: 500 }
        );
    }
}
