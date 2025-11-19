import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { getAvailableCodingModels, getDefaultCodingModel } from "@/lib/models/config";

/**
 * GET /api/user/model-preferences
 * Get user's model preferences
 */
export async function GET(request: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
                preferredCodingModel: true,
                enabledCodingModels: true,
            },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Get all available coding model IDs
        const availableModels = getAvailableCodingModels().map((m) => m.id);

        return NextResponse.json({
            preferredCodingModel: user.preferredCodingModel || getDefaultCodingModel(),
            enabledCodingModels: user.enabledCodingModels.length > 0
                ? user.enabledCodingModels
                : availableModels,
        });
    } catch (error) {
        console.error("Error fetching model preferences:", error);
        return NextResponse.json(
            { error: "Failed to fetch model preferences" },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/user/model-preferences
 * Update user's model preferences
 */
export async function PATCH(request: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { preferredCodingModel, enabledCodingModels } = body;

        // Validate inputs
        const availableModels = getAvailableCodingModels();
        const availableModelIds = availableModels.map((m) => m.id);

        // Validate preferred model
        if (preferredCodingModel && !availableModelIds.includes(preferredCodingModel)) {
            return NextResponse.json(
                { error: "Invalid preferred coding model" },
                { status: 400 }
            );
        }

        // Validate enabled models
        if (enabledCodingModels) {
            if (!Array.isArray(enabledCodingModels) || enabledCodingModels.length === 0) {
                return NextResponse.json(
                    { error: "Must enable at least one coding model" },
                    { status: 400 }
                );
            }

            const invalidModels = enabledCodingModels.filter(
                (id: string) => !availableModelIds.includes(id)
            );

            if (invalidModels.length > 0) {
                return NextResponse.json(
                    { error: `Invalid model IDs: ${invalidModels.join(", ")}` },
                    { status: 400 }
                );
            }

            // Ensure preferred model is enabled
            if (preferredCodingModel && !enabledCodingModels.includes(preferredCodingModel)) {
                return NextResponse.json(
                    { error: "Preferred model must be enabled" },
                    { status: 400 }
                );
            }
        }

        // Update user preferences
        const updateData: any = {};
        if (preferredCodingModel !== undefined) {
            updateData.preferredCodingModel = preferredCodingModel;
        }
        if (enabledCodingModels !== undefined) {
            updateData.enabledCodingModels = enabledCodingModels;
        }

        const updatedUser = await prisma.user.update({
            where: { id: session.user.id },
            data: updateData,
            select: {
                preferredCodingModel: true,
                enabledCodingModels: true,
            },
        });

        return NextResponse.json({
            preferredCodingModel: updatedUser.preferredCodingModel,
            enabledCodingModels: updatedUser.enabledCodingModels,
        });
    } catch (error) {
        console.error("Error updating model preferences:", error);
        return NextResponse.json(
            { error: "Failed to update model preferences" },
            { status: 500 }
        );
    }
}
