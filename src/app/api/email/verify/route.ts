import { NextRequest, NextResponse } from "next/server";
import { verifyUserEmail } from "@/lib/email-management";
import { redirect } from "next/navigation";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const token = searchParams.get("token");

        if (!token) {
            return NextResponse.redirect(
                new URL("/settings?error=invalid-token", req.url)
            );
        }

        await verifyUserEmail(token);

        return NextResponse.redirect(
            new URL("/settings?success=email-verified", req.url)
        );
    } catch (error) {
        console.error("Error verifying email:", error);

        const errorMessage = error instanceof Error ? error.message : "Failed to verify email";

        return NextResponse.redirect(
            new URL(`/settings?error=${encodeURIComponent(errorMessage)}`, req.url)
        );
    }
}
