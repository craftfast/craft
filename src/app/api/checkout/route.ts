/**
 * Polar Checkout Route using Next.js Adapter
 * This provides a simplified, robust checkout flow using Polar's official Next.js SDK
 * 
 * Usage: Redirect users to /api/checkout?products=PRICE_ID&customerEmail=user@example.com
 * 
 * @see https://polar.sh/docs/integrate/sdk/adapters/nextjs
 */

import { Checkout } from "@polar-sh/nextjs";

export const GET = Checkout({
    accessToken: process.env.POLAR_ACCESS_TOKEN!,
    successUrl: process.env.NEXT_PUBLIC_APP_URL
        ? `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?payment=success`
        : "http://localhost:3000/dashboard?payment=success",
    server: (process.env.POLAR_SERVER as "sandbox" | "production") || "sandbox",
    // Optional: Add a back button in the checkout UI
    // returnUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
});
