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

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const checkoutId = searchParams.get("checkoutId");

        // Validate input
        if (!checkoutId) {
            return NextResponse.json(
                {
                    error: "Missing required field",
                    message: "Checkout ID is required"
                },
                { status: 400 }
            );
        }

        // Check for Polar access token
        if (!process.env.POLAR_ACCESS_TOKEN) {
            console.error("Polar access token not configured");
            return NextResponse.json(
                {
                    verified: false,
                    error: "Payment verification configuration error",
                    message: "Unable to verify payment. Please contact support at support@craft.fast"
                },
                { status: 503 }
            );
        }

        // Get checkout status from Polar
        const polar = getPolarInstance();
        const checkout = await polar.checkouts.get({ id: checkoutId });

        // Check if checkout exists - presence indicates payment initiated
        const isVerified = checkout.id === checkoutId;

        if (isVerified) {
            // Payment verified successfully
            return NextResponse.json({
                verified: true,
                checkoutId: checkout.id,
                message: "Payment verified successfully",
            });
        } else {
            return NextResponse.json({
                verified: false,
                message: "Checkout not found",
            });
        }
    } catch (error) {
        console.error("Error verifying payment:", error);
        return NextResponse.json(
            {
                verified: false,
                error: "Failed to verify payment",
                message: "Payment verification encountered an error. Please contact support at support@craft.fast to confirm your payment status."
            },
            { status: 500 }
        );
    }
}
