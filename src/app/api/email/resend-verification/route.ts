import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { resendVerificationEmail } from "@/lib/email-management";

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

        await resendVerificationEmail(session.user.id, emailId);

        return NextResponse.json({
            message: "Verification email sent successfully",
        });
    } catch (error) {
        console.error("Error resending verification email:", error);

        if (error instanceof Error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json(
            { error: "Failed to resend verification email" },
            { status: 500 }
        );
    }
}
