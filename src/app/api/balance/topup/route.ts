/**
 * API Route: Balance Top-Up
 * POST /api/balance/topup
 * 
 * Creates a Razorpay order for adding balance to user account.
 * Balance system: 1 credit = $1 USD, deducted at actual usage cost.
 * Includes 10% platform fee.
 */

import { NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import { prisma } from "@/lib/db";
import { createRazorpayOrder } from "@/lib/razorpay/orders";
import { RAZORPAY_CONFIG } from "@/lib/razorpay-config";
import {
    getCheckoutAmount,
    MINIMUM_BALANCE_AMOUNT,
    MAXIMUM_BALANCE_AMOUNT,
} from "@/lib/pricing-constants";
import { paymentRateLimiter, checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";

export async function POST(request: Request) {
    try {
        const session = await getSession();
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Rate limit payment requests (fail closed for security)
        const rateLimitResult = await checkRateLimit(
            paymentRateLimiter,
            session.user.email,
            true // failClosed = true for payment endpoints
        );

        if (!rateLimitResult.success) {
            return NextResponse.json(
                { error: "Too many payment requests. Please try again later." },
                {
                    status: 429,
                    headers: getRateLimitHeaders(rateLimitResult),
                }
            );
        }

        const { amount } = await request.json();

        // Validate amount - minimum and maximum limits
        if (!amount || typeof amount !== "number" || amount < MINIMUM_BALANCE_AMOUNT) {
            return NextResponse.json(
                { error: `Minimum top-up amount is $${MINIMUM_BALANCE_AMOUNT}` },
                { status: 400 }
            );
        }

        if (amount > MAXIMUM_BALANCE_AMOUNT) {
            return NextResponse.json(
                { error: `Maximum top-up amount is $${MAXIMUM_BALANCE_AMOUNT} per transaction (Razorpay limit)` },
                { status: 400 }
            );
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: {
                id: true,
                email: true,
                name: true,
                billingCountry: true,
            },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Calculate total checkout amount (includes 10% fee + 18% GST on total for ALL customers)
        const checkoutAmount = getCheckoutAmount(amount, user.billingCountry);
        const platformFee = amount * 0.1; // 10% platform fee
        const subtotal = amount + platformFee;
        const gst = subtotal * 0.18; // 18% GST on total (credits + fee) for ALL customers
        const isIndian = user.billingCountry === "IN";

        // Create Razorpay order (always in INR)
        const description = `Balance Top-Up: $${amount} + $${platformFee.toFixed(2)} fee + $${gst.toFixed(2)} GST`;

        const order = await createRazorpayOrder({
            userId: user.id,
            userName: user.name || user.email,
            userEmail: user.email,
            amount: checkoutAmount,
            description,
            countryCode: user.billingCountry, // Pass country for currency selection
            notes: {
                purchase_type: "balance_topup",
                requested_balance: amount.toString(),
                platform_fee: platformFee.toFixed(2),
                gst: gst.toFixed(2),
                billing_country: user.billingCountry || "unknown",
                total_charged: checkoutAmount.toFixed(2),
            },
        });

        console.log("Balance top-up order created:", {
            userId: user.id,
            requestedBalance: amount,
            checkoutAmount,
            platformFee,
            gst,
            billingCountry: user.billingCountry,
            orderId: order.orderId,
            currency: order.currency,
            chargeAmount: order.chargeAmount,
            exchangeRate: order.exchangeRate,
        });

        return NextResponse.json({
            success: true,
            orderId: order.orderId,
            amount: order.amount,
            currency: order.currency,
            keyId: RAZORPAY_CONFIG.keyId,
            requestedBalance: amount,
            platformFee: platformFee.toFixed(2),
            gst: gst.toFixed(2),
            isIndian,
            totalCharged: checkoutAmount.toFixed(2),
            // Currency conversion info
            chargeAmount: order.chargeAmount,
            originalUsdAmount: order.originalUsdAmount,
            exchangeRate: order.exchangeRate,
        });
    } catch (error) {
        console.error("Error creating top-up order:", error);
        return NextResponse.json(
            {
                error: "Failed to create order",
                details: error instanceof Error ? error.message : "Unknown error"
            },
            { status: 500 }
        );
    }
}
