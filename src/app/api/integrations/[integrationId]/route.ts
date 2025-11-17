import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";

/**
 * PUT /api/integrations/[integrationId]
 * Update an integration configuration
 */
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ integrationId: string }> }
) {
    try {
        const session = await getSession();

        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { integrationId } = await params;
        const body = await request.json();

        // Placeholder: In production, save to database
        console.log(`Updating integration ${integrationId}:`, body);

        return NextResponse.json({
            success: true,
            integration: integrationId,
            config: body,
        });
    } catch (error) {
        console.error("Failed to update integration:", error);
        return NextResponse.json(
            { error: "Failed to update integration" },
            { status: 500 }
        );
    }
}
