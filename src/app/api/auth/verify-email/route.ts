import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logEmailVerified } from "@/lib/security-logger";
import { buildErrorResponse, GENERIC_ERRORS } from "@/lib/error-handler";

/**
 * Legacy email verification endpoint
 * Note: Better Auth handles email verification natively.
 * This route is kept for backward compatibility but should be deprecated.
 * Rate limiting is handled by Better Auth.
 */
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const token = searchParams.get("token");

        if (!token) {
            return NextResponse.json(
                { error: "Verification token is required" },
                { status: 400 }
            );
        }

        // Find verification record using Better Auth's Verification table
        const verification = await prisma.verification.findFirst({
            where: {
                value: token,
                expiresAt: {
                    gt: new Date(),
                },
            },
        });

        if (!verification) {
            return NextResponse.json(
                { error: "Invalid or expired verification token" },
                { status: 400 }
            );
        }

        // Extract email from identifier
        const email = verification.identifier;

        // Find user
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        // Mark email as verified
        await prisma.user.update({
            where: { id: user.id },
            data: {
                emailVerified: true,
            },
        });

        // Delete verification token
        await prisma.verification.delete({
            where: { id: verification.id },
        });

        // Log email verification
        await logEmailVerified(user.id, user.email, request);

        return NextResponse.json(
            { success: true, message: "Email verified successfully" },
            { status: 200 }
        );
    } catch (error) {
        const errorResponse = buildErrorResponse(
            error,
            "Email verification",
            500,
            GENERIC_ERRORS.INTERNAL_SERVER_ERROR
        );

        return NextResponse.json(
            { error: errorResponse.error },
            { status: errorResponse.statusCode }
        );
    }
}
