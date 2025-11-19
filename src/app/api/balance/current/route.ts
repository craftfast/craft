/**
 * API Route: Get Current Balance
 * GET /api/balance/current
 * 
 * Returns the current account balance for the authenticated user
 */

import { NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import { prisma } from "@/lib/db";

export async function GET() {
    try {
        const session = await getSession();
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: {
                id: true,
                accountBalance: true
            },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const balance = Number(user.accountBalance || 0);

        return NextResponse.json({
            success: true,
            balance: balance,
            balanceFormatted: `$${balance.toFixed(2)}`,
        });
    } catch (error) {
        console.error("Error fetching balance:", error);
        return NextResponse.json(
            { error: "Failed to fetch balance" },
            { status: 500 }
        );
    }
}
