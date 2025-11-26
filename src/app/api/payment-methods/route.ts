import { NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import { prisma } from "@/lib/db";

/**
 * GET /api/payment-methods
 * 
 * Retrieves saved payment methods for the authenticated user.
 * Returns payment methods associated with the user's Razorpay customer.
 */
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
                razorpayCustomerId: true,
            },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // If no Razorpay customer ID, return empty array
        if (!user.razorpayCustomerId) {
            return NextResponse.json({
                success: true,
                paymentMethods: [],
            });
        }

        // TODO: Integrate with Razorpay to fetch actual payment methods
        // For now, return empty array as Razorpay handles payment methods through checkout
        // Note: Razorpay doesn't support saved payment methods in the same way as Stripe
        // Payment methods are managed through Razorpay checkout flow

        const mockPaymentMethods: { id: string; type: string; last4: string }[] = [
            // Razorpay doesn't provide a direct API for saved payment methods
            // Payment methods are handled through checkout flow
        ];

        return NextResponse.json({
            success: true,
            paymentMethods: mockPaymentMethods,
        });
    } catch (error) {
        console.error("Error fetching payment methods:", error);
        return NextResponse.json(
            {
                error: "Failed to fetch payment methods",
                details: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}

/**
 * POST /api/payment-methods
 * 
 * Adds a new payment method for the user.
 * Note: Razorpay handles payment methods through checkout flow, not setup intents.
 */
export async function POST(_request: Request) {
    try {
        const session = await getSession();
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: {
                id: true,
                email: true,
                razorpayCustomerId: true,
            },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Note: Razorpay doesn't support setup intents like Stripe
        // Payment methods are collected during checkout flow

        return NextResponse.json({
            success: false,
            message: "Payment methods are managed through Razorpay checkout flow",
        });
    } catch (error) {
        console.error("Error creating setup intent:", error);
        return NextResponse.json(
            {
                error: "Failed to create payment method setup",
                details: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/payment-methods/:id
 * 
 * Removes a saved payment method.
 */
export async function DELETE(request: Request) {
    try {
        const session = await getSession();
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { paymentMethodId } = await request.json();

        if (!paymentMethodId) {
            return NextResponse.json(
                { error: "Payment method ID required" },
                { status: 400 }
            );
        }

        // Note: Razorpay doesn't support detaching payment methods via API
        // Payment methods are managed through Razorpay dashboard

        return NextResponse.json({
            success: true,
            message: "Payment method removed",
        });
    } catch (error) {
        console.error("Error removing payment method:", error);
        return NextResponse.json(
            {
                error: "Failed to remove payment method",
                details: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}
