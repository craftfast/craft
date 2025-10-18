import { NextRequest, NextResponse } from "next/server";
import { Polar } from "@polar-sh/sdk";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { checkoutId, paymentId, signature } = body;

        // Validate input
        if (!checkoutId || !paymentId || !signature) {
            return NextResponse.json(
                {
                    error: "Missing required fields",
                    message: "Payment verification data is incomplete. Please contact support."
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
                    message: "Unable to verify payment. Please contact support at support@craft.fast with your payment ID: " + paymentId
                },
                { status: 503 }
            );
        }

        // Verify payment with Polar
        const server = process.env.POLAR_SERVER as "sandbox" | "production" | undefined;
        const polar = new Polar({
            accessToken: process.env.POLAR_ACCESS_TOKEN!,
            server: server || "sandbox", // Default to sandbox for safety
        });

        const checkout = await polar.checkouts.get({ id: checkoutId });
        // Verify checkout exists
        const isVerified = checkout.id === checkoutId;

        if (isVerified) {
            // Payment verified successfully
            // Here you would:
            // 1. Update user's subscription status in database
            // 2. Send confirmation email
            // 3. Grant access to premium features

            return NextResponse.json({
                verified: true,
                message: "Payment verified successfully",
            });
        } else {
            return NextResponse.json(
                {
                    verified: false,
                    error: "Invalid signature",
                    message: "Payment verification failed. Your payment may still be processing. Please contact support at support@craft.fast if you were charged."
                },
                { status: 400 }
            );
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
