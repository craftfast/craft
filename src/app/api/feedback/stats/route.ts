import { NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import { getFeedbackStats } from "@/lib/feedback";

export async function GET() {
    try {
        const session = await getSession();

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // TODO: Add admin check here
        // For now, any logged-in user can view stats
        // In production, restrict to admin users only

        const stats = await getFeedbackStats();

        return NextResponse.json(stats);
    } catch (error) {
        console.error("Error fetching feedback stats:", error);
        return NextResponse.json(
            { error: "Failed to fetch feedback statistics" },
            { status: 500 }
        );
    }
}
