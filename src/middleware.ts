import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Security Headers Middleware
 * 
 * Adds comprehensive security headers to all responses.
 * Provides defense-in-depth against various web attacks.
 * 
 * Headers Added:
 * - X-Frame-Options: Prevents clickjacking
 * - X-Content-Type-Options: Prevents MIME sniffing
 * - Referrer-Policy: Controls referrer information
 * - Permissions-Policy: Restricts browser features
 * - X-XSS-Protection: Legacy XSS protection (for older browsers)
 * - Strict-Transport-Security: Enforces HTTPS (production only)
 * - Content-Security-Policy: Controls resource loading (optional)
 */

export function middleware(request: NextRequest) {
    const response = NextResponse.next();

    // X-Frame-Options: Prevent clickjacking
    // DENY = page cannot be displayed in a frame, regardless of origin
    response.headers.set("X-Frame-Options", "DENY");

    // X-Content-Type-Options: Prevent MIME sniffing
    // Browsers will strictly follow the Content-Type header
    response.headers.set("X-Content-Type-Options", "nosniff");

    // Referrer-Policy: Control referrer information
    // strict-origin-when-cross-origin = Send full URL for same-origin, only origin for cross-origin
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

    // Permissions-Policy: Restrict browser features
    // Disable geolocation, microphone, camera by default
    response.headers.set(
        "Permissions-Policy",
        "geolocation=(), microphone=(), camera=()"
    );

    // X-XSS-Protection: Legacy XSS protection for older browsers
    // Modern browsers rely on CSP instead, but this provides backward compatibility
    response.headers.set("X-XSS-Protection", "1; mode=block");

    // Strict-Transport-Security (HSTS): Enforce HTTPS (production only)
    // Only set in production to avoid issues with local development
    if (process.env.NODE_ENV === "production") {
        // max-age=31536000 = 1 year
        // includeSubDomains = Apply to all subdomains
        response.headers.set(
            "Strict-Transport-Security",
            "max-age=31536000; includeSubDomains"
        );
    }

    // Content-Security-Policy (CSP): Optional but recommended
    // Uncomment and customize based on your app's needs
    // This is a basic CSP - you may need to adjust for your specific use case
    /*
    const cspDirectives = [
        "default-src 'self'",
        "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // Next.js requires unsafe-eval and unsafe-inline
        "style-src 'self' 'unsafe-inline'", // Allow inline styles for Tailwind
        "img-src 'self' data: https:",
        "font-src 'self'",
        "connect-src 'self' https://api.better-auth.com", // Add your API endpoints
        "frame-ancestors 'none'", // Same as X-Frame-Options: DENY
        "base-uri 'self'",
        "form-action 'self'",
    ];
    
    response.headers.set(
        "Content-Security-Policy",
        cspDirectives.join("; ")
    );
    */

    return response;
}

/**
 * Matcher configuration for middleware
 * Apply security headers to all routes except static files
 */
export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder files
         */
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};
