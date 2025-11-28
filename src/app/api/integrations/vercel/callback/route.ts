import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import { prisma } from "@/lib/db";

/**
 * GET /api/integrations/vercel/callback
 * Handles Vercel OAuth/Integration callback
 * 
 * Query parameters from Vercel:
 * - code: Authorization code to exchange for access token
 * - state: Our state parameter (base64 encoded userId:randomToken)
 * - configurationId: The integration configuration ID (for integration flow)
 * - teamId: Team ID if installed on a team (optional)
 * - next: URL to redirect to after installation (optional)
 */
export async function GET(request: NextRequest) {
    try {
        const session = await getSession();
        const searchParams = request.nextUrl.searchParams;
        const code = searchParams.get("code");
        const state = searchParams.get("state");
        const error = searchParams.get("error");
        const configurationId = searchParams.get("configurationId");
        const teamId = searchParams.get("teamId");
        const next = searchParams.get("next");

        console.log("Vercel callback received:", {
            hasCode: !!code,
            hasState: !!state,
            hasError: !!error,
            configurationId,
            teamId,
        });

        if (!session?.user?.id) {
            console.error("No session found during Vercel callback");
            return NextResponse.redirect(
                `${process.env.BETTER_AUTH_URL}/settings?error=unauthorized`
            );
        }

        // Verify state - decode and extract user ID
        if (!state) {
            console.error("No state parameter in callback");
            return NextResponse.redirect(
                `${process.env.BETTER_AUTH_URL}/settings?error=invalid_state`
            );
        }

        let stateUserId: string;
        try {
            const decodedState = Buffer.from(state, "base64url").toString();
            const [userId] = decodedState.split(":");
            stateUserId = userId;
        } catch {
            // Fallback: state might be just the user ID (old format)
            stateUserId = state;
        }

        if (stateUserId !== session.user.id) {
            console.error("State user ID mismatch:", { stateUserId, sessionUserId: session.user.id });
            return NextResponse.redirect(
                `${process.env.BETTER_AUTH_URL}/settings?error=invalid_state`
            );
        }

        if (error) {
            console.error("Vercel OAuth error:", error);
            return NextResponse.redirect(
                `${process.env.BETTER_AUTH_URL}/settings?error=${error}`
            );
        }

        if (!code) {
            console.error("No authorization code received");
            return NextResponse.redirect(
                `${process.env.BETTER_AUTH_URL}/settings?error=no_code`
            );
        }

        // Exchange code for access token
        const vercelClientId = process.env.VERCEL_CLIENT_ID;
        const vercelClientSecret = process.env.VERCEL_CLIENT_SECRET;
        const redirectUri = `${process.env.BETTER_AUTH_URL}/api/integrations/vercel/callback`;

        if (!vercelClientId || !vercelClientSecret) {
            console.error("Missing Vercel OAuth configuration");
            return NextResponse.redirect(
                `${process.env.BETTER_AUTH_URL}/settings?error=config_missing`
            );
        }

        console.log("Exchanging code for access token...");

        const tokenResponse = await fetch("https://api.vercel.com/v2/oauth/access_token", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                client_id: vercelClientId,
                client_secret: vercelClientSecret,
                code,
                redirect_uri: redirectUri,
            }),
        });

        const tokenText = await tokenResponse.text();
        console.log("Token response status:", tokenResponse.status);

        if (!tokenResponse.ok) {
            console.error("Vercel token exchange error:", tokenText);
            return NextResponse.redirect(
                `${process.env.BETTER_AUTH_URL}/settings?error=token_exchange_failed`
            );
        }

        let tokenData;
        try {
            tokenData = JSON.parse(tokenText);
        } catch {
            console.error("Failed to parse token response:", tokenText);
            return NextResponse.redirect(
                `${process.env.BETTER_AUTH_URL}/settings?error=invalid_token_response`
            );
        }

        console.log("Token exchange successful, fetching user info...");

        // Get Vercel user info
        const userResponse = await fetch("https://api.vercel.com/v2/user", {
            headers: {
                Authorization: `Bearer ${tokenData.access_token}`,
            },
        });

        if (!userResponse.ok) {
            const userError = await userResponse.text();
            console.error("Failed to fetch Vercel user info:", userError);
            return NextResponse.redirect(
                `${process.env.BETTER_AUTH_URL}/settings?error=user_info_failed`
            );
        }

        const userData = await userResponse.json();
        console.log("User info received:", { userId: userData.user?.id, username: userData.user?.username });

        // Store Vercel integration in database
        await prisma.vercelIntegration.upsert({
            where: { userId: session.user.id },
            update: {
                accessToken: tokenData.access_token,
                tokenExpiresAt: tokenData.expires_in
                    ? new Date(Date.now() + tokenData.expires_in * 1000)
                    : null,
                vercelUserId: userData.user?.id || null,
                vercelTeamId: teamId || tokenData.team_id || null,
                email: userData.user?.email || null,
                username: userData.user?.username || null,
                isActive: true,
                lastSyncAt: new Date(),
                metadata: configurationId ? { configurationId } : null,
            },
            create: {
                userId: session.user.id,
                accessToken: tokenData.access_token,
                tokenExpiresAt: tokenData.expires_in
                    ? new Date(Date.now() + tokenData.expires_in * 1000)
                    : null,
                vercelUserId: userData.user?.id || null,
                vercelTeamId: teamId || tokenData.team_id || null,
                email: userData.user?.email || null,
                username: userData.user?.username || null,
                scopes: tokenData.scope ? tokenData.scope.split(" ") : [],
                isActive: true,
                lastSyncAt: new Date(),
                metadata: configurationId ? { configurationId } : null,
            },
        });

        console.log("Vercel integration saved successfully");

        // If Vercel provided a 'next' URL, redirect there first (for integration flow)
        // Otherwise redirect to our settings page
        if (next) {
            // Decode and redirect to Vercel's next URL to complete the flow
            const decodedNext = decodeURIComponent(next);
            return NextResponse.redirect(decodedNext);
        }

        return NextResponse.redirect(
            `${process.env.BETTER_AUTH_URL}/settings?vercel=connected`
        );
    } catch (error) {
        console.error("Vercel OAuth callback error:", error);
        return NextResponse.redirect(
            `${process.env.BETTER_AUTH_URL}/settings?error=callback_failed`
        );
    }
}

