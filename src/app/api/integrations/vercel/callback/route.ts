import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import { prisma } from "@/lib/db";

/**
 * GET /api/integrations/vercel/callback
 * Handles Vercel OAuth callback
 */
export async function GET(request: NextRequest) {
    try {
        const session = await getSession();
        const searchParams = request.nextUrl.searchParams;
        const code = searchParams.get("code");
        const state = searchParams.get("state");
        const error = searchParams.get("error");

        if (!session?.user?.id) {
            return NextResponse.redirect(
                `${process.env.BETTER_AUTH_URL}/settings?error=unauthorized`
            );
        }

        // Verify state matches user ID
        if (state !== session.user.id) {
            return NextResponse.redirect(
                `${process.env.BETTER_AUTH_URL}/settings?error=invalid_state`
            );
        }

        if (error) {
            return NextResponse.redirect(
                `${process.env.BETTER_AUTH_URL}/settings?error=${error}`
            );
        }

        if (!code) {
            return NextResponse.redirect(
                `${process.env.BETTER_AUTH_URL}/settings?error=no_code`
            );
        }

        // Exchange code for access token
        const vercelClientId = process.env.VERCEL_CLIENT_ID;
        const vercelClientSecret = process.env.VERCEL_CLIENT_SECRET;
        const redirectUri = `${process.env.BETTER_AUTH_URL}/api/integrations/vercel/callback`;

        if (!vercelClientId || !vercelClientSecret) {
            return NextResponse.redirect(
                `${process.env.BETTER_AUTH_URL}/settings?error=config_missing`
            );
        }

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

        if (!tokenResponse.ok) {
            const errorText = await tokenResponse.text();
            console.error("Vercel token exchange error:", errorText);
            return NextResponse.redirect(
                `${process.env.BETTER_AUTH_URL}/settings?error=token_exchange_failed`
            );
        }

        const tokenData = await tokenResponse.json();

        // Get Vercel user info
        const userResponse = await fetch("https://api.vercel.com/v2/user", {
            headers: {
                Authorization: `Bearer ${tokenData.access_token}`,
            },
        });

        if (!userResponse.ok) {
            console.error("Failed to fetch Vercel user info");
            return NextResponse.redirect(
                `${process.env.BETTER_AUTH_URL}/settings?error=user_info_failed`
            );
        }

        const userData = await userResponse.json();

        // Store Vercel integration in database
        await prisma.vercelIntegration.upsert({
            where: { userId: session.user.id },
            update: {
                accessToken: tokenData.access_token,
                tokenExpiresAt: tokenData.expires_in
                    ? new Date(Date.now() + tokenData.expires_in * 1000)
                    : null,
                vercelUserId: userData.user.id,
                vercelTeamId: tokenData.team_id || null,
                email: userData.user.email,
                username: userData.user.username,
                isActive: true,
                lastSyncAt: new Date(),
            },
            create: {
                userId: session.user.id,
                accessToken: tokenData.access_token,
                tokenExpiresAt: tokenData.expires_in
                    ? new Date(Date.now() + tokenData.expires_in * 1000)
                    : null,
                vercelUserId: userData.user.id,
                vercelTeamId: tokenData.team_id || null,
                email: userData.user.email,
                username: userData.user.username,
                scopes: ["deployments:write", "projects:write", "user:read"],
                isActive: true,
                lastSyncAt: new Date(),
            },
        });

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

