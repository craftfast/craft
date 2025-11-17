import { NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";

/**
 * GET /api/integrations/github/connect
 * Initiates GitHub OAuth flow
 */
export async function GET() {
    try {
        const session = await getSession();

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // GitHub OAuth configuration
        const githubClientId = process.env.GITHUB_CLIENT_ID;
        const redirectUri = `${process.env.BETTER_AUTH_URL}/api/integrations/github/callback`;

        if (!githubClientId) {
            return NextResponse.json(
                { error: "GitHub integration not configured" },
                { status: 500 }
            );
        }

        // Build GitHub OAuth URL
        const params = new URLSearchParams({
            client_id: githubClientId,
            redirect_uri: redirectUri,
            scope: "repo user:email", // Request necessary scopes
            state: session.user.id, // Use user ID as state for security
        });

        const authUrl = `https://github.com/login/oauth/authorize?${params.toString()}`;

        return NextResponse.json({ url: authUrl });
    } catch (error) {
        console.error("GitHub OAuth initiation error:", error);
        return NextResponse.json(
            { error: "Failed to initiate GitHub connection" },
            { status: 500 }
        );
    }
}

