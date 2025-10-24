import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * GET /api/user/settings
 * Get user settings (preferredChatPosition, etc.)
 */
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: {
                preferredChatPosition: true,
            },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        return NextResponse.json({
            preferredChatPosition: user.preferredChatPosition || "left",
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
 * Body: { preferredChatPosition?: "left" | "right" }
 */
export async function PATCH(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { preferredChatPosition } = body;

        // Validate preferredChatPosition
        if (
            preferredChatPosition &&
            preferredChatPosition !== "left" &&
            preferredChatPosition !== "right"
        ) {
            return NextResponse.json(
                { error: "Invalid preferredChatPosition. Must be 'left' or 'right'" },
                { status: 400 }
            );
        }

        const updateData: { preferredChatPosition?: string } = {};
        if (preferredChatPosition) {
            updateData.preferredChatPosition = preferredChatPosition;
        }

        const user = await prisma.user.update({
            where: { email: session.user.email },
            data: updateData,
            select: {
                preferredChatPosition: true,
            },
        });

        return NextResponse.json({
            success: true,
            preferredChatPosition: user.preferredChatPosition,
        });
    } catch (error) {
        console.error("Error updating user settings:", error);
        return NextResponse.json(
            { error: "Failed to update user settings" },
            { status: 500 }
        );
    }
}
