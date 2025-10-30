import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { withCsrfProtection } from "@/lib/csrf";

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

        const session = await getServerSession(authOptions);

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

        const userId = (session.user as { id: string }).id;

        // Get user's current authentication methods
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                password: true,
                accounts: {
                    select: {
                        provider: true,
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
        const oauthProviders = user.accounts.map(acc => acc.provider);
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
            const account = user.accounts.find(acc => acc.provider === provider);

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
                    provider,
                },
            });

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
        console.error("Error unlinking provider:", error);
        return NextResponse.json(
            { error: "Failed to unlink provider" },
            { status: 500 }
        );
    }
}
