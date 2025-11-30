/**
 * Admin Export API
 *
 * GET /api/admin/export - Export data as CSV
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/get-session";
import { isAdmin } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const hasAdminRole = await isAdmin(session.user.id);
        if (!hasAdminRole) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const type = searchParams.get("type") || "users";

        let csvContent = "";

        switch (type) {
            case "users": {
                const users = await prisma.user.findMany({
                    where: { deletedAt: null },
                    select: {
                        id: true,
                        email: true,
                        name: true,
                        role: true,
                        emailVerified: true,
                        accountBalance: true,
                        createdAt: true,
                        banned: true,
                        _count: { select: { projects: true } },
                    },
                    orderBy: { createdAt: "desc" },
                });

                csvContent = "ID,Email,Name,Role,Verified,Balance,Projects,Created,Banned\n";
                csvContent += users
                    .map(
                        (u) =>
                            `"${u.id}","${u.email}","${u.name || ""}","${u.role}",${u.emailVerified},${u.accountBalance},${u._count.projects},"${u.createdAt.toISOString()}",${u.banned || false}`
                    )
                    .join("\n");
                break;
            }

            case "transactions": {
                const transactions = await prisma.paymentTransaction.findMany({
                    select: {
                        id: true,
                        userId: true,
                        amount: true,
                        currency: true,
                        status: true,
                        paymentMethod: true,
                        razorpayPaymentId: true,
                        createdAt: true,
                        user: { select: { email: true } },
                    },
                    orderBy: { createdAt: "desc" },
                });

                csvContent = "ID,User Email,Amount,Currency,Status,Method,Payment ID,Created\n";
                csvContent += transactions
                    .map(
                        (t) =>
                            `"${t.id}","${t.user.email}",${t.amount},"${t.currency}","${t.status}","${t.paymentMethod}","${t.razorpayPaymentId || ""}","${t.createdAt.toISOString()}"`
                    )
                    .join("\n");
                break;
            }

            case "usage": {
                const usage = await prisma.aICreditUsage.findMany({
                    select: {
                        id: true,
                        userId: true,
                        projectId: true,
                        model: true,
                        inputTokens: true,
                        outputTokens: true,
                        totalTokens: true,
                        providerCostUsd: true,
                        callType: true,
                        createdAt: true,
                    },
                    orderBy: { createdAt: "desc" },
                    take: 10000, // Limit to 10k records
                });

                csvContent = "ID,User ID,Project ID,Model,Input Tokens,Output Tokens,Total Tokens,Cost USD,Type,Created\n";
                csvContent += usage
                    .map(
                        (u) =>
                            `"${u.id}","${u.userId}","${u.projectId}","${u.model}",${u.inputTokens},${u.outputTokens},${u.totalTokens},${u.providerCostUsd},"${u.callType}","${u.createdAt.toISOString()}"`
                    )
                    .join("\n");
                break;
            }

            default:
                return NextResponse.json({ error: "Invalid export type" }, { status: 400 });
        }

        return new NextResponse(csvContent, {
            headers: {
                "Content-Type": "text/csv",
                "Content-Disposition": `attachment; filename="${type}-export-${new Date().toISOString().split("T")[0]}.csv"`,
            },
        });
    } catch (error) {
        console.error("Error exporting data:", error);
        return NextResponse.json(
            { error: "Failed to export data" },
            { status: 500 }
        );
    }
}
