import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getFeedbackStats } from "@/lib/feedback";

export async function GET(request: NextRequest) {
    try {
        // Check admin authorization
        const adminCheck = await requireAdmin(request);
        if (adminCheck) return adminCheck;

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
