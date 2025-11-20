/**
 * Razorpay Checkout Route
 * This provides a checkout flow using Razorpay payment gateway
 * 
 * Note: Razorpay doesn't have a hosted checkout like Polar.
 * Instead, we create orders and use Razorpay's JavaScript SDK on the frontend.
 * This endpoint is kept for API compatibility but redirects to balance top-up.
 */

import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    // Razorpay uses a different flow - orders are created via API
    // and checkout is handled on the frontend with Razorpay.js

    // For now, redirect to the app with a message
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    return NextResponse.redirect(
        `${baseUrl}/?settings=true&tab=billing&message=Use+the+top-up+button+to+add+balance`
    );
}

export async function POST(request: NextRequest) {
    // If a POST request is made, suggest using the balance top-up endpoint
    return NextResponse.json({
        error: "This endpoint is for Polar compatibility only",
        message: "Use /api/balance/topup to create Razorpay orders",
    }, { status: 400 });
}
