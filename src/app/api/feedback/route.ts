import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        const { feedback, sentiment } = await req.json();

        if (!feedback || !feedback.trim()) {
            return NextResponse.json(
                { error: "Feedback is required" },
                { status: 400 }
            );
        }

        // Save feedback to database
        await prisma.feedback.create({
            data: {
                userId: session?.user?.id,
                email: session?.user?.email,
                name: session?.user?.name,
                message: feedback,
                sentiment: sentiment,
            },
        });

        console.log("Feedback saved:", {
            userId: session?.user?.id,
            userEmail: session?.user?.email,
            userName: session?.user?.name,
            sentiment,
            timestamp: new Date().toISOString(),
        });

        return NextResponse.json(
            { message: "Feedback submitted successfully" },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error submitting feedback:", error);
        return NextResponse.json(
            { error: "Failed to submit feedback" },
            { status: 500 }
        );
    }
}
