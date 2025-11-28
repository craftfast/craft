import { NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import { randomBytes } from "crypto";

/**
 * GET /api/integrations/vercel/connect
 * Initiates Vercel Integration installation flow
 * 
 * Vercel uses an Integration-based OAuth flow, not standard OAuth2.
 * Users are redirected to install the integration, which then redirects
 * back with a code that can be exchanged for an access token.
 */
export async function GET() {
    try {
        const session = await getSession();

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const vercelClientId = process.env.VERCEL_CLIENT_ID;
        const integrationSlug = process.env.VERCEL_INTEGRATION_SLUG;

        if (!vercelClientId) {
            return NextResponse.json(
                { error: "Vercel integration not configured" },
                { status: 500 }
            );
        }

        // Generate a secure state token that includes the user ID
        // Format: base64(userId:randomToken)
        const randomToken = randomBytes(16).toString("hex");
        const stateData = `${session.user.id}:${randomToken}`;
        const state = Buffer.from(stateData).toString("base64url");

        // If we have an integration slug, use the integration installation flow
        // Otherwise, fall back to the OAuth authorization endpoint
        let authUrl: string;

        if (integrationSlug) {
            // Vercel Integration installation flow (recommended)
            // This takes users through the proper integration consent screen
            const params = new URLSearchParams({
                state,
            });
            authUrl = `https://vercel.com/integrations/${integrationSlug}/new?${params.toString()}`;
        } else {
            // Standard OAuth flow (requires integration to be configured in Vercel Console)
            const redirectUri = `${process.env.BETTER_AUTH_URL}/api/integrations/vercel/callback`;
            const params = new URLSearchParams({
                client_id: vercelClientId,
                redirect_uri: redirectUri,
                response_type: "code",
                state,
            });
            authUrl = `https://vercel.com/oauth/authorize?${params.toString()}`;
        }

        return NextResponse.json({ url: authUrl });
    } catch (error) {
        console.error("Vercel OAuth initiation error:", error);
        return NextResponse.json(
            { error: "Failed to initiate Vercel connection" },
            { status: 500 }
        );
    }
}

