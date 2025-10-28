/**
 * API Route: Get/Update User Model Preferences
 * GET /api/user/model-preferences - Get current preferences
 * POST /api/user/model-preferences - Update preferences
 * PUT /api/user/model-preferences/reset - Reset to defaults
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
    getUserModelPreferences,
    updatePreferredModel,
    updateEnabledModels,
    resetModelPreferences,
} from "@/lib/models/preferences";

/**
 * GET - Get user's model preferences
 */
export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const preferences = await getUserModelPreferences(user.id);

        return NextResponse.json(preferences);
    } catch (error) {
        console.error("Error fetching model preferences:", error);
        return NextResponse.json(
            { error: "Failed to fetch model preferences" },
            { status: 500 }
        );
    }
}

/**
 * POST - Update user's model preferences
 */
export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const body = await req.json();
        const { preferredModel, enabledModels } = body;

        // Update preferred model if provided
        if (preferredModel) {
            try {
                await updatePreferredModel(user.id, preferredModel);
            } catch (error) {
                return NextResponse.json(
                    {
                        error:
                            error instanceof Error
                                ? error.message
                                : "Failed to update preferred model",
                    },
                    { status: 400 }
                );
            }
        }

        // Update enabled models if provided
        if (enabledModels && Array.isArray(enabledModels)) {
            try {
                await updateEnabledModels(user.id, enabledModels);
            } catch (error) {
                return NextResponse.json(
                    {
                        error:
                            error instanceof Error
                                ? error.message
                                : "Failed to update enabled models",
                    },
                    { status: 400 }
                );
            }
        }

        // Return updated preferences
        const preferences = await getUserModelPreferences(user.id);
        return NextResponse.json(preferences);
    } catch (error) {
        console.error("Error updating model preferences:", error);
        return NextResponse.json(
            { error: "Failed to update model preferences" },
            { status: 500 }
        );
    }
}

/**
 * PUT - Reset model preferences to defaults
 */
export async function PUT() {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        await resetModelPreferences(user.id);

        // Return updated preferences
        const preferences = await getUserModelPreferences(user.id);
        return NextResponse.json(preferences);
    } catch (error) {
        console.error("Error resetting model preferences:", error);
        return NextResponse.json(
            { error: "Failed to reset model preferences" },
            { status: 500 }
        );
    }
}
