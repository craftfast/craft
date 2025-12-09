/**
 * API Route: Get Balance Transactions
 * GET /api/balance/transactions
 * 
 * Returns transaction history for the authenticated user
 */

import { NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import { prisma } from "@/lib/db";
import type { BalanceTransactionType } from "@prisma/client";

export async function GET(request: Request) {
    try {
        const session = await getSession();
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get("limit") || "10");
        const offset = parseInt(searchParams.get("offset") || "0");
        const type = searchParams.get("type") as BalanceTransactionType | null; // Optional filter by type (e.g., TOPUP)

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Build where clause with optional type filter
        const whereClause: { userId: string; type?: BalanceTransactionType } = { userId: user.id };
        if (type) {
            whereClause.type = type;
        }

        // Fetch transactions
        const [transactions, total] = await Promise.all([
            prisma.balanceTransaction.findMany({
                where: whereClause,
                orderBy: { createdAt: "desc" },
                take: limit,
                skip: offset,
                select: {
                    id: true,
                    type: true,
                    amount: true,
                    balanceBefore: true,
                    balanceAfter: true,
                    description: true,
                    createdAt: true,
                    metadata: true,
                },
            }),
            prisma.balanceTransaction.count({
                where: whereClause,
            }),
        ]);

        return NextResponse.json({
            success: true,
            transactions: transactions.map(tx => ({
                id: tx.id,
                type: tx.type,
                amount: Number(tx.amount),
                balanceBefore: Number(tx.balanceBefore),
                balanceAfter: Number(tx.balanceAfter),
                description: tx.description,
                createdAt: tx.createdAt.toISOString(),
                metadata: tx.metadata,
            })),
            pagination: {
                total,
                limit,
                offset,
                hasMore: offset + limit < total,
            },
        });
    } catch (error) {
        console.error("Error fetching transactions:", error);
        return NextResponse.json(
            { error: "Failed to fetch transactions" },
            { status: 500 }
        );
    }
}
