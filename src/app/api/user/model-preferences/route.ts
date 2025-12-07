import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { modelService } from "@/lib/models";
import type { ModelUseCase } from "@/lib/models";

/**
 * GET /api/user/model-preferences
 * Get user's model preferences for all use cases
 */
export async function GET(_request: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const preferencesWithDetails = await modelService.getUserPreferencesWithDetails(
            session.user.id
        );

        return NextResponse.json({
            preferences: preferencesWithDetails,
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
 * Update user's preferred model for a use case
 * 
 * Body: { useCase: string, modelId: string }
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
        const { useCase, modelId } = body;

        // Validate use case
        const validUseCases: ModelUseCase[] = [
            "coding",
            "image-generation",
            "video-generation",
        ];

        if (!useCase || !validUseCases.includes(useCase)) {
            return NextResponse.json(
                { error: `Invalid use case. Must be one of: ${validUseCases.join(", ")}` },
                { status: 400 }
            );
        }

        // Validate model ID
        if (!modelId || typeof modelId !== "string") {
            return NextResponse.json(
                { error: "modelId is required" },
                { status: 400 }
            );
        }

        // Set the preference (service handles validation)
        await modelService.setUserPreferredModel(
            session.user.id,
            useCase as ModelUseCase,
            modelId
        );

        // Return updated preferences
        const preferencesWithDetails = await modelService.getUserPreferencesWithDetails(
            session.user.id
        );

        return NextResponse.json({
            success: true,
            preferences: preferencesWithDetails,
        });
    } catch (error) {
        console.error("Error updating model preferences:", error);

        // Return specific error messages
        if (error instanceof Error) {
            if (error.message.includes("not found")) {
                return NextResponse.json(
                    { error: error.message },
                    { status: 404 }
                );
            }
            if (error.message.includes("not a") || error.message.includes("not enabled") || error.message.includes("system model")) {
                return NextResponse.json(
                    { error: error.message },
                    { status: 400 }
                );
            }
        }

        return NextResponse.json(
            { error: "Failed to update model preferences" },
            { status: 500 }
        );
    }
}
