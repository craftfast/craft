import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import { prisma } from "@/lib/db";
import { exchangeFigmaCodeForToken, getFigmaUser } from "@/lib/figma/service";

/**
 * GET /api/integrations/figma/callback
 * Handles Figma OAuth callback
 */
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    const baseUrl = process.env.BETTER_AUTH_URL || "";

    try {
        const session = await getSession();

        if (!session?.user?.id) {
            return NextResponse.redirect(`${baseUrl}/settings?tab=integrations&error=unauthorized`);
        }

        // Verify state matches user ID
        if (state && state !== session.user.id) {
            return NextResponse.redirect(`${baseUrl}/settings?tab=integrations&error=invalid_state`);
        }

        if (error) {
            console.error("Figma OAuth error:", error);
            return NextResponse.redirect(`${baseUrl}/settings?tab=integrations&error=${error}`);
        }

        if (!code) {
            return NextResponse.redirect(`${baseUrl}/settings?tab=integrations&error=no_code`);
        }

        // Exchange code for token
        const tokenData = await exchangeFigmaCodeForToken(code);

        // Get Figma user info
        const figmaUser = await getFigmaUser(tokenData.access_token);

        // Calculate token expiration
        const tokenExpiresAt = new Date(Date.now() + tokenData.expires_in * 1000);

        // Store/update Figma integration
        await prisma.figmaIntegration.upsert({
            where: { userId: session.user.id },
            update: {
                accessToken: tokenData.access_token,
                refreshToken: tokenData.refresh_token,
                tokenExpiresAt,
                figmaUserId: figmaUser.id,
                email: figmaUser.email,
                handle: figmaUser.handle,
                imgUrl: figmaUser.img_url,
                isActive: true,
                lastSyncAt: new Date(),
            },
            create: {
                userId: session.user.id,
                accessToken: tokenData.access_token,
                refreshToken: tokenData.refresh_token,
                tokenExpiresAt,
                figmaUserId: figmaUser.id,
                email: figmaUser.email,
                handle: figmaUser.handle,
                imgUrl: figmaUser.img_url,
                isActive: true,
                lastSyncAt: new Date(),
            },
        });

        return NextResponse.redirect(`${baseUrl}/settings?tab=integrations&figma=connected`);
    } catch (err) {
        console.error("Figma callback error:", err);
        return NextResponse.redirect(`${baseUrl}/settings?tab=integrations&error=callback_failed`);
    }
}
