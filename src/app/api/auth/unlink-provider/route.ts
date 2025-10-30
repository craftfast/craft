import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import { prisma } from "@/lib/db";
import { withCsrfProtection } from "@/lib/csrf";
import { logAccountUnlinked } from "@/lib/security-logger";
import { buildErrorResponse, GENERIC_ERRORS } from "@/lib/error-handler";

/**
 * POST /api/auth/unlink-provider
 * Removes an authentication provider from the user's account
 * Validates that user won't be locked out (must have at least one auth method)
 */
export async function POST(req: NextRequest) {
    try {
        // CSRF Protection
        const csrfCheck = await withCsrfProtection(req);
        if (csrfCheck) return csrfCheck;

        const session = await getSession();

        if (!session?.user?.email) {
            return NextResponse.json(
                { error: "Not authenticated" },
                { status: 401 }
            );
        }

        const { provider } = await req.json();

        if (!provider || !["google", "github", "credentials"].includes(provider)) {
            return NextResponse.json(
                { error: "Invalid provider" },
                { status: 400 }
            );
        }

        const userId = session.user.id;

        // Get user's current authentication methods
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                email: true,
                password: true,
                accounts: {
                    select: {
                        providerId: true,
                    },
                },
            },
        });

        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        // Count available authentication methods
        const hasPassword = !!user.password;
        const oauthProviders = user.accounts.map(acc => acc.providerId);
        const totalAuthMethods = (hasPassword ? 1 : 0) + oauthProviders.length;

        // Prevent user from removing their last authentication method
        if (totalAuthMethods <= 1) {
            return NextResponse.json(
                { error: "Cannot remove your only authentication method. Add another method first." },
                { status: 400 }
            );
        }

        // Handle OAuth provider unlinking (Google, GitHub)
        if (provider === "google" || provider === "github") {
            const account = user.accounts.find(acc => acc.providerId === provider);

            if (!account) {
                return NextResponse.json(
                    { error: `${provider} account not linked` },
                    { status: 400 }
                );
            }

            // Delete the OAuth account
            await prisma.account.deleteMany({
                where: {
                    userId,
                    providerId: provider,
                },
            });

            // Log account unlinking (Issue 16)
            await logAccountUnlinked(userId, user.email, provider, req);

            return NextResponse.json({
                success: true,
                message: `${provider.charAt(0).toUpperCase() + provider.slice(1)} account unlinked successfully`,
            });
        }

        // Handle credentials (email+password) unlinking
        if (provider === "credentials") {
            if (!hasPassword) {
                return NextResponse.json(
                    { error: "Email+password authentication not set up" },
                    { status: 400 }
                );
            }

            // Remove password from user
            await prisma.user.update({
                where: { id: userId },
                data: {
                    password: null,
                },
            });

            return NextResponse.json({
                success: true,
                message: "Email+password authentication removed successfully",
            });
        }

        return NextResponse.json(
            { error: "Invalid provider" },
            { status: 400 }
        );
    } catch (error) {
        const errorResponse = buildErrorResponse(
            error,
            "Unlink provider",
            500,
            GENERIC_ERRORS.INTERNAL_SERVER_ERROR
        );

        return NextResponse.json(
            { error: errorResponse.error },
            { status: errorResponse.statusCode }
        );
    }
}
