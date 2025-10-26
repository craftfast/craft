import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * GET /api/integrations/github/callback
 * Handles GitHub OAuth callback
 */
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        const searchParams = request.nextUrl.searchParams;
        const code = searchParams.get("code");
        const state = searchParams.get("state");
        const error = searchParams.get("error");

        if (!session?.user?.id) {
            return NextResponse.redirect(
                `${process.env.NEXTAUTH_URL}/settings?error=unauthorized`
            );
        }

        // Verify state matches user ID
        if (state !== session.user.id) {
            return NextResponse.redirect(
                `${process.env.NEXTAUTH_URL}/settings?error=invalid_state`
            );
        }

        if (error) {
            return NextResponse.redirect(
                `${process.env.NEXTAUTH_URL}/settings?error=${error}`
            );
        }

        if (!code) {
            return NextResponse.redirect(
                `${process.env.NEXTAUTH_URL}/settings?error=no_code`
            );
        }

        // Exchange code for access token
        const githubClientId = process.env.GITHUB_CLIENT_ID;
        const githubClientSecret = process.env.GITHUB_CLIENT_SECRET;

        if (!githubClientId || !githubClientSecret) {
            return NextResponse.redirect(
                `${process.env.NEXTAUTH_URL}/settings?error=config_missing`
            );
        }

        const tokenResponse = await fetch(
            "https://github.com/login/oauth/access_token",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                body: JSON.stringify({
                    client_id: githubClientId,
                    client_secret: githubClientSecret,
                    code,
                }),
            }
        );

        if (!tokenResponse.ok) {
            const errorText = await tokenResponse.text();
            console.error("GitHub token exchange error:", errorText);
            return NextResponse.redirect(
                `${process.env.NEXTAUTH_URL}/settings?error=token_exchange_failed`
            );
        }

        const tokenData = await tokenResponse.json();

        if (tokenData.error) {
            console.error("GitHub token error:", tokenData.error_description);
            return NextResponse.redirect(
                `${process.env.NEXTAUTH_URL}/settings?error=${tokenData.error}`
            );
        }

        // Get GitHub user info
        const userResponse = await fetch("https://api.github.com/user", {
            headers: {
                Authorization: `Bearer ${tokenData.access_token}`,
                Accept: "application/vnd.github.v3+json",
            },
        });

        if (!userResponse.ok) {
            console.error("Failed to fetch GitHub user info");
            return NextResponse.redirect(
                `${process.env.NEXTAUTH_URL}/settings?error=user_info_failed`
            );
        }

        const userData = await userResponse.json();

        // Store GitHub integration in database
        await prisma.gitHubIntegration.upsert({
            where: { userId: session.user.id },
            update: {
                accessToken: tokenData.access_token,
                githubUserId: userData.id,
                login: userData.login,
                email: userData.email,
                name: userData.name,
                avatarUrl: userData.avatar_url,
                isActive: true,
                lastSyncAt: new Date(),
            },
            create: {
                userId: session.user.id,
                accessToken: tokenData.access_token,
                githubUserId: userData.id,
                login: userData.login,
                email: userData.email,
                name: userData.name,
                avatarUrl: userData.avatar_url,
                scopes: tokenData.scope?.split(",") || ["repo", "user:email"],
                isActive: true,
                lastSyncAt: new Date(),
            },
        });

        return NextResponse.redirect(
            `${process.env.NEXTAUTH_URL}/settings?github=connected`
        );
    } catch (error) {
        console.error("GitHub OAuth callback error:", error);
        return NextResponse.redirect(
            `${process.env.NEXTAUTH_URL}/settings?error=callback_failed`
        );
    }
}
