import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
    try {
        const session = await getSession();

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get query parameters
        const { searchParams } = new URL(req.url);
        const limit = parseInt(searchParams.get("limit") || "50");
        const offset = parseInt(searchParams.get("offset") || "0");
        const sentiment = searchParams.get("sentiment");

        // Build where clause
        const where: any = {};
        if (sentiment) {
            where.sentiment = sentiment;
        }

        // Fetch feedback
        const [feedback, total] = await Promise.all([
            prisma.feedback.findMany({
                where,
                orderBy: {
                    createdAt: "desc",
                },
                take: limit,
                skip: offset,
            }),
            prisma.feedback.count({ where }),
        ]);

        return NextResponse.json({
            feedback,
            total,
            limit,
            offset,
        });
    } catch (error) {
        console.error("Error fetching feedback:", error);
        return NextResponse.json(
            { error: "Failed to fetch feedback" },
            { status: 500 }
        );
    }
}
