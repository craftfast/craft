import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import { prisma } from "@/lib/db";
import { buildErrorResponse, GENERIC_ERRORS } from "@/lib/error-handler";

/**
 * POST /api/auth/reject-link
 * Rejects a pending account link request
 */
export async function POST(req: NextRequest) {
    try {
        const session = await getSession();
        const { token } = await req.json();

        if (!token) {
            return NextResponse.json(
                { error: "Token is required" },
                { status: 400 }
            );
        }

        // Find pending link request
        const pendingLink = await prisma.pendingAccountLink.findUnique({
            where: { token },
        });

        if (!pendingLink) {
            return NextResponse.json(
                { error: "Invalid or expired link request" },
                { status: 404 }
            );
        }

        // Verify the user is authenticated and matches the pending link
        if (!session?.user) {
            return NextResponse.json(
                { error: "You must be signed in to reject account linking" },
                { status: 401 }
            );
        }

        const userId = session.user.id;

        if (userId !== pendingLink.userId) {
            return NextResponse.json(
                { error: "You can only reject account linking for your own account" },
                { status: 403 }
            );
        }

        // Delete pending link request
        await prisma.pendingAccountLink.delete({
            where: { id: pendingLink.id },
        });

        console.log(`❌ Account link rejected: ${pendingLink.provider} → ${pendingLink.email}`);

        return NextResponse.json({
            success: true,
            message: "Account link rejected",
        });
    } catch (error) {
        const errorResponse = buildErrorResponse(
            error,
            "Reject account link",
            500,
            GENERIC_ERRORS.INTERNAL_SERVER_ERROR
        );

        return NextResponse.json(
            { error: errorResponse.error },
            { status: errorResponse.statusCode }
        );
    }
}
