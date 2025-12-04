import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import { prisma } from "@/lib/db";
import { withCsrfProtection } from "@/lib/csrf";

/**
 * GET /api/user/settings
 * Get user settings (preferredChatPosition, preferredTheme, etc.)
 */
export async function GET(_req: NextRequest) {
    try {
        const session = await getSession();

        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: {
                preferredChatPosition: true,
                preferredTheme: true,
                suggestionsEnabled: true,
                soundNotifications: true,
            },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        return NextResponse.json({
            preferredChatPosition: user.preferredChatPosition || "left",
            preferredTheme: user.preferredTheme || "system",
            suggestionsEnabled: user.suggestionsEnabled ?? true,
            soundNotifications: user.soundNotifications ?? false,
        });
    } catch (error) {
        console.error("Error fetching user settings:", error);
        return NextResponse.json(
            { error: "Failed to fetch user settings" },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/user/settings
 * Update user settings
 * Body: { preferredChatPosition?: "left" | "right", preferredTheme?: "light" | "dark" | "system" }
 */
export async function PATCH(req: NextRequest) {
    try {
        // CSRF Protection
        const csrfCheck = await withCsrfProtection(req);
        if (csrfCheck) return csrfCheck;

        const session = await getSession();

        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { preferredChatPosition, preferredTheme, suggestionsEnabled, soundNotifications } = body;

        // Validate preferredChatPosition
        if (
            preferredChatPosition !== undefined &&
            preferredChatPosition !== "left" &&
            preferredChatPosition !== "right"
        ) {
            return NextResponse.json(
                { error: "Invalid preferredChatPosition. Must be 'left' or 'right'" },
                { status: 400 }
            );
        }

        // Validate preferredTheme
        if (
            preferredTheme !== undefined &&
            preferredTheme !== "light" &&
            preferredTheme !== "dark" &&
            preferredTheme !== "system"
        ) {
            return NextResponse.json(
                { error: "Invalid preferredTheme. Must be 'light', 'dark', or 'system'" },
                { status: 400 }
            );
        }

        // Validate suggestionsEnabled
        if (suggestionsEnabled !== undefined && typeof suggestionsEnabled !== "boolean") {
            return NextResponse.json(
                { error: "Invalid suggestionsEnabled. Must be a boolean" },
                { status: 400 }
            );
        }

        // Validate soundNotifications
        if (soundNotifications !== undefined && typeof soundNotifications !== "boolean") {
            return NextResponse.json(
                { error: "Invalid soundNotifications. Must be a boolean" },
                { status: 400 }
            );
        }

        const updateData: {
            preferredChatPosition?: string;
            preferredTheme?: string;
            suggestionsEnabled?: boolean;
            soundNotifications?: boolean;
        } = {};
        if (preferredChatPosition !== undefined) {
            updateData.preferredChatPosition = preferredChatPosition;
        }
        if (preferredTheme !== undefined) {
            updateData.preferredTheme = preferredTheme;
        }
        if (suggestionsEnabled !== undefined) {
            updateData.suggestionsEnabled = suggestionsEnabled;
        }
        if (soundNotifications !== undefined) {
            updateData.soundNotifications = soundNotifications;
        }

        const user = await prisma.user.update({
            where: { email: session.user.email },
            data: updateData,
            select: {
                preferredChatPosition: true,
                preferredTheme: true,
                suggestionsEnabled: true,
                soundNotifications: true,
            },
        });

        return NextResponse.json({
            success: true,
            preferredChatPosition: user.preferredChatPosition,
            preferredTheme: user.preferredTheme,
            suggestionsEnabled: user.suggestionsEnabled,
            soundNotifications: user.soundNotifications,
        });
    } catch (error) {
        console.error("Error updating user settings:", error);
        return NextResponse.json(
            { error: "Failed to update user settings" },
            { status: 500 }
        );
    }
}
