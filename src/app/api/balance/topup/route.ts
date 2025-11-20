/**
 * API Route: Balance Top-Up
 * POST /api/balance/topup
 * 
 * Creates a Polar checkout session for adding balance to user account.
 * Balance system: 1 credit = $1 USD, deducted at actual usage cost.
 * Uses Pay What You Want product with 10% platform fee.
 */

import { NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import { prisma } from "@/lib/db";
import { polarClient, POLAR_BALANCE_TOPUP_PRODUCT_ID } from "@/lib/polar";
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

        const { amount, useCustomCheckout, paymentMethodId } = await request.json();

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

        // Validate product configuration
        if (!POLAR_BALANCE_TOPUP_PRODUCT_ID) {
            console.error("POLAR_BALANCE_TOPUP_PRODUCT_ID is not configured");
            return NextResponse.json(
                { error: "Payment configuration error. Please contact support." },
                { status: 500 }
            );
        }

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

        // Fetch the product to get its price ID
        // For Pay What You Want products, we need to use the actual price ID, not product ID
        const product = await polarClient.products.get({
            id: POLAR_BALANCE_TOPUP_PRODUCT_ID,
        });

        if (!product.prices || product.prices.length === 0) {
            console.error("Product has no prices:", product);
            return NextResponse.json(
                { error: "Product configuration error. Please contact support." },
                { status: 500 }
            );
        }

        // Use the first available price (for PWYW products, there should be one price)
        const priceId = product.prices[0].id;

        console.log("Using product price:", {
            productId: product.id,
            priceId,
            priceType: product.prices[0].type,
        });

        // Create checkout with the actual price ID
        // Note: SDK v0.14.0 still uses legacy checkout API with productPriceId
        const checkout = await polarClient.checkouts.create({
            productPriceId: priceId,
            // Amount in cents for PWYW products - this locks the amount
            amount: Math.round(checkoutAmount * 100),
            // Lock the customer email so they cannot edit it
            customerEmail: user.email,
            allowUserToSetAmount: false, // Prevent user from editing amount
            customerBillingAddress: {
                country: "US", // Default country, user can change in checkout
            },
            embedOrigin: baseUrl,
            successUrl: `${baseUrl}/?settings=true&tab=billing&payment=success`,
            metadata: {
                userId: user.id,
                purchaseType: "balance_topup",
                requestedBalance: amount.toString(),
                platformFee: platformFee.toFixed(2),
                totalCharged: checkoutAmount.toFixed(2),
            },
        } as any); // Type assertion needed for SDK v0.14.0

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
