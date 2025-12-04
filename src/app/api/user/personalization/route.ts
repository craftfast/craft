import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import { prisma } from "@/lib/db";
import { withCsrfProtection } from "@/lib/csrf";

/**
 * GET /api/user/personalization
 * Get user personalization settings
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
                responseTone: true,
                customInstructions: true,
                occupation: true,
                techStack: true,
                enableMemory: true,
                referenceChatHistory: true,
                enableWebSearch: true,
                enableImageGeneration: true,
                enableCodeExecution: true,
            },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        return NextResponse.json({
            responseTone: user.responseTone || "default",
            customInstructions: user.customInstructions || "",
            occupation: user.occupation || "",
            techStack: user.techStack || "",
            enableMemory: user.enableMemory,
            referenceChatHistory: user.referenceChatHistory,
            enableWebSearch: user.enableWebSearch,
            enableImageGeneration: user.enableImageGeneration,
            enableCodeExecution: user.enableCodeExecution,
        });
    } catch (error) {
        console.error("Error fetching user personalization:", error);
        return NextResponse.json(
            { error: "Failed to fetch user personalization" },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/user/personalization
 * Update user personalization settings
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
        const {
            responseTone,
            customInstructions,
            occupation,
            techStack,
            enableMemory,
            referenceChatHistory,
            enableWebSearch,
            enableImageGeneration,
            enableCodeExecution,
        } = body;

        // Validate responseTone
        if (responseTone) {
            const validTones = ["default", "concise", "detailed", "encouraging", "professional"];
            if (!validTones.includes(responseTone)) {
                return NextResponse.json(
                    { error: `Invalid responseTone. Must be one of: ${validTones.join(", ")}` },
                    { status: 400 }
                );
            }
        }

        // Build update data object
        const updateData: {
            responseTone?: string | null;
            customInstructions?: string | null;
            occupation?: string | null;
            techStack?: string | null;
            enableMemory?: boolean;
            referenceChatHistory?: boolean;
            enableWebSearch?: boolean;
            enableImageGeneration?: boolean;
            enableCodeExecution?: boolean;
        } = {};

        if (responseTone !== undefined) {
            updateData.responseTone = responseTone || null;
        }
        if (customInstructions !== undefined) {
            updateData.customInstructions = customInstructions || null;
        }
        if (occupation !== undefined) {
            updateData.occupation = occupation || null;
        }
        if (techStack !== undefined) {
            updateData.techStack = techStack || null;
        }
        if (enableMemory !== undefined) {
            updateData.enableMemory = enableMemory;
        }
        if (referenceChatHistory !== undefined) {
            updateData.referenceChatHistory = referenceChatHistory;
        }
        if (enableWebSearch !== undefined) {
            updateData.enableWebSearch = enableWebSearch;
        }
        if (enableImageGeneration !== undefined) {
            updateData.enableImageGeneration = enableImageGeneration;
        }
        if (enableCodeExecution !== undefined) {
            updateData.enableCodeExecution = enableCodeExecution;
        }

        const user = await prisma.user.update({
            where: { email: session.user.email },
            data: updateData,
            select: {
                responseTone: true,
                customInstructions: true,
                occupation: true,
                techStack: true,
                enableMemory: true,
                referenceChatHistory: true,
                enableWebSearch: true,
                enableImageGeneration: true,
                enableCodeExecution: true,
            },
        });

        return NextResponse.json({
            message: "Personalization settings updated successfully",
            personalization: {
                responseTone: user.responseTone || "default",
                customInstructions: user.customInstructions || "",
                occupation: user.occupation || "",
                techStack: user.techStack || "",
                enableMemory: user.enableMemory,
                referenceChatHistory: user.referenceChatHistory,
                enableWebSearch: user.enableWebSearch,
                enableImageGeneration: user.enableImageGeneration,
                enableCodeExecution: user.enableCodeExecution,
            },
        });
    } catch (error) {
        console.error("Error updating user personalization:", error);
        return NextResponse.json(
            { error: "Failed to update user personalization" },
            { status: 500 }
        );
    }
}
