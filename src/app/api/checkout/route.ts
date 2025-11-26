/**
 * Razorpay Checkout Route
 * This provides a checkout flow using Razorpay payment gateway
 * 
 * Razorpay uses orders and the JavaScript SDK on the frontend.
 * This endpoint is kept for API compatibility but redirects to balance top-up.
 */

import { NextRequest, NextResponse } from "next/server";

export async function GET(_request: NextRequest) {
    // Razorpay uses a different flow - orders are created via API
    // and checkout is handled on the frontend with Razorpay.js

    // For now, redirect to the app with a message
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    return NextResponse.redirect(
        `${baseUrl}/?settings=true&tab=billing&message=Use+the+top-up+button+to+add+balance`
    );
}

export async function POST(_request: NextRequest) {
    // If a POST request is made, suggest using the balance top-up endpoint
    return NextResponse.json({
        error: "Use /api/balance/topup to create Razorpay orders",
        message: "Use /api/balance/topup to create Razorpay orders",
    }, { status: 400 });
}
