import { NextRequest, NextResponse } from "next/server";
import { Polar } from "@polar-sh/sdk";

// Initialize Polar instance
function getPolarInstance() {
    const accessToken = process.env.POLAR_ACCESS_TOKEN;
    if (!accessToken) {
        throw new Error("POLAR_ACCESS_TOKEN environment variable is not set");
    }

    const server = process.env.POLAR_SERVER as "sandbox" | "production" | undefined;

    return new Polar({
        accessToken,
        server: server || "sandbox", // Default to sandbox for safety
    });
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { amount, currency, productName, productDescription, email, successUrl } = body;

        // Validate input
        if (!amount || !currency || !productName) {
            return NextResponse.json(
                {
                    error: "Missing required fields",
                    message: "Payment information is incomplete. Please try again."
                },
                { status: 400 }
            );
        }

        // Validate Polar credentials
        const priceId = process.env.POLAR_PRO_PRICE_ID || process.env.POLAR_PRODUCT_PRICE_ID;

        if (!process.env.POLAR_ACCESS_TOKEN || !priceId) {
            console.error("Polar credentials not configured");
            return NextResponse.json(
                {
                    error: "Payment system configuration error",
                    message: "Payment service is temporarily unavailable. Please contact support at support@craft.tech"
                },
                { status: 503 }
            );
        }

        // Create Polar checkout
        const polar = getPolarInstance();

        const checkout = await polar.checkouts.custom.create({
            paymentProcessor: "stripe",
            productPriceId: priceId,
            successUrl: successUrl || `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard?payment=success`,
            customerEmail: email,
            metadata: {
                productName,
                productDescription,
                amount: amount.toString(),
                currency,
                timestamp: new Date().toISOString(),
            },
        });

        return NextResponse.json({
            checkoutId: checkout.id,
            checkoutUrl: checkout.url,
            amount: amount,
            currency: currency,
        });
    } catch (error) {
        console.error("Error creating Polar checkout:", error);

        // Provide user-friendly error message
        const errorMessage = error instanceof Error && error.message.includes("authentication")
            ? "Payment service authentication failed. Please contact support."
            : "Payment service is temporarily unavailable. Please try again in a few minutes or contact support at support@craft.tech";

        return NextResponse.json(
            {
                error: "Failed to create checkout",
                message: errorMessage
            },
            { status: 500 }
        );
    }
}
