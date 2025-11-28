import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import { prisma } from "@/lib/db";

/**
 * POST /api/integrations/vercel/token
 * Connect Vercel using a Personal Access Token
 * This is a fallback method when OAuth flow doesn't work
 */
export async function POST(request: NextRequest) {
    try {
        const session = await getSession();

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { accessToken } = body;

        if (!accessToken || typeof accessToken !== "string") {
            return NextResponse.json(
                { error: "Access token is required" },
                { status: 400 }
            );
        }

        // Validate the token by fetching user info
        const userResponse = await fetch("https://api.vercel.com/v2/user", {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        if (!userResponse.ok) {
            const errorText = await userResponse.text();
            console.error("Invalid Vercel token:", errorText);
            return NextResponse.json(
                { error: "Invalid access token. Please check your token and try again." },
                { status: 400 }
            );
        }

        const userData = await userResponse.json();

        // Store the integration
        await prisma.vercelIntegration.upsert({
            where: { userId: session.user.id },
            update: {
                accessToken,
                tokenExpiresAt: null, // Personal tokens don't expire
                vercelUserId: userData.user?.id || null,
                vercelTeamId: null,
                email: userData.user?.email || null,
                username: userData.user?.username || null,
                isActive: true,
                lastSyncAt: new Date(),
                metadata: { connectionMethod: "personal_token" },
            },
            create: {
                userId: session.user.id,
                accessToken,
                tokenExpiresAt: null,
                vercelUserId: userData.user?.id || null,
                vercelTeamId: null,
                email: userData.user?.email || null,
                username: userData.user?.username || null,
                scopes: ["all"], // Personal tokens have full access
                isActive: true,
                lastSyncAt: new Date(),
                metadata: { connectionMethod: "personal_token" },
            },
        });

        return NextResponse.json({
            success: true,
            username: userData.user?.username,
            email: userData.user?.email,
        });
    } catch (error) {
        console.error("Vercel token connection error:", error);
        return NextResponse.json(
            { error: "Failed to connect with token" },
            { status: 500 }
        );
    }
}
