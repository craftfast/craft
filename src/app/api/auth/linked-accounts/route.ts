import { NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import { prisma } from "@/lib/db";
import { buildErrorResponse, GENERIC_ERRORS } from "@/lib/error-handler";

/**
 * GET /api/auth/linked-accounts
 * Returns all authentication methods linked to the user's account
 */
export async function GET() {
    try {
        const session = await getSession();

        if (!session?.user?.email) {
            return NextResponse.json(
                { error: "Not authenticated" },
                { status: 401 }
            );
        }

        const userId = session.user.id;

        // Fetch user with accounts (Better Auth compatible)
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                email: true,
                accounts: {
                    select: {
                        providerId: true,
                        accountId: true,
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

        // Check OAuth accounts and credentials
        // In Better Auth, passwords are stored in the Account model with providerId "credential"
        user.accounts.forEach(account => {
            if (account.providerId === "google") {
                linkedAccounts.google = {
                    email: user.email, // All linked accounts use primary email
                    connected: true,
                };
            } else if (account.providerId === "github") {
                linkedAccounts.github = {
                    email: user.email, // All linked accounts use primary email
                    connected: true,
                };
            } else if (account.providerId === "credential") {
                // Better Auth stores email+password as a "credential" provider account
                linkedAccounts.credentials = {
                    email: user.email,
                    connected: true,
                };
            }
        });

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
        const errorResponse = buildErrorResponse(
            error,
            "Fetch linked accounts",
            500,
            GENERIC_ERRORS.INTERNAL_SERVER_ERROR
        );

        return NextResponse.json(
            { error: errorResponse.error },
            { status: errorResponse.statusCode }
        );
    }
}
