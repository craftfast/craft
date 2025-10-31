import { NextRequest, NextResponse } from "next/server";
import { verifyUnlockToken } from "@/lib/account-unlock";
import { tokenSchema, validateAuthInput } from "@/lib/auth-validation";

/**
 * POST /api/auth/verify-unlock
 * Verify unlock token and unlock account
 */
export async function POST(request: NextRequest) {
    try {
        // Parse request body
        const body = await request.json();

        // Validate token
        const validation = validateAuthInput(tokenSchema, body.token);
        if (!validation.success) {
            return NextResponse.json(
                { error: validation.errors[0] },
                { status: 400 }
            );
        }

        const token = validation.data;

        // Verify and unlock
        const result = await verifyUnlockToken(token);

        if (!result.success) {
            return NextResponse.json(
                { error: result.message },
                { status: 400 }
            );
        }

        return NextResponse.json(
            {
                message: result.message,
                email: result.email,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error verifying unlock token:", error);
        return NextResponse.json(
            { error: "Failed to unlock account" },
            { status: 500 }
        );
    }
}
