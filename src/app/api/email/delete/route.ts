import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { deleteUserEmail } from "@/lib/email-management";

export async function DELETE(req: NextRequest) {
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

        await deleteUserEmail(session.user.id, emailId);

        return NextResponse.json({
            message: "Email deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting email:", error);

        if (error instanceof Error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json(
            { error: "Failed to delete email" },
            { status: 500 }
        );
    }
}
