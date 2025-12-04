import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import { prisma } from "@/lib/db";
import {
    getFigmaFile,
    extractFramesFromDocument,
    parseFigmaUrl,
    refreshFigmaToken,
} from "@/lib/figma/service";

/**
 * GET /api/integrations/figma/files
 * Get file structure and frames from a Figma file
 * Query params: url (Figma file URL) or fileKey
 */
export async function GET(request: NextRequest) {
    try {
        const session = await getSession();

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get Figma integration
        const integration = await prisma.figmaIntegration.findUnique({
            where: { userId: session.user.id },
        });

        if (!integration || !integration.isActive) {
            return NextResponse.json(
                { error: "Figma not connected" },
                { status: 400 }
            );
        }

        // Check if token needs refresh
        let accessToken = integration.accessToken;
        if (integration.tokenExpiresAt && new Date() > integration.tokenExpiresAt) {
            if (!integration.refreshToken) {
                return NextResponse.json(
                    { error: "Figma token expired, please reconnect" },
                    { status: 401 }
                );
            }

            try {
                const newTokens = await refreshFigmaToken(integration.refreshToken);
                accessToken = newTokens.access_token;

                // Update stored tokens
                await prisma.figmaIntegration.update({
                    where: { userId: session.user.id },
                    data: {
                        accessToken: newTokens.access_token,
                        refreshToken: newTokens.refresh_token,
                        tokenExpiresAt: new Date(Date.now() + newTokens.expires_in * 1000),
                    },
                });
            } catch {
                return NextResponse.json(
                    { error: "Failed to refresh Figma token, please reconnect" },
                    { status: 401 }
                );
            }
        }

        // Get file key from URL or direct param
        const searchParams = request.nextUrl.searchParams;
        const url = searchParams.get("url");
        const fileKeyParam = searchParams.get("fileKey");

        let fileKey: string;

        if (url) {
            const parsed = parseFigmaUrl(url);
            if (!parsed) {
                return NextResponse.json(
                    { error: "Invalid Figma URL" },
                    { status: 400 }
                );
            }
            fileKey = parsed.fileKey;
        } else if (fileKeyParam) {
            fileKey = fileKeyParam;
        } else {
            return NextResponse.json(
                { error: "Missing url or fileKey parameter" },
                { status: 400 }
            );
        }

        // Fetch file from Figma
        const file = await getFigmaFile(accessToken, fileKey);
        const frames = extractFramesFromDocument(file.document);

        return NextResponse.json({
            fileKey,
            name: file.name,
            lastModified: file.lastModified,
            thumbnailUrl: file.thumbnailUrl,
            frames,
        });
    } catch (error) {
        console.error("Figma files error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to fetch Figma file" },
            { status: 500 }
        );
    }
}
