/**
 * API Route: Create Customer Portal Session
 * POST /api/billing/portal
 * 
 * Creates a Polar customer portal session for self-service subscription management
 */

import { NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import { createPortalSession } from "@/lib/polar/portal";

export async function POST(request: Request) {
    try {
        const session = await getSession();

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json().catch(() => ({}));
        const { returnUrl } = body;

        // Create portal session
        const result = await createPortalSession({
            userId: session.user.id,
            returnUrl,
        });

        if (!result.success) {
            return NextResponse.json(
                { error: result.error || "Failed to create portal session" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            url: result.portalUrl,
            expiresAt: result.expiresAt,
        });
    } catch (error) {
        console.error("Error creating portal session:", error);
        return NextResponse.json(
            {
                error:
                    error instanceof Error ? error.message : "Internal server error",
            },
            { status: 500 }
        );
    }
}
