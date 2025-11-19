/**
 * API Route: Balance Top-Up
 * POST /api/balance/topup
 * 
 * Creates a Polar checkout session for adding balance to user account
 * Uses Pay What You Want product with 10% platform fee
 */

import { NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import { prisma } from "@/lib/db";
import { Polar } from "@polar-sh/sdk";
import {
    getCheckoutAmount,
    MINIMUM_BALANCE_AMOUNT,
    PLATFORM_FEE_PERCENT
} from "@/lib/pricing-constants";

export async function POST(request: Request) {
    try {
        const session = await getSession();
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { amount } = await request.json();

        // Validate amount
        if (!amount || typeof amount !== "number" || amount < MINIMUM_BALANCE_AMOUNT) {
            return NextResponse.json(
                { error: `Minimum top-up amount is $${MINIMUM_BALANCE_AMOUNT}` },
                { status: 400 }
            );
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true, email: true },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Calculate total checkout amount (includes 10% fee)
        const checkoutAmount = getCheckoutAmount(amount);
        const platformFee = checkoutAmount - amount;

        // Initialize Polar SDK
        const polar = new Polar({
            accessToken: process.env.POLAR_ACCESS_TOKEN!,
            server: (process.env.POLAR_SERVER as "sandbox" | "production") || "sandbox",
        });

        // Get the Pay What You Want product  price ID
        const priceId = process.env.POLAR_BALANCE_TOPUP_PRODUCT_ID;
        if (!priceId) {
            console.error("POLAR_BALANCE_TOPUP_PRODUCT_ID is not configured");
            return NextResponse.json(
                { error: "Payment configuration error. Please contact support." },
                { status: 500 }
            );
        }

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

        // Create checkout with Pay What You Want product
        // Note: For PWYW products, customer chooses amount in checkout UI
        // We pass suggested amount in metadata for webhook processing
        const checkout = await polar.checkouts.create({
            productPriceId: priceId,
            customerEmail: user.email || undefined,
            embedOrigin: baseUrl,
            successUrl: `${baseUrl}/?settings=true&tab=billing&payment=success`,
            metadata: {
                userId: user.id,
                purchaseType: "balance_topup",
                requestedBalance: amount.toString(),
                platformFee: platformFee.toFixed(2),
                totalCharged: checkoutAmount.toFixed(2),
            },
        } as never); // Type assertion for SDK compatibility

        console.log("Balance top-up checkout created:", {
            userId: user.id,
            requestedBalance: amount,
            checkoutAmount,
            platformFee,
            checkoutId: checkout.id,
        });

        return NextResponse.json({
            success: true,
            checkoutId: checkout.id,
            checkoutUrl: checkout.url,
            requestedBalance: amount,
            platformFee: platformFee.toFixed(2),
            totalCharged: checkoutAmount.toFixed(2),
        });
    } catch (error) {
        console.error("Error creating top-up checkout:", error);
        return NextResponse.json(
            {
                error: "Failed to create checkout",
                details: error instanceof Error ? error.message : "Unknown error"
            },
            { status: 500 }
        );
    }
}
