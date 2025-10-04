import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { orderId, paymentId, signature } = body;

        // Validate input
        if (!orderId || !paymentId || !signature) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        // Verify signature
        const generatedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
            .update(`${orderId}|${paymentId}`)
            .digest("hex");

        const isVerified = generatedSignature === signature;

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
                { verified: false, error: "Invalid signature" },
                { status: 400 }
            );
        }
    } catch (error) {
        console.error("Error verifying payment:", error);
        return NextResponse.json(
            { error: "Failed to verify payment" },
            { status: 500 }
        );
    }
}
