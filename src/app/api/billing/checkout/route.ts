/**
 * API Route: Create Polar Checkout Session
 * POST /api/billing/checkout
 * 
 * Creates an embedded checkout session for plan subscription
 */

import { NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import { prisma } from "@/lib/db";
import { createCheckoutSession } from "@/lib/polar/checkout";
import { createPolarCustomer } from "@/lib/polar/customer";

export async function POST(request: Request) {
    try {
        const session = await getSession();

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { monthlyCredits, embedOrigin } = body;

        if (!monthlyCredits) {
            return NextResponse.json(
                { error: "monthlyCredits is required" },
                { status: 400 }
            );
        }

        // Get user with full details
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Ensure user has a Polar customer account
        const customerResult = await createPolarCustomer(user);
        if (!customerResult.success) {
            return NextResponse.json(
                { error: "Failed to create customer account" },
                { status: 500 }
            );
        }

        // Create checkout session
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const successUrl = `${baseUrl}/dashboard?payment_success=true`;

        const result = await createCheckoutSession({
            userId: session.user.id,
            monthlyCredits,
            successUrl,
            embedOrigin: embedOrigin || baseUrl,
        });

        if (!result.success || !result.checkout) {
            return NextResponse.json(
                { error: result.error || "Failed to create checkout session" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            checkoutId: result.checkout.id,
            checkoutUrl: result.checkout.url,
        });
    } catch (error) {
        console.error("Error creating checkout session:", error);
        return NextResponse.json(
            {
                error:
                    error instanceof Error ? error.message : "Internal server error",
            },
            { status: 500 }
        );
    }
}
