import { NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import { prisma } from "@/lib/db";

/**
 * GET /api/payment-methods
 * 
 * Retrieves saved payment methods for the authenticated user.
 * Returns Stripe payment methods associated with the user's Polar customer.
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
                polarCustomerId: true,
            },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // If no Polar customer ID, return empty array
        if (!user.polarCustomerId) {
            return NextResponse.json({
                success: true,
                paymentMethods: [],
            });
        }

        // TODO: Integrate with Stripe to fetch actual payment methods
        // For now, return mock data structure
        // In production, you would:
        // 1. Use Stripe SDK to fetch payment methods for the customer
        // 2. const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
        // 3. const paymentMethods = await stripe.paymentMethods.list({ customer: stripeCustomerId })

        const mockPaymentMethods = [
            // Example structure - replace with actual Stripe integration
            // {
            //   id: "pm_xxx",
            //   brand: "visa",
            //   last4: "4242",
            //   expMonth: 12,
            //   expYear: 2025,
            //   isDefault: true,
            // }
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
 * Creates a Stripe setup intent for collecting payment method details.
 */
export async function POST(request: Request) {
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
                polarCustomerId: true,
            },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // TODO: Integrate with Stripe to create setup intent
        // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
        // const setupIntent = await stripe.setupIntents.create({
        //   customer: stripeCustomerId,
        //   payment_method_types: ['card'],
        // })

        return NextResponse.json({
            success: true,
            setupIntent: {
                clientSecret: "seti_xxx", // Replace with actual Stripe setup intent
            },
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

        // TODO: Integrate with Stripe to detach payment method
        // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
        // await stripe.paymentMethods.detach(paymentMethodId)

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
