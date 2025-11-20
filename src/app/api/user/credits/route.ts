import { NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import { prisma } from "@/lib/db";

export async function GET() {
    try {
        const session = await getSession();

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get user's current balance
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { accountBalance: true },
        });

        const balance = Number(user?.accountBalance || 0);
        const allowed = balance >= 0.50; // Minimum threshold

        return NextResponse.json({
            totalAvailable: balance,
            allowed,
            reason: allowed ? undefined : "Insufficient balance. Please top up.",
        });
    } catch (error) {
        console.error("Error fetching credit balance:", error);
        return NextResponse.json(
            { error: "Failed to fetch credit balance" },
            { status: 500 }
        );
    }
}
