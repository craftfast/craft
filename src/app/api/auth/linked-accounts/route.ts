import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * GET /api/auth/linked-accounts
 * Returns all authentication methods linked to the user's account
 */
export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json(
                { error: "Not authenticated" },
                { status: 401 }
            );
        }

        const userId = (session.user as { id: string }).id;

        // Fetch user with accounts
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                email: true,
                password: true,
                accounts: {
                    select: {
                        provider: true,
                        providerAccountId: true,
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

        // Build response with linked accounts
        const linkedAccounts = {
            google: null as { email: string | null; connected: boolean } | null,
            github: null as { email: string | null; connected: boolean } | null,
            credentials: null as { email: string | null; connected: boolean } | null,
        };

        // Check OAuth accounts
        // Issue #15: All OAuth providers use the same primary email (user.email)
        user.accounts.forEach(account => {
            if (account.provider === "google") {
                linkedAccounts.google = {
                    email: user.email, // All linked accounts use primary email
                    connected: true,
                };
            } else if (account.provider === "github") {
                linkedAccounts.github = {
                    email: user.email, // All linked accounts use primary email
                    connected: true,
                };
            }
        });

        // Check credentials (email+password)
        if (user.password) {
            linkedAccounts.credentials = {
                email: user.email,
                connected: true,
            };
        }

        // Set defaults for unconnected accounts
        if (!linkedAccounts.google) {
            linkedAccounts.google = { email: null, connected: false };
        }
        if (!linkedAccounts.github) {
            linkedAccounts.github = { email: null, connected: false };
        }
        if (!linkedAccounts.credentials) {
            linkedAccounts.credentials = { email: null, connected: false };
        }

        return NextResponse.json({
            success: true,
            accounts: linkedAccounts,
        });
    } catch (error) {
        console.error("Error fetching linked accounts:", error);
        return NextResponse.json(
            { error: "Failed to fetch linked accounts" },
            { status: 500 }
        );
    }
}
