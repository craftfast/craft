import { NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import { getInstallationUrl } from "@/lib/github-app";

/**
 * GET /api/integrations/github/connect
 * Initiates GitHub App installation flow
 * 
 * GitHub App flow:
 * 1. User clicks "Connect GitHub" 
 * 2. Redirect to GitHub App installation page
 * 3. User installs app (selects repos)
 * 4. GitHub redirects back with installation_id
 * 5. We also get OAuth authorization (if "Request user authorization" is enabled)
 */
export async function GET() {
    try {
        const session = await getSession();

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get the GitHub App installation URL
        // State includes user ID for verification on callback
        const installUrl = getInstallationUrl(session.user.id);

        return NextResponse.json({ url: installUrl });
    } catch (error) {
        console.error("GitHub App connect error:", error);
        return NextResponse.json(
            { error: "Failed to initiate GitHub connection" },
            { status: 500 }
        );
    }
}

