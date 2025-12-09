/**
 * PostHog Reverse Proxy - Cloudflare Worker
 * 
 * Deploy this worker to your Cloudflare account to proxy PostHog requests
 * through your own domain, avoiding tracking blockers.
 * 
 * Setup:
 * 1. Go to Cloudflare Dashboard → Workers & Pages → Create Application
 * 2. Create a new Worker and paste this code
 * 3. Set up a custom domain (e.g., t.craft.fast or analytics.craft.fast)
 * 4. Update NEXT_PUBLIC_POSTHOG_HOST in your .env to use your custom domain
 */

const POSTHOG_HOST = "https://us.i.posthog.com";

// Allowed origins - restrict CORS to your domains only for security
const ALLOWED_ORIGINS = [
    "https://craft.fast",
    "https://www.craft.fast",
    "https://app.craft.fast",
    "http://localhost:3000", // For local development testing
];

export default {
    async fetch(request) {
        const url = new URL(request.url);
        const origin = request.headers.get("Origin");

        // Handle CORS preflight requests
        if (request.method === "OPTIONS") {
            return handleCORS(origin);
        }

        try {
            // Rewrite the URL to PostHog
            const posthogUrl = new URL(url.pathname + url.search, POSTHOG_HOST);

            // Clone the request with the new URL
            const modifiedRequest = new Request(posthogUrl, {
                method: request.method,
                headers: request.headers,
                body: request.body,
                redirect: "follow",
            });

            // Forward the request to PostHog
            const response = await fetch(modifiedRequest);

            // Clone the response and add CORS headers
            const modifiedResponse = new Response(response.body, response);

            // Only allow specific origins for security
            if (origin && ALLOWED_ORIGINS.includes(origin)) {
                modifiedResponse.headers.set("Access-Control-Allow-Origin", origin);
            }
            modifiedResponse.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
            modifiedResponse.headers.set("Access-Control-Allow-Headers", "Content-Type");

            return modifiedResponse;
        } catch (error) {
            // Log the error for debugging in Cloudflare dashboard
            console.error("PostHog proxy error:", error);

            // Return a 502 Bad Gateway with CORS headers
            const headers = {
                "Content-Type": "text/plain",
                "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type",
            };
            if (origin && ALLOWED_ORIGINS.includes(origin)) {
                headers["Access-Control-Allow-Origin"] = origin;
            }

            return new Response("Bad Gateway: PostHog service unavailable", {
                status: 502,
                headers,
            });
        }
    },
};

// Handle CORS preflight requests
function handleCORS(origin) {
    const headers = {
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Max-Age": "86400", // Cache preflight for 24 hours
    };

    // Only set allowed origin if it's in our list
    if (origin && ALLOWED_ORIGINS.includes(origin)) {
        headers["Access-Control-Allow-Origin"] = origin;
    }

    return new Response(null, { status: 204, headers });
}
