import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import { prisma } from "@/lib/db";
import { exchangeCodeForToken, getUserInstallation } from "@/lib/github-app";

/**
 * GET /api/integrations/github/callback
 * Handles GitHub App installation callback
 * 
 * GitHub sends different parameters depending on the action:
 * - Installation: installation_id, setup_action
 * - OAuth: code, state
 */
export async function GET(request: NextRequest) {
    try {
        const session = await getSession();
        const searchParams = request.nextUrl.searchParams;

        // Get parameters from GitHub
        const code = searchParams.get("code");
        const state = searchParams.get("state");
        const error = searchParams.get("error");
        const installationId = searchParams.get("installation_id");
        const setupAction = searchParams.get("setup_action"); // "install", "update", or "request"

        console.log("GitHub callback received:", {
            hasCode: !!code,
            hasState: !!state,
            hasError: !!error,
            installationId,
            setupAction,
        });

        const baseUrl = process.env.BETTER_AUTH_URL || "";

        if (!session?.user?.id) {
            return NextResponse.redirect(`${baseUrl}/settings?error=unauthorized`);
        }

        // Verify state matches user ID (if provided)
        if (state && state !== session.user.id) {
            return NextResponse.redirect(`${baseUrl}/settings?error=invalid_state`);
        }

        if (error) {
            return NextResponse.redirect(`${baseUrl}/settings?error=${error}`);
        }

        // Handle OAuth code exchange
        if (code) {
            try {
                const tokenData = await exchangeCodeForToken(code);

                // Get GitHub user info
                const userResponse = await fetch("https://api.github.com/user", {
                    headers: {
                        Authorization: `Bearer ${tokenData.access_token}`,
                        Accept: "application/vnd.github.v3+json",
                    },
                });

                if (!userResponse.ok) {
                    console.error("Failed to fetch GitHub user info");
                    return NextResponse.redirect(`${baseUrl}/settings?error=user_info_failed`);
                }

                const userData = await userResponse.json();

                // Get installation ID for this user (if they installed the app)
                let userInstallationId: number | null = null;

                if (installationId) {
                    userInstallationId = parseInt(installationId, 10);
                    console.log("Installation ID from callback:", userInstallationId);
                } else {
                    // Try to find existing installation for this user
                    console.log("No installation_id in callback, checking for existing installation for user:", userData.login);
                    const installation = await getUserInstallation(userData.login);
                    if (installation) {
                        userInstallationId = installation.id;
                        console.log("Found existing installation:", userInstallationId);
                    } else {
                        console.log("No installation found for user");
                    }
                }

                // Calculate token expiration times
                const now = new Date();
                const tokenExpiresAt = tokenData.expires_in
                    ? new Date(now.getTime() + tokenData.expires_in * 1000)
                    : null;
                const refreshTokenExpiresAt = tokenData.refresh_token_expires_in
                    ? new Date(now.getTime() + tokenData.refresh_token_expires_in * 1000)
                    : null;

                // Store GitHub integration in database
                await prisma.gitHubIntegration.upsert({
                    where: { userId: session.user.id },
                    update: {
                        accessToken: tokenData.access_token,
                        refreshToken: tokenData.refresh_token || null,
                        tokenExpiresAt,
                        refreshTokenExpiresAt,
                        installationId: userInstallationId,
                        githubUserId: userData.id,
                        login: userData.login,
                        email: userData.email,
                        name: userData.name,
                        avatarUrl: userData.avatar_url,
                        scopes: tokenData.scope?.split(",") || [],
                        isActive: true,
                        lastSyncAt: new Date(),
                    },
                    create: {
                        userId: session.user.id,
                        accessToken: tokenData.access_token,
                        refreshToken: tokenData.refresh_token || null,
                        tokenExpiresAt,
                        refreshTokenExpiresAt,
                        installationId: userInstallationId,
                        githubUserId: userData.id,
                        login: userData.login,
                        email: userData.email,
                        name: userData.name,
                        avatarUrl: userData.avatar_url,
                        scopes: tokenData.scope?.split(",") || [],
                        isActive: true,
                        lastSyncAt: new Date(),
                    },
                });

                return NextResponse.redirect(`${baseUrl}/settings?github=connected`);
            } catch (tokenError) {
                console.error("Token exchange error:", tokenError);
                return NextResponse.redirect(`${baseUrl}/settings?error=token_exchange_failed`);
            }
        }

        // Handle installation without OAuth (if user already authorized before)
        if (installationId && setupAction) {
            // Update existing integration with new installation ID
            const existingIntegration = await prisma.gitHubIntegration.findUnique({
                where: { userId: session.user.id },
            });

            if (existingIntegration) {
                await prisma.gitHubIntegration.update({
                    where: { userId: session.user.id },
                    data: {
                        installationId: parseInt(installationId, 10),
                        isActive: true,
                        lastSyncAt: new Date(),
                    },
                });

                return NextResponse.redirect(`${baseUrl}/settings?github=installed`);
            }

            // No existing integration - need OAuth
            return NextResponse.redirect(`${baseUrl}/settings?error=oauth_required`);
        }

        return NextResponse.redirect(`${baseUrl}/settings?error=invalid_callback`);
    } catch (error) {
        console.error("GitHub callback error:", error);
        const baseUrl = process.env.BETTER_AUTH_URL || "";
        return NextResponse.redirect(`${baseUrl}/settings?error=callback_failed`);
    }
}

