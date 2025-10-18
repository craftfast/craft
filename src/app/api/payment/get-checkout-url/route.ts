/**
 * Helper endpoint to build Polar checkout URL
 * This endpoint constructs the URL to redirect to /api/checkout with proper query params
 * Required because we need to access server-side environment variables (POLAR_PRO_PRICE_ID)
 */

import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, successUrl } = body;

        // Get the price ID from environment variables (server-side)
        const priceId = process.env.POLAR_PRO_PRICE_ID || process.env.POLAR_PRODUCT_PRICE_ID;

        if (!priceId) {
            console.error("Polar price ID not configured");
            console.error("POLAR_PRO_PRICE_ID:", process.env.POLAR_PRO_PRICE_ID ? "SET" : "NOT SET");
            console.error("POLAR_PRODUCT_PRICE_ID:", process.env.POLAR_PRODUCT_PRICE_ID ? "SET" : "NOT SET");
            return NextResponse.json(
                {
                    error: "Payment system configuration error",
                    message: "Payment service is temporarily unavailable. Please contact support at support@craft.tech"
                },
                { status: 503 }
            );
        }

        // Build checkout URL with query parameters for the Polar Next.js adapter
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const checkoutUrl = new URL("/api/checkout", baseUrl);

        // Required: Product price ID
        checkoutUrl.searchParams.set("products", priceId);

        // Optional: Customer email
        if (email) {
            checkoutUrl.searchParams.set("customerEmail", email);
        }

        // Optional: Success URL (where to redirect after successful payment)
        if (successUrl) {
            checkoutUrl.searchParams.set("successUrl", successUrl);
        }

        console.log("=== Building Checkout URL ===");
        console.log("Price ID:", priceId);
        console.log("Customer Email:", email || "Not provided");
        console.log("Success URL:", successUrl || "Using default");
        console.log("Final Checkout URL:", checkoutUrl.toString());
        console.log("============================");

        return NextResponse.json({
            checkoutUrl: checkoutUrl.toString(),
        });
    } catch (error) {
        console.error("=== Error building checkout URL ===");
        console.error("Full error:", error);
        if (error instanceof Error) {
            console.error("Error message:", error.message);
            console.error("Error stack:", error.stack);
        }
        console.error("===================================");

        return NextResponse.json(
            {
                error: "Failed to build checkout URL",
                message: "Payment service is temporarily unavailable. Please try again in a few minutes or contact support at support@craft.tech"
            },
            { status: 500 }
        );
    }
}
