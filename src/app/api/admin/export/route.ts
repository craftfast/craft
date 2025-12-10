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
                        razorpayOrderId: true,
                        invoiceId: true,
                        taxAmount: true,
                        taxRate: true,
                        taxCountryCode: true,
                        metadata: true,
                        createdAt: true,
                        user: { select: { email: true, name: true, billingName: true } },
                    },
                    orderBy: { createdAt: "desc" },
                });

                csvContent = "Invoice Number,Date,User Email,User Name,Amount,Currency,Tax Amount,Tax Rate,Status,Payment ID,Order ID\n";
                csvContent += transactions
                    .map(
                        (t) =>
                            `"${t.invoiceId || ""}","${t.createdAt.toISOString()}","${t.user.email}","${t.user.billingName || t.user.name || ""}",${t.amount},"${t.currency}",${t.taxAmount || 0},${t.taxRate || 0},"${t.status}","${t.razorpayPaymentId || ""}","${t.razorpayOrderId || ""}"`
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

            case "invoices": {
                // Full invoice export for accounting/GST filing
                const invoices = await prisma.paymentTransaction.findMany({
                    where: {
                        status: "completed",
                        invoiceId: { not: null },
                    },
                    select: {
                        id: true,
                        invoiceId: true,
                        amount: true,
                        currency: true,
                        taxAmount: true,
                        taxRate: true,
                        taxCountryCode: true,
                        razorpayPaymentId: true,
                        razorpayOrderId: true,
                        metadata: true,
                        createdAt: true,
                        user: {
                            select: {
                                email: true,
                                name: true,
                                billingName: true,
                                billingAddress: true,
                                billingCountry: true,
                                taxId: true,
                            },
                        },
                    },
                    orderBy: { createdAt: "desc" },
                });

                // GST-compliant CSV headers for accounting
                csvContent = "Invoice Number,Invoice Date,Customer Name,Customer Email,Customer GSTIN,Customer State,Customer State Code,Billing Address,Taxable Amount,CGST,SGST,IGST,Total Tax,Total Amount,Currency,Place of Supply,SAC Code,Payment ID,B2B/B2C\n";
                csvContent += invoices
                    .map((inv) => {
                        const meta = (inv.metadata as Record<string, unknown>) || {};
                        const billingAddress = inv.user.billingAddress as { line1?: string; line2?: string; city?: string; state?: string; postalCode?: string } | null;
                        const addressStr = [
                            billingAddress?.line1,
                            billingAddress?.line2,
                            billingAddress?.city,
                            billingAddress?.state,
                            billingAddress?.postalCode,
                            inv.user.billingCountry,
                        ].filter(Boolean).join(", ");

                        return `"${inv.invoiceId}","${inv.createdAt.toISOString().split("T")[0]}","${inv.user.billingName || inv.user.name || ""}","${inv.user.email}","${inv.user.taxId || ""}","${meta.customerState || ""}","${meta.customerStateCode || ""}","${addressStr}",${meta.taxableAmount || inv.amount},${meta.cgst || 0},${meta.sgst || 0},${meta.igst || 0},${inv.taxAmount || 0},${inv.amount},"${inv.currency}","${meta.placeOfSupply || ""}","${meta.sacCode || ""}","${inv.razorpayPaymentId || ""}","${inv.user.taxId ? "B2B" : "B2C"}"`;
                    })
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
