/**
 * Polar Checkout Route using Next.js Adapter
 * This provides a simplified, robust checkout flow using Polar's official Next.js SDK
 * 
 * Usage: 
 * - For redirects: /api/checkout?products=PRICE_ID&customerEmail=user@example.com
 * - For embedded: /api/checkout?products=PRICE_ID&customerEmail=user@example.com&embed_origin=https://yourdomain.com
 * 
 * @see https://polar.sh/docs/integrate/sdk/adapters/nextjs
 * @see https://polar.sh/docs/features/checkout/embed
 */

import { Checkout } from "@polar-sh/nextjs";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const embedOrigin = searchParams.get("embed_origin");

    // Create checkout handler with dynamic config based on embed mode
    const checkoutHandler = Checkout({
        accessToken: process.env.POLAR_ACCESS_TOKEN!,
        successUrl: process.env.NEXT_PUBLIC_APP_URL
            ? `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?payment=success`
            : "http://localhost:3000/dashboard?payment=success",
        server: (process.env.POLAR_SERVER as "sandbox" | "production") || "sandbox",
        // Add embed_origin if provided (for embedded checkout)
        ...(embedOrigin && { embedOrigin }),
    });

    return checkoutHandler(request);
}
