import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getUserEmails } from "@/lib/email-management";

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const emails = await getUserEmails(session.user.id);

        return NextResponse.json({ emails });
    } catch (error) {
        console.error("Error fetching user emails:", error);
        return NextResponse.json(
            { error: "Failed to fetch emails" },
            { status: 500 }
        );
    }
}
