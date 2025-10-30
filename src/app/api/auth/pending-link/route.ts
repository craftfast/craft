import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * GET /api/auth/pending-link?token=xxx
 * Retrieves pending account link details by token
 */
export async function GET(req: NextRequest) {
    try {
        const searchParams = req.nextUrl.searchParams;
        const token = searchParams.get("token");

        if (!token) {
            return NextResponse.json(
                { error: "Token is required" },
                { status: 400 }
            );
        }

        // Find pending link request
        const pendingLink = await prisma.pendingAccountLink.findUnique({
            where: { token },
            include: {
                user: {
                    select: {
                        email: true,
                        name: true,
                    },
                },
            },
        });

        if (!pendingLink) {
            return NextResponse.json(
                { error: "Invalid or expired link request" },
                { status: 404 }
            );
        }

        // Check if expired
        if (new Date() > pendingLink.expiresAt) {
            // Clean up expired link
            await prisma.pendingAccountLink.delete({
                where: { id: pendingLink.id },
            });

            return NextResponse.json(
                { error: "Link request has expired" },
                { status: 410 }
            );
        }

        return NextResponse.json({
            success: true,
            data: {
                email: pendingLink.email,
                provider: pendingLink.provider,
                existingAccount: {
                    email: pendingLink.user.email,
                    name: pendingLink.user.name,
                },
                expiresAt: pendingLink.expiresAt,
            },
        });
    } catch (error) {
        console.error("Error fetching pending account link:", error);
        return NextResponse.json(
            { error: "Failed to fetch pending account link" },
            { status: 500 }
        );
    }
}
