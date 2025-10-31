import { NextRequest, NextResponse } from "next/server";
import { requestAccountUnlock } from "@/lib/account-unlock";
import { emailSchema, validateAuthInput } from "@/lib/auth-validation";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

/**
 * POST /api/auth/request-unlock
 * Request account unlock email
 */
export async function POST(request: NextRequest) {
    try {
        // Rate limiting (stricter than normal auth)
        const clientIp = getClientIp(request);
        const identifier = `unlock-request:${clientIp}`;
        const { success, limit, remaining, reset } = await checkRateLimit(identifier);

        if (!success) {
            const resetDate = new Date(reset);
            const minutesUntilReset = Math.ceil((resetDate.getTime() - Date.now()) / 60000);

            return NextResponse.json(
                {
                    error: `Too many unlock requests. Please try again in ${minutesUntilReset} minute${minutesUntilReset !== 1 ? 's' : ''}.`,
                },
                {
                    status: 429,
                    headers: {
                        "X-RateLimit-Limit": limit.toString(),
                        "X-RateLimit-Remaining": remaining.toString(),
                        "X-RateLimit-Reset": reset.toString(),
                    },
                }
            );
        }

        // Parse request body
        const body = await request.json();

        // Validate email
        const validation = validateAuthInput(emailSchema, body.email);
        if (!validation.success) {
            return NextResponse.json(
                { error: validation.errors[0] },
                { status: 400 }
            );
        }

        const email = validation.data;

        // Request unlock
        const result = await requestAccountUnlock(email);

        return NextResponse.json(
            { message: result.message },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error requesting account unlock:", error);
        return NextResponse.json(
            { error: "Failed to process unlock request" },
            { status: 500 }
        );
    }
}
