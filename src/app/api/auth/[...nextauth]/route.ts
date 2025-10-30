import NextAuth from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const handler = NextAuth(authOptions);

// Wrap POST handler to add rate limiting for credentials login
async function POST(req: NextRequest) {
    try {
        // Check if this is a credentials login request
        const body = await req.text();
        const isCredentialsLogin = body.includes('"credentials"') ||
            body.includes('provider":"credentials');

        if (isCredentialsLogin) {
            // Rate limit credentials login attempts
            const ip = getClientIp(req);
            const { success, limit, remaining, reset } = await checkRateLimit(ip);

            if (!success) {
                return NextResponse.json(
                    {
                        error: "Too many login attempts. Please try again later.",
                        limit,
                        remaining,
                        reset: new Date(reset).toISOString(),
                    },
                    {
                        status: 429,
                        headers: {
                            'X-RateLimit-Limit': limit.toString(),
                            'X-RateLimit-Remaining': remaining.toString(),
                            'X-RateLimit-Reset': reset.toString(),
                        }
                    }
                );
            }
        }

        // Reconstruct the request with the body
        const newRequest = new Request(req.url, {
            method: req.method,
            headers: req.headers,
            body: body,
        });

        // Call the original handler
        return handler(newRequest);
    } catch (error) {
        console.error("Error in auth handler:", error);
        // If there's an error reading the body, just pass through to NextAuth
        return handler(req);
    }
}

export { handler as GET, POST };

