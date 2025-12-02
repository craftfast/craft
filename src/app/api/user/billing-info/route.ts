import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { z } from "zod";

// Validation schema for billing info
const billingInfoSchema = z.object({
    billingName: z.string().optional(),
    billingCountry: z.string().optional(),
    billingAddress: z
        .object({
            line1: z.string().optional(),
            line2: z.string().optional(),
            city: z.string().optional(),
            state: z.string().optional(),
            postalCode: z.string().optional(),
        })
        .optional(),
    taxId: z.string().optional(),
    taxIdCountry: z.string().optional(),
    sendInvoiceEmail: z.boolean().optional(),
});

export type BillingAddress = {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
};

export type BillingInfo = {
    billingName?: string;
    billingCountry?: string;
    billingAddress?: BillingAddress;
    taxId?: string;
    taxIdCountry?: string;
    sendInvoiceEmail?: boolean;
};

/**
 * GET /api/user/billing-info
 * Get the current user's billing information
 */
export async function GET() {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
                billingName: true,
                billingCountry: true,
                billingAddress: true,
                taxId: true,
                taxIdCountry: true,
                sendInvoiceEmail: true,
            },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            billingInfo: {
                billingName: user.billingName,
                billingCountry: user.billingCountry,
                billingAddress: user.billingAddress as BillingAddress | null,
                taxId: user.taxId,
                taxIdCountry: user.taxIdCountry,
                sendInvoiceEmail: user.sendInvoiceEmail,
            },
        });
    } catch (error) {
        console.error("Error fetching billing info:", error);
        return NextResponse.json(
            { error: "Failed to fetch billing info" },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/user/billing-info
 * Update the current user's billing information
 */
export async function PUT(request: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const validatedData = billingInfoSchema.parse(body);

        const updateData: Record<string, unknown> = {};

        if (validatedData.billingName !== undefined) {
            updateData.billingName = validatedData.billingName || null;
        }

        if (validatedData.billingCountry !== undefined) {
            updateData.billingCountry = validatedData.billingCountry || null;
        }

        if (validatedData.billingAddress !== undefined) {
            updateData.billingAddress = validatedData.billingAddress;
        }

        if (validatedData.taxId !== undefined) {
            updateData.taxId = validatedData.taxId || null;
        }

        if (validatedData.taxIdCountry !== undefined) {
            updateData.taxIdCountry = validatedData.taxIdCountry || null;
        }

        if (validatedData.sendInvoiceEmail !== undefined) {
            updateData.sendInvoiceEmail = validatedData.sendInvoiceEmail;
        }

        const updatedUser = await prisma.user.update({
            where: { id: session.user.id },
            data: updateData,
            select: {
                billingName: true,
                billingCountry: true,
                billingAddress: true,
                taxId: true,
                taxIdCountry: true,
                sendInvoiceEmail: true,
            },
        });

        return NextResponse.json({
            success: true,
            billingInfo: {
                billingName: updatedUser.billingName,
                billingCountry: updatedUser.billingCountry,
                billingAddress: updatedUser.billingAddress as BillingAddress | null,
                taxId: updatedUser.taxId,
                taxIdCountry: updatedUser.taxIdCountry,
                sendInvoiceEmail: updatedUser.sendInvoiceEmail,
            },
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Invalid billing info", details: error.issues },
                { status: 400 }
            );
        }

        console.error("Error updating billing info:", error);
        return NextResponse.json(
            { error: "Failed to update billing info" },
            { status: 500 }
        );
    }
}
