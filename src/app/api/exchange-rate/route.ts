/**
 * Exchange Rate API
 * GET /api/exchange-rate
 * 
 * Returns the current USD to INR exchange rate.
 * Used for displaying estimated INR amounts to all customers, since all payments are processed in INR.
 */

import { NextResponse } from "next/server";
import { getUsdToInrRate, getFallbackRate } from "@/lib/exchange-rate";

export async function GET() {
    try {
        const rate = await getUsdToInrRate();

        return NextResponse.json({
            success: true,
            rate,
            currency: 'INR',
            base: 'USD',
            updated: new Date().toISOString(),
        });
    } catch (error) {
        console.error("Error fetching exchange rate:", error);
        return NextResponse.json({
            success: true,
            rate: getFallbackRate(),
            currency: 'INR',
            base: 'USD',
            fallback: true,
        });
    }
}
