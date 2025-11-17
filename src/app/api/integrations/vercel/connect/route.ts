import { NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";

/**
 * GET /api/integrations/vercel/connect
 * Initiates Vercel OAuth flow
 */
export async function GET() {
    try {
        const session = await getSession();

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Vercel OAuth configuration
        const vercelClientId = process.env.VERCEL_CLIENT_ID;
        const redirectUri = `${process.env.BETTER_AUTH_URL}/api/integrations/vercel/callback`;

        if (!vercelClientId) {
            return NextResponse.json(
                { error: "Vercel integration not configured" },
                { status: 500 }
            );
        }

        // Build Vercel OAuth URL
        const params = new URLSearchParams({
            client_id: vercelClientId,
            redirect_uri: redirectUri,
            scope: "deployments:write projects:write user:read", // Request necessary scopes
            state: session.user.id, // Use user ID as state for security
        });

        const authUrl = `https://vercel.com/oauth/authorize?${params.toString()}`;

        return NextResponse.json({ url: authUrl });
    } catch (error) {
        console.error("Vercel OAuth initiation error:", error);
        return NextResponse.json(
            { error: "Failed to initiate Vercel connection" },
            { status: 500 }
        );
    }
}

