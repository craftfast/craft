import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { makePrimaryEmail } from "@/lib/email-management";

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { emailId } = body;

        if (!emailId) {
            return NextResponse.json(
                { error: "Email ID is required" },
                { status: 400 }
            );
        }

        await makePrimaryEmail(session.user.id, emailId);

        // Update the session with the new primary email
        // This will be reflected on the next session refresh
        return NextResponse.json({
            message: "Primary email updated successfully",
        });
    } catch (error) {
        console.error("Error making email primary:", error);

        if (error instanceof Error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json(
            { error: "Failed to update primary email" },
            { status: 500 }
        );
    }
}
