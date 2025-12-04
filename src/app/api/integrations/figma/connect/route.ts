import { NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import { getFigmaAuthUrl } from "@/lib/figma/service";

/**
 * GET /api/integrations/figma/connect
 * Initiates Figma OAuth flow
 */
export async function GET() {
    try {
        const session = await getSession();

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // State includes user ID for verification on callback
        const authUrl = getFigmaAuthUrl(session.user.id);

        return NextResponse.json({ url: authUrl });
    } catch (error) {
        console.error("Figma connect error:", error);
        return NextResponse.json(
            { error: "Failed to initiate Figma connection" },
            { status: 500 }
        );
    }
}
