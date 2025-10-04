import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";

// Initialize Razorpay instance
// Make sure to add these environment variables to your .env.local file
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { amount, currency, plan } = body;

        // Validate input
        if (!amount || !currency || !plan) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        // Create Razorpay order
        const options = {
            amount: amount, // Amount in smallest currency unit
            currency: currency,
            receipt: `receipt_${Date.now()}`,
            notes: {
                plan: plan,
                timestamp: new Date().toISOString(),
            },
        };

        const order = await razorpay.orders.create(options);

        return NextResponse.json({
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
        });
    } catch (error) {
        console.error("Error creating Razorpay order:", error);
        return NextResponse.json(
            { error: "Failed to create order" },
            { status: 500 }
        );
    }
}
